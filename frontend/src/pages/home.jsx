  import { Link } from "react-router-dom";
  import "../home.css";

  export default function Home() {

    return (
      <div className="home-container">
        <div className="home-content">
          {/* Logo Section */}
          <div className="logo-section">
            <img 
              src={'/logo.png'} 
              alt="Veterinary Clinic Logo" 
              className="clinic-logo"
            />
            <h1 className="clinic-title">Veterinary Management System</h1>
          </div>

          {/* Navigation Buttons */}
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

            <Link to="/calendar" className="home-nav-link">
              <div className="home-nav-card">
                <div className="nav-icon">📅</div>
                <h2>Kalendar</h2>
                <p>View and manage appointments</p>
              </div>
            </Link>

            <Link to="/new-appointment" className="home-nav-link">
              <div className="home-nav-card">
                <div className="nav-icon">⏰</div>
                <h2>Novi Termin</h2>
                <p>Schedule new appointment</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }