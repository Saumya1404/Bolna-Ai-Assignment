import React from 'react';
import { statusClass, statusLabel } from './status';

function MissedCallQueue({ items, onCall, busyId }) {
  return (
    <section className="section">
      <div className="section__header">
        <h2>Missed Call Queue</h2>
        <span className="count-pill">{items.length} waiting</span>
      </div>
      <div className="panel">
        {items.length === 0 ? (
          <p className="empty-state">No pending callbacks. The queue is clear.</p>
        ) : (
          <div className="stack">
            {items.map((appointment) => (
              <div key={appointment.id} className="stack-row">
                <div>
                  <div className="stack-title">{appointment.patient_name || 'Patient'}</div>
                  <div className="stack-sub">{appointment.phone}</div>
                </div>
                <div>
                  <div className="label">Requested</div>
                  <strong>{appointment.date || 'Today'}</strong>
                </div>
                <span className={statusClass(appointment.status)}>{statusLabel(appointment.status)}</span>
                <button
                  className="button button--primary"
                  onClick={() => onCall(appointment)}
                  disabled={busyId === appointment.id}
                  type="button"
                >
                  {busyId === appointment.id ? 'Calling...' : 'Call'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default MissedCallQueue;
