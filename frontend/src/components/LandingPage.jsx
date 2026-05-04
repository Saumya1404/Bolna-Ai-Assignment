import React, { useEffect, useState } from 'react';
import { fetchDoctors, lookupAppointment, requestCallback } from '../api';
import Toast from './Toast';
import { statusClass, statusLabel } from './status';

const infoTiles = [
  {
    title: 'Doctors On Call',
    value: 'Cardiology, Pediatrics, Orthopedics',
  },
  {
    title: 'Clinic Hours',
    value: 'Mon-Sat, 9:00 AM - 8:00 PM',
  },
  {
    title: 'Consultation Fees',
    value: 'From INR 600 with same-day availability',
  },
  {
    title: 'Location',
    value: 'CarePlus Clinic, Sector 22, Noida',
  },
];

const heroHighlights = [
  'Outbound-only callbacks with real-time updates',
  'Voice agent confirms, reschedules, or cancels',
  'Staff dashboard flags escalations instantly',
];

const getErrorMessage = (error) => {
  if (error?.response?.data?.detail) {
    return String(error.response.data.detail);
  }
  if (error?.message) {
    return String(error.message);
  }
  return 'Something went wrong. Please try again.';
};

function LandingPage() {
  const [callbackPhone, setCallbackPhone] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupStatus, setLookupStatus] = useState('idle');
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsStatus, setDoctorsStatus] = useState('idle');
  const [toast, setToast] = useState({ message: '', variant: 'neutral' });

  const showToast = (message, variant = 'neutral') => {
    setToast({ message, variant });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => {
      setToast({ message: '', variant: 'neutral' });
    }, 3600);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const loadDoctors = async () => {
    try {
      setDoctorsStatus('loading');
      const response = await fetchDoctors();
      setDoctors(response.data?.doctors || []);
      setDoctorsStatus('ready');
    } catch (error) {
      setDoctorsStatus('error');
      showToast(getErrorMessage(error), 'error');
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleCallbackSubmit = async (event) => {
    event.preventDefault();
    const phone = callbackPhone.trim();
    if (!phone) {
      showToast('Enter a phone number to request a callback.', 'error');
      return;
    }
    try {
      setIsSending(true);
      await requestCallback(phone);
      showToast('Callback request received. Our AI will call you shortly.', 'success');
      setCallbackPhone('');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleLookupSubmit = async (event) => {
    event.preventDefault();
    const phone = lookupPhone.trim();
    if (!phone) {
      showToast('Enter the phone number used for the booking.', 'error');
      return;
    }
    try {
      setIsSearching(true);
      setLookupStatus('loading');
      const response = await lookupAppointment(phone);
      const results = response.data || [];
      if (results.length === 0) {
        setLookupResult(null);
        setLookupStatus('empty');
      } else {
        setLookupResult(results[0]);
        setLookupStatus('found');
      }
    } catch (error) {
      setLookupResult(null);
      setLookupStatus('error');
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">CP</div>
          <div>
            <div className="brand__name">CarePlus Clinic</div>
            <div className="brand__tag">Voice-first appointment desk</div>
          </div>
        </div>
        <nav className="topbar__nav">
          <a className="link" href="#services">Services</a>
          <a className="link" href="#doctors">Doctors</a>
          <a className="link" href="#lookup">Lookup</a>
          <a className="button button--ghost" href="/dashboard">Staff Dashboard</a>
        </nav>
      </header>

      <main className="container">
        <section className="hero section">
          <div className="hero__content">
            <p className="eyebrow">Outbound AI Care Line</p>
            <h1>Book, confirm, and manage appointments by phone.</h1>
            <p className="hero__copy">
              Request a callback and our voice agent handles scheduling, reminders, and reschedules. Staff stays in
              control with live updates and escalation flags.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#callback">
                Request Callback
              </a>
              <a className="button button--secondary" href="#lookup">
                Check My Appointment
              </a>
            </div>
          </div>
          <div className="hero__panel">
            <h3>What happens next</h3>
            <ul className="hero__list">
              {heroHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="hero__meta">
              <div>
                <span className="label">Average response</span>
                <strong>2-4 minutes</strong>
              </div>
              <div>
                <span className="label">Active specialists</span>
                <strong>12 this week</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="action-grid section" id="callback">
          <div className="panel">
            <h2>Request a callback</h2>
            <p className="muted">Share your number and our AI assistant will call you to confirm the booking.</p>
            <form className="form" onSubmit={handleCallbackSubmit}>
              <label className="field">
                Phone number
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={callbackPhone}
                  onChange={(event) => setCallbackPhone(event.target.value)}
                />
              </label>
              <button className="button button--primary" type="submit" disabled={isSending}>
                {isSending ? 'Sending...' : 'Request Callback'}
              </button>
            </form>
          </div>
          <div className="panel" id="lookup">
            <h2>Check appointment status</h2>
            <p className="muted">Already spoke with the agent? Look up the latest status here.</p>
            <form className="form" onSubmit={handleLookupSubmit}>
              <label className="field">
                Phone number
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={lookupPhone}
                  onChange={(event) => setLookupPhone(event.target.value)}
                />
              </label>
              <button className="button button--secondary" type="submit" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Check Appointment'}
              </button>
            </form>
            {lookupStatus === 'empty' && (
              <div className="result-card result-card--empty">
                <p>No appointment found for that number yet.</p>
              </div>
            )}
            {lookupStatus === 'found' && lookupResult && (
              <div className="result-card">
                <div className="result-card__header">
                  <h3>{lookupResult.patient_name || 'Appointment'}</h3>
                  <span className={statusClass(lookupResult.status)}>{statusLabel(lookupResult.status)}</span>
                </div>
                <div className="result-card__grid">
                  <div>
                    <span className="label">Doctor</span>
                    <strong>{lookupResult.doctor || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="label">Date</span>
                    <strong>{lookupResult.date || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="label">Time</span>
                    <strong>{lookupResult.time || 'TBD'}</strong>
                  </div>
                </div>
                <p className="muted">{lookupResult.summary || 'We will send you a confirmation soon.'}</p>
              </div>
            )}
          </div>
        </section>

        <section className="section" id="doctors">
          <div className="section__header">
            <div>
              <p className="eyebrow">Clinic roster</p>
              <h2>Doctors and schedules</h2>
              <p className="muted">Browse available days and hours before requesting a callback.</p>
            </div>
            {doctorsStatus === 'loading' && <span className="status-pill">Loading roster...</span>}
          </div>
          <div className="panel">
            {doctorsStatus === 'error' ? (
              <p className="empty-state">We could not load the doctors list right now.</p>
            ) : doctors.length === 0 ? (
              <p className="empty-state">No doctors are listed yet. Please check back soon.</p>
            ) : (
              <div className="doctor-grid">
                {doctors.map((doctor) => (
                  <article className="doctor-card" key={doctor.id || doctor.name}>
                    <div className="doctor-card__header">
                      <div>
                        <div className="doctor-card__name">{doctor.name || 'Doctor'}</div>
                        <div className="doctor-card__spec">{doctor.specialization || 'Specialist'}</div>
                      </div>
                      <span className="badge badge--info">
                        {Number.isFinite(doctor.fee) ? `INR ${doctor.fee}` : 'Fees vary'}
                      </span>
                    </div>
                    <div className="doctor-card__meta">
                      <div>
                        <span className="label">Available days</span>
                        <div className="schedule-chips">
                          {doctor.available_days?.length ? (
                            doctor.available_days.map((day) => (
                              <span className="schedule-chip" key={`${doctor.id || doctor.name}-day-${day}`}>
                                {day}
                              </span>
                            ))
                          ) : (
                            <span className="schedule-chip">By appointment</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="label">Hours</span>
                        <div className="schedule-chips">
                          {doctor.available_hours?.length ? (
                            doctor.available_hours.map((range) => (
                              <span
                                className="schedule-chip schedule-chip--time"
                                key={`${doctor.id || doctor.name}-time-${range}`}
                              >
                                {range}
                              </span>
                            ))
                          ) : (
                            <span className="schedule-chip schedule-chip--time">On request</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="info-grid section" id="services">
          {infoTiles.map((tile) => (
            <div className="info-card" key={tile.title}>
              <h3>{tile.title}</h3>
              <p>{tile.value}</p>
            </div>
          ))}
        </section>

        <footer className="footer">
          <div>
            <strong>Need urgent help?</strong>
            <p className="muted">Call the clinic directly at +91 11 4000 0000.</p>
          </div>
          <a className="button button--ghost" href="/dashboard">Go to staff dashboard</a>
        </footer>
      </main>

      <Toast message={toast.message} variant={toast.variant} onClose={() => setToast({ message: '', variant: 'neutral' })} />
    </div>
  );
}

export default LandingPage;
