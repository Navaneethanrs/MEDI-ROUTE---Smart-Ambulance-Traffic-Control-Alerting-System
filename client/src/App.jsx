import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import DriverAuth from './pages/DriverAuth';
import DriverDashboard from './pages/DriverDashboard';
import PatientAdmit from './pages/PatientAdmit';
import HospitalDashboard from './pages/HospitalDashboard';
import HowItWorks from './pages/HowItWorks';
import QuickGuide from './pages/QuickGuide';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/driver" element={<DriverAuth />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/patient-admit" element={<PatientAdmit />} />
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/how" element={<HowItWorks />} />
        <Route path="/quick" element={<QuickGuide />} />
      </Routes>
    </Router>
  );
}

export default App;
