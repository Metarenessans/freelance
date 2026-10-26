import React, { useState } from 'react';
import styles from './ApiExplorer.module.scss';

interface RouteDefinition {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  url: string;
  response: React.ReactNode;
}

export const ApiExplorer: React.FC = () => {
  const [activeRouteId, setActiveRouteId] = useState<string>('products');

  const routes: RouteDefinition[] = [
    {
      id: 'products',
      method: 'GET',
      path: '/catalog/products/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/catalog/products/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          {'{'}{'\n'}
          {'  '}<span className={styles.jKey}>"count"</span>: <span className={styles.jNum}>60</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"next"</span>: <span className={styles.jStr}>"https://catering-portfolio-api.vercel.app/api/v1/catalog/products/?page=2"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"results"</span>: [{'\n'}
          {'    '}{'{'}{'\n'}
          {'      '}<span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>1</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Assorted Canapes Set"</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"slug"</span>: <span className={styles.jStr}>"assorted-canapes-set"</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"price"</span>: <span className={styles.jNum}>4200.00</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"currency"</span>: <span className={styles.jStr}>"RUB"</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"is_active"</span>: <span className={styles.jBool}>true</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"section"</span>: <span className={styles.jNum}>1</span>,{'\n'}
          {'      '}<span className={styles.jKey}>"options"</span>: [<span className={styles.jStr}>"Gluten-Free"</span>, <span className={styles.jStr}>"Standard"</span>]{'\n'}
          {'    '}{'}'}{'\n'}
          {'  '}]{'\n'}
          {'}'}
        </>
      ),
    },
    {
      id: 'sections',
      method: 'GET',
      path: '/catalog/sections/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/catalog/sections/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          [{'\n'}
          {'  '}{'{'}{'\n'}
          {'    '}<span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>1</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Canapes & Finger Food"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"slug"</span>: <span className={styles.jStr}>"canapes"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"order"</span>: <span className={styles.jNum}>1</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"is_active"</span>: <span className={styles.jBool}>true</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"image_url"</span>: <span className={styles.jStr}>"/media/sections/canapes.jpg"</span>{'\n'}
          {'  '}{'}'},{'\n'}
          {'  '}{'{'}{'\n'}
          {'    '}<span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>2</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Hot Hors d'oeuvres"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"slug"</span>: <span className={styles.jStr}>"hot-appetizers"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"order"</span>: <span className={styles.jNum}>2</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"is_active"</span>: <span className={styles.jBool}>true</span>{'\n'}
          {'  '}{'}'}{'\n'}
          ]
        </>
      ),
    },
    {
      id: 'orders',
      method: 'POST',
      path: '/orders/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/orders/',
      response: (
        <>
          <span className={styles.jKey}>POST /api/v1/orders/</span> -&gt; <span className={styles.jKey}>HTTP/2 201 Created</span>{'\n'}
          <span className={styles.jKey}>x-dispatcher:</span> <span className={styles.jStr}>telegram-async-worker</span>{'\n\n'}
          {'{'}{'\n'}
          {'  '}<span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>482</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"status"</span>: <span className={styles.jStr}>"new"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"event_date"</span>: <span className={styles.jStr}>"2026-11-15"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"total_price"</span>: <span className={styles.jNum}>24500.00</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"items_count"</span>: <span className={styles.jNum}>2</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"telegram_notified"</span>: <span className={styles.jBool}>true</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"created_at"</span>: <span className={styles.jStr}>"2026-10-22T00:45:00Z"</span>{'\n'}
          {'}'}
        </>
      ),
    },
    {
      id: 'formats',
      method: 'GET',
      path: '/menu-requests/formats/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/menu-requests/formats/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          [{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>1</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Wedding Banquet"</span>, <span className={styles.jKey}>"min_guests"</span>: <span className={styles.jNum}>20</span> {'}'},{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>2</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Corporate Buffet"</span>, <span className={styles.jKey}>"min_guests"</span>: <span className={styles.jNum}>10</span> {'}'},{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>3</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Coffee Break"</span>, <span className={styles.jKey}>"min_guests"</span>: <span className={styles.jNum}>5</span> {'}'},{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>4</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Cocktail Reception"</span>, <span className={styles.jKey}>"min_guests"</span>: <span className={styles.jNum}>15</span> {'}'}{'\n'}
          ]
        </>
      ),
    },
    {
      id: 'services',
      method: 'GET',
      path: '/menu-requests/services/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/menu-requests/services/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          [{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>1</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Professional Service Staff / Waiters"</span>, <span className={styles.jKey}>"price"</span>: <span className={styles.jNum}>5000.00</span> {'}'},{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>2</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Tableware & Glassware Rental"</span>, <span className={styles.jKey}>"price"</span>: <span className={styles.jNum}>3500.00</span> {'}'},{'\n'}
          {'  '}{'{'} <span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>3</span>, <span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Mobile Cocktail Bar & Mixologist"</span>, <span className={styles.jKey}>"price"</span>: <span className={styles.jNum}>12000.00</span> {'}'}{'\n'}
          ]
        </>
      ),
    },
    {
      id: 'company',
      method: 'GET',
      path: '/company/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/company/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          {'{'}{'\n'}
          {'  '}<span className={styles.jKey}>"name"</span>: <span className={styles.jStr}>"Catering Service Demonstration"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"phone"</span>: <span className={styles.jStr}>"+7 (999) 000-00-00"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"email"</span>: <span className={styles.jStr}>"orders@catering-demo.com"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"working_hours"</span>: <span className={styles.jStr}>"09:00 - 21:00 Daily"</span>,{'\n'}
          {'  '}<span className={styles.jKey}>"min_order_sum"</span>: <span className={styles.jNum}>5000.00</span>{'\n'}
          {'}'}
        </>
      ),
    },
    {
      id: 'faq',
      method: 'GET',
      path: '/faq/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/faq/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          [{'\n'}
          {'  '}{'{'}{'\n'}
          {'    '}<span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>1</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"question"</span>: <span className={styles.jStr}>"How far in advance should we place an order?"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"answer"</span>: <span className={styles.jStr}>"We recommend booking at least 3-5 days in advance for banquets."</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"order"</span>: <span className={styles.jNum}>1</span>{'\n'}
          {'  '}{'}'}{'\n'}
          ]
        </>
      ),
    },
    {
      id: 'articles',
      method: 'GET',
      path: '/blog/articles/',
      url: 'https://catering-portfolio-api.vercel.app/api/v1/blog/articles/',
      response: (
        <>
          <span className={styles.jKey}>HTTP/2 200 OK</span>{'\n'}
          <span className={styles.jKey}>content-type:</span> <span className={styles.jStr}>application/json</span>{'\n\n'}
          [{'\n'}
          {'  '}{'{'}{'\n'}
          {'    '}<span className={styles.jKey}>"id"</span>: <span className={styles.jNum}>1</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"title"</span>: <span className={styles.jStr}>"Planning the Perfect Corporate Buffet"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"slug"</span>: <span className={styles.jStr}>"planning-corporate-buffet"</span>,{'\n'}
          {'    '}<span className={styles.jKey}>"reading_time"</span>: <span className={styles.jNum}>4</span>{'\n'}
          {'  '}{'}'}{'\n'}
          ]
        </>
      ),
    },
  ];

  const currentRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  return (
    <div>
      <div className={styles.apiSuiteIntro}>
        <div>
          <h4>Interactive OpenAPI 3.0 & Swagger UI</h4>
          <span>Comprehensive REST API specification covering 32 endpoints across 8 application domains</span>
        </div>
        <div className={styles.apiActionsWrap}>
          <a
            className={styles.btnTestApp}
            href="https://catering-portfolio-api.vercel.app/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Live Swagger UI ↗
          </a>
          <a
            className={styles.btnTestNeutral}
            href="https://catering-portfolio-api.vercel.app/api/redoc/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Redoc View ↗
          </a>
        </div>
      </div>

      <div className={styles.apiRoutesSelector}>
        {routes.map((route) => (
          <button
            key={route.id}
            className={`${styles.apiRouteBtn} ${route.id === activeRouteId ? styles.active : ''}`}
            onClick={() => setActiveRouteId(route.id)}
          >
            <span className={styles.mTag}>{route.method}</span>
            <span>{route.path}</span>
          </button>
        ))}
      </div>

      <div className={styles.apiPreviewHeader}>
        <div>
          <span className={styles.urlSubtle}>URL: </span>
          <span className={styles.apiPreviewUrl}>{currentRoute.url}</span>
        </div>
        <a
          className={styles.apiTestLink}
          href={currentRoute.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Browser ↗
        </a>
      </div>

      <div className={styles.apiJsonBox}>{currentRoute.response}</div>

      <div className={styles.apiEndpointsSummaryGrid}>
        <div className={styles.apiCatCard}>
          <div className={styles.apiCatTitle}>OpenAPI 3.0 Standard</div>
          <div className={styles.apiCatEndpoints}>
            Strict schema contracts with drf-spectacular validation, typed serializers, and auto-generated client SDK specs.
          </div>
        </div>
        <div className={styles.apiCatCard}>
          <div className={styles.apiCatTitle}>Atomic Checkouts</div>
          <div className={styles.apiCatEndpoints}>
            Multi-item orders committed atomically with <code>@transaction.atomic</code> - preventing partial writes and inventory drift.
          </div>
        </div>
        <div className={styles.apiCatCard}>
          <div className={styles.apiCatTitle}>Pooled PostgreSQL</div>
          <div className={styles.apiCatEndpoints}>
            Connection pooling with SSL encryption, prepared statement caching, and sub-50ms API response latency.
          </div>
        </div>
        <div className={styles.apiCatCard}>
          <div className={styles.apiCatTitle}>JWT Authentication</div>
          <div className={styles.apiCatEndpoints}>
            Stateless token rotation and role-based access control protecting staff back-office routes from unauthorized access.
          </div>
        </div>
      </div>
    </div>
  );
};
