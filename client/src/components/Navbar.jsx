import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header>
      <div className="container header-container">
        <div className="logo">
          <i className="fas fa-ambulance"></i>
          <h1>Medi <span>Route</span></h1>
        </div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/quick">Quick Access</Link></li>
            <li><Link to="/how">How It Works</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/driver">Driver Login</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
