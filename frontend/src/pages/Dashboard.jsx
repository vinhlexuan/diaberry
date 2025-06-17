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
      if (!user.id) return;

      // TODO: Replace with actual API call
      // const response = await fetch(`http://localhost:8080/api/diaries/user/${user.id}`);
      // const data = await response.json();
      
      // Mock data for now
      const mockDiaries = [
        {
          id: 1,
          date: new Date(2024, 0, 15),
          content: "Today was a good day. My blood sugar levels were stable throughout the day. Had a healthy breakfast with oatmeal and berries.",
          created_at: new Date(2024, 0, 15)
        },
        {
          id: 2,
          date: new Date(2024, 0, 16),
          content: "Went for a 30-minute walk after lunch. Feeling energetic and positive. Blood sugar spike after dinner - need to be more careful with portion sizes.",
          created_at: new Date(2024, 0, 16)
        },
        {
          id: 3,
          date: new Date(),
          content: "Started the day with meditation. Blood sugar readings are improving. Planning to meal prep for the week.",
          created_at: new Date()
        }
      ];

      setDiaries(mockDiaries);
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
      
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:8080/api/diaries', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     user_id: user.id,
      //     date: selectedDate,
      //     content: newDiaryContent
      //   })
      // });

      // Mock creation for now
      const newDiary = {
        id: Date.now(),
        date: selectedDate,
        content: newDiaryContent,
        created_at: new Date()
      };

      setDiaries([...diaries, newDiary]);
      setSelectedDiary(newDiary);
      setNewDiaryContent('');
      setShowNewDiaryModal(false);
    } catch (error) {
      console.error('Error creating diary:', error);
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
                    <button className="edit-btn">Edit</button>
                    <button className="delete-btn">Delete</button>
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