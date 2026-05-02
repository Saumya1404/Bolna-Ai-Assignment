import React from 'react';

function StatsCards({ stats }) {
  const cards = [
    { label: 'Total', value: stats.total, tone: 'neutral' },
    { label: 'Confirmed', value: stats.confirmed, tone: 'success' },
    { label: 'Modified', value: stats.modified, tone: 'warning' },
    { label: 'Cancelled', value: stats.cancelled, tone: 'danger' },
    { label: 'Missed', value: stats.missed, tone: 'muted' },
    { label: 'Escalations', value: stats.escalations, tone: 'alert' },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className={`stat-card stat-card--${card.tone}`}>
          <div className="stat-card__label">{card.label}</div>
          <div className="stat-card__value">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
