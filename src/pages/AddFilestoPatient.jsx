import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
import "../new_patient.css";
import "../sql_search.css";

export default function AddFilesToPatient() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all patients on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Error fetching patients:", err));
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert("Please select a patient");
      return;
    }

    if (files.length === 0) {
      alert("Please select at least one file");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(
        `http://localhost:5000/api/patients/${selectedPatient}/files`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setShowSuccess(true);
        setLoading(false);
      } else {
        alert("Error: " + data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
      setLoading(false);
    }
  };

  const handleAddMore = () => {
    setShowSuccess(false);
    setSelectedPatient("");
    setFiles([]);
    const fileInput = document.getElementById("file");
    if (fileInput) fileInput.value = "";
  };

  const handleReturnHome = () => {
    navigate("/");
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
          <h2>Files Added Successfully!</h2>
          <p>The files have been uploaded to the patient's record.</p>
          <div className="success-buttons">
            <button onClick={handleAddMore} className="search-btn">
              Add More Files
            </button>
            <button onClick={handleReturnHome} className="clear-btn">
              Return to Home
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
        <h2>Add Files to Existing Patient</h2>

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
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
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

        {/* File Upload */}
        <div className="file-upload-div">
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            multiple
            accept=".jpeg,.png,.pdf,.jpg"
            className="file-upload"
            required
          />
          <label htmlFor="file" className="file-upload-btn-new">
            {files.length > 0
              ? files.map((f) => f.name).join(", ")
              : "Upload Files"}
          </label>
        </div>

        {files.length > 0 && (
          <p className="file-count">{files.length} file(s) selected</p>
        )}

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Uploading..." : "Upload Files"}
        </button>
      </form>
    </div>
  );
}