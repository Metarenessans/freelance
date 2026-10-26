import React from 'react';
import styles from './ProjectMatrix.module.scss';
import { Console } from '../Console/Console';
import type { ClientProject } from '../../types';

export const ProjectMatrix: React.FC = () => {
  const clientProjects: ClientProject[] = [
    {
      id: 'betboom',
      label: 'PROJECT // 01',
      tag: 'COMMERCIAL CAMPAIGN',
      title: 'BetBoom Campaign Landing',
      description:
        'High-impact sports community promotional landing page featuring fluid CSS/JS keyframe animations, interactive gamified reward tiers, responsive asset handling, and conversion-optimized pathways.',
      link: '/bet-boom/',
    },
    {
      id: 'dna',
      label: 'PROJECT // 02',
      tag: 'E-COMMERCE SHOWCASE',
      title: 'DNA Personalized Jewelry',
      description:
        'Luxury e-commerce product landing page for personalized genetic jewelry. Built with mobile-first Sass/SCSS architecture, custom product selectors, and high-DPI imagery.',
      link: '/dna/',
    },
  ];

  return (
    <>
      {/* Flagship Project Showcase */}
      <section className={styles.caseSection} id="flagship">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Flagship Case Study</h2>
            <p className={styles.sectionDesc}>
              Live production sandbox demonstrating end-to-end commerce mechanics.
            </p>
          </div>
        </div>

        <article className={styles.projectCard}>
          <div className={styles.projectHeader}>
            <div className={styles.projectTitleArea}>
              <h3>Catering & Event Commerce Platform</h3>
            </div>
            <div className={styles.pillsGroup}>
              <span className={`${styles.pill} ${styles.active}`}>Next.js SSR</span>
              <span className={`${styles.pill} ${styles.active}`}>Django REST</span>
              <span className={`${styles.pill} ${styles.active}`}>PostgreSQL</span>
              <span className={styles.pill}>Telegram Bot</span>
              <span className={styles.pill}>Docker</span>
              <a
                className={`${styles.pill} ${styles.active} ${styles.pillCi}`}
                href="https://github.com/Metarenessans/freelance/actions"
                target="_blank"
                rel="noopener noreferrer"
                title="View verified GitHub Actions CI pipeline"
              >
                <span className={styles.ciStatusDot}></span> GitHub Actions CI ↗
              </a>
            </div>
          </div>

          <p className={styles.projectSummary}>
            An event catering commerce platform engineered with transactional cart checkout, authoritative
            server-side pricing validation, and operational lead routing. Features an isolated public demonstration
            sandbox where clients can place test orders, query live Swagger API documentation, and observe automated Telegram alerts.
          </p>

          <div className={styles.actionBar}>
            <span className={styles.actionLabel}>Live Sandbox:</span>
            <a
              className={styles.btnTestApp}
              href="https://catering-portfolio-six.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Launch Web App ↗
            </a>
            <a
              className={styles.btnTestNeutral}
              href="https://catering-portfolio-api.vercel.app/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Interactive Swagger API ↗
            </a>
            <a
              className={styles.btnTestNeutral}
              href="https://catering-portfolio-api.vercel.app/admin/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Django Admin Panel ↗
            </a>
            <a
              className={styles.btnTestNeutral}
              href="https://github.com/Metarenessans/freelance/tree/main/catering"
              target="_blank"
              rel="noopener noreferrer"
              title="Browse full Next.js & Django source code"
            >
              Source Code ↗
            </a>
          </div>

          <Console />
        </article>
      </section>

      {/* Client Deliveries Section */}
      <section className={styles.clientSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Client Deliveries</h2>
            <p className={styles.sectionDesc}>
              Commercial landing pages delivered for client campaigns.
            </p>
          </div>
        </div>

        <div className={styles.clientWorksGrid}>
          {clientProjects.map((project) => (
            <article key={project.id} className={styles.clientProjectCard}>
              <div>
                <div className={styles.clientProjectHeader}>
                  <span className={styles.clientLabel}>{project.label}</span>
                  <span className={styles.clientLabel}>{project.tag}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              <a className={styles.clientLink} href={project.link}>
                Explore Live Site ↗
              </a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};
