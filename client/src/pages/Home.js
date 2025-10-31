import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Create this CSS file for styling

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero-section">
        <p className="hackathon-tag">Smart India Hackathon 2025</p>
        <h1>AI-Powered Multilingual <br /><span>Content Localization Engine</span></h1>
        <p className="hero-description">
          Transform educational content across 22+ languages with AI. Translate documents,
          localize audio, generate video subtitles, and integrate with LMS, NCVET, and MSDE platforms.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/document-translation')}>
            Start Translating <span className="arrow">→</span>
          </button>
          <button className="btn-secondary">
            <span className="icon">▶️</span> View Demo <span className="arrow">›</span>
          </button>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <h3>22+</h3>
          <p>Languages Supported</p>
          <small>Including all major Indian languages</small>
        </div>
        <div className="feature-card">
          <h3>99.2%</h3>
          <p>Translation Accuracy</p>
          <small>Industry-leading precision</small>
        </div>
        <div className="feature-card">
          <h3>&lt; 5s</h3>
          <p>Processing Time</p>
          <small>Lightning-fast results</small>
        </div>
        <div className="feature-card">
          <h3>3</h3>
          <p>Content Types</p>
          <small>Text, Audio, and Video</small>
        </div>
      </section>
    </div>
  );
}

export default Home;