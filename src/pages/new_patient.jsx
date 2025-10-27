import { useState } from "react";
import "../new_patient.css";

export default function AddPet() {
  const [formData, setFormData] = useState({
    petName: "",
    breed: "",
    problem: "",
    petSpecies: "",
    ownerName: "",
    ownerPhone: "",
    files: [],
  });
const handleChange = (e) => {
  const { name, value, files } = e.target;
  setFormData({
    ...formData,
    [name]: files ? Array.from(files) : value, // store all selected files
  });
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    // create FormData for backend
    const formPayload = new FormData();
    formPayload.append("name", formData.petName);
    formPayload.append("breed", formData.breed);
    formPayload.append("problem", formData.problem);
    formPayload.append("species", formData.petSpecies);
    formPayload.append("owner_name", formData.ownerName);
    formPayload.append("owner_phone", formData.ownerPhone);

    if (formData.files && formData.files.length > 0) {
  for (let i = 0; i < formData.files.length; i++) {
    formPayload.append("files", formData.files[i]);
  }
}


    try {
      const res = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        body: formPayload,
      });

      const data = await res.json();
      console.log("Response:", data);

      if (res.ok) {
        alert("Pet added successfully!");
        setFormData({
          petName: "",
          breed: "",
          problem: "",
          petSpecies: "",
          ownerName: "",
          ownerPhone: "",
          file: null,
        });
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="add-pet-container">
      <form onSubmit={handleSubmit} className="add-pet-form">
        <h2>Add Pet</h2>

        {/* Pet Name */}
        <label className="input-div">
          <span>Pet Name</span>
          <input
            type="text"
            name="petName"
            value={formData.petName}
            onChange={handleChange}
            placeholder="Rex"
            required
          />
        </label>

        {/* Breed */}
        <label className="input-div">
          <span>Breed</span>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            placeholder="Golden Retriever"
          />
        </label>

        {/* Problem */}
        <label className="input-div">
          <span>Problem</span>
          <input
            type="text"
            name="problem"
            value={formData.problem}
            onChange={handleChange}
            placeholder="Bol u zadnjem kuku"
          />
        </label>

        {/* Pet Species */}
        <label className="input-div">
          <span>Pet Species</span>
          <input
            type="text"
            name="petSpecies"
            value={formData.petSpecies}
            onChange={handleChange}
            placeholder="Dog"
            required
          />
        </label>

        {/* Owner Name */}
        <label className="input-div">
          <span>Owner Name</span>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="e.g Marko"
            required
          />
        </label>

        {/* Owner Phone */}
        <label className="input-div">
          <span>Owner Phone</span>
          <input
            type="text"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            placeholder="069 000 0000"
            required
          />
        </label>

        {/* File Upload */}
        <div className="file-upload-div">
          <input
            type="file"
            id="file"
            name="files"
            onChange={handleChange}
            accept=".jpeg,.png,.pdf,.jpg"
            className="file-upload"
          />
          <label htmlFor="file" className="file-upload-btn-new">
            {formData.files.length > 0
  ? formData.files.map(f => f.name).join(", ")
  : "Upload File"}

          </label>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
}
