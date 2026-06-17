import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      <div className="container">
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
              <li><Link to="/">Home</Link></li>
              <li><Link to="/quick">Quick Access</Link></li>
              <li><Link to="/how">How It Works</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Features</h3>
            <ul>
              <li><a href="#">Hospital Detection</a></li>
              <li><a href="#">Bed Booking</a></li>
              <li><a href="#">Medical Reporting</a></li>
              <li><a href="#">Ambulance Tracking</a></li>
              <li><a href="#">Traffic Control</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Contact Us</h3>
            <ul>
              <li><i className="fas fa-map-marker-alt"></i> Valluvar Hostel Room No: 117, Kongu Engineering College</li>
              <li><i className="fas fa-phone"></i> 9342512455, 8825905640</li>
              <li><i className="fas fa-envelope"></i> info@mediroute.com</li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} Medi Route. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
