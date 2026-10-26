import React from 'react';
import styles from './HireSection.module.scss';

export const HireSection: React.FC = () => {
  return (
    <section className={styles.hireCard}>
      <div className={styles.hireText}>
        <h3>Ready to build your next web application?</h3>
        <p>
          Available for contract and full-stack engineering roles on Upwork.
          I deliver clear communication, structured milestones, clean code, and guaranteed production turnaround.
        </p>
      </div>
      <a
        className={styles.btnUpworkCta}
        href="https://www.upwork.com/freelancers/~0126a1db3ee4419254"
        target="_blank"
        rel="noopener noreferrer"
      >
        Hire Me on Upwork ↗
      </a>
    </section>
  );
};
