import React, { useEffect, useMemo, useState } from 'react';
import { cancelAppointment, fetchAppointments, triggerCall } from '../api';
import ActiveCalls from './ActiveCalls';
import AppointmentsTable from './AppointmentsTable';
import EscalationInbox from './EscalationInbox';
import MissedCallQueue from './MissedCallQueue';
import StatsCards from './StatsCards';
import Toast from './Toast';

const DASHBOARD_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD;
const DASHBOARD_UNLOCK_KEY = 'staffDashboardUnlocked';

const getErrorMessage = (error) => {
  if (error?.response?.data?.detail) {
    return String(error.response.data.detail);
  }
  if (error?.message) {
    return String(error.message);
  }
  return 'Something went wrong. Please try again.';
};

const formatRefreshTime = (value) => {
  if (!value) return 'Just now';
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function Dashboard() {
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState({ message: '', variant: 'neutral' });
  const [lastUpdated, setLastUpdated] = useState(null);

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

  useEffect(() => {
    const cachedUnlock = localStorage.getItem(DASHBOARD_UNLOCK_KEY);
    if (cachedUnlock === 'true') {
      setIsLocked(false);
    }
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await fetchAppointments();
      setAppointments(response.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLocked) return undefined;
    loadAppointments();
    const interval = setInterval(loadAppointments, 5000);
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleUnlock = (event) => {
    event.preventDefault();
    if (!DASHBOARD_PASSWORD) {
      setAuthError('No dashboard password configured.');
      return;
    }
    if (passwordInput === DASHBOARD_PASSWORD) {
      localStorage.setItem(DASHBOARD_UNLOCK_KEY, 'true');
      setIsLocked(false);
      setPasswordInput('');
      setAuthError('');
      return;
    }
    setAuthError('Incorrect password.');
  };

  const handleLock = () => {
    localStorage.removeItem(DASHBOARD_UNLOCK_KEY);
    setIsLocked(true);
    setPasswordInput('');
    setAuthError('');
  };

  const stats = useMemo(() => {
    const counts = {
      total: 0,
      confirmed: 0,
      modified: 0,
      cancelled: 0,
      missed: 0,
      escalations: 0,
    };
    appointments.forEach((appointment) => {
      counts.total += 1;
      if (appointment.manager_flag) {
        counts.escalations += 1;
      }
      switch (appointment.status) {
        case 'confirmed':
          counts.confirmed += 1;
          break;
        case 'modified':
          counts.modified += 1;
          break;
        case 'cancelled':
          counts.cancelled += 1;
          break;
        case 'pending':
          counts.missed += 1;
          break;
        default:
          break;
      }
    });
    return counts;
  }, [appointments]);

  const activeCalls = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'in_call'),
    [appointments]
  );

  const escalations = useMemo(
    () => appointments.filter((appointment) => appointment.manager_flag),
    [appointments]
  );

  const pendingCalls = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'pending'),
    [appointments]
  );

  const handleCall = async (appointment) => {
    if (!appointment?.phone) return;
    setBusyId(appointment.id);
    try {
      await triggerCall(appointment.phone, appointment.id);
      showToast(`Calling ${appointment.patient_name || 'patient'} now.`, 'success');
      await loadAppointments();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!appointmentId) return;
    setBusyId(appointmentId);
    try {
      await cancelAppointment(appointmentId);
      showToast('Appointment cancelled.', 'success');
      await loadAppointments();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (isLocked) {
    return (
      <div className="page">
        <header className="topbar topbar--dashboard">
          <div className="brand">
            <div className="brand__mark">CP</div>
            <div>
              <div className="brand__name">CarePlus Clinic</div>
              <div className="brand__tag">Staff command center</div>
            </div>
          </div>
          <div className="topbar__nav">
            <a className="button button--secondary" href="/">
              Patient View
            </a>
          </div>
        </header>

        <main className="lock-screen">
          <div className="panel lock-panel">
            <p className="eyebrow">Staff only</p>
            <h1>Enter dashboard password</h1>
            <p className="muted">Access to live operations is restricted.</p>
            <form className="form" onSubmit={handleUnlock}>
              <label className="field">
                Password
                <input
                  className="input"
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  autoFocus
                  required
                />
              </label>
              {authError && <p className="lock-error">{authError}</p>}
              {!DASHBOARD_PASSWORD && (
                <p className="lock-hint">Set VITE_DASHBOARD_PASSWORD in the frontend .env file.</p>
              )}
              <div className="lock-panel__actions">
                <button className="button button--primary" type="submit">
                  Unlock
                </button>
                <a className="button button--ghost" href="/">
                  Back to patient view
                </a>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar topbar--dashboard">
        <div className="brand">
          <div className="brand__mark">CP</div>
          <div>
            <div className="brand__name">CarePlus Clinic</div>
            <div className="brand__tag">Staff command center</div>
          </div>
        </div>
        <div className="topbar__nav">
          <span className="status-pill">Last refreshed {formatRefreshTime(lastUpdated)}</span>
          <button className="button button--ghost" onClick={loadAppointments} type="button">
            Refresh
          </button>
          <button className="button button--ghost" onClick={handleLock} type="button">
            Lock
          </button>
          <a className="button button--secondary" href="/">
            Patient View
          </a>
        </div>
      </header>

      <main className="container">
        <section className="section">
          <div className="section__header">
            <div>
              <p className="eyebrow">Live Operations</p>
              <h1>Appointment Dashboard</h1>
              <p className="muted">Track callback requests, in-progress calls, and escalations in real time.</p>
            </div>
            {isLoading && <span className="status-pill">Loading data...</span>}
          </div>
          <StatsCards stats={stats} />
        </section>

        <ActiveCalls calls={activeCalls} />
        <EscalationInbox items={escalations} />
        <MissedCallQueue items={pendingCalls} onCall={handleCall} busyId={busyId} />
        <AppointmentsTable items={appointments} onCancel={handleCancel} busyId={busyId} />
      </main>

      <Toast message={toast.message} variant={toast.variant} onClose={() => setToast({ message: '', variant: 'neutral' })} />
    </div>
  );
}

export default Dashboard;
