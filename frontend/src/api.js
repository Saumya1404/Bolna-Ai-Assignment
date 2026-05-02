import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

const buildQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
};

export const requestCallback = (phone, patientName) => {
  const query = buildQuery({ phone, patient_name: patientName });
  return API.post(`/api/callback-request?${query}`);
};

export const lookupAppointment = (phone) => {
  const query = buildQuery({ phone });
  return API.get(`/api/appointment?${query}`);
};

export const triggerCall = (phone, id) => {
  const query = buildQuery({ phone, appointment_id: id });
  return API.post(`/api/call?${query}`);
};

export const cancelAppointment = (id) => API.post(`/api/appointment/${id}/cancel`);
export const fetchAppointments = (params) => API.get('/api/appointments', { params });
