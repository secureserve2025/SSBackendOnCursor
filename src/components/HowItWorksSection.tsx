import React, { useState, useEffect, useRef } from 'react';
import { FileText, Shield, Upload, CheckCircle, Zap, Users, ChevronDown } from 'lucide-react';

interface HowItWorksSectionProps {
  darkMode: boolean;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ darkMode }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>(new Array(6).fill(false));
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    {
      id: 1,
      icon: Users,
      title: "Escrow Setup",
      description: "Both client and freelancer register with SecureServe. We verify your identity using Aadhar card, PAN or TAN number, and bank/UPI account details as per RBI regulations. Sign our service agreement to get started with secure escrow protection."
    },
    {
      id: 2,
      icon: FileText,
      title: "AI-Assisted Agreement",
      description: "Upload your work requirements to SecureServe. Our AI breaks down the scope into a detailed, step-by-step deliverable checklist. The freelancer reviews and agrees to provide the stated service, and an agreement is signed with clear release conditions."
    },
    {
      id: 3,
      icon: Shield,
      title: "Escrow Deposit",
      description: "The client securely deposits the agreed-upon funds into SecureServe's RBI-compliant escrow account. Your money is held safely until the work is completed and verified according to the agreed terms."
    },
    {
      id: 4,
      icon: CheckCircle,
      title: "AI-Verified Deliverables",
      description: "The freelancer completes the work and uploads it to SecureServe. Our AI system automatically verifies the deliverables against the previously agreed checklist. Both parties are instantly informed whether the work meets requirements."
    },
    {
      id: 5,
      icon: Zap,
      title: "Release of Assets",
      description: "If the work meets all requirements, both parties sign off digitally. Money is instantly transferred to the freelancer's account while the client downloads the verified final work. If requirements aren't met, we initiate revisions or process a refund."
    },
    {
      id: 6,
      icon: Upload,
      title: "Transaction Completion",
      description: "SecureServe ensures all required legal documentation is completed and recorded with appropriate authorities. Your transaction is fully compliant, documented, and secure for future reference."
    }
  ];

  // Enhanced scroll-based highlighting with visibility detection
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const viewportCenter = scrollY + windowHeight / 2;

      // Check if section is in view
      if (scrollY + windowHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
        // Check visibility for each step
        const newVisibleSteps = [...visibleSteps];
        let newActiveStep = activeStep;

        stepRefs.current.forEach((stepRef, index) => {
          if (stepRef) {
            const stepTop = stepRef.offsetTop;
            const stepBottom = stepTop + stepRef.offsetHeight;
            const stepCenter = stepTop + stepRef.offsetHeight / 2;

            // Mark step as visible if it's in viewport
            if (stepTop < scrollY + windowHeight && stepBottom > scrollY) {
              newVisibleSteps[index] = true;
            }

            // Set active step based on which step's center is closest to viewport center
            if (Math.abs(stepCenter - viewportCenter) < 200) {
              newActiveStep = index;
            }
          }
        });

        setVisibleSteps(newVisibleSteps);
        if (newActiveStep !== activeStep) {
          setActiveStep(newActiveStep);
        }
      }
    };

    // Initial visibility check
    setTimeout(handleScroll, 100);
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeStep, visibleSteps, steps.length]);

  return (
    <section 
      ref={sectionRef}
      id="how-it-works" 
      className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}
    >
      <div className="max-w-4xl mx-auto">
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

        {/* Vertical Timeline */}
        <div className="relative">
          {/* Animated Progress Line */}
          <div className="absolute left-6 top-0 w-1 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent h-full">
            <div 
              className="w-full bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
              style={{
                height: `${((activeStep + 1) / steps.length) * 100}%`,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const isVisible = visibleSteps[index];
              
              return (
                <div
                  key={step.id}
                  ref={(el) => (stepRefs.current[index] = el)}
                  className={`relative flex items-start transition-all duration-1000 ease-out ${
                    isActive ? 'transform scale-105 z-10' : ''
                  } ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transitionDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Step Chevron Arrow */}
                  <div className="relative z-20 flex-shrink-0 mb-4">
                    <ChevronDown className={`h-12 w-12 transition-all duration-500 ${
                      isActive 
                        ? `scale-110 ${
                            index === 0 ? 'text-cyan-400' :
                            index === 1 ? 'text-purple-500' :
                            index === 2 ? 'text-purple-500' :
                            index === 3 ? 'text-gray-400' :
                            index === 4 ? 'text-cyan-400' :
                            'text-pink-500'
                          }` 
                        : isCompleted
                          ? `opacity-80 ${
                            index === 0 ? 'text-cyan-400' :
                            index === 1 ? 'text-purple-500' :
                            index === 2 ? 'text-purple-500' :
                            index === 3 ? 'text-gray-400' :
                            index === 4 ? 'text-cyan-400' :
                            'text-pink-500'
                          }`
                          : `opacity-50 text-gray-400`
                    }`} />
                    
                    {/* Pulsing Ring Animation for Active Step */}
                    {isActive && (
                      <div className={`absolute inset-0 rounded-full animate-ping ${
                        index === 0 || index === 4 ? 'bg-cyan-400/30' :
                        index === 1 || index === 2 ? 'bg-purple-500/30' :
                        'bg-pink-500/30'
                      }`} />
                    )}
                  </div>

                  {/* Step Content Card */}
                  <div className={`ml-8 flex-1 p-6 rounded-2xl transition-all duration-500 ${
                    isActive 
                      ? darkMode
                        ? `bg-gray-700 border-2 ${
                            index === 0 ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' :
                            index === 1 ? 'border-purple-500 shadow-xl shadow-purple-500/20' :
                            index === 2 ? 'border-purple-500 shadow-xl shadow-purple-500/20' :
                            index === 3 ? 'border-gray-500 shadow-xl shadow-gray-500/20' :
                            index === 4 ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' :
                            'border-pink-500 shadow-xl shadow-pink-500/20'
                          }` 
                        : `bg-white border-2 ${
                            index === 0 ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' :
                            index === 1 ? 'border-purple-500 shadow-xl shadow-purple-500/20' :
                            index === 2 ? 'border-purple-500 shadow-xl shadow-purple-500/20' :
                            index === 3 ? 'border-gray-500 shadow-xl shadow-gray-500/20' :
                            index === 4 ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' :
                            'border-pink-500 shadow-xl shadow-pink-500/20'
                          }`
                      : darkMode 
                        ? `bg-gray-700 border ${
                            index === 0 ? 'border-cyan-500/30 hover:border-cyan-500/50' :
                            index === 1 ? 'border-purple-500/30 hover:border-purple-500/50' :
                            index === 2 ? 'border-purple-500/30 hover:border-purple-500/50' :
                            index === 3 ? 'border-gray-500/30 hover:border-gray-500/50' :
                            index === 4 ? 'border-cyan-500/30 hover:border-cyan-500/50' :
                            'border-pink-500/30 hover:border-pink-500/50'
                          }` 
                        : 'bg-white border border-gray-200 hover:border-gray-300'
                  } shadow-lg hover:shadow-xl overflow-hidden`}>
                    
                    {/* Icon and Title */}
                    <div className={`flex items-center space-x-4 mb-3 transition-all duration-500 ${
                      isActive ? 'transform translate-x-2' : ''
                    }`}>
                      <div className={`p-3 rounded-full transition-all duration-300 ${
                        isActive 
                          ? darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`h-6 w-6 transition-colors duration-300 ${
                          isActive 
                            ? darkMode ? 'text-purple-400' : 'text-purple-600'
                            : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                        isActive 
                          ? darkMode ? 'text-white' : 'text-gray-900'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className={`text-base leading-relaxed transition-all duration-500 ${
                      isActive 
                        ? darkMode ? 'text-gray-200 transform translate-x-2' : 'text-gray-600 transform translate-x-2'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>

                    {/* Enhanced Active Step Effects */}
                    {isActive && (
                      <>
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 rounded-2xl opacity-5 pointer-events-none ${
                          index === 0 ? 'bg-cyan-500' :
                          index === 1 ? 'bg-purple-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-gray-500' :
                          index === 4 ? 'bg-cyan-500' :
                          'bg-pink-500'
                        }`}></div>
                        
                        {/* Animated Border */}
                        <div className={`absolute inset-0 rounded-2xl pointer-events-none ${
                          index === 0 ? 'bg-gradient-to-r from-cyan-500/20 via-transparent to-cyan-500/20' :
                          index === 1 ? 'bg-gradient-to-r from-purple-500/20 via-transparent to-purple-500/20' :
                          index === 2 ? 'bg-gradient-to-r from-purple-500/20 via-transparent to-purple-500/20' :
                          index === 3 ? 'bg-gradient-to-r from-gray-500/20 via-transparent to-gray-500/20' :
                          index === 4 ? 'bg-gradient-to-r from-cyan-500/20 via-transparent to-cyan-500/20' :
                          'bg-gradient-to-r from-pink-500/20 via-transparent to-pink-500/20'
                        } animate-pulse`}></div>
                      </>
                    )}
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