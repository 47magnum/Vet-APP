import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
import "../Calendar.css";

export default function Calendar() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); 
  const [loading, setLoading] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, view]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    try {
      const response = await fetch(`${API_BASE}/api/appointments/range?start=${start}&end=${end}`);
      const data = await response.json();
      setAppointments(data);
    } catch (err) { 
      console.error("Error:", err); 
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
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const getAppointmentsForTimeSlot = (date, hour) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      const aptHour = aptDate.getHours();
      const aptMinute = aptDate.getMinutes();
      
      // Proveri da li je isti dan
      const isSameDay = aptDate.getDate() === date.getDate() &&
                        aptDate.getMonth() === date.getMonth() &&
                        aptDate.getFullYear() === date.getFullYear();
      
      // Proveri da li termin počinje tokom ovog sata
      // Na primer, za slot 14:00-15:00, prikaži termine koji počinju između 14:00 i 14:59
      const isInHourSlot = aptHour === hour;
      
      return isSameDay && isInHourSlot;
    });
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const hours = Array.from({ length: 11 }, (_, i) => i + 14);

  const AppointmentModal = ({ apt, onClose }) => {
    if (!apt) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={onClose}>&times;</button>
          <h3 style={{ color: '#1565c0', marginBottom: '1.5rem' }}>Detalji Termina</h3>
          <div className="detail-item">
            <strong>Pacijent:</strong> {apt.patients.name}
          </div>
          <div className="detail-item">
            <strong>Vlasnik:</strong> {apt.patients.owner_name}
          </div>
          <div className="detail-item">
            <strong>Telefon:</strong> {apt.patients.owner_phone}
          </div>
          <div className="detail-item">
            <strong>Vreme:</strong> {new Date(apt.appointment_date).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })} h
          </div>
          <div className="detail-item">
            <strong>Trajanje:</strong> {apt.duration_minutes} min
          </div>
          <div className="detail-item">
            <strong>Razlog:</strong> {apt.reason || "Nije navedeno"}
          </div>
          <div className="detail-item">
            <strong>Napomena:</strong> {apt.notes || "/"}
          </div>
        </div>
      </div>
    );
  };

  const weekDays = view === 'week' ? getWeekDays() : [];

  return (
    <div className="calendar-container">
      <BackButton />
      
      <div className="calendar-header">
        <h1>Kalendar Termina</h1>
        
        <div className="calendar-controls">
          <div className="view-switcher">
            <button 
              onClick={() => setView('day')} 
              className={view === 'day' ? 'active' : ''}
            >
              Dan
            </button>
            <button 
              onClick={() => setView('week')} 
              className={view === 'week' ? 'active' : ''}
            >
              Nedelja
            </button>
          </div>

          <div className="date-navigation">
            <button onClick={() => navigateDate(-1)}>←</button>
            <span className="current-date">
              {currentDate.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navigateDate(1)}>→</button>
          </div>

          <button 
            className="new-apt-btn" 
            onClick={() => navigate('/new-appointment')}
          >
            + Novi Termin
          </button>
        </div>
      </div>

      <div className="calendar-body">
        {loading ? (
          <div className="loading">Učitavanje...</div>
        ) : view === 'week' ? (
          <div className="week-calendar">
            {/* Header row */}
            <div className="calendar-grid-header">
              <div className="time-header-cell">Vreme</div>
              {weekDays.map((day, i) => (
                <div key={i} className="day-header-cell">
                  <div className="day-name">
                    {day.toLocaleDateString('sr-RS', { weekday: 'short' })}
                  </div>
                  <div className="day-number">{day.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="calendar-grid-body">
              {hours.map(hour => (
                <div key={hour} className="calendar-row">
                  <div className="time-cell">{`${hour}:00`}</div>
                  {weekDays.map((day, i) => {
                    const apts = getAppointmentsForTimeSlot(day, hour);
                    return (
                      <div key={i} className="appointment-cell">
                        {apts.map(apt => (
                          <div
                            key={apt.id}
                            className="appointment-badge"
                            onClick={() => setSelectedApt(apt)}
                          >
                            <div className="apt-patient-name">{apt.patients.name}</div>
                            <div className="apt-time-small">
                              {new Date(apt.appointment_date).toLocaleTimeString('sr-RS', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="day-calendar">
            <div className="day-grid">
              {hours.map(hour => {
                const apts = getAppointmentsForTimeSlot(currentDate, hour);
                return (
                  <div key={hour} className="day-row">
                    <div className="time-cell-day">{`${hour}:00`}</div>
                    <div className="appointment-cell-day">
                      {apts.length === 0 ? (
                        <div className="empty-slot">Slobodno</div>
                      ) : (
                        apts.map(apt => (
                          <div
                            key={apt.id}
                            className="appointment-card-day"
                            onClick={() => setSelectedApt(apt)}
                          >
                            <div className="apt-header">
                              <span className="apt-time-day">
                                {new Date(apt.appointment_date).toLocaleTimeString('sr-RS', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              <span className="apt-duration">{apt.duration_minutes} min</span>
                            </div>
                            <div className="apt-patient-day">{apt.patients.name}</div>
                            <div className="apt-owner-day">{apt.patients.owner_name}</div>
                            {apt.reason && (
                              <div className="apt-reason-day">{apt.reason}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AppointmentModal apt={selectedApt} onClose={() => setSelectedApt(null)} />
    </div>
  );
}