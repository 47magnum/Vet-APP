import { useState, useEffect } from "react";
import BackButton from "./BackButton";
import "../inspect.css";

export default function Inspect() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPatient, setEditingPatient] = useState(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = () => {
    fetch(`${API_BASE}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Error:", err));
  };

  const handleUpdate = async (e) => {
  e.preventDefault();
  
  // Proveri da li editingPatient ima ID
  if (!editingPatient?.id) return;

  try {
    const res = await fetch(`${API_BASE}/api/patients/${editingPatient.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        name: editingPatient.name,
        species: editingPatient.species,
        breed: editingPatient.breed,
        owner_name: editingPatient.owner_name,
        owner_phone: editingPatient.owner_phone
      }),
    });

    if (res.status === 404) {
      alert("Server ne pronalazi rutu. Proveri da li je server.js ažuriran na Renderu.");
      return;
    }

    if (res.ok) {
      alert("Uspešno izmenjeno!");
      setEditingPatient(null);
      fetchPatients(); // Osveži listu
    } else {
      const errData = await res.json();
      alert("Greška: " + errData.error);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Greška u komunikaciji sa serverom.");
  }
};

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="full-page-container">
      <BackButton />
      <div className="appointment-card-wide">
        <h2 style={{color: '#2196f3', marginBottom: '20px'}}>Pretraga i Izmena Baze</h2>
        
        {/* Search deo - identičan kao u NewAppointment */}
        <div className="form-section">
          <label>Pretraži bazu</label>
          <input 
            type="text" 
            placeholder="Pronađi pacijenta..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="wide-input"
          />
        </div>

        {/* Lista rezultata u vidu "pilula" ili kartica */}
        <div className="results-list">
          {filteredPatients.map(p => (
            <div key={p.id} className="patient-search-result">
              <div className="result-text">
                <strong>{p.name}</strong> • {p.owner_name} ({p.owner_phone})
              </div>
              <button 
                className="edit-btn-pill" 
                onClick={() => setEditingPatient(p)}
              >
                Izmeni
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal za izmenu */}
      {editingPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setEditingPatient(null)}>&times;</button>
            <h3>Izmeni podatke</h3>
            <form onSubmit={handleUpdate} className="modern-form">
              <label>Ime Ljubimca</label>
              <input 
                type="text" 
                className="wide-input"
                value={editingPatient.name} 
                onChange={e => setEditingPatient({...editingPatient, name: e.target.value})}
              />
              <label>Ime Vlasnika</label>
              <input 
                type="text" 
                className="wide-input"
                value={editingPatient.owner_name} 
                onChange={e => setEditingPatient({...editingPatient, owner_name: e.target.value})}
              />
              <label>Telefon</label>
              <input 
                type="text" 
                className="wide-input"
                value={editingPatient.owner_phone} 
                onChange={e => setEditingPatient({...editingPatient, owner_phone: e.target.value})}
              />
              <button type="submit" className="submit-btn-large">Sačuvaj Promene</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}