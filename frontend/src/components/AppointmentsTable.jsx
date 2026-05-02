import React, { useMemo, useState } from 'react';
import { statusClass, statusLabel } from './status';

const sortByDate = (items) => {
  return [...items].sort((a, b) => {
    const aKey = `${a.date || ''} ${a.time || ''}`.trim();
    const bKey = `${b.date || ''} ${b.time || ''}`.trim();
    return aKey.localeCompare(bKey);
  });
};

function AppointmentsTable({ items, onCancel, busyId }) {
  const [filters, setFilters] = useState({ status: 'all', doctor: 'all', date: '' });

  const doctors = useMemo(() => {
    const unique = new Set();
    items.forEach((appointment) => {
      if (appointment.doctor) {
        unique.add(appointment.doctor);
      }
    });
    return Array.from(unique).sort();
  }, [items]);

  const statuses = useMemo(() => {
    const unique = new Set();
    items.forEach((appointment) => {
      if (appointment.status) {
        unique.add(appointment.status);
      }
    });
    return Array.from(unique).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return sortByDate(items).filter((appointment) => {
      const statusOk = filters.status === 'all' || appointment.status === filters.status;
      const doctorOk = filters.doctor === 'all' || appointment.doctor === filters.doctor;
      const dateOk = !filters.date || appointment.date === filters.date;
      return statusOk && doctorOk && dateOk;
    });
  }, [items, filters]);

  return (
    <section className="section">
      <div className="section__header">
        <h2>All Appointments</h2>
        <span className="count-pill">{filteredItems.length} matches</span>
      </div>
      <div className="panel">
        <div className="filters">
          <label className="field field--inline">
            Status
            <select
              className="input"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="all">All</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--inline">
            Doctor
            <select
              className="input"
              value={filters.doctor}
              onChange={(event) => setFilters((prev) => ({ ...prev, doctor: event.target.value }))}
            >
              <option value="all">All</option>
              {doctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--inline">
            Date
            <input
              className="input"
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
            />
          </label>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => setFilters({ status: 'all', doctor: 'all', date: '' })}
          >
            Clear Filters
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <p className="empty-state">No appointments match these filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Summary</th>
                  <th>Transcript</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.id}</td>
                    <td>{appointment.patient_name || 'Patient'}</td>
                    <td>{appointment.phone}</td>
                    <td>{appointment.doctor || 'TBD'}</td>
                    <td>{appointment.date || 'TBD'}</td>
                    <td>{appointment.time || 'TBD'}</td>
                    <td>
                      <span className={statusClass(appointment.status)}>{statusLabel(appointment.status)}</span>
                    </td>
                    <td>{appointment.summary || '—'}</td>
                    <td>
                      {appointment.transcript ? (
                        <details>
                          <summary>View</summary>
                          <pre className="transcript">{appointment.transcript}</pre>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={() => onCancel(appointment.id)}
                        disabled={appointment.status === 'cancelled' || busyId === appointment.id}
                      >
                        {busyId === appointment.id ? 'Working...' : 'Cancel'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default AppointmentsTable;
