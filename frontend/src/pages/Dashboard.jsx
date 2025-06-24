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
  CircularProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Collapse,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  MenuBook,
  CalendarToday,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  FiberManualRecord,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';

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
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
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
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
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
              bottom: 4,
              right: 4,
              fontSize: 8,
              color: 'secondary.main',
              pointerEvents: 'none', // Prevent interference with day clicking
              zIndex: 1,
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
      {/* Mobile Calendar Toggle */}
      {isMobile && (
        <Card sx={{ mb: 2, transform: 'scale(0.9)', transformOrigin: 'top left', width: '111.11%' }}>
          <CardContent sx={{ py: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalendarToday />}
              endIcon={calendarExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setCalendarExpanded(!calendarExpanded)}
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography variant="body2">
                {selectedDate.format('MMMM D, YYYY')}
              </Typography>
            </Button>
            <Collapse in={calendarExpanded}>
              <Box sx={{ mt: 2 }}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newValue) => {
                    setSelectedDate(newValue);
                    setCalendarExpanded(false); // Close calendar after selection
                  }}
                  slots={{
                    day: CustomPickersDay,
                  }}
                  minDate={dayjs('2000-01-01')}
                  maxDate={dayjs('2099-12-31')}
                  views={['year', 'month', 'day']}
                  openTo="day"
                  sx={{
                    width: '100%',
                    '& .MuiPickersDay-root': {
                      fontSize: '0.875rem',
                    },
                    // Ensure day cells have enough space for the indicator
                    '& .MuiDayCalendar-weekDayLabel': {
                      margin: 0,
                    },
                    '& .MuiPickersDay-dayWithMargin': {
                      margin: '2px',
                    },
                    // Prevent overflow clipping
                    '& .MuiDayCalendar-monthContainer': {
                      overflow: 'visible',
                    },
                    '& .MuiDayCalendar-weekContainer': {
                      overflow: 'visible',
                    },
                  }}
                />
                
                {/* Mobile Legend */}
                <Box sx={{ 
                  mt: 1, 
                  pt: 1, 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: 'center',
                }}>
                  <FiberManualRecord sx={{ fontSize: 12, color: 'secondary.main' }} />
                  <Typography variant="caption" color="text.secondary">
                    Has diary entry
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Desktop/Tablet Layout */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 0, md: 3 },
        height: { xs: 'auto', md: 'calc(100vh - 200px)' },
        minHeight: { xs: 'auto', md: '600px' },
        flexDirection: { xs: 'column', md: 'row' },
        transform: { xs: 'none', md: 'scale(0.9)' },
        transformOrigin: { xs: 'none', md: 'top left' },
        width: { xs: '100%', md: '111.11%' },
      }}>
        {/* Calendar Section - Hidden on mobile */}
        {!isMobile && (
          <Box sx={{ 
            width: { md: isTablet ? '35%' : '25%' },
            minWidth: { md: '280px' },
            maxWidth: { md: '350px' },
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
                    '& .MuiDayCalendar-root': {
                      width: '100%',
                    },
                    '& .MuiPickersDay-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      width: { xs: '28px', sm: '36px' },
                      height: { xs: '28px', sm: '36px' },
                    },
                    '& .MuiYearCalendar-root': {
                      width: '100%',
                      height: 'auto',
                    },
                    '& .MuiPickersYear-yearButton': {
                      fontSize: '0.875rem',
                      margin: '2px',
                    },
                    '& .MuiMonthCalendar-root': {
                      width: '100%',
                      height: 'auto',
                    },
                    '& .MuiPickersMonth-monthButton': {
                      fontSize: '0.875rem',
                      margin: '4px',
                    },
                    // Ensure day cells have enough space for the indicator
                    '& .MuiDayCalendar-weekDayLabel': {
                      margin: 0,
                    },
                    '& .MuiPickersDay-dayWithMargin': {
                      margin: '2px',
                    },
                    // Prevent overflow clipping
                    '& .MuiDayCalendar-monthContainer': {
                      overflow: 'visible',
                    },
                    '& .MuiDayCalendar-weekContainer': {
                      overflow: 'visible',
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
        )}

        {/* Diary Section */}
        <Box sx={{ 
          width: { xs: '100%', md: isTablet ? '65%' : '73%' },
          flexShrink: 0,
        }}>
          <Card sx={{ 
            height: { xs: 'auto', md: '100%' }, 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: { xs: '400px', md: 'auto' },
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Diary Header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 },
                flexShrink: 0,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                  <CalendarToday color="primary" sx={{ display: { xs: 'none', sm: 'block' } }} />
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    component="h2" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                    }}
                  >
                    {selectedDate.format('dddd, MMMM D, YYYY')}
                  </Typography>
                </Box>
                
                {!selectedDiary && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowNewDiaryModal(true)}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ 
                      flexShrink: 0,
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Add Entry
                  </Button>
                )}
              </Box>

              {/* Diary Content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedDiary ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexShrink: 0 }}>
                      <MenuBook fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Created: {selectedDiary.created_at.format('MMM D, YYYY [at] h:mm A')}
                      </Typography>
                    </Box>
                    
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        mb: 2, 
                        backgroundColor: 'grey.50',
                        borderRadius: 2,
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: { xs: '200px', md: 'auto' },
                      }}
                    >
                      <Box
                        sx={{ 
                          lineHeight: 1.6,
                          overflow: 'auto',
                          flex: 1,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '& p': {
                            margin: '0.5em 0',
                            '&:first-of-type': {
                              marginTop: 0,
                            },
                            '&:last-of-type': {
                              marginBottom: 0,
                            },
                          },
                          '& ul, & ol': {
                            pl: 3,
                            my: 1,
                          },
                          '& li': {
                            mb: 0.5,
                          },
                          '& a': {
                            color: 'primary.main',
                            textDecoration: 'underline',
                            '&:hover': {
                              textDecoration: 'none',
                            },
                          },
                          '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 2,
                            ml: 0,
                            my: 1,
                            fontStyle: 'italic',
                            backgroundColor: 'grey.100',
                            py: 1,
                            borderRadius: '0 4px 4px 0',
                          },
                          '& pre': {
                            backgroundColor: 'grey.200',
                            p: 1,
                            borderRadius: 1,
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            my: 1,
                          },
                          '& h1, & h2, & h3, & h4, & h5, & h6': {
                            margin: '1em 0 0.5em 0',
                            '&:first-of-type': {
                              marginTop: 0,
                            },
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedDiary.content }}
                      />
                    </Paper>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      flexWrap: 'wrap', 
                      flexShrink: 0,
                      flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => startEdit(selectedDiary)}
                        size="small"
                        sx={{ flex: { xs: 1, sm: 'none' } }}
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
                        sx={{ flex: { xs: 1, sm: 'none' } }}
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
                    py: { xs: 3, md: 4 }
                  }}>
                    <Box>
                      <MenuBook sx={{ 
                        fontSize: { xs: 40, sm: 48 }, 
                        color: 'text.disabled', 
                        mb: 2 
                      }} />
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        gutterBottom 
                        color="text.secondary"
                      >
                        No diary entry for this date
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: { xs: 2, sm: 0 } }}
                      >
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

      {/* Mobile FAB for adding entry */}
      {isMobile && !selectedDiary && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setShowNewDiaryModal(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            transform: 'scale(0.9)',
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* New Diary Modal */}
      <Dialog 
        open={showNewDiaryModal} 
        onClose={() => setShowNewDiaryModal(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            transform: { xs: 'none', md: 'scale(0.9)' },
            transformOrigin: { xs: 'none', md: 'center' },
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: { xs: 1, sm: 2 }
        }}>
          <Typography variant="h6">New Diary Entry</Typography>
          <IconButton onClick={() => setShowNewDiaryModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 1, sm: 2 } }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedDate.format('dddd, MMMM D, YYYY')}
          </Typography>
          <RichTextEditor
            value={newDiaryContent}
            onChange={setNewDiaryContent}
            placeholder="Write about your day, feelings, health observations..."
            minHeight={isMobile ? '250px' : '300px'}
          />
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={() => setShowNewDiaryModal(false)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleCreateDiary}
            disabled={!newDiaryContent.trim()}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
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
        PaperProps={{
          sx: {
            transform: { xs: 'none', md: 'scale(0.9)' },
            transformOrigin: { xs: 'none', md: 'center' },
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: { xs: 1, sm: 2 }
        }}>
          <Typography variant="h6">Edit Diary Entry</Typography>
          <IconButton onClick={() => setEditingDiary(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 1, sm: 2 } }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {editingDiary?.date.format('dddd, MMMM D, YYYY')}
          </Typography>
          <RichTextEditor
            value={editContent}
            onChange={setEditContent}
            placeholder="Edit your diary entry..."
            minHeight={isMobile ? '250px' : '300px'}
          />
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={() => setEditingDiary(null)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleEditDiary}
            disabled={!editContent.trim()}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Update Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Dashboard;