import React from 'react';
import { FileText, Shield, CheckCircle, Zap } from 'lucide-react';

interface SecureServeBenefitsProps {
  darkMode: boolean;
}

const SecureServeBenefits: React.FC<SecureServeBenefitsProps> = ({ darkMode }) => {
  const benefits = [
    {
      icon: FileText,
      title: "Smart Contracts",
      description: "AI helps create clear, detailed project specifications that protect both parties and set clear expectations from the start.",
      color: "blue",
      delay: "0s"
    },
    {
      icon: Shield,
      title: "Secure Escrow System",
      description: "Money is held safely in escrow until work is approved. Complete protection for both freelancers and clients throughout the project.",
      color: "green",
      delay: "0.2s"
    },
    {
      icon: CheckCircle,
      title: "AI-Verified Deliverables",
      description: "Advanced AI instantly verifies if your work matches client requirements, eliminating subjective disputes and ensuring fair evaluation.",
      color: "purple",
      delay: "0.4s"
    },
    {
      icon: Zap,
      title: "Instant Payments",
      description: "Once AI confirms work quality meets specifications, payments are transferred instantly to your account without delays.",
      color: "yellow",
      delay: "0.6s"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        iconBg: darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50',
        iconColor: darkMode ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-cyan-500 group-hover:text-cyan-600',
        hoverBorder: darkMode ? 'hover:border-cyan-500/50' : 'hover:border-cyan-300',
        hoverBg: darkMode ? 'bg-cyan-400' : 'bg-cyan-500'
      },
      green: {
        iconBg: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
        iconColor: darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-500 group-hover:text-purple-600',
        hoverBorder: darkMode ? 'hover:border-purple-500/50' : 'hover:border-purple-300',
        hoverBg: darkMode ? 'bg-purple-400' : 'bg-purple-500'
      },
      purple: {
        iconBg: darkMode ? 'bg-pink-900/20' : 'bg-pink-50',
        iconColor: darkMode ? 'text-pink-400 group-hover:text-pink-300' : 'text-pink-500 group-hover:text-pink-600',
        hoverBorder: darkMode ? 'hover:border-pink-500/50' : 'hover:border-pink-300',
        hoverBg: darkMode ? 'bg-pink-400' : 'bg-pink-500'
      },
      yellow: {
        iconBg: darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50',
        iconColor: darkMode ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-cyan-500 group-hover:text-cyan-600',
        hoverBorder: darkMode ? 'hover:border-cyan-500/50' : 'hover:border-cyan-300',
        hoverBg: darkMode ? 'bg-cyan-400' : 'bg-cyan-500'
      }
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Switch to SecureServe
          </h2>
          <h3 className={`text-lg sm:text-xl lg:text-2xl font-medium mb-6 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your AI-Powered Payment Guardian
          </h3>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            const colorClasses = getColorClasses(benefit.color);
            
            return (
              <div
                key={index}
                className={`group relative p-6 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-xl ${
                  darkMode 
                    ? `bg-gray-800 border border-purple-500/30 ${colorClasses.hoverBorder}` 
                    : `bg-white border border-gray-200 ${colorClasses.hoverBorder}`
                } shadow-lg`}
                style={{
                  animationDelay: benefit.delay,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                {/* Animated Icon */}
                <div className={`mb-4 w-16 h-16 rounded-full transition-all duration-300 group-hover:scale-110 ${colorClasses.iconBg} mx-auto flex items-center justify-center`}>
                  <IconComponent className={`h-8 w-8 transition-colors duration-300 ${colorClasses.iconColor}`} />
                </div>

                {/* Benefit Title */}
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 text-center ${
                  darkMode 
                    ? 'text-white group-hover:text-white' 
                    : 'text-gray-900 group-hover:text-gray-900'
                }`}>
                  {benefit.title}
                </h3>

                {/* Benefit Description */}
                <p className={`text-sm sm:text-base leading-relaxed transition-colors duration-300 text-center ${
                  darkMode 
                    ? 'text-gray-300 group-hover:text-gray-200' 
                    : 'text-gray-600 group-hover:text-gray-700'
                }`}>
                  {benefit.description}
                </p>

                {/* Subtle Background Animation */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${colorClasses.hoverBg}`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecureServeBenefits;