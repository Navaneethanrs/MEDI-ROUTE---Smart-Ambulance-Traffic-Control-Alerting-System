import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './DriverAuth.css';

const DriverAuth = () => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);

  // Form input states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    hospitalName: '',
    driverName: '',
    email: '',
    password: '',
    phone: '',
    licenceNumber: ''
  });

  // Validation error states
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Check if session already exists
    const storedData = localStorage.getItem('driverData');
    if (storedData) {
      try {
        const driverData = JSON.parse(storedData);
        if (driverData.isLoggedIn) {
          navigate('/driver/dashboard');
        }
      } catch (err) {
        localStorage.removeItem('driverData');
      }
    }
  }, [navigate]);

  const handleLoginChange = (e) => {
    const { id, value } = e.target;
    // Map id to state keys
    const key = id === 'loginEmail' ? 'email' : 'password';
    setLoginForm(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear error
    const errorKey = id + 'Error';
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  const handleRegisterChange = (e) => {
    const { id, value } = e.target;
    let key = id;
    if (id === 'registerEmail') key = 'email';
    if (id === 'registerPassword') key = 'password';

    setRegisterForm(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear error
    const errorKey = id + 'Error';
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  const validateLogin = () => {
    const tempErrors = {};
    let isValid = true;

    if (!/^\S+@\S+\.\S+$/.test(loginForm.email)) {
      tempErrors.loginEmailError = 'Please enter a valid email address';
      isValid = false;
    }
    if (loginForm.password.length === 0) {
      tempErrors.loginPasswordError = 'Please enter your password';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const validateRegister = () => {
    const tempErrors = {};
    let isValid = true;

    if (!registerForm.hospitalName.trim()) {
      tempErrors.hospitalNameError = 'Please enter hospital name';
      isValid = false;
    }
    if (registerForm.driverName.trim().length < 2) {
      tempErrors.driverNameError = 'Please enter your full name';
      isValid = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(registerForm.email)) {
      tempErrors.registerEmailError = 'Please enter a valid email address';
      isValid = false;
    }
    if (registerForm.password.length < 6) {
      tempErrors.registerPasswordError = 'Password must be at least 6 characters';
      isValid = false;
    }
    if (registerForm.phone.trim().length < 10) {
      tempErrors.phoneError = 'Please enter a valid phone number';
      isValid = false;
    }
    if (registerForm.licenceNumber.trim().length < 5) {
      tempErrors.licenceNumberError = 'Please enter your license number';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/driver/login', {
        email: loginForm.email.trim(),
        password: loginForm.password
      });

      if (response.status === 200) {
        const result = response.data;
        const driverData = {
          driverName: result.driver.driverName,
          email: result.driver.email,
          phone: result.driver.phone,
          licenceNumber: result.driver.licenceNumber,
          createdAt: result.driver.createdAt,
          isLoggedIn: true,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('driverData', JSON.stringify(driverData));
        setMessage({ type: 'success', text: `Welcome ${result.driver.driverName}! Login successful.` });

        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errMsg = error.response?.data?.message || 'Invalid email or password';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/driver/register', {
        hospitalName: registerForm.hospitalName.trim(),
        driverName: registerForm.driverName.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        phone: registerForm.phone.trim(),
        licenceNumber: registerForm.licenceNumber.trim()
      });

      if (response.status === 200) {
        localStorage.setItem('driverData', JSON.stringify({
          driverName: registerForm.driverName.trim(),
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          licenceNumber: registerForm.licenceNumber.trim(),
          isLoggedIn: true
        }));

        setMessage({ type: 'success', text: 'Registration successful! You can now login.' });

        setTimeout(() => {
          setFormType('login');
          setLoginForm(prev => ({ ...prev, email: registerForm.email }));
          setMessage({ type: '', text: '' });
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = (type) => {
    setFormType(type);
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="auth-body-container">
      <div className="auth-container floating">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="fas fa-ambulance"></i>
          </div>
          <h1>{formType === 'login' ? 'Driver Login' : 'Driver Register'}</h1>
          <p>{formType === 'login' ? 'Access your MediRoute dashboard' : 'Join the MediRoute network'}</p>
        </div>

        <div className="auth-form">
          <div className="form-toggle">
            <div className={`toggle-slider ${formType}`}></div>
            <div 
              className={`toggle-option ${formType === 'login' ? 'active' : ''}`} 
              onClick={() => toggleForm('login')}
            >
              Login
            </div>
            <div 
              className={`toggle-option ${formType === 'register' ? 'active' : ''}`} 
              onClick={() => toggleForm('register')}
            >
              Register
            </div>
          </div>

          {message.text && (
            <div className={`${message.type}-message`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span>{message.text}</span>
            </div>
          )}

          {/* Login Form */}
          {formType === 'login' && (
            <form id="loginForm" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="loginEmail">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  id="loginEmail" 
                  placeholder="Enter your email" 
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required 
                />
                <i className="fas fa-envelope form-icon"></i>
                {errors.loginEmailError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.loginEmailError}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  id="loginPassword" 
                  placeholder="Enter your password" 
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required 
                />
                <i className="fas fa-lock form-icon"></i>
                {errors.loginPasswordError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.loginPasswordError}</span>
                  </div>
                )}
              </div>

              <button type="submit" className={`auth-button ${loading ? 'loading' : ''}`} id="loginBtn" disabled={loading}>
                <span>{loading ? 'Logging in...' : 'Login to Dashboard'}</span>
              </button>

              <div className="form-footer">
                <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); toggleForm('register'); }}>
                  <i className="fas fa-user-plus"></i>
                  Don't have an account? Register
                </a>
              </div>
            </form>
          )}

          {/* Register Form */}
          {formType === 'register' && (
            <form id="registerForm" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="hospitalName">Hospital Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  id="hospitalName" 
                  placeholder="Enter hospital name" 
                  value={registerForm.hospitalName}
                  onChange={handleRegisterChange}
                  required 
                />
                <i className="fas fa-hospital form-icon"></i>
                {errors.hospitalNameError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.hospitalNameError}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="driverName">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  id="driverName" 
                  placeholder="Enter your full name" 
                  value={registerForm.driverName}
                  onChange={handleRegisterChange}
                  required 
                />
                <i className="fas fa-user form-icon"></i>
                {errors.driverNameError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.driverNameError}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="registerEmail">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  id="registerEmail" 
                  placeholder="Enter your email" 
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required 
                />
                <i className="fas fa-envelope form-icon"></i>
                {errors.registerEmailError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.registerEmailError}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="registerPassword">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  id="registerPassword" 
                  placeholder="Create a password" 
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required 
                />
                <i className="fas fa-lock form-icon"></i>
                {errors.registerPasswordError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.registerPasswordError}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  id="phone" 
                  placeholder="Enter your phone number" 
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  required 
                />
                <i className="fas fa-phone form-icon"></i>
                {errors.phoneError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.phoneError}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="licenceNumber">License Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  id="licenceNumber" 
                  placeholder="Enter your license number" 
                  value={registerForm.licenceNumber}
                  onChange={handleRegisterChange}
                  required 
                />
                <i className="fas fa-id-card form-icon"></i>
                {errors.licenceNumberError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.licenceNumberError}</span>
                  </div>
                )}
              </div>

              <div className="form-footer" style={{ display: 'flex', gap: '15px', borderTop: 'none', marginTop: '0', paddingTop: '0' }}>
                <button 
                  type="button" 
                  className="auth-button" 
                  id="declineBtn" 
                  style={{ background: '#dc3545' }}
                  onClick={() => navigate('/')}
                >
                  <i className="fas fa-times"></i> Decline
                </button>
                <button type="submit" className={`auth-button ${loading ? 'loading' : ''}`} id="acceptBtn" disabled={loading}>
                  <span>{loading ? 'Saving...' : 'Accept & Continue'}</span>
                </button>
              </div>

              <div className="form-footer">
                <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); toggleForm('login'); }}>
                  <i className="fas fa-sign-in-alt"></i>
                  Already have an account? Login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverAuth;
