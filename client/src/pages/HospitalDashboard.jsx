import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './HospitalDashboard.css';

const HospitalDashboard = () => {
  const navigate = useNavigate();

  // Resource capacity state
  const [capacity, setCapacity] = useState({
    icuBeds: 8,
    ventilators: 5,
    erBeds: 12
  });

  // Pending patients from DB
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

  // Fetch pending patients
  const loadIncomingPatients = async () => {
    try {
      const response = await api.get('/patients/pending');
      if (response.status === 200) {
        setPatients(response.data);
        setErrorText('');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setErrorText('Unable to Connect to Server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomingPatients();
    // Poll every 3 seconds
    const interval = setInterval(loadIncomingPatients, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate real-time updates for capacity
  useEffect(() => {
    const capacitySim = setInterval(() => {
      if (Math.random() > 0.7) {
        setCapacity(prev => ({
          ...prev,
          icuBeds: Math.max(0, prev.icuBeds + (Math.random() > 0.5 ? 1 : -1))
        }));
      }
      if (Math.random() > 0.7) {
        setCapacity(prev => ({
          ...prev,
          ventilators: Math.max(0, prev.ventilators + (Math.random() > 0.5 ? 1 : -1))
        }));
      }
    }, 45000);

    return () => clearInterval(capacitySim);
  }, []);

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
      // Fallback from existing state list
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

  // Admit patient
  const handleAdmitPatient = async (patientId) => {
    try {
      const response = await api.post(`/patients/${patientId}/accept`);
      if (response.status === 200) {
        const patientName = response.data.patientName || 'Patient';
        
        // Decrement capacity
        const updatedNeeds = response.data.medicalNeeds || [];
        setCapacity(prev => ({
          ...prev,
          icuBeds: updatedNeeds.includes('ICU Bed') ? Math.max(0, prev.icuBeds - 1) : prev.icuBeds,
          ventilators: updatedNeeds.includes('Ventilator') ? Math.max(0, prev.ventilators - 1) : prev.ventilators
        }));

        setSuccessNotification({
          show: true,
          title: 'Patient Admitted Successfully!',
          message: `${patientName} has been admitted. The ambulance driver has been notified and medical teams are preparing for arrival.`
        });
        
        loadIncomingPatients();
      }
    } catch (error) {
      console.error('Error admitting patient:', error);
      alert('Failed to admit patient.');
    }
  };

  // Decline patient from card
  const handleDeclinePatientSubmit = async (patientId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a reason for declining admission.');
      return;
    }
    try {
      const response = await api.post(`/patients/${patientId}/decline`, { reason });
      if (response.status === 200) {
        const patientName = response.data.patientName || 'Patient';
        setDeclineNotification({
          show: true,
          title: 'Admission Declined',
          message: `The admission request for ${patientName} has been declined. Reason: ${reason}. The driver has been notified.`
        });
        setDeclineReasonCardId(null);
        setDeclineReasonText('');
        loadIncomingPatients();
      }
    } catch (error) {
      console.error('Error declining patient:', error);
      alert('Failed to decline patient.');
    }
  };

  // Decline patient from modal
  const handleModalDeclineSubmit = async () => {
    if (!modalReasonText.trim()) {
      alert('Please provide a reason for declining admission.');
      return;
    }
    if (selectedPatient) {
      const patientId = selectedPatient._id || selectedPatient.id;
      try {
        const response = await api.post(`/patients/${patientId}/decline`, { reason: modalReasonText });
        if (response.status === 200) {
          const patientName = response.data.patientName || 'Patient';
          setDeclineNotification({
            show: true,
            title: 'Admission Declined',
            message: `The admission request for ${patientName} has been declined. Reason: ${modalReasonText}. The driver has been notified.`
          });
          setShowModal(false);
          setSelectedPatient(null);
          loadIncomingPatients();
        }
      } catch (error) {
        console.error('Error declining patient from modal:', error);
        alert('Failed to decline patient.');
      }
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
              <li><a href="#" onClick={(e) => e.preventDefault()}><i className="fas fa-hospital"></i> Hospital Access</a></li>
            </ul>
          </nav>
          <div className="hospital-info">
            <div className="hospital-badge">
              <i className="fas fa-hospital"></i> City General Hospital
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="hospital-dashboard-container main-content">
        <div className="page-title">
          <h2>Hospital Emergency Dashboard</h2>
          <p>Manage incoming patients and coordinate with ambulance services</p>
        </div>

        {/* Dashboard capacity info */}
        <div className="dashboard">
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">
                <i className="fas fa-hospital-user"></i>
              </div>
              <h3>Hospital Capacity Status</h3>
            </div>
            <div className="resources-grid">
              <div className="resource-item">
                <div className="resource-value">{capacity.icuBeds}</div>
                <div className="resource-label">ICU Beds Available</div>
              </div>
              <div className="resource-item">
                <div className="resource-value">{capacity.ventilators}</div>
                <div className="resource-label">Ventilators Available</div>
              </div>
              <div className="resource-item">
                <div className="resource-value">{capacity.erBeds}</div>
                <div className="resource-label">ER Beds Available</div>
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
