import React from 'react';

interface CTASectionProps {
  darkMode: boolean;
}

const CTASection: React.FC<CTASectionProps> = ({ darkMode }) => {
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
          
        </div>
      </section>

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