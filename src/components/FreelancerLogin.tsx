import React, { useState } from 'react';
import { Shield, User, Mail, Lock, Eye, EyeOff, ArrowLeft, Briefcase, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const FreelancerLogin: React.FC = () => {
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
    console.log('Freelancer login:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div className="flex items-center">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-cyan-500/20 rounded-full">
              <Shield className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">SecureServe</h1>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Briefcase className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Freelancer Login</h2>
            </div>
            <p className="text-cyan-200">
              Access your freelancer dashboard and manage your projects
            </p>
          </div>
        </div>

        {/* Freelancer Benefits */}
        <div className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-cyan-300 font-semibold mb-3 flex items-center">
            <Star className="h-4 w-4 mr-2" />
            Freelancer Benefits
          </h3>
          <div className="space-y-2 text-sm text-cyan-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>Guaranteed payments with AI verification</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>Instant fund release upon approval</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>Protection against payment disputes</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-cyan-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-cyan-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cyan-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-cyan-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyan-400 hover:text-cyan-300"
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
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-cyan-500 rounded focus:ring-cyan-400 focus:ring-2"
                />
                <span className="ml-2 text-sm text-cyan-200">Remember me</span>
              </label>
              <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Sign In as Freelancer
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-500/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-cyan-300">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <a
                href="#"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Create Freelancer Account
              </a>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-cyan-400">15,247+</div>
            <div className="text-sm text-cyan-200">Active Freelancers</div>
          </div>
          <div className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-cyan-400">₹2.4Cr+</div>
            <div className="text-sm text-cyan-200">Payments Secured</div>
          </div>
        </div>
      </div>
    </div>
  )
  );
};

export default FreelancerLogin;