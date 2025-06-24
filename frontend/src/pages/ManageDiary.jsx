import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  MenuBook,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  DateRange,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import RichTextEditor from '../components/RichTextEditor';
import { useAuth } from '../context/AuthContext';

function ManageDiary() {
  const { user, authenticatedFetch } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const [filteredDiaries, setFilteredDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [newDiaryDate, setNewDiaryDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [editingDiary, setEditingDiary] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Use refs to prevent duplicate API calls
  const isFetching = useRef(false);
  const hasInitialized = useRef(false);

  const fetchDiaries = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current || !user?.id) {
      return;
    }

    isFetching.current = true;
    setLoading(true);

    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/diaries`);
      const data = await response.json();
      
      if (data.success) {
        const formattedDiaries = data.data.map(diary => ({
          ...diary,
          date: dayjs(diary.date),
          created_at: dayjs(diary.created_at)
        })).sort((a, b) => b.date.valueOf() - a.date.valueOf()); // Sort by date descending
        
        setDiaries(formattedDiaries);
      } else {
        console.error('Failed to fetch diaries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching diaries:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user?.id, authenticatedFetch]);

  // Initialize only once when user is available
  useEffect(() => {
    if (user?.id && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchDiaries();
    }
  }, [user?.id, fetchDiaries]);

  useEffect(() => {
    // Filter diaries based on search term
    if (searchTerm.trim() === '') {
      setFilteredDiaries(diaries);
    } else {
      const filtered = diaries.filter(diary => 
        diary.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diary.date.format('MMMM D, YYYY').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDiaries(filtered);
    }
  }, [diaries, searchTerm]);

  const stripHtmlTags = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const handleCreateDiary = async () => {
    const textContent = stripHtmlTags(newDiaryContent);
    if (!textContent.trim() || !newDiaryDate) return;

    try {
      const response = await authenticatedFetch('http://localhost:8080/api/diaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dayjs(newDiaryDate).toISOString(),
          content: newDiaryContent // Store HTML content
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newDiary = {
          ...data.data,
          date: dayjs(data.data.date),
          created_at: dayjs(data.data.created_at)
        };

        const updatedDiaries = [newDiary, ...diaries].sort((a, b) => b.date.valueOf() - a.date.valueOf());
        setDiaries(updatedDiaries);
        setNewDiaryContent('');
        setNewDiaryDate(dayjs().format('YYYY-MM-DD'));
        setShowNewDiaryModal(false);
      } else {
        console.error('Failed to create diary:', data.error);
      }
    } catch (error) {
      console.error('Error creating diary:', error);
    }
  };

  const handleEditDiary = async () => {
    const textContent = stripHtmlTags(editContent);
    if (!textContent.trim() || !editingDiary) return;

    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/diaries/${editingDiary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent // Store HTML content
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedDiaries = diaries.map(diary => 
          diary.id === editingDiary.id 
            ? { ...diary, content: editContent, updated_at: dayjs() }
            : diary
        );
        setDiaries(updatedDiaries);
        setEditingDiary(null);
        setEditContent('');
      } else {
        console.error('Failed to update diary:', data.error);
      }
    } catch (error) {
      console.error('Error updating diary:', error);
    }
  };

  const handleDeleteDiary = async (diaryId) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/diaries/${diaryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedDiaries = diaries.filter(diary => diary.id !== diaryId);
        setDiaries(updatedDiaries);
      } else {
        console.error('Failed to delete diary:', data.error);
      }
    } catch (error) {
      console.error('Error deleting diary:', error);
    }
  };

  const startEdit = (diary) => {
    setEditingDiary(diary);
    setEditContent(diary.content);
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your diaries...
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Manage Diary Entries
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Browse, search, and manage all your diary entries
        </Typography>
      </Box>

      {/* Actions Bar */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <TextField
          placeholder="Search your diary entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowNewDiaryModal(true)}
          sx={{ minWidth: { xs: 'auto', sm: '140px' } }}
        >
          New Entry
        </Button>
      </Box>

      {/* Diary Stats */}
      <Box sx={{ mb: 3 }}>
        <Chip 
          label={`${filteredDiaries.length} entries found`} 
          color="primary" 
          variant="outlined"
        />
      </Box>

      {/* Diary Entries */}
      <Container maxWidth="xl" disableGutters>
        {filteredDiaries.length > 0 ? (
          <Grid container spacing={3}>
            {filteredDiaries.map((diary) => (
              <Grid item xs={12} md={6} lg={4} key={diary.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    {/* Date Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <DateRange color="primary" fontSize="small" />
                      <Typography variant="h6" component="h3">
                        {diary.date.format('dddd, MMMM D, YYYY')}
                      </Typography>
                    </Box>

                    {/* Content Preview */}
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        backgroundColor: 'grey.50',
                        borderRadius: 2,
                        maxHeight: 150,
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{ 
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          '& *': {
                            fontSize: '0.875rem !important',
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: diary.content }}
                      />
                    </Paper>

                    {/* Meta Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MenuBook fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Created: {diary.created_at.format('MMM D, YYYY [at] h:mm A')}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => startEdit(diary)}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this diary entry?')) {
                            handleDeleteDiary(diary.id);
                          }
                        }}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <MenuBook sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              {searchTerm ? 'No matching entries found' : 'No diary entries yet'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'Start writing your first diary entry to begin your journey.'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowNewDiaryModal(true)}
                size="large"
              >
                Create First Entry
              </Button>
            )}
          </Box>
        )}
      </Container>

      {/* New Diary Modal - Now with Rich Text Editor */}
      <Dialog 
        open={showNewDiaryModal} 
        onClose={() => setShowNewDiaryModal(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: { xs: '100%', md: '80vh' },
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Create New Diary Entry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Write about your day, thoughts, and experiences
            </Typography>
          </Box>
          <IconButton onClick={() => setShowNewDiaryModal(false)} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={newDiaryDate}
              onChange={(e) => setNewDiaryDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 300 }}
            />
          </Box>
          
          <Box sx={{ flex: 1, p: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Content
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <RichTextEditor
                value={newDiaryContent}
                onChange={setNewDiaryContent}
                placeholder="Write about your day, feelings, health observations, or anything that's on your mind..."
                minHeight={isMobile ? '250px' : '400px'}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button 
            onClick={() => setShowNewDiaryModal(false)}
            size="large"
            sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 2, sm: 1 } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleCreateDiary}
            disabled={!stripHtmlTags(newDiaryContent).trim() || !newDiaryDate}
            size="large"
            sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 1, sm: 2 } }}
          >
            Save Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Diary Modal - Also with Rich Text Editor */}
      <Dialog 
        open={Boolean(editingDiary)} 
        onClose={() => setEditingDiary(null)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: { xs: '100%', md: '80vh' },
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Edit Diary Entry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingDiary?.date.format('dddd, MMMM D, YYYY')}
            </Typography>
          </Box>
          <IconButton onClick={() => setEditingDiary(null)} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, p: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Content
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <RichTextEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Edit your diary entry..."
                minHeight={isMobile ? '250px' : '400px'}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button 
            onClick={() => setEditingDiary(null)}
            size="large"
            sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 2, sm: 1 } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleEditDiary}
            disabled={!stripHtmlTags(editContent).trim()}
            size="large"
            sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 1, sm: 2 } }}
          >
            Update Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default ManageDiary;