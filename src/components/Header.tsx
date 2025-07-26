import React, { useState } from 'react';
import { Shield, Menu, X, Globe, ChevronDown } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const exploreLinks = [
    { label: 'How it works', href: '#how-it-works', onClick: () => scrollToSection('how-it-works') },
    { label: 'FAQs', href: '#faqs', onClick: () => scrollToSection('faqs') },
    { label: 'Contact us', href: '#contact', onClick: () => scrollToFooter() },
  ];

  const loginOptions = [
    { label: 'As a Freelancer', href: '/login/freelancer' },
    { label: 'As a Client', href: '/login/client' },
  ];
  const indianLanguages = [
    { label: 'English', code: 'en' }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setIsExploreOpen(false); // Close dropdown after clicking
    }
  };

  const scrollToFooter = () => {
    // Scroll to the bottom of the page to show the footer
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
    setIsExploreOpen(false); // Close dropdown after clicking
  };
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900/95' : 'bg-white/95'
    } backdrop-blur-sm border-b ${darkMode ? 'border-purple-500/30' : 'border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Shield className={`h-8 w-8 ${darkMode ? 'text-cyan-400' : 'text-purple-600'}`} />
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              SecureServe
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Explore Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExploreOpen(!isExploreOpen)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-purple-800/50' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>Explore</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExploreOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isExploreOpen && (
                <div className={`absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg ${
                  darkMode ? 'bg-gray-800 border border-purple-500/30' : 'bg-white border border-gray-200'
                } py-1`}>
                  {exploreLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                     onClick={(e) => {
                       if (link.onClick) {
                         e.preventDefault();
                         link.onClick();
                       }
                     }}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-purple-700/50' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}

            {/* Login Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLoginOpen(!isLoginOpen)}
                className={`flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isLoginOpen ? 'bg-purple-700' : ''
                }`}
              >
                <span>Login</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isLoginOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Login Dropdown Menu */}
              {isLoginOpen && (
                <div className={`absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg ${
                  darkMode ? 'bg-gray-800 border border-purple-500/30' : 'bg-white border border-gray-200'
                } py-1`}>
                  {loginOptions.map((option) => (
                    <a
                      key={option.label}
                      href={option.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-purple-700/50' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsLoginOpen(false)}
                    >
                      {option.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden p-2 rounded-md ${
              darkMode 
                ? 'text-gray-300 hover:text-white hover:bg-purple-800/50' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden border-t ${darkMode ? 'border-purple-500/30' : 'border-gray-200'} py-4`}>
            <div className="space-y-2">
              {/* Mobile Explore Links */}
              <div className="space-y-1">
                <div className={`px-3 py-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Explore
                </div>
                {exploreLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                   onClick={(e) => {
                     if (link.onClick) {
                       e.preventDefault();
                       link.onClick();
                     }
                   }}
                    className={`block px-6 py-2 text-sm transition-colors ${
                      darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-purple-800/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              
              {/* Mobile Controls */}
              <div className="flex items-center justify-between px-3 py-2">
                <div className="relative">
                  <button
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className={`p-2 rounded-md transition-colors ${
                      darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-purple-800/50' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label="Select language"
                  >
                    <Globe className="h-5 w-5" />
                  </button>
                  
                  {/* Mobile Language Dropdown */}
                  {isLanguageOpen && (
                    <div className={`absolute bottom-full right-0 mb-1 w-56 rounded-md shadow-lg ${
                      darkMode ? 'bg-gray-800 border border-purple-500/30' : 'bg-white border border-gray-200'
                    } py-1 max-h-64 overflow-y-auto`}>
                      {indianLanguages.map((language) => (
                        <button
                          key={language.code}
                          className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                            darkMode 
                              ? 'text-gray-300 hover:text-white hover:bg-purple-700/50' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsLanguageOpen(false)}
                        >
                          {language.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile CTA */}
              <div className="px-3 pt-2">
                <div className="space-y-2">
                  <div className={`px-3 py-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Login
                  </div>
                  {loginOptions.map((option) => (
                    <a
                      key={option.label}
                      href={option.href}
                      className={`block w-full px-6 py-3 rounded-md font-medium transition-colors text-center ${
                        darkMode 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    >
                      {option.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
