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
        fetchPatients();
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
    <div className="ins-wrapper">
      <BackButton />
      
      <div className="ins-panel">
        <h2 className="ins-title">Pretraga i Izmena Baze</h2>
        
        <div className="ins-field-group">
          <label>Pronađi pacijenta</label>
          <input 
            type="text" 
            className="ins-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ime ljubimca..."
          />
        </div>

        <div className="ins-results-container">
          {filteredPatients.map(p => (
            <div key={p.id} className="ins-patient-row">
              <div className="result-text">
                <strong>{p.name}</strong> • {p.owner_name}
              </div>
              <button className="ins-btn-edit" onClick={() => setEditingPatient(p)}>
                Izmeni
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for editing */}
      {editingPatient && (
        <div className="ins-modal-overlay" onClick={() => setEditingPatient(null)}>
          <div className="ins-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="ins-modal-title">Izmeni pacijenta</h3>
            <form onSubmit={handleUpdate}>
              <div className="ins-field-group">
                <label>Ime ljubimca</label>
                <input
                  type="text"
                  className="ins-input"
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})}
                />
              </div>

              <div className="ins-field-group">
                <label>Vrsta</label>
                <input
                  type="text"
                  className="ins-input"
                  value={editingPatient.species}
                  onChange={(e) => setEditingPatient({...editingPatient, species: e.target.value})}
                />
              </div>

              <div className="ins-field-group">
                <label>Rasa</label>
                <input
                  type="text"
                  className="ins-input"
                  value={editingPatient.breed}
                  onChange={(e) => setEditingPatient({...editingPatient, breed: e.target.value})}
                />
              </div>

              <div className="ins-field-group">
                <label>Ime vlasnika</label>
                <input
                  type="text"
                  className="ins-input"
                  value={editingPatient.owner_name}
                  onChange={(e) => setEditingPatient({...editingPatient, owner_name: e.target.value})}
                />
              </div>

              <div className="ins-field-group">
                <label>Telefon vlasnika</label>
                <input
                  type="text"
                  className="ins-input"
                  value={editingPatient.owner_phone}
                  onChange={(e) => setEditingPatient({...editingPatient, owner_phone: e.target.value})}
                />
              </div>

              <div className="ins-modal-buttons">
                <button type="submit" className="ins-btn-save">Sačuvaj</button>
                <button type="button" className="ins-btn-cancel" onClick={() => setEditingPatient(null)}>Otkaži</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}