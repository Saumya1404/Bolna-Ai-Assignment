const STATUS_LABELS = {
  confirmed: 'Confirmed',
  modified: 'Modified',
  cancelled: 'Cancelled',
  pending: 'Pending',
  in_call: 'In Call',
};

const STATUS_TONES = {
  confirmed: 'success',
  modified: 'warning',
  cancelled: 'danger',
  pending: 'muted',
  in_call: 'info',
};

const titleCase = (value) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const statusLabel = (status) => {
  if (!status) return 'Unknown';
  return STATUS_LABELS[status] || titleCase(status);
};

export const statusTone = (status) => STATUS_TONES[status] || 'neutral';

export const statusClass = (status) => `badge badge--${statusTone(status)}`;
