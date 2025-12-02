import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
import "../Calendar.css";

export default function Calendar() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [loading, setLoading] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, view]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    
    try {
      const response = await fetch(
        `${API_BASE}/api/appointments/range?start=${start}&end=${end}`
      );
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
    setLoading(false);
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('sr-RS', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (view === 'week') {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return `${start.toLocaleDateString('sr-RS', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('sr-RS', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
    }
  };

  const getAppointmentsForTimeSlot = (date, hour) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear() &&
             aptDate.getHours() === hour;
    });
  };

  const deleteAppointment = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="day-view">
        <div className="time-column">
          {hours.map(hour => (
            <div key={hour} className="time-slot">
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>
        <div className="appointments-column">
          {hours.map(hour => {
            const appts = getAppointmentsForTimeSlot(currentDate, hour);
            return (
              <div key={hour} className="appointment-slot">
                {appts.map(apt => (
                  <div key={apt.id} className="appointment-card">
                    <button 
                      className="delete-apt-btn"
                      onClick={() => deleteAppointment(apt.id)}
                    >
                      ×
                    </button>
                    <div className="apt-time">
                      {new Date(apt.appointment_date).toLocaleTimeString('sr-RS', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="apt-patient">{apt.patients.name}</div>
                    <div className="apt-owner">{apt.patients.owner_name}</div>
                    {apt.reason && <div className="apt-reason">{apt.reason}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="week-view">
        <div className="week-header">
          <div className="time-header">Time</div>
          {days.map(date => (
            <div key={date.toISOString()} className="day-header">
              <div className="day-name">
                {date.toLocaleDateString('sr-RS', { weekday: 'short' })}
              </div>
              <div className="day-number">{date.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="week-grid">
          <div className="time-column">
            {hours.map(hour => (
              <div key={hour} className="time-slot">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          {days.map(date => (
            <div key={date.toISOString()} className="day-column">
              {hours.map(hour => {
                const appts = getAppointmentsForTimeSlot(date, hour);
                return (
                  <div key={hour} className="appointment-slot">
                    {appts.map(apt => (
                      <div key={apt.id} className="appointment-card-small">
                        <button 
                          className="delete-apt-btn-small"
                          onClick={() => deleteAppointment(apt.id)}
                        >
                          ×
                        </button>
                        <div className="apt-patient-small">{apt.patients.name}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <BackButton />
      
      <div className="calendar-header">
        <h1>Appointment Calendar</h1>
        
        <div className="calendar-controls">
          <div className="view-switcher">
            <button 
              className={view === 'day' ? 'active' : ''} 
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button 
              className={view === 'week' ? 'active' : ''} 
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>

          <div className="date-navigation">
            <button onClick={() => navigateDate(-1)}>←</button>
            <button onClick={goToToday}>Today</button>
            <span className="current-date">{formatDateHeader()}</span>
            <button onClick={() => navigateDate(1)}>→</button>
          </div>

          <button 
            className="new-apt-btn"
            onClick={() => navigate('/new-appointment')}
          >
            + New Appointment
          </button>
        </div>
      </div>

      <div className="calendar-body">
        {loading ? (
          <div className="loading">Loading appointments...</div>
        ) : view === 'day' ? (
          renderDayView()
        ) : (
          renderWeekView()
        )}
      </div>

      {appointments.length === 0 && !loading && (
        <div className="no-appointments">
          No appointments scheduled for this period
        </div>
      )}
    </div>
  );
}