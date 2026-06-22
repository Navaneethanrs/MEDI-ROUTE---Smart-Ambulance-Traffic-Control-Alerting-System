import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickGuide.css';

const QuickGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="quick-guide-page">
      {/* Header */}
      <header>
        <div className="quick-guide-container header-container">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-ambulance"></i>
            <h1>Medi <span>Route</span></h1>
          </div>
          <nav>
            <ul>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a></li>
              <li><a href="/quick" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>Quick Access</a></li>
              <li><a href="/how" onClick={(e) => { e.preventDefault(); navigate('/how'); }}>How It Works</a></li>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a></li>
              <li><a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a></li>
              <li><a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }}>Driver Login</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="quick-guide-container hero-content">
          <div className="hero-text">
            <h2>Revolutionizing Emergency Medical Response</h2>
            <p>Medi Route is an IoT-based Smart Ambulance Traffic Control System designed to reduce ambulance delays, provide real-time hospital connectivity, and save lives through efficient coordination.</p>
            <a href="/how" onClick={(e) => { e.preventDefault(); navigate('/how'); }} className="cta-button">Learn More</a>
          </div>
          <div className="hero-image">
            <div style={{ width: '100%', height: '300px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-ambulance" style={{ fontSize: '150px', opacity: 0.7 }}></i>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="quick-access">
        <div className="quick-guide-container">
          <div className="section-title">
            <h2>Quick Access</h2>
            <p>Select your role to access the MediRoute system</p>
          </div>
          
          <div className="access-container">
            <h2 className="access-title">Prioritize Life. Optimize Route.</h2>
            <p className="access-subtitle">Select your user role to access the real-time smart traffic control system.</p>
            
            <div className="access-buttons">
              <a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }} className="access-button ambulance-button">
                <i className="fas fa-ambulance access-icon"></i>
                <h3>Ambulance Driver</h3>
              </a>
              
              <a href="/hospital" onClick={(e) => { e.preventDefault(); navigate('/hospital'); }} className="access-button hospital-button">
                <i className="fas fa-hospital access-icon"></i>
                <h3>Hospital Access</h3>
              </a>
            </div>
            
            <div className="access-features">
              <div className="access-feature">
                <i className="fas fa-shield-alt"></i>
                <span>Secure Access</span>
              </div>
              <div className="access-feature">
                <i className="fas fa-bolt"></i>
                <span>Real-time Updates</span>
              </div>
              <div className="access-feature">
                <i className="fas fa-map-marked-alt"></i>
                <span>Smart Routing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="quick-guide-container">
          <div className="section-title">
            <h2>Impactful Results</h2>
            <p>Medi Route is making a difference in emergency medical response times.</p>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <h3>40%</h3>
              <p>Reduction in Response Time</p>
            </div>
            <div className="stat-item">
              <h3>500+</h3>
              <p>Lives Saved Monthly</p>
            </div>
            <div className="stat-item">
              <h3>85%</h3>
              <p>Faster Hospital Arrival</p>
            </div>
            <div className="stat-item">
              <h3>30+</h3>
              <p>Cities Using Medi Route</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="quick-guide-container">
          <div className="section-title">
            <h2>Key Features</h2>
            <p>Our comprehensive system connects ambulances, hospitals, and traffic infrastructure to create a seamless emergency response network.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-hospital"></i>
              </div>
              <h3>Nearby Hospital Detection</h3>
              <p>Ambulance drivers can instantly view nearby hospitals based on GPS location for the fastest route.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bed"></i>
              </div>
              <h3>Bed Booking System</h3>
              <p>Reserve patient beds in advance based on real-time hospital availability and requirements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-medical"></i>
              </div>
              <h3>Medical Requirement Reporting</h3>
              <p>Send patient details and medical needs to hospitals before arrival for better preparation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Ambulance Tracking</h3>
              <p>Hospitals can track ambulances in real-time to prepare for patient arrival.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-traffic-light"></i>
              </div>
              <h3>Traffic Signal Control</h3>
              <p>Automatically switch traffic signals to green when ambulances approach intersections.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3>Life-Saving Coordination</h3>
              <p>Efficient coordination between drivers, hospitals, and traffic systems to save lives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="quick-guide-container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Medi Route</h3>
              <p>An IoT-based Smart Ambulance Traffic Control System designed to improve emergency medical response and save lives.</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-facebook-f"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="https://www.linkedin.com/in/navaneethan-sankar-743751367/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
                <a href="https://www.linkedin.com/in/niranjan-gobinathan-0b67b4321/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
                <a href="https://www.instagram.com/n.o.v.a.__.18/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
                <a href="https://www.instagram.com/nirxnjxn_off_/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a></li>
                <li><a href="/quick" onClick={(e) => { e.preventDefault(); navigate('/quick'); }}>Quick Access</a></li>
                <li><a href="/how" onClick={(e) => { e.preventDefault(); navigate('/how'); }}>How It Works</a></li>
                <li><a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a></li>
                <li><a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Features</h3>
              <ul>
                <li><a href="#">Hospital Detection</a></li>
                <li><a href="#">Bed Booking</a></li>
                <li><a href="#">Medical Reporting</a></li>
                <li><a href="#">Ambulance Tracking</a></li>
                <li><a href="#">Traffic Control</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contact Us</h3>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> 123 Healthcare Ave, MedCity</li>
                <li><i className="fas fa-phone"></i> +1 (555) 123-4567</li>
                <li><i className="fas fa-envelope"></i> info@mediroute.com</li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; 2023 Medi Route. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuickGuide;
