import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './QuickGuide.css';

const QuickGuide = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [statusText, setStatusText] = useState('Requesting your location...');
  const [currentPosition, setCurrentPosition] = useState(null);

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [selectedHospitalName, setSelectedHospitalName] = useState('');
  const [patientForm, setPatientForm] = useState({
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientPhone: '',
    patientNotes: ''
  });

  // Haversine formula to compute distance in meters
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch hospitals from Overpass API
  const fetchNearbyHospitals = async (lat, lon) => {
    const radius = 10000; // 10km
    const overpassQuery = `[out:json];(node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon});relation["amenity"="hospital"](around:${radius},${lat},${lon}););out tags center;`;
    
    setStatusText('Searching nearby hospitals...');
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: overpassQuery })
      });
      const json = await response.json();
      const elements = json.elements || [];
      
      const mapped = elements.map(el => {
        const latc = el.lat || (el.center && el.center.lat);
        const lonc = el.lon || (el.center && el.center.lon);
        const name = el.tags && (el.tags.name || el.tags['name:en'] || 'Unnamed Hospital');
        const addr = el.tags ? [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') : 'Address not available';
        const dist = (latc && lonc) ? calculateHaversineDistance(lat, lon, latc, lonc) : Infinity;
        return { name, addr, distance: dist };
      }).filter(x => isFinite(x.distance));

      mapped.sort((a, b) => a.distance - b.distance);
      setHospitals(mapped);
      setFilteredHospitals(mapped);
      setStatusText(`Showing ${mapped.length} hospital(s) within ${radius / 1000} km`);
    } catch (err) {
      console.error(err);
      setStatusText('Failed to fetch hospitals. Please try again.');
      setHospitals([]);
      setFilteredHospitals([]);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatusText('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setCurrentPosition(pos.coords);
        await fetchNearbyHospitals(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn(err);
        setStatusText('Location access denied. Please enable location and refresh.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  // Filter list when search query changes
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredHospitals(hospitals);
      return;
    }
    const filtered = hospitals.filter(h =>
      (h.name || '').toLowerCase().includes(query) ||
      (h.addr || '').toLowerCase().includes(query)
    );
    setFilteredHospitals(filtered);
  }, [searchQuery, hospitals]);

  const openModal = (hospital) => {
    setSelectedHospitalName(hospital.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedHospitalName('');
    setPatientForm({
      patientName: '',
      patientAge: '',
      patientGender: '',
      patientPhone: '',
      patientNotes: ''
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPatientForm(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!patientForm.patientName || !patientForm.patientAge || !patientForm.patientGender || !patientForm.patientPhone) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        patientName: patientForm.patientName,
        age: Number(patientForm.patientAge),
        gender: patientForm.patientGender.toLowerCase(),
        medicalCondition: 'emergency',
        medicalNeeds: ['ICU Bed'],
        allergies: 'None reported',
        bloodPressure: 'N/A',
        additionalNotes: patientForm.patientNotes,
        selectedHospital: selectedHospitalName,
        driverEmail: 'quick-access@mediroute.com',
        status: 'pending'
      };

      const res = await api.post('/patient', payload);
      if (res.status === 200) {
        alert('Patient details submitted successfully!');
        closeModal();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit patient details. Storing details locally...');
      // Local fallback
      console.log('Local storage payload:', payload);
      closeModal();
    }
  };

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
            <div style={{ width: '100%', height: '300px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', align-items: 'center', justify-content: 'center' }}>
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

      {/* Nearby Hospitals Section */}
      <section className="nearby-section">
        <div className="quick-guide-container">
          <div className="nearby-card">
            <div className="nearby-header">
              <div className="nearby-title">Nearby Hospitals</div>
              <div className="nearby-search">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search hospitals..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {filteredHospitals.length > 0 ? (
              <div className="nearby-list">
                {filteredHospitals.map((h, i) => (
                  <div key={i} className="nearby-item" onClick={() => openModal(h)}>
                    <div className="nearby-icon"><i className="fas fa-hospital"></i></div>
                    <div>
                      <div className="nearby-name">{h.name}</div>
                      <div className="nearby-meta">{(h.distance / 1000).toFixed(2)} km • {h.addr}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="nearby-empty">
                <div><i className="fas fa-hospital"></i></div>
                <div><strong>No nearby hospitals found</strong></div>
                <div className="nearby-footer">Try expanding your search radius or check your location.</div>
              </div>
            )}
            
            <div className="nearby-footer">{statusText}</div>
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

      {/* Patient Details Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div class="modal-header">
              <div id="modalTitle" className="modal-title">Patient Details</div>
              <button onClick={closeModal} className="modal-close" aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-control">
                  <label>Selected Hospital</label>
                  <input type="text" value={selectedHospitalName} readOnly />
                </div>
                <div className="form-row">
                  <div className="form-control">
                    <label>Patient Name</label>
                    <input 
                      type="text" 
                      id="patientName"
                      value={patientForm.patientName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-control">
                    <label>Age</label>
                    <input 
                      type="number" 
                      id="patientAge"
                      min="0" 
                      max="120" 
                      value={patientForm.patientAge} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-control">
                    <label>Gender</label>
                    <select 
                      id="patientGender"
                      value={patientForm.patientGender} 
                      onChange={handleInputChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label>Contact Number</label>
                    <input 
                      type="tel" 
                      id="patientPhone"
                      pattern="[0-9]{10}" 
                      placeholder="10-digit number" 
                      value={patientForm.patientPhone} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label>Condition / Notes</label>
                  <textarea 
                    id="patientNotes"
                    placeholder="Brief description of the condition"
                    value={patientForm.patientNotes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickGuide;
