import React, { useState } from 'react';
import styles from './Console.module.scss';
import { ApiExplorer } from './ApiExplorer/ApiExplorer';
import { TelegramSimulator } from './TelegramSimulator/TelegramSimulator';
import { AdminPreview } from './AdminPreview/AdminPreview';
import type { ArchStep } from '../../types';

type TabKey = 'arch' | 'api' | 'tg' | 'admin';

export const Console: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('arch');

  const archSteps: ArchStep[] = [
    {
      step: '01 / FRONTEND',
      title: 'Next.js SSR',
      description: 'Responsive customer interface, reactive shopping cart, and form validation.',
    },
    {
      step: '02 / BACKEND',
      title: 'Django REST',
      description: 'Authoritative database pricing, atomic transaction guarantees, and JWT auth.',
    },
    {
      step: '03 / STORAGE',
      title: 'PostgreSQL',
      description: 'PostgreSQL 17 with connection pooling, SSL encryption, and isolated demo tables.',
    },
    {
      step: '04 / ALERTS',
      title: 'Telegram Worker',
      description: 'Asynchronous event dispatcher parsing delivery lead times without blocking the API.',
    },
  ];

  return (
    <div className={styles.workspaceConsole}>
      <div className={styles.consoleNav}>
        <button
          className={`${styles.cTab} ${activeTab === 'arch' ? styles.active : ''}`}
          onClick={() => setActiveTab('arch')}
        >
          Architecture Overview
        </button>
        <button
          className={`${styles.cTab} ${activeTab === 'api' ? styles.active : ''}`}
          onClick={() => setActiveTab('api')}
        >
          Swagger & API Explorer
        </button>
        <button
          className={`${styles.cTab} ${activeTab === 'tg' ? styles.active : ''}`}
          onClick={() => setActiveTab('tg')}
        >
          Telegram Dispatcher
        </button>
        <button
          className={`${styles.cTab} ${activeTab === 'admin' ? styles.active : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          Django Admin Features
        </button>
      </div>

      {activeTab === 'arch' && (
        <div className={styles.cPane}>
          <div className={styles.archFlowGrid}>
            {archSteps.map((item, index) => (
              <div key={index} className={styles.archBox}>
                <div className={styles.archStep}>{item.step}</div>
                <div className={styles.archTitle}>{item.title}</div>
                <div className={styles.archDesc}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className={styles.cPane}>
          <ApiExplorer />
        </div>
      )}

      {activeTab === 'tg' && (
        <div className={styles.cPane}>
          <TelegramSimulator />
        </div>
      )}

      {activeTab === 'admin' && (
        <div className={styles.cPane}>
          <AdminPreview />
        </div>
      )}
    </div>
  );
};
