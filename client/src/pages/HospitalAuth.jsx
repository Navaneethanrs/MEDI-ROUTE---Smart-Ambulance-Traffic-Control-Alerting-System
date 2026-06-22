import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './HospitalAuth.css';

const HospitalAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('Multi-Specialty Trauma Hospital');

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem('hospitalToken');
    if (token) {
      navigate('/hospital');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const response = await api.post('/hospital/login', { email, password });
        if (response.status === 200) {
          localStorage.setItem('hospitalToken', response.data.token);
          localStorage.setItem('hospitalData', JSON.stringify(response.data.hospital));
          navigate('/hospital');
        }
      } else {
        // Register API Call
        const response = await api.post('/hospital/register', {
          name,
          email,
          password,
          address,
          phone,
          type
        });
        if (response.status === 201) {
          setSuccessText(response.data.message);
          setIsLogin(true); // Toggle to login view
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorText(err.response?.data?.message || 'Connection to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-overlay-card">
        <div className="auth-header">
          <i className="fas fa-hospital auth-logo-icon"></i>
          <h2>MediRoute <span>Hospital Portal</span></h2>
          <p>{isLogin ? 'Access your real-time hospital resource dashboard' : 'Register your medical facility with MediRoute'}</p>
        </div>

        {errorText && (
          <div className="auth-alert error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="auth-alert success">
            <i className="fas fa-check-circle"></i>
            <span>{successText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group-item">
                <label>Hospital Name *</label>
                <div className="input-with-icon">
                  <i className="fas fa-clinic-medical"></i>
                  <input
                    type="text"
                    placeholder="e.g., City General Hospital"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label>Facility Type</label>
                <div className="input-with-icon">
                  <i className="fas fa-hand-holding-medical"></i>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Multi-Specialty Trauma Hospital">Multi-Specialty Trauma Hospital</option>
                    <option value="General Emergency Care">General Emergency Care</option>
                    <option value="Women & Children Hospital">Women & Children Hospital</option>
                    <option value="Cardiac Care Center">Cardiac Care Center</option>
                  </select>
                </div>
              </div>

              <div className="form-group-item">
                <label>Contact Number</label>
                <div className="input-with-icon">
                  <i className="fas fa-phone"></i>
                  <input
                    type="tel"
                    placeholder="e.g., +91 427 466483"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label>Address</label>
                <div className="input-with-icon">
                  <i className="fas fa-map-marker-alt"></i>
                  <input
                    type="text"
                    placeholder="e.g., Salem, Tamil Nadu"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group-item">
            <label>Email Address *</label>
            <div className="input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="hospital@mediroute.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-item">
            <label>Password *</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-loader"></span>
            ) : isLogin ? (
              'Login to Dashboard'
            ) : (
              'Submit Registration'
            )}
          </button>
        </form>

        <div className="auth-footer-toggle">
          {isLogin ? (
            <p>
              Want to register your hospital?{' '}
              <span onClick={() => setIsLogin(false)}>Sign Up Here</span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span onClick={() => setIsLogin(true)}>Log In Here</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalAuth;
