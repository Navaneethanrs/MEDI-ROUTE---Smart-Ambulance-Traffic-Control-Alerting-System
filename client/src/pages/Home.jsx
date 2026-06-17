import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Home.css';

const Home = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  // Simple React Carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: "Emergency Dispatch",
      text: "Our system instantly dispatches the nearest available ambulance to emergency locations with real-time traffic optimization.",
      color: "#1d3557"
    },
    {
      title: "Hospital Coordination",
      text: "Seamlessly coordinate with hospitals to ensure beds and medical staff are ready upon patient arrival.",
      color: "#457b9d"
    },
    {
      title: "Traffic Management",
      text: "Smart traffic signal control creates green corridors for ambulances, reducing transit time by up to 40%.",
      color: "#e63946"
    },
    {
      title: "Real-time Tracking",
      text: "Hospitals and emergency services can track ambulance location and ETA in real-time.",
      color: "#2a9d8f"
    }
  ];

  // Simple React Testimonials state
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      quote: "Medi Route has reduced our ambulance response times by 35% and improved patient outcomes significantly. The real-time coordination is a game-changer for emergency medicine.",
      author: "Dr. Sarah Johnson",
      role: "Chief of Emergency Medicine, City General Hospital",
      icon: "fa-user-md"
    },
    {
      quote: "The traffic signal control feature has been revolutionary. Our ambulances now reach patients faster, and we've seen a 40% reduction in transit time to hospitals.",
      author: "Michael Rodriguez",
      role: "EMS Director, Metro Ambulance Services",
      icon: "fa-ambulance"
    },
    {
      quote: "Implementing Medi Route has transformed our emergency response capabilities. The bed booking system ensures our patients get immediate care upon arrival.",
      author: "Jennifer Lee",
      role: "Hospital Administrator, Regional Medical Center",
      icon: "fa-hospital"
    }
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume / 100;

    const handleTimeUpdate = () => {
      setCurrentTime(formatTime(video.currentTime));
    };

    const handleLoadedMetadata = () => {
      setDuration(formatTime(video.duration));
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [volume]);

  // Testimonials autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Play failed:", err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    const video = videoRef.current;
    if (video) {
      video.volume = val / 100;
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
      video.msRequestFullscreen();
    }
  };

  const handleEmergencyClick = () => {
    alert('In case of emergency, please call 108 for immediate assistance.');
  };

  return (
    <div>
      <Navbar />

      {/* Hero Section */}
      <section className="hero" style={{ marginTop: '70px' }}>
        <div className="container hero-content">
          <div className="hero-text">
            <h2>Revolutionizing Emergency Medical Response</h2>
            <p>Medi Route is an IoT-based Smart Ambulance Traffic Control System designed to reduce ambulance delays, provide real-time hospital connectivity, and save lives through efficient coordination.</p>
            <a href="/about" className="cta-button" onClick={(e) => { e.preventDefault(); window.location.href = '/about'; }}>Learn More</a>
          </div>
          <div className="hero-image">
            <div style={{ width: '100%', height: '300px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justify-content: 'center' }}>
              <i className="fas fa-ambulance" style={{ fontSize: '150px', opacity: 0.7 }}></i>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="container">
          <div className="section-title">
            <h2>See Medi Route in Action</h2>
            <p>Watch how our smart ambulance system revolutionizes emergency medical response and saves precious lives.</p>
          </div>
          <div className="video-container">
            <div className="video-wrapper">
              <video 
                ref={videoRef}
                className="main-video" 
                controls={false}
                preload="metadata"
              >
                <source src="/mediroute.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div 
                className={`video-overlay ${isPlaying ? 'hidden' : ''}`} 
                onClick={togglePlayPause}
                style={{ display: isPlaying ? 'none' : 'flex' }}
              >
                <div className="play-button">
                  <i className="fas fa-play"></i>
                </div>
              </div>
            </div>
            <div className="video-controls">
              <button className="control-btn" onClick={togglePlayPause} title="Play/Pause">
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button className="control-btn" onClick={toggleMute} title="Mute/Unmute">
                <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 50 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
              </button>
              <div className="volume-slider">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="slider"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${isMuted ? 0 : volume}%, #ddd ${isMuted ? 0 : volume}%, #ddd 100%)`
                  }}
                />
              </div>
              <div className="time-display">
                <span>{currentTime}</span> / <span>{duration}</span>
              </div>
              <button className="control-btn" onClick={handleFullscreen} title="Fullscreen">
                <i className="fas fa-expand"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-title">
            <h2>Key Features</h2>
            <p>Our comprehensive system connects ambulances, hospitals, and traffic infrastructure to create a seamless emergency response network.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-hospital"></i>
              </div>
              <h3>Nearby Hospital Detection</h3>
              <p>Ambulance drivers can instantly view nearby hospitals based on GPS location for the fastest route.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bed"></i>
              </div>
              <h3>Bed Booking System</h3>
              <p>Reserve patient beds in advance based on real-time hospital availability and requirements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-medical"></i>
              </div>
              <h3>Medical Requirement Reporting</h3>
              <p>Send patient details and medical needs to hospitals before arrival for better preparation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Ambulance Tracking</h3>
              <p>Hospitals can track ambulances in real-time to prepare for patient arrival.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-traffic-light"></i>
              </div>
              <h3>Traffic Signal Control</h3>
              <p>Automatically switch traffic signals to green when ambulances approach intersections.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3>Life-Saving Coordination</h3>
              <p>Efficient coordination between drivers, hospitals, and traffic systems to save lives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="carousel-section">
        <div className="container">
          <div className="section-title">
            <h2>Medi Route in Action</h2>
            <p>See how our system is transforming emergency medical services across different scenarios.</p>
          </div>
          <div className="carousel-container">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
              {slides.map((slide, index) => (
                <div key={index} className="item" style={{ maxWidth: '300px', flex: '1 1 300px' }}>
                  <div className="carousel-image" style={{ backgroundColor: slide.color }}></div>
                  <div className="carousel-content">
                    <h3>{slide.title}</h3>
                    <p>{slide.text}</p>
                    <a href="#" className="cta-button" onClick={(e) => e.preventDefault()}>Learn More</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-title">
            <h2>How Medi Route Works</h2>
            <p>Our system creates a seamless connection between emergency vehicles, hospitals, and traffic infrastructure.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Emergency Alert</h3>
              <p>Ambulance receives emergency call and is dispatched to location.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Hospital Selection</h3>
              <p>System identifies nearby hospitals with required facilities.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Bed & Resource Booking</h3>
              <p>Reserves bed and notifies hospital of patient needs.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Smart Routing</h3>
              <p>Calculates fastest route considering traffic conditions.</p>
            </div>
            <div className="step">
              <div className="step-number">5</div>
              <h3>Traffic Control</h3>
              <p>Signals turn green as ambulance approaches intersections.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-title">
            <h2>What Our Partners Say</h2>
            <p>Hear from hospitals and emergency services using Medi Route to save lives.</p>
          </div>
          <div className="testimonial-carousel" style={{ position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
            {testimonials.map((t, idx) => (
              <div 
                key={idx} 
                className="item" 
                style={{ 
                  display: idx === activeTestimonial ? 'block' : 'none',
                  animation: 'fadeIn 0.5s ease-in-out',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '40px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <div className="testimonial-content">
                  "{t.quote}"
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <i className={`fas ${t.icon}`}></i>
                  </div>
                  <div className="author-info">
                    <h4>{t.author}</h4>
                    <p>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="owl-dots">
              {testimonials.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`owl-dot ${idx === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(idx)}
                  style={{ border: 'none', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="section-title">
            <h2>Impactful Results</h2>
            <p>Medi Route is making a difference in emergency medical response times.</p>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <h3>40%</h3>
              <p>Reduction in Response Time</p>
            </div>
            <div className="stat-item">
              <h3>500+</h3>
              <p>Lives Saved Monthly</p>
            </div>
            <div className="stat-item">
              <h3>85%</h3>
              <p>Faster Hospital Arrival</p>
            </div>
            <div className="stat-item">
              <h3>30+</h3>
              <p>Cities Using Medi Route</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Partners Section */}
      <section className="partners">
        <div className="container">
          <div className="section-title">
            <h2>Our Hospital Partners</h2>
            <p>Trusted by leading healthcare institutions across the country.</p>
          </div>
          <div className="partners-grid">
            <div className="partner-logo">
              <i className="fas fa-hospital"></i>
            </div>
            <div className="partner-logo">
              <i className="fas fa-clinic-medical"></i>
            </div>
            <div className="partner-logo">
              <i className="fas fa-heartbeat"></i>
            </div>
            <div className="partner-logo">
              <i className="fas fa-stethoscope"></i>
            </div>
            <div className="partner-logo">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="partner-logo">
              <i className="fas fa-procedures"></i>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Emergency Response?</h2>
          <p>Join the growing network of cities and hospitals using Medi Route to save lives through efficient emergency medical coordination.</p>
          <div className="cta-buttons">
            <a href="/quick" className="cta-button" onClick={(e) => { e.preventDefault(); window.location.href = '/quick'; }}>Quick Access</a>
            <a href="/about" className="secondary-button" onClick={(e) => { e.preventDefault(); window.location.href = '/about'; }}>About Us</a>
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

export default Home;
