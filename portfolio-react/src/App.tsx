import React, { useState, useEffect } from 'react';
import styles from './App.module.scss';
import type { ThemeMode } from './types';
import { Navbar } from './components/Navbar/Navbar';
import { Hero } from './components/Hero/Hero';
import { ProjectMatrix } from './components/ProjectMatrix/ProjectMatrix';
import { CicdGate } from './components/CicdGate/CicdGate';
import { SkillsStrip } from './components/SkillsStrip/SkillsStrip';
import { HireSection } from './components/HireSection/HireSection';
import { Footer } from './components/Footer/Footer';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={styles.appContainer}>
      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />
      <main className={`container ${styles.mainContent}`}>
        <Hero />
        <ProjectMatrix />
        <CicdGate />
        <SkillsStrip />
        <HireSection />
        <Footer />
      </main>
    </div>
  );
};

export default App;
