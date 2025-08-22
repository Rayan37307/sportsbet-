import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div className="error-actions">
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
