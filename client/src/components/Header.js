// // src/components/Header.js
// import React from 'react';
// import { Link, NavLink } from 'react-router-dom';
// import './Header.css';

// function Header() {
//   return (
//     <header className="header">
//       <div className="container">
//         {/* Logo/Branding - Text should be white on the navy navbar */}
//         <Link to="/" className="logo">
//           <span>SafeHorizon</span>
//           <span className="logo-subtitle">AI Localization Engine</span>
//         </Link>
        
//         {/* Navigation Links */}
//         <nav className="main-nav">
//           <ul>
//             <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
//             <li><NavLink to="/document-translation" className={({ isActive }) => isActive ? "active" : ""}>Document Translation</NavLink></li>
//             <li><NavLink to="/audio-localization" className={({ isActive }) => isActive ? "active" : ""}>Audio Localization</NavLink></li>
//             <li><NavLink to="/video-localization" className={({ isActive }) => isActive ? "active" : ""}>Video Localization</NavLink></li>
//           </ul>
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;
// src/components/Header.js
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <span>SafeHorizon</span>
          <span className="logo-subtitle">AI Localization Engine</span>
        </Link>
        
        <nav className="main-nav">
          <ul>
            <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
            {/* --- CHANGED: Document Translation to Text Translation --- */}
            <li><NavLink to="/text-translation" className={({ isActive }) => isActive ? "active" : ""}>Text Translation</NavLink></li>
            {/* The component path will be updated in App.js */}
            
            <li><NavLink to="/audio-localization" className={({ isActive }) => isActive ? "active" : ""}>Audio Localization</NavLink></li>
            <li><NavLink to="/video-localization" className={({ isActive }) => isActive ? "active" : ""}>Video Localization</NavLink></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;