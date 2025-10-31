// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
// --- CHANGED IMPORT AND COMPONENT NAME ---
import TextTranslation from './pages/TextTranslation';
import AudioLocalization from './pages/AudioLocalization';
import VideoLocalization from './pages/VideoLocalization'; 

import './App.css'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* --- CHANGED ROUTE PATH AND ELEMENT --- */}
            <Route path="/text-translation" element={<TextTranslation />} />
            <Route path="/audio-localization" element={<AudioLocalization />} />
            <Route path="/video-localization" element={<VideoLocalization />} />
            {/* Add more routes for integration, about, etc. if needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;