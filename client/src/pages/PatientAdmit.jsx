import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './PatientAdmit.css';

const PatientAdmit = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  
  // Patient Form State
  const [patientForm, setPatientForm] = useState({
    patientName: '',
    age: '',
    gender: '',
    medicalCondition: '',
    bloodPressure: '',
    heartRate: '',
    oxygenSaturation: '',
    allergies: '',
    medicalNeeds: [],
    additionalNotes: ''
  });

  const [savedPatientId, setSavedPatientId] = useState(null);
  const [patientStatusText, setPatientStatusText] = useState('Awaiting Details');
  const [selectedHospitalName, setSelectedHospitalName] = useState('None');
  const [hospitalResponseText, setHospitalResponseText] = useState('Pending');
  const [hospitalResponseColor, setHospitalResponseColor] = useState('inherit');
  
  const [showHospitals, setShowHospitals] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  
  const [gpsLocationText, setGpsLocationText] = useState('123 Main Street, Downtown');
  const [gpsTimeText, setGpsTimeText] = useState('Just now');

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // success or danger
    title: '',
    message: ''
  });

  const hospitalsList = [
    {
      id: 1,
      name: "City General Hospital",
      address: "123 Medical Center Dr, Healthcare City",
      phone: "(555) 123-4567",
      distance: "2.3 km",
      eta: "8 min",
      specialties: ["Cardiology", "Trauma", "ICU", "Emergency Medicine"],
      icuBeds: 8,
      ventilators: 5,
      status: "available"
    },
    {
      id: 2,
      name: "Unity Medical Center",
      address: "456 Health Ave, Wellness District",
      phone: "(555) 234-5678",
      distance: "3.1 km",
      eta: "10 min",
      specialties: ["Cardiology", "Neurology", "ICU", "Surgery"],
      icuBeds: 4,
      ventilators: 2,
      status: "limited"
    },
    {
      id: 3,
      name: "Hope Regional Hospital",
      address: "789 Care Blvd, Recovery Town",
      phone: "(555) 345-6789",
      distance: "4.5 km",
      eta: "14 min",
      specialties: ["Trauma", "Pediatrics", "ICU", "Emergency Medicine"],
      icuBeds: 0,
      ventilators: 1,
      status: "full"
    }
  ];

  useEffect(() => {
    // Check for current logged in driver
    const storedDriver = localStorage.getItem('driverData');
    if (storedDriver) {
      try {
        const parsed = JSON.parse(storedDriver);
        setDriver(parsed);
      } catch (e) {
        console.error("Failed to parse driver details", e);
      }
    }

    // Update GPS time
    const updateGPSTime = () => {
      const now = new Date();
      setGpsTimeText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateGPSTime();
    const timer = setInterval(updateGPSTime, 60000);

    return () => clearInterval(timer);
  }, []);

  // Poll for notifications or status updates if we submitted a patient
  useEffect(() => {
    if (!driver || !driver.email || !savedPatientId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/notifications/${driver.email}`);
        if (response.status === 200 && response.data.length > 0) {
          // Check for notifications related to our saved patient
          const notifications = response.data;
          const relevantNoti = notifications.find(n => n.patientName === patientForm.patientName);
          
          if (relevantNoti) {
            if (relevantNoti.status === 'accepted') {
              setHospitalResponseText('ACCEPTED');
              setHospitalResponseColor('var(--success)');
              setPatientStatusText('Hospital Accepted - Proceed to Hospital');
              triggerNotification(
                'success', 
                'Patient Admitted!', 
                `${relevantNoti.hospitalName} has accepted the patient and is preparing for arrival.`
              );
            } else if (relevantNoti.status === 'declined') {
              setHospitalResponseText('DECLINED');
              setHospitalResponseColor('var(--danger)');
              setPatientStatusText('Hospital Declined - Select Another Hospital');
              triggerNotification(
                'danger', 
                'Admission Declined', 
                `${relevantNoti.hospitalName} cannot admit the patient. Reason: ${relevantNoti.reason || 'No capacity available'}`
              );
            }
            
            // Mark notification as read
            await api.post(`/notifications/${relevantNoti._id}/read`);
          }
        }
      } catch (error) {
        console.error("Error polling for patient admission response", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [driver, savedPatientId, patientForm.patientName]);

  const triggerNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPatientForm(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setPatientForm(prev => {
      const needs = [...prev.medicalNeeds];
      if (checked) {
        needs.push(value);
      } else {
        const index = needs.indexOf(value);
        if (index > -1) {
          needs.splice(index, 1);
        }
      }
      return { ...prev, medicalNeeds: needs };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!patientForm.patientName || !patientForm.age || !patientForm.gender || !patientForm.medicalCondition) {
      alert('Please fill in all required fields marked with *');
      return;
    }
    if (patientForm.medicalNeeds.length === 0) {
      alert('Please select at least one required medical resource.');
      return;
    }

    try {
      const payload = {
        patientName: patientForm.patientName,
        age: Number(patientForm.age),
        gender: patientForm.gender,
        medicalCondition: patientForm.medicalCondition,
        bloodPressure: patientForm.bloodPressure,
        heartRate: patientForm.heartRate ? Number(patientForm.heartRate) : undefined,
        oxygenSaturation: patientForm.oxygenSaturation ? Number(patientForm.oxygenSaturation) : undefined,
        allergies: patientForm.allergies,
        medicalNeeds: patientForm.medicalNeeds,
        additionalNotes: patientForm.additionalNotes,
        driverEmail: driver ? driver.email : 'anonymous@mediroute.com',
        selectedHospital: 'Pending Selection',
        status: 'pending'
      };

      const res = await api.post('/patient', payload);
      if (res.status === 200) {
        setPatientStatusText('Details Saved - Ready for Hospital Selection');
        setSavedPatientId('temp_id_' + Date.now()); // Set a truthy temp ID to enable polling
        setShowHospitals(true);
        triggerNotification('success', 'Patient Details Saved', 'You can now select a hospital.');
        
        // Scroll to hospital selection
        setTimeout(() => {
          document.getElementById('hospitals-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save patient details to server.');
    }
  };

  const handleSelectHospital = async (hospital) => {
    if (hospital.status === 'full') return;
    
    setSelectedHospitalId(hospital.id);
    setSelectedHospitalName(hospital.name);
    setHospitalResponseText('Waiting for response...');
    setHospitalResponseColor('inherit');
    setPatientStatusText('Waiting for Hospital Response');

    try {
      // In a real flow we update the patient's selected hospital
      const payload = {
        patientName: patientForm.patientName,
        age: Number(patientForm.age),
        gender: patientForm.gender,
        medicalCondition: patientForm.medicalCondition,
        bloodPressure: patientForm.bloodPressure,
        heartRate: patientForm.heartRate ? Number(patientForm.heartRate) : undefined,
        oxygenSaturation: patientForm.oxygenSaturation ? Number(patientForm.oxygenSaturation) : undefined,
        allergies: patientForm.allergies,
        medicalNeeds: patientForm.medicalNeeds,
        additionalNotes: patientForm.additionalNotes,
        driverEmail: driver ? driver.email : 'anonymous@mediroute.com',
        selectedHospital: hospital.name,
        status: 'pending'
      };

      const res = await api.post('/patient', payload);
      if (res.status === 200) {
        setSavedPatientId('patient_active'); // Start checking response
        triggerNotification('success', 'Request Sent', `Patient details sent to ${hospital.name}. Waiting for response.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('danger', 'Error', 'Failed to dispatch request to hospital.');
    }
  };

  return (
    <div className="patient-admit-page">
      {/* Header */}
      <header>
        <div className="patient-admit-container header-container">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-ambulance"></i>
            <h1>Medi <span>Route</span></h1>
          </div>
          <nav>
            <ul>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}><i className="fas fa-home"></i> Home</a></li>
              <li><a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }}><i className="fas fa-user-md"></i> Ambulance Driver</a></li>
              <li><a href="/hospital" onClick={(e) => { e.preventDefault(); navigate('/hospital'); }}><i className="fas fa-hospital"></i> Hospital Access</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Notification System */}
      <div 
        className={`notification notification-${notification.type === 'danger' ? 'danger' : 'success'} ${notification.show ? 'show' : ''}`}
        id={`${notification.type}-notification`}
      >
        <div className="notification-icon">
          <i className={`fas ${notification.type === 'danger' ? 'fa-times' : 'fa-check'}`}></i>
        </div>
        <div className="notification-content">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-message">{notification.message}</div>
        </div>
        <button className="notification-close" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Main Content */}
      <div className="patient-admit-container main-content">
        <div className="page-title">
          <h2>Ambulance Driver Dashboard</h2>
          <p>Enter patient details and select hospital for emergency admission</p>
        </div>

        {/* Dashboard Cards */}
        <div className="dashboard">
          {/* GPS Status Card */}
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">
                <i className="fas fa-satellite-dish"></i>
              </div>
              <h3>Live GPS Tracking</h3>
            </div>
            <div className="gps-status">
              <div className="status-indicator"></div>
              <span>GPS Signal: Strong</span>
            </div>
            <div className="gps-details">
              <div className="gps-detail">
                <span>Current Location:</span>
                <span>{gpsLocationText}</span>
              </div>
              <div className="gps-detail">
                <span>Last Updated:</span>
                <span>{gpsTimeText}</span>
              </div>
            </div>
          </div>

          {/* Patient Status Card */}
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">
                <i className="fas fa-user-injured"></i>
              </div>
              <h3>Patient Status</h3>
            </div>
            <div className="patient-status">
              <div className="status-item">
                <strong>Current Status: </strong> 
                <span>{patientStatusText}</span>
              </div>
              <div className="status-item">
                <strong>Selected Hospital: </strong> 
                <span>{selectedHospitalName}</span>
              </div>
              <div className="status-item">
                <strong>Hospital Response: </strong> 
                <span style={{ color: hospitalResponseColor, fontWeight: 'bold' }}>{hospitalResponseText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Details Form */}
        <div className="patient-form-section">
          <div className="section-header">
            <h3>Patient Information</h3>
          </div>
          
          <form id="patient-form" onSubmit={handleFormSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="patientName">Patient Name *</label>
                <input 
                  type="text" 
                  id="patientName" 
                  className="form-input" 
                  placeholder="Enter patient full name" 
                  value={patientForm.patientName}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="age">Age *</label>
                <input 
                  type="number" 
                  id="age" 
                  className="form-input" 
                  placeholder="Enter age" 
                  min="0" 
                  max="120" 
                  value={patientForm.age}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="gender">Gender *</label>
                <select 
                  id="gender" 
                  className="form-select" 
                  value={patientForm.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="medicalCondition">Medical Condition *</label>
                <select 
                  id="medicalCondition" 
                  className="form-select" 
                  value={patientForm.medicalCondition}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select condition</option>
                  <option value="cardiac">Cardiac Arrest</option>
                  <option value="trauma">Trauma/Accident</option>
                  <option value="stroke">Stroke</option>
                  <option value="respiratory">Respiratory Distress</option>
                  <option value="seizure">Seizure</option>
                  <option value="other">Other Emergency</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="bloodPressure">Blood Pressure</label>
                <input 
                  type="text" 
                  id="bloodPressure" 
                  className="form-input" 
                  placeholder="e.g., 120/80" 
                  value={patientForm.bloodPressure}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="heartRate">Heart Rate (BPM)</label>
                <input 
                  type="number" 
                  id="heartRate" 
                  className="form-input" 
                  placeholder="e.g., 72" 
                  value={patientForm.heartRate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="oxygenSaturation">Oxygen Saturation (%)</label>
                <input 
                  type="number" 
                  id="oxygenSaturation" 
                  className="form-input" 
                  placeholder="e.g., 98" 
                  min="0" 
                  max="100" 
                  value={patientForm.oxygenSaturation}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="allergies">Known Allergies</label>
                <input 
                  type="text" 
                  id="allergies" 
                  className="form-input" 
                  placeholder="e.g., Penicillin, Latex" 
                  value={patientForm.allergies}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Required Medical Resources *</label>
                <div className="medical-needs">
                  <div className="need-checkbox">
                    <input 
                      type="checkbox" 
                      id="need-icu" 
                      value="ICU Bed" 
                      checked={patientForm.medicalNeeds.includes("ICU Bed")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="need-icu">ICU Bed</label>
                  </div>
                  <div className="need-checkbox">
                    <input 
                      type="checkbox" 
                      id="need-ventilator" 
                      value="Ventilator" 
                      checked={patientForm.medicalNeeds.includes("Ventilator")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="need-ventilator">Ventilator</label>
                  </div>
                  <div className="need-checkbox">
                    <input 
                      type="checkbox" 
                      id="need-surgery" 
                      value="Emergency Surgery" 
                      checked={patientForm.medicalNeeds.includes("Emergency Surgery")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="need-surgery">Emergency Surgery</label>
                  </div>
                  <div className="need-checkbox">
                    <input 
                      type="checkbox" 
                      id="need-blood" 
                      value="Blood Transfusion" 
                      checked={patientForm.medicalNeeds.includes("Blood Transfusion")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="need-blood">Blood Transfusion</label>
                  </div>
                  <div className="need-checkbox">
                    <input 
                      type="checkbox" 
                      id="need-cardiac" 
                      value="Cardiac Team" 
                      checked={patientForm.medicalNeeds.includes("Cardiac Team")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="need-cardiac">Cardiac Team</label>
                  </div>
                  <div className="need-checkbox">
                    <input 
                      type="checkbox" 
                      id="need-trauma" 
                      value="Trauma Team" 
                      checked={patientForm.medicalNeeds.includes("Trauma Team")}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor="need-trauma">Trauma Team</label>
                  </div>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label" htmlFor="additionalNotes">Additional Medical Notes</label>
                <textarea 
                  id="additionalNotes" 
                  className="form-textarea" 
                  placeholder="Enter any additional information about the patient's condition, symptoms, or treatment provided"
                  value={patientForm.additionalNotes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="action-buttons">
              <button type="submit" className="confirm-button">
                <i className="fas fa-save"></i> Save Patient Details
              </button>
            </div>
          </form>
        </div>

        {/* Hospitals Section */}
        {showHospitals && (
          <div className="hospitals-section" id="hospitals-section">
            <div className="section-header">
              <h3>Select Hospital</h3>
              <div className="hospital-alert">
                <i className="fas fa-info-circle"></i>
                <span>Patient details saved. Select a hospital for admission.</span>
              </div>
            </div>
            <div className="hospitals-grid" id="hospitals-grid">
              {hospitalsList.map(hospital => (
                <div 
                  key={hospital.id} 
                  className={`hospital-card ${selectedHospitalId === hospital.id ? 'selected' : ''}`}
                  style={{ opacity: hospital.status === 'full' ? 0.6 : 1 }}
                  onClick={() => handleSelectHospital(hospital)}
                >
                  <div className="hospital-header">
                    <div className="hospital-name">{hospital.name}</div>
                    <div className="hospital-distance">{hospital.distance}</div>
                  </div>
                  <div className="hospital-details">
                    <div className="hospital-detail">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{hospital.address}</span>
                    </div>
                    <div className="hospital-detail">
                      <i className="fas fa-phone"></i>
                      <span>{hospital.phone}</span>
                    </div>
                    <div className="hospital-detail">
                      <i className="fas fa-clock"></i>
                      <span>ETA: {hospital.eta}</span>
                    </div>
                    <div className="hospital-detail">
                      <i className="fas fa-bed"></i>
                      <span>ICU Beds: {hospital.icuBeds} available</span>
                    </div>
                  </div>
                  <div className="hospital-actions">
                    {hospital.status === 'full' ? (
                      <button className="select-button" disabled>No Capacity</button>
                    ) : (
                      <button 
                        className="select-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHospital(hospital);
                        }}
                      >
                        {selectedHospitalId === hospital.id ? 'Selected' : 'Select Hospital'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer>
        <div className="patient-admit-container">
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
                <li><a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }}>Ambulance Driver</a></li>
                <li><a href="/hospital" onClick={(e) => { e.preventDefault(); navigate('/hospital'); }}>Hospital Access</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Emergency Contacts</h3>
              <ul>
                <li><i className="fas fa-phone"></i> Emergency: 108</li>
                <li><i className="fas fa-ambulance"></i> Ambulance: 102</li>
                <li><i className="fas fa-envelope"></i> info@mediroute.com</li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; 2023 Medi Route. All rights reserved. Created by Niranjan, Navaneethan & Nishant</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PatientAdmit;
