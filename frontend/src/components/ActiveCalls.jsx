import React from 'react';
import { statusClass, statusLabel } from './status';

function ActiveCalls({ calls }) {
  return (
    <section className="section">
      <div className="section__header">
        <h2>Active Calls</h2>
        <span className="count-pill">{calls.length} live</span>
      </div>
      <div className="panel">
        {calls.length === 0 ? (
          <p className="empty-state">No active calls right now.</p>
        ) : (
          <div className="stack">
            {calls.map((appointment) => (
              <div key={appointment.id} className="stack-row">
                <div>
                  <div className="stack-title">{appointment.patient_name || 'Patient'}</div>
                  <div className="stack-sub">{appointment.phone}</div>
                </div>
                <div>
                  <div className="label">Doctor</div>
                  <strong>{appointment.doctor || 'TBD'}</strong>
                </div>
                <div>
                  <div className="label">Time</div>
                  <strong>{appointment.time || 'TBD'}</strong>
                </div>
                <span className={statusClass(appointment.status)}>{statusLabel(appointment.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ActiveCalls;
