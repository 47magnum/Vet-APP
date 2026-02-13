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
  
  // NOVO: Stanje za prikaz detalja
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

  const hours = Array.from({ length: 11 }, (_, i) => i + 14); // 14:00 do 24:00

  // MODAL KOMPONENTA (Unutar istog fajla radi jednostavnosti)
  const AppointmentModal = ({ apt, onClose }) => {
    if (!apt) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={onClose}>&times;</button>
          <h3>Detalji Termina</h3>
          <hr />
          <div className="detail-item"><strong>Pacijent:</strong> {apt.patients.name}</div>
          <div className="detail-item"><strong>Vlasnik:</strong> {apt.patients.owner_name}</div>
          <div className="detail-item"><strong>Telefon:</strong> {apt.patients.owner_phone}</div>
          <div className="detail-item"><strong>Vreme:</strong> {new Date(apt.appointment_date).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })} h</div>
          <div className="detail-item"><strong>Trajanje:</strong> {apt.duration_minutes} min</div>
          <div className="detail-item"><strong>Razlog:</strong> {apt.reason || "Nije navedeno"}</div>
          <div className="detail-item"><strong>Napomena:</strong> <p>{apt.notes || "/"}</p></div>
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

      <div className="calendar-body">
        {loading ? <div>Učitavanje...</div> : (
          <div className={view === 'day' ? "day-view" : "week-view"}>
            {/* Logika za Week Header ostaje ista... */}
            {view === 'week' && (
              <div className="week-header">
                <div className="time-header">Vreme</div>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(currentDate);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + i;
                  d.setDate(diff);
                  return (
                    <div key={i} className="day-header">
                      <div>{d.toLocaleDateString('sr-RS', { weekday: 'short' })}</div>
                      <strong>{d.getDate()}</strong>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={view === 'week' ? "week-grid" : "day-view-grid"}>
               <div className="time-column">
                {hours.map(hour => <div key={hour} className="time-slot">{`${hour}:00`}</div>)}
              </div>
              
              {/* Renderovanje kolona/termina */}
              {/* Ovde samo dodajemo onClick={() => setSelectedApt(apt)} na svaku karticu */}
              {view === 'week' ? (
                Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(currentDate);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + i;
                  d.setDate(diff);
                  return (
                    <div key={i} className="day-column">
                      {hours.map(hour => (
                        <div key={hour} className="appointment-slot">
                          {getAppointmentsForTimeSlot(d, hour).map(apt => (
                            <div 
                              key={apt.id} 
                              className="appointment-card-small clickable" 
                              onClick={() => setSelectedApt(apt)}
                            >
                              {apt.patients.name}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })
              ) : (
                <div className="appointments-column">
                  {hours.map(hour => (
                    <div key={hour} className="appointment-slot">
                      {getAppointmentsForTimeSlot(currentDate, hour).map(apt => (
                        <div 
                          key={apt.id} 
                          className="appointment-card clickable" 
                          onClick={() => setSelectedApt(apt)}
                        >
                          <strong>{apt.patients.name}</strong> - {apt.reason}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NOVO: Renderovanje Modala */}
      <AppointmentModal apt={selectedApt} onClose={() => setSelectedApt(null)} />
    </div>
  );
}