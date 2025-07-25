import React, { useState } from 'react';
import { Shield, Building, Mail, Lock, Eye, EyeOff, ArrowLeft, Users, CheckCircle, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/supabase';

const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setErrors({ email: '', password: '' });

    try {
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({
            email: 'Invalid email or password',
            password: 'Invalid email or password'
          });
        } else {
          setErrors({
            email: error.message,
            password: ''
          });
        }
        return;
      }

      if (data.user) {
        // Check if user is a client
        const userType = data.user.user_metadata?.user_type;
        if (userType === 'client') {
          // Redirect to client dashboard
          navigate('/client/dashboard');
        } else {
          setErrors({
            email: 'This account is not registered as a client',
            password: ''
          });
        }
      }
    } catch (err) {
      setErrors({
        email: 'An unexpected error occurred',
        password: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23a855f7%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M30 30l15-15v30l-15-15zm-15 0l15 15V15l-15 15z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative max-w-md w-full">
        {/* Back to Home */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
          {/* Header Section */}
          <div className="bg-purple-600 px-8 py-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to Your Account!
            </h1>
            <p className="text-purple-100 text-sm">
              Manage your projects and connect with top freelancers
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Email Address
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
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Password
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
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-300">Keep me signed in</span>
                </label>
                <a href="#" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                  Reset password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 transform hover:scale-105'
                } text-white`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Access Client Dashboard'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-sm text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                Don't have an account?{' '}
                <Link to="/signup/client" className="text-purple-400 hover:text-purple-300 font-semibold">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          {/* Benefits Footer */}
          <div className="bg-gray-700 px-8 py-6 border-t border-purple-500/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Users className="h-5 w-5 text-purple-400 mb-1" />
                <span className="text-xs text-gray-300 font-medium">Top Talent</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-5 w-5 text-purple-400 mb-1" />
                <span className="text-xs text-gray-300 font-medium">Quality Assured</span>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="h-5 w-5 text-purple-400 mb-1" />
                <span className="text-xs text-gray-300 font-medium">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default ClientLogin;