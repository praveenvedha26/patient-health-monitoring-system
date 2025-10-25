import React from 'react';
import { FaHeartbeat, FaMicrochip, FaCloud, FaMobile } from 'react-icons/fa';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About Smart Patient Health Monitoring System</h1>
        <p>Revolutionizing healthcare with IoT and real-time monitoring</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>🎯 Our Mission</h2>
          <p>
            The Smart Patient Health Monitoring System is designed to provide continuous,
            real-time monitoring of vital health parameters using cutting-edge IoT technology.
            Our goal is to enable early detection of health issues and improve patient outcomes
            through accessible, affordable, and accurate health monitoring.
          </p>
        </section>

        <section className="about-section">
          <h2>💡 How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaMicrochip size={40} color="#667eea" />
              </div>
              <h3>ESP32 Sensors</h3>
              <p>
                Advanced sensors connected to ESP32 microcontroller continuously measure
                body temperature, heart rate, and blood oxygen levels (SpO₂).
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaCloud size={40} color="#3b82f6" />
              </div>
              <h3>Firebase Cloud</h3>
              <p>
                All health data is securely transmitted to Firebase Realtime Database,
                ensuring data integrity and accessibility from anywhere.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaMobile size={40} color="#10b981" />
              </div>
              <h3>Web Dashboard</h3>
              <p>
                Real-time visualization of health metrics through responsive web interface
                accessible on any device - desktop, tablet, or mobile.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaHeartbeat size={40} color="#e11d48" />
              </div>
              <h3>Real-Time Alerts</h3>
              <p>
                Automatic notifications when vital signs fall outside normal ranges,
                enabling quick medical response and intervention.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>👥 Who Benefits?</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <h4>Patients</h4>
              <p>Monitor your own health from home with ease and confidence</p>
            </div>
            <div className="benefit-item">
              <h4>Doctors</h4>
              <p>Track multiple patients simultaneously and make data-driven decisions</p>
            </div>
            <div className="benefit-item">
              <h4>Healthcare Facilities</h4>
              <p>Streamline patient monitoring and optimize resource allocation</p>
            </div>
          </div>
        </section>

        <section className="about-section tech-stack">
          <h2>🛠️ Technology Stack</h2>
          <div className="tech-badges">
            <span className="tech-badge">React.js</span>
            <span className="tech-badge">Firebase</span>
            <span className="tech-badge">ESP32</span>
            <span className="tech-badge">IoT Sensors</span>
            <span className="tech-badge">Real-time Database</span>
            <span className="tech-badge">Responsive Design</span>
          </div>
        </section>

        <section className="about-section">
          <h2>📞 Contact & Support</h2>
          <p>
            For technical support, inquiries, or feedback, please reach out to our team.
            We're committed to continuously improving the system based on user needs and
            advancing healthcare technology.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
