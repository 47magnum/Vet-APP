import { Link } from "react-router-dom";
import "../home.css";

export default function Home() {
  const LOGO_URL = "YOUR_LOGO_URL_HERE";

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Logo  */}
        <div className="logo-section">
          <img 
            src={LOGO_URL} 
            alt="Veterinary Clinic Logo" 
            className="clinic-logo"
          />
          <h1 className="clinic-title">Veterinary Management System</h1>
        </div>

        {/* Nav Btns */}
        <div className="home-nav-grid">
          <Link to="/addpet" className="home-nav-link">
            <div className="home-nav-card">
              <div className="nav-icon">+</div>
              <h2>Dodaj Pacijenta</h2>
              <p>Add new patient to database</p>
            </div>
          </Link>

          <Link to="/inspect" className="home-nav-link">
            <div className="home-nav-card">
              <div className="nav-icon">📋</div>
              <h2>Funkcionalnost 1</h2>
              <p>Inspect and manage records</p>
            </div>
          </Link>

          <Link to="/patients" className="home-nav-link">
            <div className="home-nav-card">
              <div className="nav-icon">🔍</div>
              <h2>Pretraživanje</h2>
              <p>Search patient database</p>
            </div>
          </Link>

          <Link to="/add-files" className="home-nav-link">
            <div className="home-nav-card">
              <div className="nav-icon">📎</div>
              <h2>Dodaj Fajlove</h2>
              <p>Add files to existing patients</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}