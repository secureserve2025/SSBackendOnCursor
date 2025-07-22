import React, { useState, useEffect, useRef } from 'react';
import { FileText, Shield, Upload, CheckCircle, Zap, Users, ChevronDown } from 'lucide-react';

interface HowItWorksSectionProps {
  darkMode: boolean;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ darkMode }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Color schemes for each step
  const stepColors = [
    { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-white', shadow: 'shadow-blue-500/25', chevron: 'text-blue-400', glow: 'shadow-blue-500/20' }, // Step 1 - Setup
    { bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/25', chevron: 'text-purple-400', glow: 'shadow-purple-500/20' }, // Step 2 - Agreement
    { bg: 'bg-green-600', border: 'border-green-500', text: 'text-white', shadow: 'shadow-green-500/25', chevron: 'text-green-400', glow: 'shadow-green-500/20' }, // Step 3 - Deposit
    { bg: 'bg-cyan-600', border: 'border-cyan-500', text: 'text-white', shadow: 'shadow-cyan-500/25', chevron: 'text-cyan-400', glow: 'shadow-cyan-500/20' }, // Step 4 - Verification
    { bg: 'bg-yellow-600', border: 'border-yellow-500', text: 'text-white', shadow: 'shadow-yellow-500/25', chevron: 'text-yellow-400', glow: 'shadow-yellow-500/20' }, // Step 5 - Release
    { bg: 'bg-pink-600', border: 'border-pink-500', text: 'text-white', shadow: 'shadow-pink-500/25', chevron: 'text-pink-400', glow: 'shadow-pink-500/20' }, // Step 6 - Completion
  ];

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

  // Progressive reveal animation
  useEffect(() => {
    const revealTimer = setInterval(() => {
      setVisibleSteps(prev => {
        if (prev.length < steps.length) {
          return [...prev, prev.length];
        }
        clearInterval(revealTimer);
        return prev;
      });
    }, 800); // Reveal each step every 800ms

    return () => clearInterval(revealTimer);
  }, [steps.length]);
  // Scroll-based highlighting
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Check if section is in view
      if (scrollY + windowHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
        // Calculate which step should be active based on scroll position
        const relativeScroll = scrollY + windowHeight - sectionTop;
        const stepHeight = sectionHeight / steps.length;
        const newActiveStep = Math.min(
          Math.floor(relativeScroll / stepHeight),
          steps.length - 1
        );
        
        if (newActiveStep >= 0 && newActiveStep !== activeStep) {
          setActiveStep(newActiveStep);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeStep, steps.length]);

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
          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const isVisible = visibleSteps.includes(index);
              
              return (
                <React.Fragment key={step.id}>
                  {/* Step Content */}
                  <div
                    ref={(el) => (stepRefs.current[index] = el)}
                    className={`relative flex items-start transition-all duration-700 ${
                      isActive ? 'transform scale-105' : ''
                    } ${
                      isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-8'
                    }`}
                    style={{
                      transitionDelay: `${index * 0.1}s`
                    }}
                  >
                    {/* Step Content Card */}
                    <div className={`flex-1 p-6 rounded-2xl transition-all duration-700 ${
                      isVisible 
                        ? 'opacity-100 transform translate-x-0' 
                        : 'opacity-0 transform translate-x-8'
                    } ${
                      isActive 
                        ? darkMode
                          ? `bg-gray-700 border-2 shadow-2xl ${stepColors[index].border} shadow-xl ${stepColors[index].glow}` 
                          : `bg-white border-2 shadow-2xl ${stepColors[index].border} shadow-xl ${stepColors[index].glow}`
                        : darkMode 
                          ? `bg-gray-700 border ${stepColors[index].border.replace('border-', 'border-').replace('-500', '-500/30')} hover:${stepColors[index].border.replace('border-', 'border-').replace('-500', '-500/50')}` 
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                    } shadow-lg hover:shadow-xl`}
                    style={{
                      transitionDelay: `${index * 0.1 + 0.4}s`
                    }}>
                      
                      {/* Icon and Title */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`p-3 rounded-full transition-all duration-500 ${
                          isActive 
                            ? darkMode ? `bg-${stepColors[index].bg.replace('bg-', '').replace('-600', '-900')}/30` : `bg-${stepColors[index].bg.replace('bg-', '').replace('-600', '-100')}`
                            : darkMode ? `bg-${stepColors[index].bg.replace('bg-', '').replace('-600', '-900')}/20` : `bg-${stepColors[index].bg.replace('bg-', '').replace('-600', '-50')}`
                        }`}>
                          <IconComponent className={`h-6 w-6 transition-all duration-500 ${
                            isActive 
                              ? darkMode ? `text-${stepColors[index].bg.replace('bg-', '').replace('-600', '-400')} scale-110` : `text-${stepColors[index].bg.replace('bg-', '').replace('-600', '-600')} scale-110`
                              : darkMode ? `text-${stepColors[index].bg.replace('bg-', '').replace('-600', '-400')}` : `text-${stepColors[index].bg.replace('bg-', '').replace('-600', '-500')}`
                          }`} />
                        </div>
                        
                        <h3 className={`text-xl font-semibold transition-colors duration-500 ${
                          isActive 
                            ? darkMode ? 'text-white' : 'text-gray-900'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {step.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className={`text-base leading-relaxed transition-colors duration-500 ${
                        isActive 
                          ? darkMode ? 'text-gray-200' : 'text-gray-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>

                      {/* Active Step Glow Effect */}
                      {isActive && (
                        <div className={`absolute inset-0 rounded-2xl opacity-10 pointer-events-none animate-pulse ${stepColors[index].bg}`}></div>
                      )}
                    </div>
                  </div>

                  {/* Triangular Arrow Between Steps (except after last step) */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center my-8">
                      <div 
                        className={`w-0 h-0 transition-all duration-700 ${
                          visibleSteps.includes(index) 
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-4'
                        }`}
                        style={{
                          borderLeft: '20px solid transparent',
                          borderRight: '20px solid transparent',
                          borderTop: `24px solid ${
                            index === activeStep 
                              ? stepColors[index].bg.replace('bg-', '#').replace('-600', '') === '#blue' ? '#2563eb' :
                                stepColors[index].bg.replace('bg-', '#').replace('-600', '') === '#purple' ? '#9333ea' :
                                stepColors[index].bg.replace('bg-', '#').replace('-600', '') === '#green' ? '#16a34a' :
                                stepColors[index].bg.replace('bg-', '#').replace('-600', '') === '#cyan' ? '#0891b2' :
                                stepColors[index].bg.replace('bg-', '#').replace('-600', '') === '#yellow' ? '#ca8a04' :
                                '#db2777'
                              : '#6b7280'
                          }`,
                          transitionDelay: `${index * 0.1 + 0.6}s`,
                          filter: index === activeStep ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;