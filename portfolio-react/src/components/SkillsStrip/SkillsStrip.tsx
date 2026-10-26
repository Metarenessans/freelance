import React from 'react';
import styles from './SkillsStrip.module.scss';
import type { SkillCategory } from '../../types';

export const SkillsStrip: React.FC = () => {
  const categories: SkillCategory[] = [
    {
      title: 'Frontend',
      skills: ['Next.js SSR', 'React & TypeScript', 'Tailwind CSS & Sass', 'Responsive & Accessible UI'],
    },
    {
      title: 'Backend',
      skills: ['Python 3.11+', 'Django & Django REST', 'PostgreSQL', 'Atomic Transactions'],
    },
    {
      title: 'Automation',
      skills: [
        'Telegram Bot & Telethon',
        'Async Event Dispatchers',
        'Custom Django Admin Panels',
        'SMTP Email Alerting',
      ],
    },
    {
      title: 'DevOps',
      skills: ['GitHub Actions CI/CD', 'GitLab CI', 'Docker & Compose', 'Vercel Deployments'],
    },
  ];

  return (
    <section className={styles.skillsBox}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Full-Stack Core Capabilities</h2>
        <p className={styles.sectionDesc}>
          Production technologies applied across client engagements.
        </p>
      </div>

      <div className={styles.skillsGrid}>
        {categories.map((cat, idx) => (
          <div key={idx} className={styles.skillCategory}>
            <h4>{cat.title}</h4>
            <ul className={styles.skillList}>
              {cat.skills.map((skill, sIdx) => (
                <li key={sIdx}>{skill}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
