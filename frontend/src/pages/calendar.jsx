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
    } catch (err) { console.error("Error:", err); }
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
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    view === 'day' ? newDate.setDate(newDate.getDate() + direction) : newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
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

  // OGRANIČAVANJE VREMENA: 14:00 do 23:00
  const hours = Array.from({ length: 10 }, (_, i) => i + 14);

  const renderDayView = () => (
    <div className="day-view">
      <div className="time-column">
        {hours.map(hour => <div key={hour} className="time-slot">{`${hour}:00`}</div>)}
      </div>
      <div className="appointments-column">
        {hours.map(hour => (
          <div key={hour} className="appointment-slot">
            {getAppointmentsForTimeSlot(currentDate, hour).map(apt => (
              <div key={apt.id} className="appointment-card">
                <div className="apt-time">{new Date(apt.appointment_date).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="apt-patient">{apt.patients.name}</div>
                <div className="apt-reason">{apt.reason}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    return (
      <div className="week-view">
        <div className="week-header">
          <div className="time-header">Vreme</div>
          {days.map(d => (
            <div key={d.toISOString()} className="day-header">
              <div className="day-name">{d.toLocaleDateString('sr-RS', { weekday: 'short' })}</div>
              <div className="day-number">{d.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="week-grid">
          <div className="time-column">
            {hours.map(hour => <div key={hour} className="time-slot">{`${hour}:00`}</div>)}
          </div>
          {days.map(date => (
            <div key={date.toISOString()} className="day-column">
              {hours.map(hour => (
                <div key={hour} className="appointment-slot">
                  {getAppointmentsForTimeSlot(date, hour).map(apt => (
                    <div key={apt.id} className="appointment-card-small">
                      <div className="apt-patient-small">{apt.patients.name}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container-wide">
      <BackButton />
      <div className="calendar-header">
        <h1>Kalendar Termina</h1>
        <div className="calendar-controls">
          <button onClick={() => setView('day')} className={view === 'day' ? 'active' : ''}>Dan</button>
          <button onClick={() => setView('week')} className={view === 'week' ? 'active' : ''}>Nedelja</button>
          <div className="nav-group">
            <button onClick={() => navigateDate(-1)}>←</button>
            <span className="current-date">{currentDate.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => navigateDate(1)}>→</button>
          </div>
          <button className="new-apt-btn" onClick={() => navigate('/new-appointment')}>+ Novi Termin</button>
        </div>
      </div>
      <div className="calendar-body">{loading ? <div>Učitavanje...</div> : view === 'day' ? renderDayView() : renderWeekView()}</div>
    </div>
  );
}