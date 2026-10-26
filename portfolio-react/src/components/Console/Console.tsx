import React, { useState } from 'react';
import styles from './Console.module.scss';
import { ApiExplorer } from './ApiExplorer/ApiExplorer';
import { TelegramSimulator } from './TelegramSimulator/TelegramSimulator';
import { AdminPreview } from './AdminPreview/AdminPreview';
import type { ArchStep } from '../../types';

type TabKey = 'arch' | 'api' | 'tg' | 'admin' | 'seo';

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
        <button
          className={`${styles.cTab} ${activeTab === 'seo' ? styles.active : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO & Schema.org Microdata
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

      {activeTab === 'seo' && (
        <div className={styles.cPane}>
          <div className={styles.seoGrid}>
            <div className={styles.seoCard}>
              <span className={styles.seoCardBadge}>SCHEMA.ORG GRAPH</span>
              <div className={styles.seoCardTitle}>Interconnected @graph</div>
              <div className={styles.seoCardDesc}>
                Unified JSON-LD graph linking WebSite, FoodEstablishment, CateringService, Product, Offer, FAQPage, and BreadcrumbList into a coherent semantic web entity.
              </div>
            </div>
            <div className={styles.seoCard}>
              <span className={styles.seoCardBadge}>SPA SYNCHRONIZATION</span>
              <div className={styles.seoCardTitle}>JsonLdGlobalWatcher</div>
              <div className={styles.seoCardDesc}>
                Client-side route watcher ensuring Next.js route transitions update document schema markup dynamically without full page reloads, keeping search crawlers in sync.
              </div>
            </div>
            <div className={styles.seoCard}>
              <span className={styles.seoCardBadge}>CATALOG CACHE</span>
              <div className={styles.seoCardTitle}>Sub-millisecond Metadata</div>
              <div className={styles.seoCardDesc}>
                Memory-cached server-side catalog hierarchy (server-catalog-cache) generates complete schema objects with zero database queries during client requests.
              </div>
            </div>
            <div className={styles.seoCard}>
              <span className={styles.seoCardBadge}>DISCOVERY SUITE</span>
              <div className={styles.seoCardTitle}>XML Sitemaps & OpenGraph</div>
              <div className={styles.seoCardDesc}>
                Automated sitemap.xml route generation, dynamic robots.txt rules, OpenGraph preview cards, Twitter cards, and Yandex / Google search verification tokens.
              </div>
            </div>
          </div>

          <div className={styles.seoPreviewWrap}>
            <div className={styles.seoPreviewHeader}>
              <span>LIVE STRUCTURED DATA (JSON-LD @graph SAMPLE)</span>
              <span>SCHEMA.ORG / APPLICATION/LD+JSON</span>
            </div>
            <pre className={styles.seoPreviewBody}>
              <code>{`{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FoodEstablishment",
      "@id": "https://chefmil-furshet.ru/#organization",
      "name": "Chef Meal Catering",
      "servesCuisine": "Event Catering, Buffet Platters, Banquet Canapes",
      "telephone": "+7 (999) 123-45-67",
      "geo": { "@type": "GeoCoordinates", "latitude": 55.7436, "longitude": 52.3959 }
    },
    {
      "@type": "Product",
      "name": "Assorted Canapes Set",
      "offers": {
        "@type": "Offer",
        "price": "4200.00",
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock"
      }
    }
  ]
}`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
