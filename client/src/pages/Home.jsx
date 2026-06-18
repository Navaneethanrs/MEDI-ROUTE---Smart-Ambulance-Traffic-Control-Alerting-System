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

  // Redesigned Showcase Grid images mapping
  const slides = [
    {
      title: "Emergency Dispatch",
      text: "Instantly dispatches the nearest ambulance to emergency locations with real-time GPS traffic optimization.",
      image: "/hos dispach.jpg"
    },
    {
      title: "Hospital Coordination",
      text: "Seamlessly coordinates with hospitals to ensure beds and medical staff are prepared before the ambulance arrives.",
      image: "/hospital.jpg"
    },
    {
      title: "Traffic Management",
      text: "Smart traffic signal control creates green corridors for emergency vehicles, reducing transit time by up to 40%.",
      image: "/img1.jpg"
    },
    {
      title: "Real-time Tracking",
      text: "Hospitals, dispatchers, and paramedics can track the exact ambulance location and ETA live on the map.",
      image: "/tracking.jpg"
    }
  ];

  // Testimonials state
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      quote: "MediRoute has reduced our ambulance response times by 35% and improved patient outcomes significantly. The real-time coordination is a game-changer for emergency medicine.",
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
      quote: "Implementing MediRoute has transformed our emergency response capabilities. The bed booking system ensures our patients get immediate care upon arrival.",
      author: "Jennifer Lee",
      role: "Hospital Administrator, Regional Medical Center",
      icon: "fa-hospital"
    }
  ];

  // Simulator State
  const [simLog, setSimLog] = useState([
    "SYS READY: STANDBY FOR DISPATCH ALERTS"
  ]);
  const [corridorActive, setCorridorActive] = useState(false);
  const [simRunning, setSimRunning] = useState(false);

  const startSimulation = () => {
    if (simRunning) return;
    setSimRunning(true);
    setCorridorActive(false);
    
    setSimLog(["[0.0s] 🚨 INCOMING EMERGENCY CALL: Form Submitted..."]);
    
    setTimeout(() => {
      setSimLog(prev => [...prev, "[1.2s] 🏥 HOSPITALS SEARCHED: Analyzing closest trauma units..."]);
    }, 1000);

    setTimeout(() => {
      setSimLog(prev => [...prev, "[2.4s] 🚑 AMBULANCE DEPLOYED: AMB-108 dispatched with GPS route sync."]);
    }, 2000);

    setTimeout(() => {
      setSimLog(prev => [...prev, "[3.6s] 📶 TELEMETRY SYNCED: Heart Rate and vitals transmitting live to ER."]);
    }, 3000);

    setTimeout(() => {
      setSimLog(prev => [...prev, "[5.0s] 🟢 CORRIDOR PREEMPTION: IoT signal override active! Green lights established."]);
      setCorridorActive(true);
      setSimRunning(false);
    }, 4000);
  };

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
    if (isNaN(seconds)) return '0:00';
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
    <div className="home-page-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text animate-fade-in-left">
            <span className="hero-tagline">🚑 Smart Emergency Corridor</span>
            <h2>Revolutionizing <span>Emergency Medical Response</span></h2>
            <p>MediRoute is an intelligent, IoT-driven traffic control and hospital coordination network. We minimize transit delays, establish green corridors, and link ambulances directly with trauma departments to save lives when seconds count.</p>
            <div className="hero-cta-buttons">
              <a href="/about" className="cta-button" onClick={(e) => { e.preventDefault(); window.location.href = '/about'; }}>Learn More <i className="fas fa-arrow-right"></i></a>
              <a href="/quick" className="secondary-button-hero" onClick={(e) => { e.preventDefault(); window.location.href = '/quick'; }}>Quick Access</a>
            </div>
          </div>
          <div className="hero-image animate-fade-in-right">
            <div className="hero-image-container">
              <img src="/img1.jpg" alt="MediRoute Smart Traffic Corridor" className="hero-img-file" />
              
              {/* Telemetry Badge 1 */}
              <div className="hero-glass-badge">
                <i className="fas fa-heartbeat"></i>
                <div>
                  <h4>Live Sync</h4>
                  <p>EMS & Hospitals</p>
                </div>
              </div>

              {/* GPS Sync Badge 2 */}
              <div className="hero-gps-sync-badge">
                <div className="gps-pulse-dot"></div>
                <span>GPS SYNCED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="container">
          <div className="section-title">
            <h2>See <span>MediRoute in Action</span></h2>
            <p>Watch how our smart traffic alerts and telemetry synchronization create a seamless corridor for EMS vehicles.</p>
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
                    background: `linear-gradient(to right, var(--primary-blue) 0%, var(--primary-blue) ${isMuted ? 0 : volume}%, rgba(0,0,0,0.1) ${isMuted ? 0 : volume}%, rgba(0,0,0,0.1) 100%)`
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
            <h2>Key <span>Operations & Features</span></h2>
            <p>Our comprehensive grid integrates smart signaling, patient telemetry, and hospital coordination into a single unified network.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-hospital"></i>
              </div>
              <h3>Nearby Hospital Detection</h3>
              <p>Locates the closest medical centers instantly based on GPS telemetry, providing optimal routing for drivers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bed"></i>
              </div>
              <h3>Emergency Bed Booking</h3>
              <p>Enables EMS to book patient beds ahead of arrival, matching patients with appropriate specialized rooms.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-medical"></i>
              </div>
              <h3>Telemetry Transmission</h3>
              <p>Sends real-time critical vitals (heart rate, SpO2, blood pressure) to trauma teams prior to arrival.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Live Paramedic Tracking</h3>
              <p>Allows hospitals to monitor incoming emergency vehicles on an interactive map with updated ETAs.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-traffic-light"></i>
              </div>
              <h3>IoT Traffic Preemption</h3>
              <p>Automatically triggers green lights at upcoming intersections, cutting critical travel times by 40%.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3>Life-Saving Synergy</h3>
              <p>Fosters immediate communication between first responders, traffic control, and emergency departments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Showcase of MediRoute in Action */}
      <section className="carousel-section">
        <div className="container">
          <div className="section-title">
            <h2>MediRoute <span>Ecosystem</span></h2>
            <p>Explore the components that power our real-time smart medical corridor.</p>
          </div>
          <div className="showcase-grid">
            {slides.map((slide, index) => (
              <div key={index} className="showcase-card">
                <div className="showcase-image-wrapper">
                  <img src={slide.image} alt={slide.title} className="showcase-img" />
                  <div className="showcase-overlay">
                    <span className="showcase-tag">Active Mode</span>
                  </div>
                </div>
                <div className="showcase-content">
                  <h3>{slide.title}</h3>
                  <p>{slide.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-title">
            <h2>How <span>MediRoute Works</span></h2>
            <p>From dispatch to ER check-in, see the automated stages of our intelligent emergency system.</p>
          </div>
          <div className="steps-timeline">
            <div className="step-timeline-item">
              <div className="step-circle">01</div>
              <h4>Emergency Alert</h4>
              <p>Ambulance dispatches and driver logs into the system with active routing.</p>
            </div>
            <div className="step-timeline-item">
              <div className="step-circle">02</div>
              <h4>Hospital Match</h4>
              <p>System displays nearest hospitals with relevant trauma facilities.</p>
            </div>
            <div className="step-timeline-item">
              <div className="step-circle">03</div>
              <h4>Pre-Admittance Prep</h4>
              <p>Paramedic transmits vitals; ER reviews data and approves the bed booking.</p>
            </div>
            <div className="step-timeline-item">
              <div className="step-circle">04</div>
              <h4>Green Light Corridors</h4>
              <p>IoT modules communicate with traffic signals to clear intersections on approach.</p>
            </div>
            <div className="step-timeline-item">
              <div className="step-circle">05</div>
              <h4>Instant Reception</h4>
              <p>Ambulance arrives; trauma team is prepped and takes immediate action.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Dispatch Simulator Widget */}
      <section className="simulator-section">
        <div className="container">
          <div className="section-title">
            <h2>Interactive <span>EMS Simulator</span></h2>
            <p>Launch a mock emergency dispatch alert to see how MediRoute IoT modules synchronize traffic and hospitals.</p>
          </div>
          <div className="simulator-box">
            <div className="simulator-grid">
              <div className="sim-controls">
                <h3>Preemption Override Panel</h3>
                <p>Click the dispatch trigger to broadcast simulated telemetry packets. Watch the IoT corridor switch intersections to open paths dynamically.</p>
                <button className="sim-btn" onClick={startSimulation} disabled={simRunning}>
                  {simRunning ? "BROADCASTING telemetry..." : "TRIGGER EMS DISPATCH"} <i className="fas fa-satellite"></i>
                </button>
              </div>
              <div className="sim-screen">
                <div className="screen-header">
                  <span>SYSTEM LOG (CONSOLE)</span>
                  <span>PORT: 5000 / IoT-108</span>
                </div>
                <div className="screen-body">
                  {simLog.map((line, index) => (
                    <div key={index} className="console-line">{line}</div>
                  ))}
                </div>
                <div className="sim-corridor-status">
                  <div className={`corridor-glowing-dot ${corridorActive ? 'active' : ''}`} style={{ backgroundColor: corridorActive ? 'var(--neon-green)' : 'var(--neon-red)', boxShadow: corridorActive ? '0 0 8px var(--neon-green)' : '0 0 8px var(--neon-red)' }}></div>
                  <span>CORRIDOR OVERRIDE: {corridorActive ? "ACTIVE (OPEN PATH)" : "STANDBY (NORMAL TRAFFIC)"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-title">
            <h2>Trusted by <span>First Responders & Providers</span></h2>
            <p>Hear from leading doctors, dispatchers, and administrators who use our smart coordination grid.</p>
          </div>
          <div className="testimonial-slider-container">
            {testimonials.map((t, idx) => (
              <div 
                key={idx} 
                className={`testimonial-card-item ${idx === activeTestimonial ? 'active' : ''}`}
                style={{ display: idx === activeTestimonial ? 'block' : 'none' }}
              >
                <div className="quote-mark">“</div>
                <p className="testimonial-text">{t.quote}</p>
                <div className="author-meta">
                  <div className="author-icon">
                    <i className={`fas ${t.icon}`}></i>
                  </div>
                  <div>
                    <h4>{t.author}</h4>
                    <p>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="testimonial-dots">
              {testimonials.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`test-dot ${idx === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Partners Section */}
      <section className="partners">
        <div className="container">
          <div className="section-title">
            <h2>Our <span>Integrated Networks</span></h2>
            <p>Fully certified and linked with regional clinical directories and EMS dispatch databases.</p>
          </div>
          <div className="partners-grid">
            <div className="partner-logo">
              <i className="fas fa-hospital-alt"></i>
              <span>City Health</span>
            </div>
            <div className="partner-logo">
              <i className="fas fa-clinic-medical"></i>
              <span>Metro EMS</span>
            </div>
            <div className="partner-logo">
              <i className="fas fa-heartbeat"></i>
              <span>LifeGuard</span>
            </div>
            <div className="partner-logo">
              <i className="fas fa-stethoscope"></i>
              <span>Apex Health</span>
            </div>
            <div className="partner-logo">
              <i className="fas fa-user-md"></i>
              <span>Red Cross Care</span>
            </div>
            <div className="partner-logo">
              <i className="fas fa-procedures"></i>
              <span>ER Response Co.</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container cta-box-gradient">
          <h2>Ready to Transform Emergency Response?</h2>
          <p>Join the growing network of smart cities, hospital complexes, and EMS teams using MediRoute to optimize emergency paths and save lives.</p>
          <div className="cta-buttons">
            <a href="/quick" className="cta-button" onClick={(e) => { e.preventDefault(); window.location.href = '/quick'; }}>Quick Access</a>
            <a href="/about" className="secondary-button" onClick={(e) => { e.preventDefault(); window.location.href = '/about'; }}>About Us</a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Pulsing Floating Emergency Hotline Badge */}
      <div className="emergency-float-badge" onClick={handleEmergencyClick}>
        <div className="badge-icon-wrapper">
          <i className="fas fa-phone-alt"></i>
        </div>
        <div className="badge-details">
          <span>EMERGENCY HOTLINE</span>
          <h4>CALL 108</h4>
        </div>
      </div>
    </div>
  );
};

export default Home;
