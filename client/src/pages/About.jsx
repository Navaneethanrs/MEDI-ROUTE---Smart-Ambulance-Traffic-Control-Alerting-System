import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './About.css';

const About = () => {
  const handleEmergencyClick = () => {
    alert('In case of emergency, please call 108 for immediate assistance.');
  };

  return (
    <div>
      <Navbar />

      {/* Page Header */}
      <section className="page-header" style={{ marginTop: '70px' }}>
        <div className="container page-header-content">
          <h2>About Medi Route</h2>
          <p>Learn about our mission to revolutionize emergency medical response and the team behind our life-saving technology.</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <div className="container">
          <div className="section-title">
            <h2>Our Mission</h2>
            <p>We're dedicated to transforming emergency medical response through innovative technology.</p>
          </div>
          <div className="mission-content">
            <div className="mission-text">
              <h3>Reducing Ambulance Delays, Saving Lives</h3>
              <p>At Medi Route, we believe that every second counts in emergency medical situations. Our mission is to leverage cutting-edge IoT technology to create a seamless connection between ambulances, hospitals, and traffic infrastructure.</p>
              <p>We're committed to eliminating the critical minutes lost to traffic congestion and hospital coordination challenges, ensuring that patients receive the care they need when they need it most.</p>
              <p>Through real-time data sharing, intelligent routing, and automated traffic control, we're building a future where emergency medical response is faster, smarter, and more efficient than ever before.</p>
            </div>
            <div className="mission-image">
              <div className="mission-image-placeholder">
                <i className="fas fa-bullseye"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story">
        <div className="container">
          <div className="story-content">
            <div className="story-image">
              <div className="story-image-placeholder">
                <i className="fas fa-history"></i>
              </div>
            </div>
            <div className="story-text">
              <h3>Our Story</h3>
              <p>Medi Route was founded in 2020 by a team of healthcare professionals, engineers, and data scientists who witnessed firsthand the challenges faced by emergency medical services.</p>
              <p>After studying response times in major metropolitan areas, our founders identified that traffic congestion and hospital coordination issues were responsible for significant delays in emergency care.</p>
              <p>Driven by the vision of a connected emergency ecosystem, we developed the Medi Route platform to bridge the gap between ambulances, hospitals, and city infrastructure.</p>
              <p>Today, our system is deployed in over 30 cities, helping save hundreds of lives each month by reducing emergency response times by up to 40%.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values">
        <div className="container">
          <div className="section-title">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do at Medi Route.</p>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3>Patient-First Approach</h3>
              <p>Every decision we make is guided by what's best for the patient in critical condition.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3>Innovation</h3>
              <p>We continuously push the boundaries of technology to solve complex emergency response challenges.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Collaboration</h3>
              <p>We believe in working closely with healthcare providers, city planners, and emergency services.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Reliability</h3>
              <p>Our systems are built with redundancy and fail-safes to ensure they work when needed most.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Data-Driven</h3>
              <p>We use real-time data and analytics to continuously improve our systems and response times.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3>Accessibility</h3>
              <p>We strive to make our technology accessible to communities of all sizes and resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Join Us in Transforming Emergency Response</h2>
          <p>Whether you're a hospital administrator, city planner, or emergency services provider, we'd love to show you how Medi Route can benefit your community.</p>
          <div className="cta-buttons">
            <a href="/contact" className="cta-button" onClick={(e) => { e.preventDefault(); window.location.href = '/contact'; }}>Contact Our Team</a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Emergency Alert */}
      <div className="emergency-alert" onClick={handleEmergencyClick}>
        <i className="fas fa-phone-alt"></i>
        <span>Emergency Hotline: 108</span>
      </div>
    </div>
  );
};

export default About;
