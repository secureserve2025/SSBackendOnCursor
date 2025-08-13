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
import Messages from './pages/Messages';
import { checkOpenAIConfiguration, initializeAuth } from './lib/supabase';

function App() {
  // Always use dark mode
  const darkMode = true;

  // Set dark mode class on document
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Check OpenAI configuration and initialize auth on app load
  useEffect(() => {
    checkOpenAIConfiguration();
    
    // Initialize Supabase auth
    initializeAuth().catch(err => {
      console.warn('Failed to initialize auth:', err);
    });
  }, []);

  // Production environment checker
  useEffect(() => {
    if (import.meta.env.PROD) {
      console.log('🚀 Production Environment Check');
      console.log('==============================');
      console.log('Environment Variables:');
      console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
      console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
      console.log('- VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
    }
  }, []);

  // Suppress console errors for better user experience
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // Suppress specific errors that are expected
      const errorMessage = args.join(' ');
      if (
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('vite.svg') ||
        errorMessage.includes('400') ||
        errorMessage.includes('token?grant_type=refresh_token')
      ) {
        // Don't log these expected errors
        return;
      }
      // Log other errors normally
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login/freelancer" element={<FreelancerLogin />} />
        <Route path="/login/client" element={<ClientLogin />} />
        <Route path="/signup/freelancer" element={<FreelancerSignup />} />
        <Route path="/signup/client" element={<ClientSignup />} />
        <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/" element={
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
        } />
      </Routes>
    </Router>
  );
}

export default App;