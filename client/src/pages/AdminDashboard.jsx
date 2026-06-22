import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data
  const [stats, setStats] = useState({
    totalHospitals: 0,
    approvedHospitals: 0,
    pendingHospitals: 0,
    totalAmbulances: 0,
    activeRequests: 0,
    totalRequests: 0,
    resources: { icuBeds: 0, ventilators: 0, generalBeds: 0, emergencyDoctors: 0 }
  });
  const [hospitals, setHospitals] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdminLoggedIn(true);
      loadDashboardData();
    }
  }, []);

  // Socket.IO for real-time monitoring
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // Connect socket
    const socket = io('/', { path: '/socket.io' });

    // Join admin room
    socket.emit('join_room', { role: 'admin' });

    // Listen for live activity
    socket.on('system_activity', (data) => {
      setActivityLog(prev => [data, ...prev.slice(0, 19)]);
      // Refresh stats on event
      loadDashboardData();
    });

    socket.on('hospital_resource_updated', (data) => {
      setActivityLog(prev => [{
        type: 'resource_update',
        message: `${data.name} updated capacities (General: ${data.generalBeds}, ICU: ${data.icuBeds}, Doctors: ${data.emergencyDoctors})`,
        timestamp: new Date()
      }, ...prev.slice(0, 19)]);
      loadDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdminLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await api.post('/admin/login', { email, password });
      if (response.status === 200) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAdminLoggedIn(true);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
      setLoginError(err.response?.data?.message || 'Access Denied. Check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminLoggedIn(false);
  };

  const loadDashboardData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const statsRes = await api.get('/admin/stats', config);
      if (statsRes.status === 200) {
        setStats(statsRes.data);
      }

      const hospRes = await api.get('/admin/hospitals', config);
      if (hospRes.status === 200) {
        setHospitals(hospRes.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setDataLoading(false);
    }
  };

  // Hospital actions
  const handleApprove = async (id) => {
    setActionLoadingId(id);
    const token = localStorage.getItem('adminToken');
    try {
      await api.put(`/admin/hospitals/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    const token = localStorage.getItem('adminToken');
    try {
      await api.put(`/admin/hospitals/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this hospital account?')) return;
    
    setActionLoadingId(id);
    const token = localStorage.getItem('adminToken');
    try {
      await api.delete(`/admin/hospitals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="admin-login-page">
        <div className="login-box-card">
          <div className="login-hdr">
            <i className="fas fa-user-shield admin-shield-icon"></i>
            <h2>MediRoute <span>Admin Panel</span></h2>
            <p>Authorized access only</p>
          </div>

          {loginError && (
            <div className="admin-alert error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="admin-form">
            <div className="form-item">
              <label>Admin Email</label>
              <div className="input-group">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  placeholder="admin@mediroute.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-item">
              <label>Password</label>
              <div className="input-group">
                <i className="fas fa-key"></i>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="admin-submit-btn" disabled={loginLoading}>
              {loginLoading ? <span className="spinner-loader"></span> : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Header */}
      <header className="admin-nav-bar">
        <div className="admin-brand">
          <i className="fas fa-user-shield"></i>
          <h1>MediRoute <span>Control Center</span></h1>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>

      <div className="admin-content-viewport">
        {/* Statistics Row */}
        <section className="stats-grid-row">
          <div className="stat-summary-card">
            <div className="stat-details">
              <span className="stat-lbl">Total Registered Facilities</span>
              <h3 className="stat-val">{stats.totalHospitals}</h3>
              <p className="stat-desc">{stats.approvedHospitals} Approved • {stats.pendingHospitals} Pending</p>
            </div>
            <i className="fas fa-hospital stat-card-icon red"></i>
          </div>

          <div className="stat-summary-card">
            <div className="stat-details">
              <span className="stat-lbl">Active Ambulances</span>
              <h3 className="stat-val">{stats.totalAmbulances}</h3>
              <p className="stat-desc">Tracking online GPS alerts</p>
            </div>
            <i className="fas fa-ambulance stat-card-icon blue"></i>
          </div>

          <div className="stat-summary-card">
            <div className="stat-details">
              <span className="stat-lbl">Pending Admissions</span>
              <h3 className="stat-val">{stats.activeRequests}</h3>
              <p className="stat-desc">System total: {stats.totalRequests} requests</p>
            </div>
            <i className="fas fa-hourglass-half stat-card-icon yellow"></i>
          </div>

          <div className="stat-summary-card">
            <div className="stat-details">
              <span className="stat-lbl">Global ICU Beds</span>
              <h3 className="stat-val">{stats.resources?.icuBeds}</h3>
              <p className="stat-desc">{stats.resources?.ventilators} Ventilators Ready</p>
            </div>
            <i className="fas fa-procedures stat-card-icon green"></i>
          </div>
        </section>

        {/* Dashboard Main Split */}
        <div className="admin-split-layout">
          {/* Hospital Account Console */}
          <section className="admin-card-section hospitals-console">
            <div className="section-hdr">
              <h2>Hospital Registration Management</h2>
              <p>Approve, reject, or delete medical facilities accounts</p>
            </div>

            {dataLoading ? (
              <div className="admin-loading-spinner">
                <span className="spinner-loader"></span>
              </div>
            ) : (
              <div className="table-responsive-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Hospital Details</th>
                      <th>Facility Type</th>
                      <th>Resource Stats (G/I/V/D)</th>
                      <th>Contact info</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((h) => (
                      <tr key={h._id}>
                        <td>
                          <div className="hosp-cell-name">
                            <strong>{h.name}</strong>
                            <span>{h.address || 'Address not listed'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge-type">{h.type || 'General Clinic'}</span>
                        </td>
                        <td>
                          <div className="resource-capsule-row">
                            <span title="General Beds" className="res-cap gen">{h.generalBeds || 0}G</span>
                            <span title="ICU Beds" className="res-cap icu">{h.icuBeds || 0}I</span>
                            <span title="Ventilators" className="res-cap vent">{h.ventilators || 0}V</span>
                            <span title="Doctors" className="res-cap doc">{h.emergencyDoctors || 0}D</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            <span>{h.email || 'Synced OSM'}</span>
                            <span className="phone">{h.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${h.isApproved ? 'active' : 'pending'}`}>
                            {h.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-btn-group">
                            {h.isApproved ? (
                              <button
                                onClick={() => handleReject(h._id)}
                                className="action-btn disapprove"
                                disabled={actionLoadingId === h._id}
                                title="Suspending Access"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprove(h._id)}
                                className="action-btn approve"
                                disabled={actionLoadingId === h._id}
                                title="Approve hospital"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(h._id)}
                              className="action-btn delete"
                              disabled={actionLoadingId === h._id}
                              title="Delete account"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {hospitals.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-table-state">
                          No hospital facilities registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Real-time System Monitoring Activity Feed */}
          <section className="admin-card-section live-monitor-section">
            <div className="section-hdr">
              <h2>
                <span className="live-pulsar-dot"></span> Live Activity Monitor
              </h2>
              <p>Real-time system actions logs (Socket.IO)</p>
            </div>

            <div className="activity-feed-container">
              {activityLog.map((log, index) => (
                <div key={index} className={`activity-log-item ${log.type || ''}`}>
                  <div className="activity-icon">
                    {log.type === 'patient_request' && <i className="fas fa-ambulance"></i>}
                    {log.type === 'request_resolved' && <i className="fas fa-check-circle"></i>}
                    {log.type === 'resource_update' && <i className="fas fa-sync-alt"></i>}
                  </div>
                  <div className="activity-details-text">
                    <p>{log.message}</p>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <div className="empty-activity-log">
                  <i className="fas fa-stream"></i>
                  <p>Monitoring activity feed... Waiting for events.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
