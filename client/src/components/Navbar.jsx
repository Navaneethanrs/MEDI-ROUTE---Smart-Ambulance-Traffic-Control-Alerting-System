import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
            <li><Link to="/how">How It Works</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li 
              className="nav-dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <span className="dropdown-trigger">
                Logins <i className="fas fa-caret-down"></i>
              </span>
              <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                <li><Link to="/admin">Admin Login</Link></li>
                <li><Link to="/driver">Driver Login</Link></li>
                <li><Link to="/hospital/auth">Hospital Login</Link></li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
