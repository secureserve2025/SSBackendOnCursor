import React, { useState, useEffect, useRef } from 'react';
import { FileText, Shield, Upload, CheckCircle, Zap, Users } from 'lucide-react';

interface HowItWorksSectionProps {
  darkMode: boolean;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ darkMode }) => {

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

  return (
    <section 
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
          <div className="space-y-16">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div
                  key={step.id}
                  className={`relative flex items-center ${
                    isEven ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Step Content Card */}
                  <div className={`w-full max-w-md p-6 rounded-2xl ${
                    darkMode 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-white border border-gray-200'
                  } shadow-lg ${isEven ? 'mr-auto' : 'ml-auto'}`}>
                    
                    {/* Step Number and Icon */}
                    <div className={`flex items-center mb-4 ${
                      isEven ? 'justify-start' : 'justify-end'
                    }`}>
                      <div className={`flex items-center space-x-3 ${
                        isEven ? 'flex-row' : 'flex-row-reverse space-x-reverse'
                      }`}>
                        {/* Step Number Circle */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-purple-600' :
                          index === 2 ? 'bg-green-600' :
                          index === 3 ? 'bg-cyan-600' :
                          index === 4 ? 'bg-yellow-600' :
                          'bg-pink-600'
                        }`}>
                          #{step.id}
                        </div>
                        
                        {/* Icon */}
                        <div className={`p-3 rounded-full ${
                          darkMode ? 'bg-gray-600' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-semibold mb-3 ${
                      isEven ? 'text-left' : 'text-right'
                    } ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-base leading-relaxed ${
                      isEven ? 'text-left' : 'text-right'
                    } ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Connecting Line (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-16 ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`} style={{ zIndex: -1 }}></div>
                  )}
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