import React, { useState } from 'react';
import { Building, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../lib/supabase';

const ClientSignup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: ''
  });
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    alphanumeric: false
  });

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Password validation: minimum 8 characters with at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

  const validatePassword = (password: string) => {
    const length = password.length >= 8;
    const alphanumeric = /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
    
    setPasswordValidation({
      length,
      alphanumeric
    });

    return length && alphanumeric;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time password validation
    if (name === 'password') {
      validatePassword(value);
    }

    // Real-time confirm password validation
    if (name === 'confirmPassword' && formData.password) {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setSuccessMessage('');
    
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: ''
    };

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with letters and numbers';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (!hasErrors) {
      try {
        const { data, error } = await signUp(formData.email, formData.password, 'client');
        
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({
              email: 'This email is already registered',
              password: '',
              confirmPassword: '',
              agreeToTerms: ''
            });
          } else {
            setErrors({
              email: error.message,
              password: '',
              confirmPassword: '',
              agreeToTerms: ''
            });
          }
          return;
        }

        if (data.user) {
          setSuccessMessage('Account created successfully! Please check your email to verify your account.');
          // Reset form
          setFormData({ email: '', password: '', confirmPassword: '', agreeToTerms: false });
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login/client');
          }, 3000);
        }
      } catch (err) {
        setErrors({
          email: 'An unexpected error occurred',
          password: '',
          confirmPassword: '',
          agreeToTerms: ''
        });
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23a855f7%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M30 30l15-15v30l-15-15zm-15 0l15 15V15l-15 15z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative max-w-md w-full">
        {/* Back to Login */}
        <div className="mb-6">
          <Link 
            to="/login/client" 
            className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Login</span>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
          {/* Header Section */}
          <div className="bg-purple-600 px-8 py-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Join as Client
            </h1>
            <p className="text-purple-100 text-sm">
              Create your account and hire top freelancers
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {successMessage}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-purple-500/30 focus:border-purple-400'
                    }`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-purple-500/30 focus:border-purple-400'
                    }`}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className={`flex items-center text-sm ${
                      passwordValidation.length ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {passwordValidation.length ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center text-sm ${
                      passwordValidation.alphanumeric ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {passwordValidation.alphanumeric ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Contains letters and numbers
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-purple-500/30 focus:border-purple-400'
                    }`}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-300"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-green-400 text-sm mt-1 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700 mt-1"
                  required
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
                  I agree to the{' '}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyModal(true);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Privacy Policy
                  </a>
                </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 transform hover:scale-105'
                } text-white`}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Client Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-sm text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                Already have an account?{' '}
                <Link to="/login/client" className="text-purple-400 hover:text-purple-300 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-purple-400">
                Terms of Service
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p className="text-white font-medium mb-4">
                By creating a client account on SecureServe, you agree to the following:
              </p>
              
              <p>
                You will define clear project requirements and milestones for freelancers you engage with.
              </p>
              
              <p>
                Project funds are placed in escrow and released only when you approve submitted deliverables.
              </p>
              
              <p>
                Our AI-assisted systems help track progress and facilitate fair dispute resolution, if needed.
              </p>
              
              <p>
                You agree to maintain transparency in communication and ensure timely feedback or release of funds.
              </p>
              
              <p>
                Misuse of the platform, including failure to honor escrow terms or abusive behavior, may lead to account restrictions.
              </p>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-purple-400">
                Privacy Policy
              </h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p className="text-white font-medium mb-4">
                Your privacy and trust are essential to us. Here is how we handle your data as a client:
              </p>
              
              <p>
                We collect only essential information such as your Name, Mobile number, project briefs, and payment data to enable safe and smooth transactions.
              </p>
              
              <p>
                Your data is encrypted, stored securely, and never shared with freelancers or third parties beyond what is necessary for project execution.
              </p>
              
              <p>
                AI tools help with work checklist generation, finished work verification, secure payment processing, and dispute prevention.
              </p>
              
              <p>
                You can access, edit, or remove your data at any time via your profile settings.
              </p>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSignup;