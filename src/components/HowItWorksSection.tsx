import React, { useState, useEffect, useRef } from 'react';
import { FileText, Shield, Upload, CheckCircle, Zap, Users, ChevronDown } from 'lucide-react';

interface HowItWorksSectionProps {
  darkMode: boolean;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ darkMode }) => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    {
      id: 1,
      icon: Users,
      title: "Escrow Setup",
      description: "Both client and freelancer register with SecureServe. We verify your identity using Aadhar card, PAN or TAN number, and bank/UPI account details as per RBI regulations. Sign our service agreement to get started with secure escrow protection.",
      color: "cyan"
    },
    {
      id: 2,
      icon: FileText,
      title: "AI-Assisted Agreement",
      description: "Upload your work requirements to SecureServe. Our AI breaks down the scope into a detailed, step-by-step deliverable checklist. The freelancer reviews and agrees to provide the stated service, and an agreement is signed with clear release conditions.",
      color: "purple"
    },
    {
      id: 3,
      icon: Shield,
      title: "Escrow Deposit",
      description: "The client securely deposits the agreed-upon funds into SecureServe's RBI-compliant escrow account. Your money is held safely until the work is completed and verified according to the agreed terms.",
      color: "pink"
    },
    {
      id: 4,
      icon: CheckCircle,
      title: "AI-Verified Deliverables",
      description: "The freelancer completes the work and uploads it to SecureServe. Our AI system automatically verifies the deliverables against the previously agreed checklist. Both parties are instantly informed whether the work meets requirements.",
      color: "purple"
    },
    {
      id: 5,
      icon: Zap,
      title: "Release of Assets",
      description: "If the work meets all requirements, both parties sign off digitally. Money is instantly transferred to the freelancer's account while the client downloads the verified final work. If requirements aren't met, we initiate revisions or process a refund.",
      color: "cyan"
    },
    {
      id: 6,
      icon: Upload,
      title: "Transaction Completion",
      description: "SecureServe ensures all required legal documentation is completed and recorded with appropriate authorities. Your transaction is fully compliant, documented, and secure for future reference.",
      color: "pink"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      cyan: {
        chevron: 'text-cyan-400',
        border: 'border-cyan-500',
        shadow: 'shadow-cyan-500/20',
        iconBg: darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50',
        iconColor: darkMode ? 'text-cyan-400' : 'text-cyan-500',
        cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
        cardBorder: darkMode ? 'border-cyan-500/30' : 'border-cyan-200'
      },
      purple: {
        chevron: 'text-purple-400',
        border: 'border-purple-500',
        shadow: 'shadow-purple-500/20',
        iconBg: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
        iconColor: darkMode ? 'text-purple-400' : 'text-purple-500',
        cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
        cardBorder: darkMode ? 'border-purple-500/30' : 'border-purple-200'
      },
      pink: {
        chevron: 'text-pink-400',
        border: 'border-pink-500',
        shadow: 'shadow-pink-500/20',
        iconBg: darkMode ? 'bg-pink-900/20' : 'bg-pink-50',
        iconColor: darkMode ? 'text-pink-400' : 'text-pink-500',
        cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
        cardBorder: darkMode ? 'border-pink-500/30' : 'border-pink-200'
      }
    };
    return colorMap[color as keyof typeof colorMap];
  };

  // Intersection Observer for step animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepIndex = parseInt(entry.target.getAttribute('data-step-index') || '0');
            setVisibleSteps(prev => {
              if (!prev.includes(stepIndex)) {
                return [...prev, stepIndex].sort((a, b) => a - b);
              }
              return prev;
            });
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-50px 0px'
      }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      id="how-it-works" 
      className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            How SecureServe Works
          </h2>
          <p className={`text-lg sm:text-xl ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Simple, secure, and powered by AI to protect both freelancers and clients
          </p>
        </div>

        {/* Animated Timeline */}
        <div className="relative">
          {/* Central Vertical Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 opacity-30 h-full"></div>

          {/* Steps */}
          <div className="space-y-16">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const colorClasses = getColorClasses(step.color);
              const isVisible = visibleSteps.includes(index);
              const isRight = index % 2 === 0; // Even indices on right, odd on left
              
              return (
                <div
                  key={step.id}
                  ref={(el) => (stepRefs.current[index] = el)}
                  data-step-index={index}
                  className="relative"
                >
                  {/* Central Chevron */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 ${
                      isVisible 
                        ? `${colorClasses.cardBg} ${colorClasses.cardBorder} border-2 scale-110 ${colorClasses.shadow} shadow-xl` 
                        : 'bg-gray-600 border-2 border-gray-500 scale-90 opacity-50'
                    }`}>
                      <ChevronDown className={`h-6 w-6 transition-all duration-700 ${
                        isVisible ? colorClasses.chevron : 'text-gray-400'
                      } ${isVisible ? 'animate-bounce' : ''}`} />
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className={`flex items-center ${isRight ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-5/12 transition-all duration-1000 ${
                      isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : `opacity-0 transform ${isRight ? 'translate-x-8' : '-translate-x-8'} translate-y-4`
                    }`} style={{ transitionDelay: `${index * 200}ms` }}>
                      
                      {/* Step Card */}
                      <div className={`p-6 rounded-2xl transition-all duration-500 hover:scale-105 ${
                        colorClasses.cardBg
                      } ${colorClasses.cardBorder} border-2 ${colorClasses.shadow} shadow-lg hover:shadow-xl`}>
                        
                        {/* Step Number Badge */}
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-4 ${
                          colorClasses.iconBg
                        } ${colorClasses.iconColor}`}>
                          {step.id}
                        </div>

                        {/* Icon and Title */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className={`p-3 rounded-full ${colorClasses.iconBg}`}>
                            <IconComponent className={`h-6 w-6 ${colorClasses.iconColor}`} />
                          </div>
                          
                          <h3 className={`text-xl font-semibold ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {step.title}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className={`text-base leading-relaxed ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {step.description}
                        </p>

                        {/* Connecting Line to Center */}
                        <div className={`absolute top-1/2 ${
                          isRight ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                        } w-16 h-0.5 ${
                          isVisible ? colorClasses.border.replace('border-', 'bg-') : 'bg-gray-500'
                        } transition-all duration-700 opacity-30`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;