import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
import "../NewAppointmentLayout.css"; 

export default function NewAppointment() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_date: "",
    appointment_time: "",
    duration_minutes: 30,
    reason: "",
    notes: ""
  });
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Error:", err));
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
    const appointmentData = {
      ...formData,
      appointment_date: dateTime.toISOString(),
      duration_minutes: parseInt(formData.duration_minutes)
    };

    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });
      if (res.ok) setShowSuccess(true);
      else alert("Greška pri čuvanju");
    } catch (err) { alert("Server error"); }
  };

  const filteredPatients = patients.filter((p) => {
    const search = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(search) || p.owner_name.toLowerCase().includes(search);
  });

  if (showSuccess) {
    return (
      <div className="full-page-container">
        <div className="success-box">
          <h2>✓ Termin Uspešno Zakazan</h2>
          <button onClick={() => navigate("/calendar")} className="submit-btn">Nazad na Kalendar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-page-container">
      <BackButton />
      <div className="appointment-card-wide">
        <h2>Zakažite Novi Termin</h2>
        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-section">
            <label>Pretraži Pacijenta</label>
            <input 
              type="text" 
              placeholder="Ime psa ili vlasnika..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="wide-input"
            />
            
            <label>Izaberi Pacijenta *</label>
            <select name="patient_id" value={formData.patient_id} onChange={handleInputChange} required className="wide-input">
              <option value="">-- Izaberi sa liste --</option>
              {filteredPatients.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.owner_name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Datum</label>
              <input type="date" name="appointment_date" value={formData.appointment_date} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Vreme (14:00 - 23:00)</label>
              <input type="time" name="appointment_time" min="14:00" max="23:00" value={formData.appointment_time} onChange={handleInputChange} required />
            </div>
          </div>

          <label>Razlog Posete</label>
          <input type="text" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="npr. Kontrola" className="wide-input" />

          <label>Napomena</label>
          <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="wide-input" />

          <button type="submit" className="submit-btn-large">Zakaži Termin</button>
        </form>
      </div>
    </div>
  );
}