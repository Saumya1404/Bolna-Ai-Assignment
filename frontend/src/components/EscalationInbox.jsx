import React from 'react';
import { statusClass, statusLabel } from './status';

function EscalationInbox({ items }) {
  return (
    <section className="section">
      <div className="section__header">
        <h2>Escalation Inbox</h2>
        <span className="count-pill count-pill--alert">{items.length} urgent</span>
      </div>
      <div className="panel panel--alert">
        {items.length === 0 ? (
          <p className="empty-state">No escalations right now.</p>
        ) : (
          <div className="stack">
            {items.map((appointment) => (
              <div key={appointment.id} className="stack-row stack-row--alert">
                <div>
                  <div className="stack-title">{appointment.patient_name || 'Patient'}</div>
                  <div className="stack-sub">{appointment.phone}</div>
                </div>
                <div className="stack-summary">
                  <div className="label">Summary</div>
                  <strong>{appointment.summary || 'Manager follow-up required.'}</strong>
                </div>
                <div className="stack-meta">
                  <div className="label">Status</div>
                  <span className={statusClass(appointment.status)}>
                    {statusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default EscalationInbox;
