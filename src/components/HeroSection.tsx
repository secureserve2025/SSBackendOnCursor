import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';

interface HeroSectionProps {
  darkMode: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ darkMode }) => {
  const [animationStep, setAnimationStep] = useState(0);

  // Animation sequence: 0 = start, 1 = video format, 2 = duration, 3 = resolution, 4 = watermark processing, 5 = watermark complete, 6 = verification passed
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 7);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const getFieldState = (fieldIndex: number) => {
    if (animationStep === 0) return 'hidden';
    if (animationStep > fieldIndex) return 'completed';
    if (animationStep === fieldIndex) return 'processing';
    return 'hidden';
  };

  const getWatermarkState = () => {
    if (animationStep < 4) return 'hidden';
    if (animationStep === 4) return 'processing';
    return 'completed';
  };

  return (
    <section className={`pt-24 pb-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                India's First{' '}
                <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                <span className={darkMode ? 'text-cyan-400' : 'text-purple-600'}>
                  AI-Powered Escrow Platform
                </span>{' '}
                </span>
                for Freelancers & Clients
              </h1>
              
              <p className={`text-lg sm:text-xl leading-relaxed ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Protect your work. Pursue your worth.
              </p>

              {/* Performance Analytics */}
              <div className="grid grid-cols-2 gap-8 pt-8 max-w-md mx-auto">
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    darkMode ? 'text-cyan-400' : 'text-purple-600'
                  }`}>
                    15,247+
                  </div>
                  <div className={`text-sm font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Happy Customers
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    darkMode ? 'text-pink-400' : 'text-pink-600'
                  }`}>
                    8,932+
                  </div>
                  <div className={`text-sm font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Successful Closures
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <div className="relative">
            {/* Main Dashboard Card */}
            <div className={`rounded-2xl p-6 shadow-2xl animate-swing ${
              darkMode ? 'bg-gray-800 border border-purple-500/30' : 'bg-white border border-gray-200'
            }`}>
              {/* Project Header */}
              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Video Editing Project Uploaded
                </h3>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(85, (animationStep / 6) * 85)}%` }}
                  ></div>
                </div>
                <div className={`flex items-center justify-between mt-2 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>2 min ago</span>
                  </div>
                </div>
              </div>

              {/* AI Verification Results */}
              <div className="space-y-4 mb-6">
                <h4 className={`font-semibold flex items-center space-x-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <span>📋</span>
                  <span>AI Verification Results</span>
                </h4>

                {/* Verification Items */}
                <div className="space-y-3">
                  {/* Video Format */}
                  <div 
                    className={`transition-all duration-500 ${
                      getFieldState(1) === 'hidden' 
                        ? 'opacity-0 transform translate-y-4' 
                        : 'opacity-100 transform translate-y-0'
                    }`}
                  >
                    <div className={`p-3 rounded-lg border transition-all duration-500 ${
                      getFieldState(1) === 'completed'
                        ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                        : darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className={`flex items-center space-x-2 transition-colors duration-500 ${
                        getFieldState(1) === 'completed' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {getFieldState(1) === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span className="font-medium">
                          Video Format: MP4 {getFieldState(1) === 'completed' ? '✓' : ''}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 transition-colors duration-500 ${
                        getFieldState(1) === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {getFieldState(1) === 'completed' ? 'Matches requirement' : 'Checking format...'}
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div 
                    className={`transition-all duration-500 ${
                      getFieldState(2) === 'hidden' 
                        ? 'opacity-0 transform translate-y-4' 
                        : 'opacity-100 transform translate-y-0'
                    }`}
                  >
                    <div className={`p-3 rounded-lg border transition-all duration-500 ${
                      getFieldState(2) === 'completed'
                        ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                        : darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className={`flex items-center space-x-2 transition-colors duration-500 ${
                        getFieldState(2) === 'completed' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {getFieldState(2) === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span className="font-medium">
                          Duration: 60 seconds {getFieldState(2) === 'completed' ? '✓' : ''}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 transition-colors duration-500 ${
                        getFieldState(2) === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {getFieldState(2) === 'completed' ? 'Perfect match' : 'Analyzing duration...'}
                      </div>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div 
                    className={`transition-all duration-500 ${
                      getFieldState(3) === 'hidden' 
                        ? 'opacity-0 transform translate-y-4' 
                        : 'opacity-100 transform translate-y-0'
                    }`}
                  >
                    <div className={`p-3 rounded-lg border transition-all duration-500 ${
                      getFieldState(3) === 'completed'
                        ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                        : darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className={`flex items-center space-x-2 transition-colors duration-500 ${
                        getFieldState(3) === 'completed' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {getFieldState(3) === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span className="font-medium">
                          Resolution: 1080p HD {getFieldState(3) === 'completed' ? '✓' : ''}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 transition-colors duration-500 ${
                        getFieldState(3) === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {getFieldState(3) === 'completed' ? 'High quality confirmed' : 'Checking quality...'}
                      </div>
                    </div>
                  </div>

                  {/* Watermark Check */}
                  <div 
                    className={`transition-all duration-500 ${
                      getWatermarkState() === 'hidden' 
                        ? 'opacity-0 transform translate-y-4' 
                        : 'opacity-100 transform translate-y-0'
                    }`}
                  >
                    <div className={`p-3 rounded-lg border transition-all duration-500 ${
                      getWatermarkState() === 'completed'
                        ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                        : darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className={`flex items-center space-x-2 transition-colors duration-500 ${
                        getWatermarkState() === 'completed' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {getWatermarkState() === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span className="font-medium">
                          Watermark Check {getWatermarkState() === 'completed' ? '✓' : ''}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 transition-colors duration-500 ${
                        getWatermarkState() === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {getWatermarkState() === 'completed' ? 'No watermarks detected' : 'Processing...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div 
                className={`flex items-center justify-center mb-6 transition-all duration-500 ${
                  animationStep >= 6 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-4'
                }`}
              >
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verification Passed</span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="flex space-x-3">
                <button className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-500 flex items-center justify-center space-x-2 border ${
                  animationStep >= 6
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                    : darkMode 
                      ? 'border-purple-500/30 text-gray-300 hover:bg-purple-800/50' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  <span>Release Funds</span>
                </button>
                <button className={`px-4 py-3 rounded-lg font-medium transition-colors border ${
                  darkMode 
                    ? 'border-purple-500/30 text-gray-300' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  Request Revision
                </button>
              </div>

              {/* Amount Display */}
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">₹25,000</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  In Escrow
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;