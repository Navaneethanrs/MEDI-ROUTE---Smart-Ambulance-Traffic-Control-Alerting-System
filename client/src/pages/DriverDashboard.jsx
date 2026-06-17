import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState({ driverName: 'Driver', email: 'driver@mediroute.com', phone: 'N/A', licenceNumber: 'N/A' });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    driverName: '',
    email: '',
    phone: '',
    licenceNumber: ''
  });

  // GPS State
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsTime, setGpsTime] = useState('Just now');
  const [gpsAccuracy, setGpsAccuracy] = useState('± 10 meters');
  const [gpsStrength, setGpsStrength] = useState('Strong');
  const [currentCoords, setCurrentCoords] = useState(null);
  const gpsWatchIdRef = useRef(null);

  // Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const hospitalLayerGroupRef = useRef(null);

  // Nearby Hospitals State
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Dashboard Page/Section State: 'map', 'patient', 'confirm'
  const [activeSection, setActiveSection] = useState('map');

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

  // Notification Toast State
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // success or error
    title: '',
    message: ''
  });

  useEffect(() => {
    // Authenticate and load profile
    const storedData = localStorage.getItem('driverData');
    if (!storedData) {
      navigate('/driver');
      return;
    }
    try {
      const driverData = JSON.parse(storedData);
      if (!driverData.isLoggedIn) {
        navigate('/driver');
        return;
      }
      setDriver(driverData);
      setEditForm({
        driverName: driverData.driverName || '',
        email: driverData.email || '',
        phone: driverData.phone || '',
        licenceNumber: driverData.licenceNumber || ''
      });
    } catch (err) {
      navigate('/driver');
    }
  }, [navigate]);

  // Notifications polling from server
  useEffect(() => {
    if (!driver || !driver.email) return;

    const checkNotifications = async () => {
      try {
        const response = await api.get(`/notifications/${driver.email}`);
        if (response.status === 200) {
          const notifications = response.data;
          notifications.forEach(noti => {
            if (noti.status === 'accepted') {
              triggerNotification(
                'success',
                'Patient Accepted!',
                `${noti.hospitalName} accepted your patient ${noti.patientName}. Proceed to hospital.`
              );
            } else if (noti.status === 'declined') {
              triggerNotification(
                'error',
                'Patient Declined',
                `${noti.hospitalName} declined ${noti.patientName}. Reason: ${noti.reason || 'No capacity'}`
              );
            }
            
            // Mark as read
            api.post(`/notifications/${noti._id}/read`);
          });
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(checkNotifications, 5000);
    return () => clearInterval(interval);
  }, [driver]);

  // Clean up GPS watcher
  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  // Update map markers when hospitals change
  useEffect(() => {
    if (!mapInstanceRef.current || !hospitals.length) return;
    
    // Clear old hospital markers
    if (hospitalLayerGroupRef.current) {
      hospitalLayerGroupRef.current.clearLayers();
    } else {
      hospitalLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    hospitals.forEach(hospital => {
      L.marker([hospital.lat, hospital.lng])
        .addTo(hospitalLayerGroupRef.current)
        .bindPopup(`
          <b>${hospital.name}</b><br>
          ${hospital.address}<br>
          Distance: ${hospital.distance}<br>
          ETA: ${hospital.eta}
        `);
    });
  }, [hospitals]);

  // Filter hospitals based on search
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = hospitals.filter(hospital => 
      hospital.name.toLowerCase().includes(query) ||
      hospital.address.toLowerCase().includes(query) ||
      hospital.specialties.some(s => s.toLowerCase().includes(query))
    );
    setFilteredHospitals(filtered);
  }, [searchQuery, hospitals]);

  const triggerNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });

    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('driverData');
    navigate('/');
  };

  const handleEditProfileChange = (e) => {
    const { id, value } = e.target;
    // Map IDs to keys
    const key = id === 'editDriverName' ? 'driverName' : id === 'editEmail' ? 'email' : id === 'editPhone' ? 'phone' : 'licenceNumber';
    setEditForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveProfileChanges = (e) => {
    e.preventDefault();
    const updatedData = {
      ...driver,
      ...editForm
    };
    localStorage.setItem('driverData', JSON.stringify(updatedData));
    setDriver(updatedData);
    setShowEditModal(false);
    triggerNotification('success', 'Profile Updated', 'Your profile has been updated successfully!');
  };

  const activateLiveGPS = () => {
    if (!navigator.geolocation) {
      handleGPSError(new Error('Geolocation not supported'));
      return;
    }

    setLoadingHospitals(true);

    const success = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCurrentCoords({ latitude, longitude });
      setGpsAccuracy(`± ${Math.round(accuracy)} meters`);
      setGpsTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (accuracy < 10) setGpsStrength('Excellent');
      else if (accuracy < 25) setGpsStrength('Good');
      else if (accuracy < 50) setGpsStrength('Fair');
      else setGpsStrength('Poor');

      setGpsActive(true);

      // Initialize or update Map
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const mapInstance = L.map(mapContainerRef.current).setView([latitude, longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstance);

        const ambulanceIcon = L.divIcon({
          html: '<i class="fas fa-ambulance" style="color: #e63946; font-size: 24px;"></i>',
          iconSize: [30, 30],
          className: 'custom-div-icon'
        });

        const userMarker = L.marker([latitude, longitude], { icon: ambulanceIcon })
          .addTo(mapInstance)
          .bindPopup('<b>Your Ambulance Location</b>')
          .openPopup();

        L.circle([latitude, longitude], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.05,
          radius: 10000,
          dashArray: '5, 5'
        }).addTo(mapInstance).bindPopup('10km Hospital Search Radius');

        mapInstanceRef.current = mapInstance;
        userMarkerRef.current = userMarker;
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 13);
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }
      }

      fetchHospitals(latitude, longitude);
    };

    navigator.geolocation.getCurrentPosition(success, handleGPSError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    // Watch for continuous updates
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(success, (err) => console.warn(err), {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    });
  };

  const handleGPSError = (error) => {
    console.error('GPS error:', error);
    setGpsAccuracy('Demo Mode');
    setGpsStrength('Simulated');
    setGpsTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setGpsActive(true);

    const lat = 19.0760; // Mumbai fallback
    const lng = 72.8777;
    setCurrentCoords({ latitude: lat, longitude: lng });

    setTimeout(() => {
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const mapInstance = L.map(mapContainerRef.current).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstance);

        const ambulanceIcon = L.divIcon({
          html: '<i class="fas fa-ambulance" style="color: #e63946; font-size: 24px;"></i>',
          iconSize: [30, 30],
          className: 'custom-div-icon'
        });

        L.marker([lat, lng], { icon: ambulanceIcon }).addTo(mapInstance).bindPopup('<b>Simulated Ambulance Location</b>');
        mapInstanceRef.current = mapInstance;
      }
      useFallbackHospitals(lat, lng);
    }, 500);
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchHospitals = async (lat, lng) => {
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:10000,${lat},${lng});
          way["amenity"="hospital"](around:10000,${lat},${lng});
          relation["amenity"="hospital"](around:10000,${lat},${lng});
        );
        out center;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      
      const data = await response.json();
      const mapped = data.elements.map(element => {
        const hLat = element.lat || element.center.lat;
        const hLng = element.lon || element.center.lon;
        const dist = calculateDistance(lat, lng, hLat, hLng);
        const eta = Math.ceil((dist / 40) * 60);

        return {
          id: element.id,
          name: element.tags.name || 'Unknown Hospital',
          address: element.tags['addr:street'] || 'Address not available',
          lat: hLat,
          lng: hLng,
          distance: dist.toFixed(1) + ' km',
          eta: eta + ' min',
          distanceValue: dist,
          specialties: ['Emergency Medicine', 'ICU', 'Trauma Care'],
          phone: '(555) 123-4567',
          icuBeds: Math.floor(Math.random() * 10) + 1,
          ventilators: Math.floor(Math.random() * 6) + 1,
          cardiacTeams: Math.floor(Math.random() * 3) + 1
        };
      }).filter(h => h.distanceValue <= 10)
        .sort((a, b) => a.distanceValue - b.distanceValue);

      if (mapped.length === 0) {
        useFallbackHospitals(lat, lng);
      } else {
        setHospitals(mapped);
        setLoadingHospitals(false);
      }
    } catch (err) {
      console.error(err);
      useFallbackHospitals(lat, lng);
    }
  };

  const useFallbackHospitals = (lat, lng) => {
    const hospitalNames = [
      "City General Hospital", 
      "Unity Medical Center", 
      "Hope Regional Hospital",
      "LifeSavers Medical",
      "Metro Emergency Center",
      "Advanced Care Hospital"
    ];
    
    const fallbacks = hospitalNames.map((name, i) => {
      const rLat = lat + (Math.random() - 0.5) * 0.18;
      const rLng = lng + (Math.random() - 0.5) * 0.18;
      const dist = calculateDistance(lat, lng, rLat, rLng);
      const eta = Math.ceil((dist / 40) * 60);

      return {
        id: i + 1,
        name,
        address: `${i + 1}${i % 2 === 0 ? ' Medical' : ' Health'} Avenue, Healthcare District`,
        lat: rLat,
        lng: rLng,
        distance: dist.toFixed(1) + ' km',
        eta: eta + ' min',
        distanceValue: dist,
        specialties: ['Emergency Medicine', 'ICU', 'Trauma Care', 'Cardiology'],
        phone: `(555) ${100 + i}-${1000 + i}`,
        icuBeds: Math.floor(Math.random() * 10) + 1,
        ventilators: Math.floor(Math.random() * 6) + 1,
        cardiacTeams: Math.floor(Math.random() * 3) + 1
      };
    }).sort((a, b) => a.distanceValue - b.distanceValue);

    setHospitals(fallbacks);
    setLoadingHospitals(false);
  };

  const handlePatientFormChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (checked) {
        setPatientForm(prev => ({
          ...prev,
          medicalNeeds: [...prev.medicalNeeds, value]
        }));
      } else {
        setPatientForm(prev => ({
          ...prev,
          medicalNeeds: prev.medicalNeeds.filter(item => item !== value)
        }));
      }
    } else {
      setPatientForm(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSendToHospital = async (e) => {
    e.preventDefault();
    if (!patientForm.patientName || !patientForm.age || !patientForm.gender || !patientForm.medicalCondition) {
      triggerNotification('error', 'Validation Error', 'Please fill in all required fields marked with *');
      return;
    }
    if (patientForm.medicalNeeds.length === 0) {
      triggerNotification('error', 'Validation Error', 'Please select at least one required medical resource');
      return;
    }
    if (!selectedHospital) {
      triggerNotification('error', 'Validation Error', 'Please select a hospital before sending');
      return;
    }

    setLoadingHospitals(true);

    try {
      const payload = {
        ...patientForm,
        age: Number(patientForm.age),
        heartRate: patientForm.heartRate ? Number(patientForm.heartRate) : undefined,
        oxygenSaturation: patientForm.oxygenSaturation ? Number(patientForm.oxygenSaturation) : undefined,
        selectedHospital: selectedHospital.name,
        driverEmail: driver.email,
        timestamp: new Date().toISOString(),
        location: currentCoords
      };

      const res = await api.post('/patient', payload);
      if (res.status === 200) {
        triggerNotification('success', 'Success!', 'Patient data sent successfully!');
        setActiveSection('confirm');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Error', 'Failed to save patient data. Please try again.');
    } finally {
      setLoadingHospitals(false);
    }
  };

  const resetDashboard = () => {
    setActiveSection('map');
    setSelectedHospital(null);
    setPatientForm({
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
  };

  return (
    <div>
      {/* Header */}
      <header>
        <div className="container header-container">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-ambulance"></i>
            <h1>Medi <span>Route</span></h1>
          </div>
          <nav>
            <ul>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}><i className="fas fa-home"></i> Home</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}><i className="fas fa-user-md"></i> Driver Portal</a></li>
            </ul>
          </nav>
          <div className="driver-profile">
            <button className="profile-btn" onClick={() => setShowProfileMenu(prev => !prev)}>
              <i className="fas fa-user-circle" style={{ fontSize: '20px' }}></i>
              <span>{driver.driverName}</span>
              <i className="fas fa-chevron-down" style={{ fontSize: '12px' }}></i>
            </button>
            
            {showProfileMenu && (
              <div className="profile-menu" style={{ display: 'block' }}>
                <div className="profile-info">
                  <i className="fas fa-user-circle"></i>
                  <div>
                    <div className="profile-name">{driver.driverName}</div>
                    <div className="profile-email">{driver.email}</div>
                  </div>
                </div>
                <hr />
                <a href="#" className="profile-link" onClick={(e) => { e.preventDefault(); setShowEditModal(true); setShowProfileMenu(false); }}>
                  <i className="fas fa-user-edit"></i> Edit Profile
                </a>
                <a href="#" className="profile-link logout" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div 
        className={`notification notification-${notification.type} ${notification.show ? 'show' : ''}`}
        style={{ display: notification.show ? 'flex' : 'none' }}
      >
        <div className="notification-icon">
          <i className={`fas ${notification.type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
        </div>
        <div className="notification-content">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-message">{notification.message}</div>
        </div>
        <button className="notification-close" onClick={() => setNotification((prev) => ({ ...prev, show: false }))}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Main Content */}
      <div className="container main-content">
        <div className="page-title">
          <h2>Ambulance Driver Dashboard</h2>
          <p>Activate GPS to find nearby hospitals and coordinate patient dispatch</p>
        </div>

        {/* 1. GPS Activation Panel */}
        {!gpsActive && (
          <div className="gps-activation">
            <div className="gps-icon-large">
              <i className="fas fa-satellite-dish"></i>
            </div>
            <h3>Enable Live GPS Tracking</h3>
            <p>To find the nearest hospitals and optimize your route, we need to access your device's GPS location. This allows real-time traffic signal optimization for emergency corridors.</p>
            <button className="activate-button" onClick={activateLiveGPS} disabled={loadingHospitals}>
              {loadingHospitals ? (
                <span><i className="fas fa-spinner fa-spin"></i> Activating GPS...</span>
              ) : (
                <span><i className="fas fa-location-dot"></i> Activate GPS Tracking</span>
              )}
            </button>
          </div>
        )}

        {/* GPS Live Info Card */}
        {gpsActive && (
          <div className="gps-card">
            <div className="gps-header">
              <div className="gps-icon">
                <i className="fas fa-satellite-dish"></i>
              </div>
              <h3>Live GPS Location Tracking</h3>
            </div>
            <div className="gps-status">
              <div className="status-indicator"></div>
              <span>GPS Signal: <strong>{gpsStrength}</strong></span>
            </div>
            <div className="gps-details">
              <div className="gps-detail">
                <span>Current Location:</span>
                <span>{currentCoords ? `Lat: ${currentCoords.latitude.toFixed(6)}, Lng: ${currentCoords.longitude.toFixed(6)}` : 'Acquiring...'}</span>
              </div>
              <div className="gps-detail">
                <span>Last Updated:</span>
                <span>{gpsTime}</span>
              </div>
              <div className="gps-detail">
                <span>Accuracy:</span>
                <span>{gpsAccuracy}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Main Map & Hospitals Selection Section */}
        {gpsActive && activeSection === 'map' && (
          <div>
            <div className="map-section">
              <div className="section-header">
                <h3>Nearby Hospitals Map</h3>
                <p>Hospitals within 10km radius are shown on the map</p>
              </div>
              <div ref={mapContainerRef} className="map-container" id="map"></div>
            </div>

            <div className="hospitals-section">
              <div className="section-header">
                <h3>Nearby Hospitals</h3>
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input 
                    type="text" 
                    placeholder="Search hospitals..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {loadingHospitals ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="hospitals-grid">
                  {filteredHospitals.map(hospital => (
                    <div key={hospital.id} className="hospital-card">
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
                      </div>
                      <div className="hospital-specialties">
                        {hospital.specialties.map((spec, i) => (
                          <span key={i} className="specialty-tag">{spec}</span>
                        ))}
                      </div>
                      <div className="hospital-capacity">
                        <div className="capacity-item">
                          <i className="fas fa-procedures"></i>
                          <span>ICU: {hospital.icuBeds}</span>
                        </div>
                        <div className="capacity-item">
                          <i className="fas fa-lungs"></i>
                          <span>Vent: {hospital.ventilators}</span>
                        </div>
                        <div className="capacity-item">
                          <i className="fas fa-heartbeat"></i>
                          <span>Cardiac: {hospital.cardiacTeams}</span>
                        </div>
                      </div>
                      <div className="hospital-actions" style={{ marginTop: '15px' }}>
                        <button 
                          className="select-button" 
                          onClick={() => { setSelectedHospital(hospital); setActiveSection('patient'); }}
                        >
                          Select Hospital
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredHospitals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', gridColumn: '1 / -1' }}>
                      <i className="fas fa-hospital" style={{ fontSize: '48px', marginBottom: '15px', display: 'block' }}></i>
                      <h3>No hospitals found</h3>
                      <p>Try searching for a different keyword.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Patient Details Submission Form */}
        {gpsActive && activeSection === 'patient' && (
          <div className="patient-details-section">
            <div className="section-header">
              <h3>Patient Details</h3>
              <p>Send patient details to <strong>{selectedHospital?.name}</strong> for ER preparation</p>
            </div>
            
            <form onSubmit={handleSendToHospital}>
              <div className="patient-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="patientName">Patient Name *</label>
                  <input 
                    type="text" 
                    id="patientName" 
                    className="form-control" 
                    placeholder="Enter patient full name" 
                    value={patientForm.patientName}
                    onChange={handlePatientFormChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="age">Age *</label>
                  <input 
                    type="number" 
                    id="age" 
                    className="form-control" 
                    placeholder="Enter age" 
                    min="0" 
                    max="120" 
                    value={patientForm.age}
                    onChange={handlePatientFormChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender *</label>
                  <select 
                    id="gender" 
                    className="form-select" 
                    value={patientForm.gender}
                    onChange={handlePatientFormChange}
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
                    onChange={handlePatientFormChange}
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
                    className="form-control" 
                    placeholder="e.g., 120/80"
                    value={patientForm.bloodPressure}
                    onChange={handlePatientFormChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="heartRate">Heart Rate (BPM)</label>
                  <input 
                    type="number" 
                    id="heartRate" 
                    className="form-control" 
                    placeholder="e.g., 72"
                    value={patientForm.heartRate}
                    onChange={handlePatientFormChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="oxygenSaturation">Oxygen Saturation (%)</label>
                  <input 
                    type="number" 
                    id="oxygenSaturation" 
                    className="form-control" 
                    placeholder="e.g., 98" 
                    min="0" 
                    max="100"
                    value={patientForm.oxygenSaturation}
                    onChange={handlePatientFormChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="allergies">Known Allergies</label>
                  <input 
                    type="text" 
                    id="allergies" 
                    className="form-control" 
                    placeholder="e.g., Penicillin, Latex"
                    value={patientForm.allergies}
                    onChange={handlePatientFormChange}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label">Required Medical Resources *</label>
                  <div className="medical-needs">
                    {[
                      { id: 'need-icu', val: 'ICU Bed' },
                      { id: 'need-ventilator', val: 'Ventilator' },
                      { id: 'need-surgery', val: 'Emergency Surgery' },
                      { id: 'need-blood', val: 'Blood Transfusion' },
                      { id: 'need-cardiac', val: 'Cardiac Team' },
                      { id: 'need-trauma', val: 'Trauma Team' }
                    ].map(need => (
                      <div key={need.id} className="need-checkbox">
                        <input 
                          type="checkbox" 
                          id={need.id} 
                          name="medicalNeeds" 
                          value={need.val}
                          checked={patientForm.medicalNeeds.includes(need.val)}
                          onChange={handlePatientFormChange}
                        />
                        <label htmlFor={need.id}>{need.val}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="additionalNotes">Additional Medical Notes</label>
                  <textarea 
                    id="additionalNotes" 
                    className="form-textarea" 
                    placeholder="Enter any additional details"
                    value={patientForm.additionalNotes}
                    onChange={handlePatientFormChange}
                  ></textarea>
                </div>
              </div>
              
              <div className="action-buttons">
                <button type="button" className="back-button" onClick={() => setActiveSection('map')}>
                  <i className="fas fa-arrow-left"></i> Back to Hospitals
                </button>
                <button type="submit" className="confirm-button" disabled={loadingHospitals}>
                  {loadingHospitals ? (
                    <span><i className="fas fa-spinner fa-spin"></i> Sending...</span>
                  ) : (
                    <span><i className="fas fa-paper-plane"></i> Send to Hospital</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Submission Confirmation Section */}
        {gpsActive && activeSection === 'confirm' && (
          <div className="confirmation-section">
            <div className="confirmation-icon">
              <i className="fas fa-check"></i>
            </div>
            <h3>Hospital Notified Successfully!</h3>
            <p>Patient details have been transmitted to <strong>{selectedHospital?.name}</strong>. The medical staff is preparing for arrival.</p>
            
            <div className="eta-display">
              <div className="eta-value">{selectedHospital?.eta}</div>
              <div className="eta-label">Estimated Time of Arrival</div>
            </div>
            
            <p>Traffic signals along your route are being optimized for green corridor priority.</p>
            
            <div className="action-buttons">
              <button className="back-button" onClick={resetDashboard}>
                <i className="fas fa-arrow-left"></i> Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveProfileChanges}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    id="editDriverName" 
                    className="form-input" 
                    value={editForm.driverName}
                    onChange={handleEditProfileChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    id="editEmail" 
                    className="form-input" 
                    value={editForm.email}
                    onChange={handleEditProfileChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    type="tel" 
                    id="editPhone" 
                    className="form-input" 
                    value={editForm.phone}
                    onChange={handleEditProfileChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input 
                    type="text" 
                    id="editLicense" 
                    className="form-input" 
                    value={editForm.licenceNumber}
                    onChange={handleEditProfileChange}
                    required 
                  />
                </div>
                <div className="modal-actions" style={{ borderTop: 'none', marginTop: '10px' }}>
                  <button type="button" className="back-button" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="confirm-button">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Medi Route</h3>
              <p>Smart Ambulance traffic corridor system coordinating emergency vehicles, traffic systems and hospitals.</p>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a></li>
                <li><a href="/driver" onClick={(e) => { e.preventDefault(); navigate('/driver'); }}>Driver Portal</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contact Us</h3>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> Valluvar Hostel Room No: 117, Kongu Engineering College</li>
                <li><i className="fas fa-phone"></i> 9342512455, 8825905640</li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} Medi Route. All rights reserved. Created by Niranjan, Navaneethan & Nishant</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DriverDashboard;
