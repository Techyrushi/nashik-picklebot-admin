import React from 'react';
import 'src/components/css/Preloader.css'; // Import the CSS for the preloader

const Preloader = () => {
  return (
    <div className="preloader-container mt-5">
      <div className="preloader-image"></div>
      <div className="loading-text">Loading...</div>
    </div>
  );
};

export default Preloader;