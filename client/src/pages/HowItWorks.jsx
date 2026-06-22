import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="how-it-works-page">
      {/* Header */}
      <header>
        <div className="how-it-works-container header-container">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-ambulance"></i>
            <h1>Medi <span>Route</span></h1>
          </div>
          <nav>
            <ul>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a></li>
              <li><a href="/how" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>How It Works</a></li>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a></li>
              <li><a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a></li>
              <li><a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }}>Driver Login</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section className="page-header">
        <div className="how-it-works-container page-header-content">
          <h2>How Medi Route Works</h2>
          <p>Discover how our IoT-based system creates a seamless connection between ambulances, hospitals, and traffic infrastructure to save lives.</p>
        </div>
      </section>

      {/* Process Overview */}
      <section class="process-overview">
        <div className="how-it-works-container">
          <div className="section-title">
            <h2>The Medi Route Process</h2>
            <p>Our system transforms emergency response through five key steps</p>
          </div>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>Emergency Alert</h3>
              <p>Ambulance receives emergency call and is dispatched</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Hospital Selection</h3>
              <p>System identifies best hospital based on needs & availability</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>Pre-Arrival Prep</h3>
              <p>Hospital receives patient details and prepares resources</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3>Smart Routing</h3>
              <p>Optimal route calculated with real-time traffic data</p>
            </div>
            <div className="process-step">
              <div className="step-number">5</div>
              <h3>Traffic Control</h3>
              <p>Signals turn green as ambulance approaches</p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Process Breakdown */}
      <section className="detailed-process">
        <div className="how-it-works-container">
          <div className="section-title">
            <h2>Detailed Process Breakdown</h2>
            <p>How each component works together to create a seamless emergency response system</p>
          </div>
          
          <div className="process-phase">
            <div className="phase-content">
              <h3>Emergency Detection & Dispatch</h3>
              <p>When an emergency call is received, the system immediately identifies the nearest available ambulance and dispatches it to the location.</p>
              <p>Our advanced algorithms consider multiple factors including ambulance availability, current location, and traffic conditions to ensure the fastest possible response.</p>
              <ul className="phase-features">
                <li><i className="fas fa-check-circle"></i> <span>Automatic ambulance identification based on GPS location</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Real-time traffic analysis for optimal routing</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Integration with existing emergency call systems</span></li>
              </ul>
            </div>
            <div className="phase-image">
              <div className="phase-image-placeholder">
                <i className="fas fa-bell"></i>
              </div>
            </div>
          </div>
          
          <div className="process-phase">
            <div className="phase-content">
              <h3>Intelligent Hospital Selection</h3>
              <p>While en route to the emergency, the system automatically identifies the most appropriate hospital based on multiple criteria.</p>
              <p>Factors include bed availability, specialized equipment needs (ICU, ventilator, trauma care), current capacity, and travel time.</p>
              <ul className="phase-features">
                <li><i className="fas fa-check-circle"></i> <span>Real-time hospital capacity monitoring</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Specialized facility matching based on patient needs</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Automatic bed reservation system</span></li>
              </ul>
            </div>
            <div className="phase-image">
              <div className="phase-image-placeholder">
                <i className="fas fa-hospital"></i>
              </div>
            </div>
          </div>
          
          <div className="process-phase">
            <div className="phase-content">
              <h3>Pre-Arrival Hospital Preparation</h3>
              <p>The selected hospital receives detailed patient information and medical requirements before the ambulance arrives.</p>
              <p>This allows medical teams to prepare necessary equipment, medications, and specialist staff, saving critical minutes upon arrival.</p>
              <ul className="phase-features">
                <li><i className="fas fa-check-circle"></i> <span>Secure transmission of patient medical data</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Automatic alerting of relevant medical specialists</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Equipment preparation notifications</span></li>
              </ul>
            </div>
            <div className="phase-image">
              <div className="phase-image-placeholder">
                <i className="fas fa-user-md"></i>
              </div>
            </div>
          </div>
          
          <div className="process-phase">
            <div className="phase-content">
              <h3>Smart Routing & Traffic Management</h3>
              <p>Our system calculates the fastest possible route to the hospital, considering real-time traffic conditions, road closures, and construction.</p>
              <p>As the ambulance approaches intersections, traffic signals automatically switch to green, creating a clear path to the hospital.</p>
              <ul className="phase-features">
                <li><i className="fas fa-check-circle"></i> <span>Dynamic route optimization based on live traffic data</span></li>
                <li><i className="fas fa-check-circle"></i> <span>IoT-enabled traffic signal control</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Real-time ambulance tracking and ETA updates</span></li>
              </ul>
            </div>
            <div className="phase-image">
              <div className="phase-image-placeholder">
                <i className="fas fa-traffic-light"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key System Components */}
      <section className="system-components">
        <div className="how-it-works-container">
          <div className="section-title">
            <h2>Key System Components</h2>
            <p>The technology that powers the Medi Route ecosystem</p>
          </div>
          <div className="components-grid">
            <div className="component-card">
              <div className="component-icon">
                <i className="fas fa-ambulance"></i>
              </div>
              <h3>Ambulance Module</h3>
              <p>IoT device installed in ambulances with GPS, communication systems, and hospital interface for real-time coordination.</p>
            </div>
            <div className="component-card">
              <div className="component-icon">
                <i className="fas fa-hospital-alt"></i>
              </div>
              <h3>Hospital Dashboard</h3>
              <p>Centralized system for hospitals to monitor incoming patients, bed availability, and resource allocation.</p>
            </div>
            <div className="component-card">
              <div className="component-icon">
                <i className="fas fa-traffic-light"></i>
              </div>
              <h3>Traffic Control Interface</h3>
              <p>Integration with city traffic systems to manage signal prioritization for emergency vehicles.</p>
            </div>
            <div className="component-card">
              <div className="component-icon">
                <i className="fas fa-cloud"></i>
              </div>
              <h3>Central Cloud Platform</h3>
              <p>Secure cloud infrastructure that processes data and coordinates between all system components in real-time.</p>
            </div>
            <div className="component-card">
              <div className="component-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3>Mobile Applications</h3>
              <p>Dedicated apps for ambulance crews, hospital staff, and administrators for seamless communication.</p>
            </div>
            <div className="component-card">
              <div className="component-icon">
                <i className="fas fa-database"></i>
              </div>
              <h3>Analytics Engine</h3>
              <p>Advanced algorithms that process historical and real-time data to optimize emergency response.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="benefits">
        <div className="how-it-works-container">
          <div className="section-title">
            <h2>Key Benefits</h2>
            <p>How Medi Route transforms emergency medical response</p>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Reduced Response Times</h3>
              <p>Our system reduces ambulance response times by up to 40% through optimized routing and traffic signal control.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fas fa-user-injured"></i>
              </div>
              <h3>Better Patient Outcomes</h3>
              <p>Faster hospital arrival and pre-arrival preparation significantly improve survival rates and recovery outcomes.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fas fa-procedures"></i>
              </div>
              <h3>Optimized Hospital Resources</h3>
              <p>Hospitals can better prepare for incoming patients, ensuring the right resources are available when needed.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Enhanced Safety</h3>
              <p>Reduced need for ambulances to run red lights or make dangerous maneuvers through controlled traffic flow.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Data-Driven Improvements</h3>
              <p>Comprehensive analytics help cities identify response bottlenecks and optimize emergency services over time.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h3>Cost Efficiency</h3>
              <p>Reduced fuel consumption, lower vehicle maintenance costs, and more efficient use of emergency resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="how-it-works-container">
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

export default HowItWorks;
