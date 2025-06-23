import { useState, useEffect, useRef, useCallback } from 'react';
import {
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
} from '@mui/material';
import {
  Add as AddIcon,
  MenuBook,
  CalendarToday,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  FiberManualRecord,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, authenticatedFetch } = useAuth();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [diaries, setDiaries] = useState([]);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [editingDiary, setEditingDiary] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
        }));
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
    // Update selected diary when date changes
    const diary = diaries.find(d => 
      dayjs(d.date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
    );
    setSelectedDiary(diary || null);
  }, [selectedDate, diaries]);

  const CustomPickersDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    
    const hasDiary = diaries.some(diary => 
      diary.date.format('YYYY-MM-DD') === day.format('YYYY-MM-DD')
    );

    return (
      <Box sx={{ position: 'relative' }}>
        <PickersDay
          {...other}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          sx={{
            position: 'relative',
            ...(hasDiary && {
              backgroundColor: 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected',
              },
            }),
          }}
        />
        {hasDiary && (
          <FiberManualRecord
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              fontSize: 8,
              color: 'secondary.main',
            }}
          />
        )}
      </Box>
    );
  };

  const handleCreateDiary = async () => {
    if (!newDiaryContent.trim()) return;

    try {
      const response = await authenticatedFetch('http://localhost:8080/api/diaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          content: newDiaryContent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newDiary = {
          ...data.data,
          date: dayjs(data.data.date),
          created_at: dayjs(data.data.created_at)
        };

        setDiaries(prev => [...prev, newDiary]);
        setSelectedDiary(newDiary);
        setNewDiaryContent('');
        setShowNewDiaryModal(false);
      } else {
        console.error('Failed to create diary:', data.error);
      }
    } catch (error) {
      console.error('Error creating diary:', error);
    }
  };

  const handleEditDiary = async () => {
    if (!editContent.trim() || !editingDiary) return;

    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/diaries/${editingDiary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDiaries(prev => prev.map(diary => 
          diary.id === editingDiary.id 
            ? { ...diary, content: editContent, updated_at: dayjs() }
            : diary
        ));
        
        if (selectedDiary && selectedDiary.id === editingDiary.id) {
          setSelectedDiary(prev => ({ ...prev, content: editContent }));
        }
        
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
        setDiaries(prev => prev.filter(diary => diary.id !== diaryId));
        
        if (selectedDiary && selectedDiary.id === diaryId) {
          setSelectedDiary(null);
        }
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
      {/* Main Content with Fixed Widths - No Header */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3,
        height: 'calc(100vh - 200px)', // Adjusted height since no header
        minHeight: '600px',
        // Stack vertically on mobile
        flexDirection: { xs: 'column', md: 'row' },
      }}>
        {/* Calendar Section - Fixed 20% width on desktop */}
        <Box sx={{ 
          width: { xs: '100%', md: '20%' },
          minWidth: { md: '300px' }, // Minimum width to keep calendar usable
          flexShrink: 0,
        }}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <DateCalendar
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slots={{
                  day: CustomPickersDay,
                }}
                // Fix calendar year selection by adding min/max dates
                minDate={dayjs('2000-01-01')}
                maxDate={dayjs('2099-12-31')}
                views={['year', 'month', 'day']}
                openTo="day"
                sx={{
                  width: '100%',
                  flex: 1,
                  '& .MuiPickersCalendarHeader-root': {
                    paddingLeft: 1,
                    paddingRight: 1,
                  },
                  // Make calendar responsive within fixed width
                  '& .MuiDayCalendar-root': {
                    width: '100%',
                  },
                  '& .MuiPickersDay-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    width: { xs: '28px', sm: '36px' },
                    height: { xs: '28px', sm: '36px' },
                  },
                  // Fix year selection view styling
                  '& .MuiYearCalendar-root': {
                    width: '100%',
                    height: 'auto',
                  },
                  '& .MuiPickersYear-yearButton': {
                    fontSize: '0.875rem',
                    margin: '2px',
                  },
                  // Fix month selection view styling
                  '& .MuiMonthCalendar-root': {
                    width: '100%',
                    height: 'auto',
                  },
                  '& .MuiPickersMonth-monthButton': {
                    fontSize: '0.875rem',
                    margin: '4px',
                  },
                }}
              />
              
              {/* Legend */}
              <Box sx={{ 
                mt: 2, 
                pt: 2, 
                borderTop: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
              }}>
                <FiberManualRecord sx={{ fontSize: 12, color: 'secondary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Has diary entry
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Diary Section - Fixed 70% width on desktop */}
        <Box sx={{ 
          width: { xs: '100%', md: '70%' },
          flexShrink: 0,
        }}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Diary Header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
                flexShrink: 0,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                  <CalendarToday color="primary" />
                  <Typography variant="h6" component="h2" noWrap>
                    {selectedDate.format('dddd, MMMM D, YYYY')}
                  </Typography>
                </Box>
                
                {!selectedDiary && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowNewDiaryModal(true)}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ flexShrink: 0 }}
                  >
                    Add Entry
                  </Button>
                )}
              </Box>

              {/* Diary Content - Expandable area */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedDiary ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexShrink: 0 }}>
                      <MenuBook fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Created: {selectedDiary.created_at.format('MMM D, YYYY [at] h:mm A')}
                      </Typography>
                    </Box>
                    
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        backgroundColor: 'grey.50',
                        borderRadius: 2,
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          lineHeight: 1.6, 
                          whiteSpace: 'pre-wrap',
                          overflow: 'auto',
                          flex: 1,
                        }}
                      >
                        {selectedDiary.content}
                      </Typography>
                    </Paper>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => startEdit(selectedDiary)}
                        size="small"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this diary entry?')) {
                            handleDeleteDiary(selectedDiary.id);
                          }
                        }}
                        size="small"
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center', 
                    py: 4 
                  }}>
                    <Box>
                      <MenuBook sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" gutterBottom color="text.secondary">
                        No diary entry for this date
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Add Entry" to create your first diary entry for this day.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* New Diary Modal */}
      <Dialog 
        open={showNewDiaryModal} 
        onClose={() => setShowNewDiaryModal(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">New Diary Entry</Typography>
          <IconButton onClick={() => setShowNewDiaryModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedDate.format('dddd, MMMM D, YYYY')}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            placeholder="Write about your day, feelings, health observations..."
            value={newDiaryContent}
            onChange={(e) => setNewDiaryContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowNewDiaryModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleCreateDiary}
            disabled={!newDiaryContent.trim()}
          >
            Save Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Diary Modal */}
      <Dialog 
        open={Boolean(editingDiary)} 
        onClose={() => setEditingDiary(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Diary Entry</Typography>
          <IconButton onClick={() => setEditingDiary(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {editingDiary?.date.format('dddd, MMMM D, YYYY')}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditingDiary(null)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleEditDiary}
            disabled={!editContent.trim()}
          >
            Update Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Dashboard;