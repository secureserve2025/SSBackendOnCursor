import React, { useState } from 'react';
import { Shield, Building, Mail, Lock, Eye, EyeOff, ArrowLeft, Users, CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add login logic here
    console.log('Client login:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div className="flex items-center">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-pink-300 hover:text-pink-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-pink-500/20 rounded-full">
              <Shield className="h-8 w-8 text-pink-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">SecureServe</h1>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building className="h-6 w-6 text-pink-400" />
              <h2 className="text-2xl font-bold text-white">Client Login</h2>
            </div>
            <p className="text-pink-200">
              Access your client dashboard and manage your projects
            </p>
          </div>
        </div>

        {/* Client Benefits */}
        <div className="bg-pink-500/10 backdrop-blur-sm border border-pink-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-pink-300 font-semibold mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Client Benefits
          </h3>
          <div className="space-y-2 text-sm text-pink-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span>AI-verified deliverables before payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span>Secure escrow protection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span>Quality assurance guarantee</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-pink-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-pink-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-pink-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-pink-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-pink-400 hover:text-pink-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-pink-500 bg-gray-700 border-pink-500 rounded focus:ring-pink-400 focus:ring-2"
                />
                <span className="ml-2 text-sm text-pink-200">Remember me</span>
              </label>
              <a href="#" className="text-sm text-pink-400 hover:text-pink-300 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Sign In as Client
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-500/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-pink-300">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <a
                href="#"
                className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
              >
                Create Client Account
              </a>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-pink-500/10 backdrop-blur-sm border border-pink-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-pink-400">8,932+</div>
            <div className="text-sm text-pink-200">Happy Clients</div>
          </div>
          <div className="bg-pink-500/10 backdrop-blur-sm border border-pink-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-pink-400">99.8%</div>
            <div className="text-sm text-pink-200">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
  );
};

export default ClientLogin;