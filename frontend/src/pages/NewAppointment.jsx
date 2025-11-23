import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
import "../new_patient.css";
import "../sql_search.css";

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
    // Fetch all patients
    fetch(`${API_BASE}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Error fetching patients:", err));
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.appointment_date || !formData.appointment_time) {
      alert("Please fill in all required fields");
      return;
    }

    // Combine date and time into ISO string
    const dateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
    
    const appointmentData = {
      patient_id: formData.patient_id,
      appointment_date: dateTime.toISOString(),
      duration_minutes: parseInt(formData.duration_minutes),
      reason: formData.reason,
      notes: formData.notes
    };

    try {
      const response = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    setFormData({
      patient_id: "",
      appointment_date: "",
      appointment_time: "",
      duration_minutes: 30,
      reason: "",
      notes: ""
    });
  };

  const handleViewCalendar = () => {
    navigate("/calendar");
  };

  // Filter patients based on search
  const filteredPatients = patients.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      p.owner_name.toLowerCase().includes(search) ||
      p.id.toLowerCase().includes(search)
    );
  });

  // Success Screen
  if (showSuccess) {
    return (
      <div className="add-pet-container">
        <div className="success-message-container">
          <div className="success-icon">✓</div>
          <h2>Appointment Created Successfully!</h2>
          <p>The appointment has been added to the calendar.</p>
          <div className="success-buttons">
            <button onClick={handleAddAnother} className="search-btn">
              Add Another Appointment
            </button>
            <button onClick={handleViewCalendar} className="clear-btn">
              View Calendar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-pet-container">
      <BackButton />
      <form onSubmit={handleSubmit} className="add-pet-form">
        <h2>Schedule New Appointment</h2>

        {/* Search Patient */}
        <label className="input-div">
          <span>Search Patient</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, owner, or ID..."
            className="search-input"
          />
        </label>

        {/* Select Patient */}
        <label className="input-div">
          <span>Select Patient *</span>
          <select
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            required
            className="patient-select"
          >
            <option value="">-- Choose a patient --</option>
            {filteredPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} - {patient.owner_name} ({patient.species})
              </option>
            ))}
          </select>
        </label>

        {/* Appointment Date */}
        <label className="input-div">
          <span>Date *</span>
          <input
            type="date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Appointment Time */}
        <label className="input-div">
          <span>Time *</span>
          <input
            type="time"
            name="appointment_time"
            value={formData.appointment_time}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Duration */}
        <label className="input-div">
          <span>Duration (minutes)</span>
          <select
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleInputChange}
            className="patient-select"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </label>

        {/* Reason */}
        <label className="input-div">
          <span>Reason for Visit</span>
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="e.g., Regular checkup, Vaccination"
          />
        </label>

        {/* Notes */}
        <label className="input-div">
          <span>Additional Notes</span>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Any special instructions or notes..."
            rows="4"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '2px solid #e3f2fd',
              borderRadius: '8px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </label>

        {/* Submit Button */}
        <button type="submit" className="submit-btn">
          Schedule Appointment
        </button>
      </form>
    </div>
  );
}