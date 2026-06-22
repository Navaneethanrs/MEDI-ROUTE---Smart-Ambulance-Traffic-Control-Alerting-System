import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  
  // Notification states
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // success or error
    title: '',
    message: ''
  });

  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "How long does it take to implement Medi Route in a city?",
      a: "Implementation typically takes 3-6 months depending on the size of the city and existing infrastructure. We work closely with municipal authorities to ensure a smooth integration with minimal disruption to existing services."
    },
    {
      q: "What are the hardware requirements for hospitals?",
      a: "Hospitals need our dedicated dashboard software which can run on existing computers or tablets. No specialized hardware is required beyond standard internet connectivity. For ambulances, we install our IoT device which includes GPS, communication modules, and traffic signal interface."
    },
    {
      q: "How does Medi Route integrate with existing traffic systems?",
      a: "Our system uses standardized protocols to interface with most modern traffic control systems. We work with city traffic departments to establish secure communication channels that allow our system to temporarily prioritize emergency vehicles at intersections."
    },
    {
      q: "Is patient data secure in your system?",
      a: "Yes, we take data security very seriously. All patient information is encrypted end-to-end and transmitted securely. Our system is HIPAA compliant and we undergo regular security audits to ensure the highest level of data protection."
    },
    {
      q: "What kind of training do you provide for ambulance crews and hospital staff?",
      a: "We provide comprehensive training programs for all users. For ambulance crews, we offer hands-on training sessions and simulation exercises. For hospital staff, we provide both in-person and online training modules. We also offer ongoing support and refresher courses as needed."
    }
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/contact', {
        ...formData,
        submittedAt: new Date().toISOString()
      });

      triggerNotification(
        'success',
        'Success!',
        'Your message has been sent successfully! We will get back to you soon.'
      );
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        organization: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Server not available, storing locally:', error);
      
      // Local storage fallback
      const contactData = {
        ...formData,
        submittedAt: new Date().toISOString()
      };
      
      const existingContacts = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
      existingContacts.push(contactData);
      localStorage.setItem('contactSubmissions', JSON.stringify(existingContacts));
      
      triggerNotification(
        'success',
        'Message Saved!',
        'Your message has been saved locally. Please start the server to sync to database.'
      );

      // Clear form
      setFormData({
        name: '',
        email: '',
        organization: '',
        phone: '',
        subject: '',
        message: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  const handleEmergencyClick = () => {
    alert('In case of emergency, please call 108 for immediate assistance.');
  };

  return (
    <div>
      <Navbar />

      {/* Notification System */}
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

      {/* Page Header */}
      <section className="page-header" style={{ marginTop: '70px' }}>
        <div className="container page-header-content">
          <h2>Contact Medi Route</h2>
          <p>Get in touch with our team to learn how our smart ambulance system can transform emergency response in your community.</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="section-title">
            <h2>Get In Touch</h2>
            <p>We're here to answer any questions and help you implement Medi Route in your city or hospital.</p>
          </div>
          
          <div className="contact-container">
            <div className="contact-info">
              <div className="contact-card">
                <div className="contact-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <h3>Our Location</h3>
                <p>Valluvar Hostel Room No: 117</p>
                <p>Kongu Engineering College</p>
                <p>Perundurai, Tamil Nadu</p>
              </div>
              
              <div className="contact-card">
                <div className="contact-icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <h3>Phone Number</h3>
                <p>9342512455</p>
                <p>8825905640</p>
                <p>Available 24/7</p>
              </div>
              
              <div className="contact-card">
                <div className="contact-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <h3>Email Address</h3>
                <p>info@mediroute.com</p>
                <p>support@mediroute.com</p>
                <p>partnerships@mediroute.com</p>
              </div>
            </div>
            
            <div className="contact-form">
              <h3 style={{ marginBottom: '25px', color: 'var(--secondary)' }}>Send Us a Message</h3>
              <form id="contactForm" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    className="form-control" 
                    placeholder="Enter your full name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="form-control" 
                    placeholder="Enter your email address" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="organization">Organization</label>
                  <input 
                    type="text" 
                    id="organization" 
                    className="form-control" 
                    placeholder="Enter your organization name"
                    value={formData.organization}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    className="form-control" 
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select 
                    id="subject" 
                    className="form-control" 
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="demo">Request a Demo</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="general">General Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    className="form-control" 
                    placeholder="Enter your message" 
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-btn" id="submitBtn" disabled={loading}>
                  {!loading ? (
                    <span id="submitText">Send Message</span>
                  ) : (
                    <span id="submitLoading">
                      <i className="fas fa-spinner fa-spin"></i> Sending...
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-title">
            <h2>Frequently Asked Questions</h2>
            <p>Quick answers to common questions about Medi Route</p>
          </div>
          
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.q}</span>
                  <i className="fas fa-chevron-down"></i>
                </div>
                <div 
                  className="faq-answer"
                  style={{
                    maxHeight: activeFaq === index ? '500px' : '0px',
                    padding: activeFaq === index ? '0 25px 25px' : '0 25px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="container">
          <div className="section-title">
            <h2>Find Us</h2>
            <p>Visit our headquarters or schedule a virtual meeting</p>
          </div>
          
          <div className="map-container">
            <div className="map-placeholder">
              <i className="fas fa-map-marked-alt"></i>
              <h3>Medi Route Headquarters</h3>
              <p>Kongu Engineering College, Perundurai, Erode, Tamil Nadu - 638060</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Emergency Response?</h2>
          <p>Join cities and hospitals across the country that are already using Medi Route to save lives and improve emergency medical services.</p>
          <div className="cta-buttons">
            <a href="#" className="cta-button" onClick={(e) => { e.preventDefault(); alert("Demo request feature is coming soon!"); }}>Request a Demo</a>
            <a href="tel:+15551234567" className="secondary-button">Call Us Now</a>
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

export default Contact;
