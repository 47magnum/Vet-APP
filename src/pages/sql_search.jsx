import { useEffect, useState } from "react";
import "../sql_search.css";
import BackButton from "./BackButton";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search form state
  const [searchParams, setSearchParams] = useState({
    name: '',
    id: '',
    owner_name: '',
    owner_phone: ''
  });

  // Load all patients on mount
  useEffect(() => {
    fetchAllPatients();
  }, []);

  const fetchAllPatients = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/patients")
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
        setLoading(false);
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Build query string from non-empty fields
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value.trim()) {
        params.append(key, value.trim());
      }
    });

    // If no search params, show all patients
    if (params.toString() === '') {
      fetchAllPatients();
      return;
    }

    setLoading(true);
    fetch(`http://localhost:5000/api/patients/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error searching patients:", err);
        setLoading(false);
      });
  };

  const handleClear = () => {
    setSearchParams({
      name: '',
      id: '',
      owner_name: '',
      owner_phone: ''
    });
    fetchAllPatients();
  };

  const handleInputChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="patients-container">
      <h1>PATIENTS</h1>
      <BackButton/>
      {/* Search Bar */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-inputs">
            <input
              type="text"
              name="name"
              placeholder="Pet Name"
              value={searchParams.name}
              onChange={handleInputChange}
              className="search-input"
            />
            <input
              type="text"
              name="id"
              placeholder="Pet ID"
              value={searchParams.id}
              onChange={handleInputChange}
              className="search-input"
            />
            <input
              type="text"
              name="owner_name"
              placeholder="Owner Name"
              value={searchParams.owner_name}
              onChange={handleInputChange}
              className="search-input"
            />
            <input
              type="text"
              name="owner_phone"
              placeholder="Owner Phone"
              value={searchParams.owner_phone}
              onChange={handleInputChange}
              className="search-input"
            />
          </div>
          <div className="search-buttons">
            <button type="submit" className="search-btn">
              Search
            </button>
            <button type="button" onClick={handleClear} className="clear-btn">
              Clear
            </button>
          </div>
        </form>
        <p className="results-count">
          {loading ? 'Loading...' : `${patients.length} patient${patients.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Patients Grid */}
      <div className="patients-grid">
        {!loading && patients.length === 0 && (
          <p className="no-results">No patients found. Try adjusting your search criteria.</p>
        )}
        
        {patients.map((p) => (
          <div className="patient-card" key={p.id}>
            <h2>{p.name}</h2>
            <p>Species: {p.species}</p>
            <p>Breed: {p.breed}</p>
            <p>Owner: {p.owner_name} ({p.owner_phone})</p>
            {p.files && p.files.length > 0 && (
              <div className="patient-files">
                <h3>Files:</h3>
                <ul>
                  {p.files.map((file, idx) => (
                    <li key={idx}>
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        {file.split('/').pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}