import React from 'react';
import { UserX, RefreshCw, AlertTriangle, DollarSign, MessageSquareX } from 'lucide-react';

interface BenefitsSectionProps {
  darkMode: boolean;
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ darkMode }) => {
  const painPoints = [
    {
      icon: MessageSquareX,
      title: "Subjective quality disputes",
      delay: "0s"
    },
    {
      icon: RefreshCw,
      title: "Endless revision delaying your payment",
      delay: "0.2s"
    },
    {
      icon: DollarSign,
      title: "Unpredictable payment schedules",
      delay: "0.4s"
    }
  ];

  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
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
        <div className="max-w-2xl mx-auto space-y-6">
          {painPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div
                key={index}
                className={`group relative p-6 rounded-2xl transition-all duration-500 hover:scale-102 hover:shadow-xl ${
                  darkMode 
                    ? `bg-gray-900 border border-purple-500/30 hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/25` 
                    : 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-400/25'
                }`}
                style={{
                  animationDelay: point.delay,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                <div className="flex items-center space-x-4">
                  {/* Animated Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full transition-all duration-300 group-hover:scale-110 flex items-center justify-center ${
                    darkMode ? 'bg-pink-900/20' : 'bg-purple-50'
                  }`}>
                    <IconComponent className={`h-5 w-5 transition-colors duration-300 ${
                      darkMode 
                        ? 'text-pink-400 group-hover:text-pink-300' 
                        : 'text-purple-500 group-hover:text-purple-600'
                    }`} />
                  </div>

                  {/* Pain Point Text */}
                  <p className={`flex-1 text-base sm:text-lg font-medium leading-relaxed transition-colors duration-300 ${
                    darkMode 
                      ? 'text-gray-300 group-hover:text-white' 
                      : 'text-gray-600 group-hover:text-gray-900'
                  }`}>
                    {point.title}
                  </p>
                </div>

                {/* Subtle Background Animation */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${
                  darkMode ? 'bg-pink-400' : 'bg-purple-500'
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