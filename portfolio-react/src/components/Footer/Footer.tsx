import React from 'react';
import styles from './Footer.module.scss';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <span>© Oleg G. Built for technical and commercial client evaluation.</span>
        <div className={styles.footerLinks}>
          <a
            href="https://github.com/Metarenessans/freelance"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository ↗
          </a>
          <a
            href="https://www.upwork.com/freelancers/~0126a1db3ee4419254"
            target="_blank"
            rel="noopener noreferrer"
          >
            Upwork Profile ↗
          </a>
        </div>
      </div>
    </footer>
  );
};
