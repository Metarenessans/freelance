import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.scss';
import type { ThemeMode } from '../../types';

interface NavbarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const [scrollWidth, setScrollWidth] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollWidth(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div
        className={styles.scrollProgress}
        style={{ width: `${scrollWidth}%` }}
        aria-hidden="true"
      />
      <header className={styles.siteHeader}>
        <nav className={`container ${styles.navInner}`} aria-label="Main Navigation">
          <div className={styles.brandGroup}>
            <div className={styles.brandBadge}>O</div>
            <div className={styles.brandMeta}>
              <span className={styles.brandName}>Oleg G.</span>
              <span className={styles.brandTitle}>Full-Stack Engineer</span>
            </div>
          </div>

          <div className={styles.navActions}>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot}></span>
              <span>Available on Upwork</span>
            </div>

            <button
              className={styles.themeBtn}
              onClick={onToggleTheme}
              aria-label="Toggle visual theme"
              title="Toggle Light / Dark mode"
            >
              {theme === 'dark' ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            <a
              className={styles.btnUpwork}
              href="https://www.upwork.com/freelancers/~0126a1db3ee4419254"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hire Me ↗
            </a>
          </div>
        </nav>
      </header>
    </>
  );
};
