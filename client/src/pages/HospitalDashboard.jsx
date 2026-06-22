import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import './HospitalDashboard.css';

const HospitalDashboard = () => {
  const navigate = useNavigate();

  // Auth and profile states
  const [hospitalName, setHospitalName] = useState("");
  const [dbId, setDbId] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Resource capacity state (General Beds, ICU Beds, Ventilators, Emergency Doctors)
  const [capacity, setCapacity] = useState({
    generalBeds: 0,
    icuBeds: 0,
    ventilators: 0,
    emergencyDoctors: 0
  });

  // Pending patients from DB / Socket
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Active state for modals/notifications
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalReasonText, setModalReasonText] = useState('');
  const [showModalReasonSection, setShowModalReasonSection] = useState(false);

  // Decline reason states for patient cards
  const [declineReasonCardId, setDeclineReasonCardId] = useState(null);
  const [declineReasonText, setDeclineReasonText] = useState('');

  // Alert overlays
  const [successNotification, setSuccessNotification] = useState({
    show: false,
    title: '',
    message: ''
  });
  const [declineNotification, setDeclineNotification] = useState({
    show: false,
    title: '',
    message: ''
  });

  const socketRef = useRef(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('hospitalToken');
    if (!token) {
      navigate('/hospital/auth');
    } else {
      loadHospitalProfile();
    }
  }, [navigate]);

  const loadHospitalProfile = async () => {
    const token = localStorage.getItem('hospitalToken');
    if (!token) return;

    try {
      const response = await api.get('/hospital/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        const h = response.data;
        setHospitalName(h.name);
        setDbId(h._id);
        setCapacity({
          generalBeds: h.generalBeds || 0,
          icuBeds: h.icuBeds || 0,
          ventilators: h.ventilators || 0,
          emergencyDoctors: h.emergencyDoctors || 0
        });
        if (h.lastUpdatedAt) setLastUpdated(new Date(h.lastUpdatedAt));
      }
    } catch (err) {
      console.error("Error loading hospital profile:", err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hospitalToken');
    localStorage.removeItem('hospitalData');
    navigate('/hospital/auth');
  };

  // Fetch pending patients from DB
  const loadIncomingPatients = async () => {
    if (!hospitalName) return;
    try {
      const response = await api.get('/patients/pending');
      if (response.status === 200) {
        // Filter patients for this hospital
        const filtered = response.data.filter(p => 
          p.hospitalId === dbId || 
          p.selectedHospital === hospitalName || 
          (p.selectedHospital && hospitalName && p.selectedHospital.toLowerCase() === hospitalName.toLowerCase())
        );
        setPatients(filtered);
        setErrorText('');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setErrorText('Unable to Connect to Server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients when profile loaded
  useEffect(() => {
    if (hospitalName) {
      loadIncomingPatients();
    }
  }, [hospitalName]);

  // Socket.IO real-time updates setup
  useEffect(() => {
    if (!dbId || !hospitalName) return;

    // Connect socket
    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;

    // Join hospital room
    socket.emit('join_room', { role: 'hospital', id: dbId });

    // Listen for live incoming request
    socket.on('incoming_patient_request', (patientData) => {
      console.log('Real-time request received via socket:', patientData);
      
      // Play alert sound if possible
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.5;
        audio.play();
      } catch (e) {
        console.log('Audio playback blocked');
      }

      // Add to patient state lists
      setPatients(prev => [patientData, ...prev]);

      setSuccessNotification({
        show: true,
        title: '🔴 URGENT EMERGENCY ALERT!',
        message: `Ambulance approaching for patient ${patientData.patientName} (${patientData.medicalCondition}). Please review immediately.`
      });
      setTimeout(() => setSuccessNotification(prev => ({ ...prev, show: false })), 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [dbId, hospitalName]);

  // Handle capacity increment/decrement locally
  const handleCapacityChange = (field, amount) => {
    setCapacity(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount)
    }));
  };

  // Save modified capacities to MongoDB and emit live updates
  const saveCapacityToDB = async () => {
    const token = localStorage.getItem('hospitalToken');
    if (!token) return;
    
    setSaving(true);
    try {
      const res = await api.put(`/hospital/profile`, {
        icuBeds: capacity.icuBeds,
        ventilators: capacity.ventilators,
        generalBeds: capacity.generalBeds,
        emergencyDoctors: capacity.emergencyDoctors
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 200) {
        setLastUpdated(new Date());
        setSuccessNotification({
          show: true,
          title: "Capacity Synchronized",
          message: `The live resources for ${hospitalName} have been broadcast to all active ambulances.`
        });
        setTimeout(() => setSuccessNotification(prev => ({ ...prev, show: false })), 4000);
      }
    } catch (err) {
      console.error("Error saving capacity:", err);
      alert("Failed to save capacity.");
    } finally {
      setSaving(false);
    }
  };

  // Helper: calculate time ago
  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getCapacityStatus = () => {
    if (capacity.icuBeds > 3) {
      return (
        <div className="availability-status status-available">
          <i className="fas fa-check-circle"></i>
          <span>Accepting Emergency Patients</span>
        </div>
      );
    } else if (capacity.icuBeds > 0) {
      return (
        <div className="availability-status status-limited">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Limited Capacity</span>
        </div>
      );
    } else {
      return (
        <div className="availability-status status-full">
          <i className="fas fa-times-circle"></i>
          <span>ICU at Full Capacity</span>
        </div>
      );
    }
  };

  // View full details in modal
  const handleViewPatientDetails = async (patientId) => {
    try {
      const response = await api.get(`/patients/${patientId}`);
      if (response.status === 200) {
        setSelectedPatient(response.data);
        setShowModal(true);
        setShowModalReasonSection(false);
        setModalReasonText('');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      const fallback = patients.find(p => p._id === patientId || p.id === patientId);
      if (fallback) {
        setSelectedPatient(fallback);
        setShowModal(true);
        setShowModalReasonSection(false);
        setModalReasonText('');
      } else {
        alert('Unable to load patient details.');
      }
    }
  };

  // Admit patient (emit socket)
  const handleAdmitPatient = (patientId) => {
    if (socketRef.current) {
      socketRef.current.emit('respond_patient_request', {
        patientId,
        status: 'accepted',
        hospitalName
      });
      
      // Update state locally immediately
      setPatients(prev => prev.filter(p => p._id !== patientId && p.id !== patientId));
      
      setSuccessNotification({
        show: true,
        title: 'Patient Admitted Successfully!',
        message: `The driver has been notified. The ICU beds/ventilators will sync dynamically.`
      });
      setTimeout(() => setSuccessNotification(prev => ({ ...prev, show: false })), 4000);
      
      // Reload profile after database updates
      setTimeout(() => loadHospitalProfile(), 500);
    }
  };

  // Decline patient from card (emit socket)
  const handleDeclinePatientSubmit = (patientId, reason) => {
    if (!reason.trim()) {
      alert('Please enter a decline reason.');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('respond_patient_request', {
        patientId,
        status: 'declined',
        reason,
        hospitalName
      });
      
      setPatients(prev => prev.filter(p => p._id !== patientId && p.id !== patientId));
      setDeclineReasonCardId(null);
      setDeclineReasonText('');
      
      setDeclineNotification({
        show: true,
        title: 'Admission Request Declined',
        message: `Decline response with reason "${reason}" has been dispatched to the driver.`
      });
      setTimeout(() => setDeclineNotification(prev => ({ ...prev, show: false })), 4000);
      
      setTimeout(() => loadHospitalProfile(), 500);
    }
  };

  // Decline patient from modal
  const handleModalDeclineSubmit = () => {
    if (!modalReasonText.trim()) {
      alert('Please enter a decline reason.');
      return;
    }
    if (selectedPatient) {
      const patientId = selectedPatient._id || selectedPatient.id;
      handleDeclinePatientSubmit(patientId, modalReasonText);
      setShowModal(false);
      setSelectedPatient(null);
    }
  };

  return (
    <div className="hospital-dashboard-page">
      {/* Header */}
      <header>
        <div className="hospital-dashboard-container header-container">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-hospital"></i>
            <h1>Medi <span>Route</span></h1>
          </div>
          <nav>
            <ul>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}><i className="fas fa-home"></i> Home</a></li>
              <li><a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }}><i className="fas fa-user-md"></i> Driver Portal</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="active-nav-link"><i className="fas fa-hospital-alt"></i> Hospital Portal</a></li>
            </ul>
          </nav>
          <div className="hospital-profile-nav-info">
            <span className="hosp-nav-name"><i className="fas fa-clinic-medical"></i> {hospitalName || 'Loading...'}</span>
            <button onClick={handleLogout} className="hosp-nav-logout-btn">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="hospital-dashboard-container main-content">
        <div className="page-title">
          <h2>Hospital Emergency Dashboard</h2>
          <p>Coordinate emergency ambulance receptions and resource capacities in real-time</p>
        </div>

        {/* Dashboard capacity info */}
        <div className="dashboard">
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">
                <i className="fas fa-hospital-user"></i>
              </div>
              <h3>Emergency Resource Sync</h3>
            </div>
            <div className="resources-grid">
              <div className="resource-item">
                <div className="resource-value-editor">
                  <button className="qty-btn" onClick={() => handleCapacityChange('generalBeds', -1)}><i className="fas fa-minus"></i></button>
                  <span className="resource-value">{capacity.generalBeds}</span>
                  <button className="qty-btn" onClick={() => handleCapacityChange('generalBeds', 1)}><i className="fas fa-plus"></i></button>
                </div>
                <div className="resource-label">General Beds</div>
              </div>

              <div className="resource-item">
                <div className="resource-value-editor">
                  <button className="qty-btn" onClick={() => handleCapacityChange('icuBeds', -1)}><i className="fas fa-minus"></i></button>
                  <span className="resource-value">{capacity.icuBeds}</span>
                  <button className="qty-btn" onClick={() => handleCapacityChange('icuBeds', 1)}><i className="fas fa-plus"></i></button>
                </div>
                <div className="resource-label">ICU Beds</div>
              </div>

              <div className="resource-item">
                <div className="resource-value-editor">
                  <button className="qty-btn" onClick={() => handleCapacityChange('ventilators', -1)}><i className="fas fa-minus"></i></button>
                  <span className="resource-value">{capacity.ventilators}</span>
                  <button className="qty-btn" onClick={() => handleCapacityChange('ventilators', 1)}><i className="fas fa-plus"></i></button>
                </div>
                <div className="resource-label">Ventilators</div>
              </div>

              <div className="resource-item">
                <div className="resource-value-editor">
                  <button className="qty-btn" onClick={() => handleCapacityChange('emergencyDoctors', -1)}><i className="fas fa-minus"></i></button>
                  <span className="resource-value">{capacity.emergencyDoctors}</span>
                  <button className="qty-btn" onClick={() => handleCapacityChange('emergencyDoctors', 1)}><i className="fas fa-plus"></i></button>
                </div>
                <div className="resource-label">On-Duty ER Doctors</div>
              </div>
            </div>
            <div className="save-capacity-container">
              <button className="save-capacity-btn" onClick={saveCapacityToDB} disabled={saving}>
                {saving ? 'Broadcasting...' : 'Broadcast Capacity Sync'}
              </button>
              <div className="last-sync-timestamp">
                Last broadcast: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            {getCapacityStatus()}
          </div>

          {/* Current Alerts Card */}
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">
                <i className="fas fa-bell"></i>
              </div>
              <h3>Current Alerts</h3>
            </div>
            <div className="alert-list">
              <div className="alert-item">
                <div className="alert-message">
                  <i className="fas fa-ambulance" style={{ color: 'var(--primary)' }}></i>
                  <span><strong>{patients.length} ambulance{patients.length !== 1 ? 's' : ''}</strong> en route to hospital</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-message">
                  <i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)' }}></i>
                  <span><strong>Cardiac team</strong> on standby</span>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-message">
                  <i className="fas fa-clock" style={{ color: 'var(--accent)' }}></i>
                  <span>Next ambulance ETA: <strong>8-15 minutes</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Patients Section */}
        <div className="incoming-patients">
          <div className="section-header">
            <h3>Incoming Patient Requests</h3>
            <div className="patient-alert">
              <i className="fas fa-ambulance"></i>
              <span>{patients.length} Patient Request{patients.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {errorText && (
            <div id="no-patients-message" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-wifi" style={{ fontSize: '48px', marginBottom: '20px', color: 'var(--primary)' }}></i>
              <h4>{errorText}</h4>
              <p>Cannot load patient requests. Please check backend connection.</p>
              <button 
                onClick={loadIncomingPatients} 
                style={{ marginTop: '15px', padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {!errorText && patients.length === 0 && (
            <div id="no-patients-message" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}></i>
              <h4>No Incoming Patient Requests</h4>
              <p>Patient requests from ambulances will appear here in real-time.</p>
            </div>
          )}

          {!errorText && patients.length > 0 && patients.map(patient => {
            const pId = patient._id || patient.id;
            const vitalSigns = [];
            if (patient.bloodPressure) vitalSigns.push(`BP: ${patient.bloodPressure}`);
            if (patient.heartRate) vitalSigns.push(`HR: ${patient.heartRate}`);
            if (patient.oxygenSaturation) vitalSigns.push(`O2: ${patient.oxygenSaturation}%`);

            return (
              <div key={pId} className="patient-card urgent">
                <div className="patient-card-header">
                  <div className="patient-info">
                    <h4>{patient.patientName}</h4>
                    <div className="patient-meta">
                      <span>{patient.age} years • {patient.gender}</span>
                      <span>{patient.medicalCondition}</span>
                      <span>Submitted {getTimeAgo(patient.createdAt)}</span>
                    </div>
                    <div className="patient-meta" style={{ marginTop: '5px', color: '#666' }}>
                      <span><i className="fas fa-user"></i> Driver: {patient.driverName || 'Driver'}</span>
                      <span><i className="fas fa-phone"></i> {patient.driverPhone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="patient-eta">
                    <i className="fas fa-clock"></i>
                    <span>ETA: 8-15 min</span>
                  </div>
                </div>

                <div className="patient-details">
                  <div className="detail-group">
                    <h5>Medical Information</h5>
                    <div className="detail-item">
                      <span className="detail-label">Condition:</span>
                      <span className="detail-value">{patient.medicalCondition}</span>
                    </div>
                    {vitalSigns.length > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Vital Signs:</span>
                        <span className="detail-value">{vitalSigns.join(', ')}</span>
                      </div>
                    )}
                    {patient.allergies && (
                      <div className="detail-item">
                        <span className="detail-label">Allergies:</span>
                        <span className="detail-value">{patient.allergies}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="detail-group">
                    <h5>Required Resources</h5>
                    <div className="medical-needs">
                      {(patient.medicalNeeds || []).slice(0, 3).map((need, index) => (
                        <span key={index} className="need-tag">{need}</span>
                      ))}
                      {(patient.medicalNeeds || []).length > 3 && (
                        <span className="need-tag">+{patient.medicalNeeds.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {declineReasonCardId !== pId ? (
                  <div className="action-buttons" id={`actions-${pId}`}>
                    <button className="view-details-btn" onClick={() => handleViewPatientDetails(pId)}>
                      <i className="fas fa-file-medical"></i> View Full Details
                    </button>
                    <button className="admit-button" onClick={() => handleAdmitPatient(pId)}>
                      <i className="fas fa-check"></i> Admit Patient
                    </button>
                    <button className="decline-button" onClick={() => setDeclineReasonCardId(pId)}>
                      <i className="fas fa-times"></i> Decline Admission
                    </button>
                  </div>
                ) : (
                  <div className="decision-reason" id={`reason-${pId}`}>
                    <textarea 
                      className="reason-textarea" 
                      placeholder="Please provide reason for declining admission..."
                      value={declineReasonText}
                      onChange={(e) => setDeclineReasonText(e.target.value)}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <button className="submit-reason" onClick={() => handleDeclinePatientSubmit(pId, declineReasonText)}>Submit Decline Reason</button>
                      <button className="submit-reason" onClick={() => { setDeclineReasonCardId(null); setDeclineReasonText(''); }} style={{ background: '#666', marginLeft: '10px' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
        <div className="patient-details-modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            
            <div className="modal-header">
              <h3>{selectedPatient.patientName}</h3>
              <span className="patient-status-badge status-pending">PENDING REVIEW</span>
            </div>

            <div className="detail-section">
              <h4>Personal Information</h4>
              <div className="detail-grid">
                <div className="detail-field">
                  <strong>Age</strong>
                  <span>{selectedPatient.age} years</span>
                </div>
                <div className="detail-field">
                  <strong>Gender</strong>
                  <span>{selectedPatient.gender}</span>
                </div>
                <div className="detail-field">
                  <strong>Medical Condition</strong>
                  <span>{selectedPatient.medicalCondition}</span>
                </div>
                <div className="detail-field">
                  <strong>Known Allergies</strong>
                  <span>{selectedPatient.allergies || 'None reported'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Vital Signs</h4>
              <div className="detail-grid">
                <div className="detail-field">
                  <strong>Blood Pressure</strong>
                  <span>{selectedPatient.bloodPressure || 'Not provided'}</span>
                </div>
                <div className="detail-field">
                  <strong>Heart Rate</strong>
                  <span>{selectedPatient.heartRate ? `${selectedPatient.heartRate} BPM` : 'Not provided'}</span>
                </div>
                <div className="detail-field">
                  <strong>Oxygen Saturation</strong>
                  <span>{selectedPatient.oxygenSaturation ? `${selectedPatient.oxygenSaturation}%` : 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Required Medical Resources</h4>
              <div className="medical-resources-grid">
                {['ICU Bed', 'Ventilator', 'Trauma Team', 'Emergency Surgery', 'Blood Transfusion', 'Cardiac Team'].map((resName, i) => {
                  const isRequired = (selectedPatient.medicalNeeds || []).includes(resName);
                  return (
                    <div key={i} className={`resource-check ${isRequired ? 'required' : ''}`}>
                      <i className={`fas ${isRequired ? 'fa-check-circle' : 'fa-times-circle'}`} 
                         style={{ color: isRequired ? 'var(--success)' : '#ccc' }}></i>
                      <span>{resName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-section">
              <h4>Additional Medical Notes</h4>
              <div className="detail-field">
                <span>{selectedPatient.additionalNotes || 'No additional notes provided.'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Ambulance & Driver Information</h4>
              <div className="detail-grid">
                <div className="detail-field">
                  <strong>Driver Name</strong>
                  <span>{selectedPatient.driverName || 'Unknown Driver'}</span>
                </div>
                <div className="detail-field">
                  <strong>Driver Phone</strong>
                  <span>{selectedPatient.driverPhone || 'N/A'}</span>
                </div>
                <div className="detail-field">
                  <strong>Driver Email</strong>
                  <span>{selectedPatient.driverEmail || 'N/A'}</span>
                </div>
                <div className="detail-field">
                  <strong>License Number</strong>
                  <span>{selectedPatient.driverLicense || 'N/A'}</span>
                </div>
                <div className="detail-field">
                  <strong>Request Submitted</strong>
                  <span>{getTimeAgo(selectedPatient.createdAt)}</span>
                </div>
              </div>
            </div>

            {!showModalReasonSection ? (
              <div className="modal-actions">
                <button className="admit-button" onClick={() => { handleAdmitPatient(selectedPatient._id || selectedPatient.id); setShowModal(false); }}>
                  <i className="fas fa-check"></i> Admit Patient
                </button>
                <button className="decline-button" onClick={() => setShowModalReasonSection(true)}>
                  <i className="fas fa-times"></i> Decline Admission
                </button>
              </div>
            ) : (
              <div className="decision-reason" style={{ marginTop: '20px' }}>
                <textarea 
                  className="reason-textarea" 
                  placeholder="Please provide reason for declining admission..." 
                  value={modalReasonText}
                  onChange={(e) => setModalReasonText(e.target.value)}
                />
                <div style={{ marginTop: '10px' }}>
                  <button className="submit-reason" onClick={handleModalDeclineSubmit}>Submit Decline Reason</button>
                  <button className="submit-reason" onClick={() => setShowModalReasonSection(false)} style={{ background: '#666', marginLeft: '10px' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision Success Notification (Admit) */}
      {successNotification.show && (
        <div className="decision-notification">
          <div className="notification-icon icon-admit">
            <i className="fas fa-check"></i>
          </div>
          <h3>{successNotification.title}</h3>
          <p>{successNotification.message}</p>
          <div className="notification-buttons">
            <button className="notification-button button-primary" onClick={() => setSuccessNotification(prev => ({ ...prev, show: false }))}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Decision Success Notification (Decline) */}
      {declineNotification.show && (
        <div className="decision-notification">
          <div className="notification-icon icon-decline">
            <i className="fas fa-times"></i>
          </div>
          <h3>{declineNotification.title}</h3>
          <p>{declineNotification.message}</p>
          <div className="notification-buttons">
            <button className="notification-button button-primary" onClick={() => setDeclineNotification(prev => ({ ...prev, show: false }))}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
