import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import SecureServeBenefits from './components/SecureServeBenefits';
import HowItWorksSection from './components/HowItWorksSection';
import FAQsSection from './components/FAQsSection';
import CTASection from './components/CTASection';

function App() {
  // Dark mode state management
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Update document class for global styling
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-slate-900' : 'bg-white'
    }`}>
      {/* Header Component */}
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* Hero Section */}
      <HeroSection darkMode={darkMode} />
      
      {/* Benefits Section */}
      <BenefitsSection darkMode={darkMode} />
      
      {/* SecureServe Benefits Section */}
      <SecureServeBenefits darkMode={darkMode} />
      
      {/* How It Works Section */}
      <HowItWorksSection darkMode={darkMode} />
      
      {/* FAQs Section */}
      <FAQsSection darkMode={darkMode} />
      
      {/* CTA and Footer Section */}
      <CTASection darkMode={darkMode} />
    </div>
  );
}

export default App;