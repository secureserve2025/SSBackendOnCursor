import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import SecureServeBenefits from './components/SecureServeBenefits';
import HowItWorksSection from './components/HowItWorksSection';
import FAQsSection from './components/FAQsSection';
import CTASection from './components/CTASection';

function App() {
  // Always use dark mode
  const darkMode = true;

  // Set dark mode class on document
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-900">
      {/* Header Component */}
      <Header darkMode={darkMode} />
      
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