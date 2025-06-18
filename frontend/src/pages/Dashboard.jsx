import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import Header from '../components/Header.jsx';
import { Plus, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import '../styles/Dashboard.css';
import 'react-calendar/dist/Calendar.css';

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaries, setDiaries] = useState([]);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [newDiaryContent, setNewDiaryContent] = useState('');

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:8080/api/diaries/user/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        // Convert date strings to Date objects
        const formattedDiaries = data.data.map(diary => ({
          ...diary,
          date: new Date(diary.date),
          created_at: new Date(diary.created_at)
        }));
        setDiaries(formattedDiaries);
      } else {
        console.error('Failed to fetch diaries:', data.error);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching diaries:', error);
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const diary = diaries.find(d => 
      d.date.toDateString() === date.toDateString()
    );
    setSelectedDiary(diary || null);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasDiary = diaries.some(diary => 
        diary.date.toDateString() === date.toDateString()
      );
      if (hasDiary) {
        return <div className="diary-indicator"></div>;
      }
    }
    return null;
  };

  const handleCreateDiary = async () => {
    if (!newDiaryContent.trim()) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch('http://localhost:8080/api/diaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          date: selectedDate.toISOString(),
          content: newDiaryContent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Convert date string to Date object
        const newDiary = {
          ...data.data,
          date: new Date(data.data.date),
          created_at: new Date(data.data.created_at)
        };

        setDiaries([...diaries, newDiary]);
        setSelectedDiary(newDiary);
        setNewDiaryContent('');
        setShowNewDiaryModal(false);
      } else {
        console.error('Failed to create diary:', data.error);
        alert(data.error || 'Failed to create diary entry');
      }
    } catch (error) {
      console.error('Error creating diary:', error);
      alert('Failed to create diary entry');
    }
  };

  const handleEditDiary = async (diaryId, newContent) => {
    try {
      const response = await fetch(`http://localhost:8080/api/diaries/${diaryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the diary in the list
        const updatedDiaries = diaries.map(diary => 
          diary.id === diaryId 
            ? { ...diary, content: newContent, updated_at: new Date() }
            : diary
        );
        setDiaries(updatedDiaries);
        
        // Update selected diary if it's the one being edited
        if (selectedDiary && selectedDiary.id === diaryId) {
          setSelectedDiary({ ...selectedDiary, content: newContent });
        }
      } else {
        console.error('Failed to update diary:', data.error);
        alert(data.error || 'Failed to update diary entry');
      }
    } catch (error) {
      console.error('Error updating diary:', error);
      alert('Failed to update diary entry');
    }
  };

  const handleDeleteDiary = async (diaryId) => {
    if (!confirm('Are you sure you want to delete this diary entry?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/diaries/${diaryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove diary from the list
        const updatedDiaries = diaries.filter(diary => diary.id !== diaryId);
        setDiaries(updatedDiaries);
        
        // Clear selected diary if it's the one being deleted
        if (selectedDiary && selectedDiary.id === diaryId) {
          setSelectedDiary(null);
        }
      } else {
        console.error('Failed to delete diary:', data.error);
        alert(data.error || 'Failed to delete diary entry');
      }
    } catch (error) {
      console.error('Error deleting diary:', error);
      alert('Failed to delete diary entry');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Header />
        <div className="loading-spinner">Loading your diaries...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Personal Diary Calendar</h2>
          <p>Track your daily experiences and health journey</p>
        </div>

        <div className="dashboard-content">
          <div className="calendar-section">
            <div className="calendar-wrapper">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={tileContent}
                className="custom-calendar"
              />
            </div>
            
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="diary-indicator"></div>
                <span>Has diary entry</span>
              </div>
            </div>
          </div>

          <div className="diary-section">
            <div className="diary-header">
              <h3>
                <CalendarIcon size={20} />
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              {!selectedDiary && (
                <button 
                  className="add-diary-btn"
                  onClick={() => setShowNewDiaryModal(true)}
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              )}
            </div>

            <div className="diary-content">
              {selectedDiary ? (
                <div className="diary-entry">
                  <div className="diary-meta">
                    <BookOpen size={16} />
                    <span>Created: {selectedDiary.created_at.toLocaleString()}</span>
                  </div>
                  <div className="diary-text">
                    {selectedDiary.content}
                  </div>
                  <div className="diary-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        const newContent = prompt('Edit your diary entry:', selectedDiary.content);
                        if (newContent && newContent.trim() !== selectedDiary.content) {
                          handleEditDiary(selectedDiary.id, newContent.trim());
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteDiary(selectedDiary.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-diary">
                  <BookOpen size={48} />
                  <h4>No diary entry for this date</h4>
                  <p>Click "Add Entry" to create your first diary entry for this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Diary Modal */}
      {showNewDiaryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>New Diary Entry</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNewDiaryModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <textarea
                value={newDiaryContent}
                onChange={(e) => setNewDiaryContent(e.target.value)}
                placeholder="Write about your day, feelings, health observations..."
                rows={8}
                className="diary-textarea"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowNewDiaryModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleCreateDiary}
                disabled={!newDiaryContent.trim()}
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;