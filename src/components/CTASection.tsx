import React from 'react';
import { useState } from 'react';

interface CTASectionProps {
  darkMode: boolean;
}

const CTASection: React.FC<CTASectionProps> = ({ darkMode }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      {/* Call to Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Secure Your Freelance Future?
          </h2>
          
          {/* CTA Subtitle */}
          <p className="text-lg sm:text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
          </p>
          <p className="text-lg sm:text-xl text-white mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of Indian freelancers who never worry about payment delays anymore
          </p>
          
          {/* Message Form */}
          <div className="max-w-lg mx-auto bg-gray-800 rounded-2xl p-8 border border-purple-500/30">
            <div className="flex items-center space-x-2 mb-6">
              <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 6-8 4-2 8-8-18z" />
              </svg>
              <h3 className="text-xl font-semibold text-purple-400">Send us a message</h3>
            </div>
            <div className="w-12 h-0.5 bg-purple-400 mb-6"></div>
            
            <form className="space-y-6" onSubmit={handleSendMessage}>
              {/* Name Field */}
              <div>
                <label className="block text-purple-400 text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              
              {/* Email Field */}
              <div>
                <label className="block text-purple-400 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              
              {/* Message Field */}
              <div>
                <label className="block text-purple-400 text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your project..."
                  className="w-full px-4 py-3 bg-transparent border-2 border-purple-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                ></textarea>
              </div>
              
              {/* Send Button */}
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Message</span>
              </button>
            </form>
          </div>
          
        </div>
      </section>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 text-center">
            <h3 className="text-2xl font-bold text-purple-400 mb-4">
              Thank you!
            </h3>
            <p className="text-white text-lg mb-2">
              Your message has been sent successfully.
            </p>
            <p className="text-gray-300 text-base mb-6">
              We'll get back to you soon.
            </p>
            <button
              onClick={closeConfirmation}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-800'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © 2025 SecureServe. Built for Indian freelancers, by Indian freelancers.
          </p>
        </div>
      </footer>
    </>
  );
};

export default CTASection;