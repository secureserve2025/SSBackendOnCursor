import React from 'react';
import { useState, useEffect } from 'react';
import EmailService from '../emails/emailService';

interface CTASectionProps {
  darkMode: boolean;
}

const CTASection: React.FC<CTASectionProps> = ({ darkMode }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate individual fields
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.trim().length < 2 ? 'Name must be at least 2 characters long' : '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      case 'message':
        return value.trim().length < 10 ? 'Message must be at least 10 characters long' : '';
      default:
        return '';
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle input blur (when user leaves field)
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Check if form is valid
  useEffect(() => {
    const nameValid = formData.name.trim().length >= 2;
    const emailValid = formData.email.trim() && emailRegex.test(formData.email);
    const messageValid = formData.message.trim().length >= 10;
    
    setIsFormValid(Boolean(nameValid && emailValid && messageValid));
  }, [formData]);

  // Send email function using centralized EmailService
  const sendEmail = async (formData: { name: string; email: string; message: string }) => {
    try {
      const emailService = EmailService.getInstance();
      const result = await emailService.sendContactFormEmail(formData);
      
      if (result.success) {
        return { success: true };
      } else {
        console.error('Failed to send contact form email:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error sending contact form email:', error);
      return { success: false, error: 'Unknown error occurred' };
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      message: validateField('message', formData.message)
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (!hasErrors && isFormValid) {
      setIsSubmitting(true);
      
      try {
        const result = await sendEmail(formData);
        
        if (result.success) {
          // Reset form
          setFormData({ name: '', email: '', message: '' });
          setErrors({ name: '', email: '', message: '' });
          // Show confirmation
          setShowConfirmation(true);
        } else {
          // Handle error with more specific message
          const errorMessage = result.error || 'Failed to send message. Please try again.';
          alert(`Failed to send message: ${errorMessage}`);
        }
      } catch (error) {
        alert('An error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
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
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Your full name"
                  className={`w-full px-4 py-3 bg-transparent border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-purple-500/50 focus:border-purple-400'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>
              
              {/* Email Field */}
              <div>
                <label className="block text-purple-400 text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3 bg-transparent border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-purple-500/50 focus:border-purple-400'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>
              
              {/* Message Field */}
              <div>
                <label className="block text-purple-400 text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Tell us about your project..."
                  className={`w-full px-4 py-3 bg-transparent border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                    errors.message 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-purple-500 focus:border-purple-400'
                  }`}
                ></textarea>
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.message}
                  </p>
                )}
              </div>
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full font-medium py-3 px-6 rounded-md transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isFormValid && !isSubmitting
                    ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transform hover:scale-105' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 6-8 4-2 8-8-18z" />
                    </svg>
                    <span>{isFormValid ? 'Send Message' : 'Please fill all fields'}</span>
                  </>
                )}
              </button>
              
              {/* Form Requirements */}
              <div className="text-center">
                <p className="text-gray-400 text-xs">
                  * All fields are required
                </p>
              </div>
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
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-white font-semibold mb-4">SecureServe</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                India's first AI-powered escrow platform for freelancers and clients. 
                Secure payments, verified deliverables.
              </p>
            </div>
            
            {/* Contact Details */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>📍 #42, 3rd Floor, Koramangala</p>
                <p>Bengaluru, Karnataka 560034</p>
                <p>📞 +91 80 4567 8900</p>
                <p>✉️ hello@secureserve.ai</p>
              </div>
            </div>
            
            {/* Business Hours */}
            <div>
              <h3 className="text-white font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>Monday - Friday</p>
                <p>9:00 AM - 6:00 PM IST</p>
                <p className="mt-3">Saturday</p>
                <p>10:00 AM - 2:00 PM IST</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 SecureServe. Built for Indian freelancers, by Indian freelancers.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default CTASection;