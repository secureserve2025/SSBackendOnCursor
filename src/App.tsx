import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import SecureServeBenefits from './components/SecureServeBenefits';
import HowItWorksSection from './components/HowItWorksSection';
import FAQsSection from './components/FAQsSection';
import CTASection from './components/CTASection';
import FreelancerLogin from './pages/FreelancerLogin';
import ClientLogin from './pages/ClientLogin';
import FreelancerSignup from './pages/FreelancerSignup';
import ClientSignup from './pages/ClientSignup';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ClientDashboard from './pages/ClientDashboard';

function App() {
  // Dark mode state with dark mode as default
  const [darkMode, setDarkMode] = useState(true);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Set dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/login/freelancer" element={<FreelancerLogin />} />
        <Route path="/login/client" element={<ClientLogin />} />
        <Route path="/signup/freelancer" element={<FreelancerSignup />} />
        <Route path="/signup/client" element={<ClientSignup />} />
        <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/" element={
          <div className="min-h-screen transition-colors duration-300 bg-gray-900">
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
        } />
      </Routes>
    </Router>
  );
}

export default App;