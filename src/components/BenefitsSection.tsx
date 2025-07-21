import React from 'react';
import { UserX, RefreshCw, AlertTriangle, DollarSign } from 'lucide-react';

interface BenefitsSectionProps {
  darkMode: boolean;
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ darkMode }) => {
  const painPoints = [
    {
      icon: RefreshCw,
      title: "Endless revision delaying your payment",
      delay: "0s"
    },
    {
      icon: DollarSign,
      title: "Unpredictable payment schedules",
      delay: "0.2s"
    }
  ];

  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-slate-800' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Say goodbye to...
          </h2>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {painPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div
                key={index}
                className={`group relative p-6 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-xl ${
                  darkMode 
                    ? 'bg-slate-900 border border-slate-700 hover:border-red-500/50' 
                    : 'bg-white border border-gray-200 hover:border-red-300'
                }`}
                style={{
                  animationDelay: point.delay,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                {/* Animated Icon */}
                <div className={`mb-4 p-3 rounded-full transition-all duration-300 group-hover:scale-110 ${
                  darkMode ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                  <IconComponent className={`h-8 w-8 transition-colors duration-300 ${
                    darkMode 
                      ? 'text-red-400 group-hover:text-red-300' 
                      : 'text-red-500 group-hover:text-red-600'
                  }`} />
                </div>

                {/* Pain Point Text */}
                <p className={`text-sm sm:text-base leading-relaxed transition-colors duration-300 ${
                  darkMode 
                    ? 'text-gray-300 group-hover:text-white' 
                    : 'text-gray-600 group-hover:text-gray-900'
                }`}>
                  {point.title}
                </p>

                {/* Subtle Background Animation */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${
                  darkMode ? 'bg-red-400' : 'bg-red-500'
                }`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;