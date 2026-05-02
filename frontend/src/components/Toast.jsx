import React from 'react';

function Toast({ message, onClose, variant = 'neutral' }) {
  if (!message) return null;

  return (
    <div className={`toast toast--${variant}`} role="status">
      <span>{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Dismiss notification">
        Close
      </button>
    </div>
  );
}

export default Toast;
