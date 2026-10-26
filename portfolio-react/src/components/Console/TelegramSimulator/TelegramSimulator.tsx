import React, { useState } from 'react';
import styles from './TelegramSimulator.module.scss';

export const TelegramSimulator: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState<number>(482);
  const [leadTime, setLeadTime] = useState<string>('in 3 days (15 Nov)');
  const [timestamp, setTimestamp] = useState<string>('JUST NOW');
  const [isDispatched, setIsDispatched] = useState<boolean>(false);

  const sampleLeads = [
    'in 3 days (15 Nov)',
    'today (Urgent Banquet)',
    'in 5 days (Corporate Party)',
    'tomorrow (VIP Tasting)',
    'in 2 days (Executive Lunch)',
  ];

  const handleSimulate = () => {
    const nextId = Math.floor(400 + Math.random() * 500);
    const nextLead = sampleLeads[Math.floor(Math.random() * sampleLeads.length)];
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setOrderNumber(nextId);
    setLeadTime(nextLead);
    setTimestamp(timeString);
    setIsDispatched(true);

    setTimeout(() => {
      setIsDispatched(false);
    }, 1500);
  };

  return (
    <div className={styles.tgLayout}>
      <div className={styles.tgInfo}>
        <h4>Asynchronous Telegram Alert Pipeline</h4>
        <p>
          When a customer places an order or requests an event quote, the Django backend asynchronously
          formats and routes an urgent dispatch into staff Telegram channels without blocking HTTP execution.
        </p>
        <ul className={styles.tgFeatureList}>
          <li>
            <strong>Non-blocking workers:</strong> Uses background thread dispatchers so API response latency stays under 50ms.
          </li>
          <li>
            <strong>Lead-time urgency calculations:</strong> Computes days remaining until the banquet (e.g. <em>in 3 days</em>, <em>today</em>).
          </li>
          <li>
            <strong>Phone number resolution:</strong> Normalizes contact numbers and resolves Telegram user handles for managers.
          </li>
          <li>
            <strong>Standalone subscriber worker:</strong> Telethon worker allowing staff to subscribe or mute notification channels.
          </li>
        </ul>
      </div>

      <div className={styles.tgMockDevice}>
        <div className={styles.tgMockHead}>
          <span>TELEGRAM DISPATCH BOT</span>
          <span>{timestamp}</span>
        </div>
        <div className={styles.tgMockTitle}>
          🔔 New Order #{orderNumber} Received
        </div>
        <div className={styles.tgMockBody}>
          <strong>Event Urgency:</strong>{' '}
          <span className={styles.tgBadgeUrgency}>{leadTime}</span>
          <br />
          <strong>Order Items:</strong> Mini Tartlets x24, Salmon Skewers x18
          <br />
          <strong>Total Sum:</strong> 24,500 RUB (~$270 USD, Server Enforced)
          <br />
          <strong>Customer:</strong> +7 999 123-45-67 (@customer_demo)
          <br />
          <span className={styles.adminLinkSubtle}>
            [Admin Quicklink: /admin/orders/order/{orderNumber}/change/]
          </span>
        </div>
        <button
          className={`${styles.btnSimTrigger} ${isDispatched ? styles.dispatched : ''}`}
          onClick={handleSimulate}
        >
          {isDispatched ? '✓ Notification Dispatched!' : '⚡ Simulate Live Order Dispatch'}
        </button>
      </div>
    </div>
  );
};
