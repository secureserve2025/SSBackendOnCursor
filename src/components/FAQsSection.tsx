import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQsSectionProps {
  darkMode: boolean;
}

const FAQsSection: React.FC<FAQsSectionProps> = ({ darkMode }) => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does the AI verify if work meets requirements?",
      answer: "Our advanced AI analyzes deliverables against agreed specification checklist. Consider video content for example. It checks resolution, color balance, aspect ratio, lighting quality, audio bitrate, and so on. The system creates a match score where ≥85% triggers automatic approval and payment release, 60-84% flags discrepancies for quick manual review with AI-generated evidence (timestamps, frame samples, audio clips), and <60% initiates automatic refunds. Clients receive a detailed \"Delivery Report\" showing which requirements passed, AI confidence scores, and explanatory notes, ensuring complete transparency and eliminating subjective disputes through objective and technical verification."
    },
    {
      question: "What happens if the AI verification fails?",
      answer: "If the AI identifies issues with your deliverable, you'll receive detailed feedback explaining exactly what needs to be corrected. The system highlights specific areas that don't meet requirements and provides suggestions for improvement. You can then revise your work and resubmit for verification. The client is notified of the revision process, and funds remain securely held in escrow until the work meets all specified requirements. There's no penalty for revisions - we encourage quality work."
    },
    {
      question: "How secure is the escrow system?",
      answer: "Our escrow system uses bank-level security with 256-bit SSL encryption and is compliant with Indian financial regulations. Funds are held in segregated accounts with partner banks, ensuring complete separation from our operational funds. We use multi-factor authentication, fraud detection systems, and regular security audits. Your money is protected by insurance coverage and regulatory oversight. Neither party can access the funds until verification is complete and both parties agree to release."
    },
    {
      question: "What types of projects can use SecureServe?",
      answer: "Our MVP currently focuses on video production projects including promotional videos, corporate training content, social media videos, product demonstrations, educational content, event recordings, and animation. Video projects are ideal for our AI verification system because they involve complex technical specifications (resolution, frame rates, audio quality, color grading) that can be objectively measured. While we start with video deliverables due to their clear technical requirements, our AI-powered verification system is designed to expand to other digital creative services like graphic design, web development, digital marketing assets, audio production, and photography as we scale our platform."
    },
    {
      question: "How much does SecureServe charge?",
      answer: "SecureServe charges a competitive 7% service fee split between both parties (3.5% each for freelancer and client). This covers AI verification, secure escrow services, dispute resolution, and platform maintenance. There are no hidden fees, setup costs, or monthly subscriptions. You only pay when you successfully complete a project. Compared to traditional payment disputes and chargebacks, our fee structure saves both time and money while providing guaranteed payment security."
    },
    {
      question: "What if I disagree with the AI verification?",
      answer: "If you believe the AI verification is incorrect, you can request a human review within 24 hours. Our expert team will manually assess your work against the original requirements. If the AI made an error, we'll immediately approve your work and release payment. If the AI was correct, we'll provide detailed guidance on what needs to be fixed. We also continuously improve our AI based on feedback to reduce future discrepancies. Your satisfaction and fair treatment are our priorities."
    },
    {
      question: "How long does verification take?",
      answer: "AI verification typically completes within 2-5 minutes for most digital deliverables. Complex projects like large websites or extensive code repositories may take up to 15 minutes. The system processes files in real-time and provides instant feedback. If human review is requested, it takes 2-4 hours during business hours. Once verification passes, payment is released immediately to your account. We prioritize speed without compromising accuracy."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section id="faqs" className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Everything you need to know
          </h2>
          <p className={`text-lg ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Got questions? We've got answers. Learn more about how SecureServe works and how it can benefit you.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-lg border transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-800 border-purple-500/30 hover:border-purple-500/50' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } shadow-sm hover:shadow-md`}
            >
              {/* Question Button */}
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors duration-200 ${
                  darkMode 
                    ? 'text-white hover:text-cyan-400' 
                    : 'text-gray-900 hover:text-purple-600'
                }`}
              >
                <span className="font-medium text-base sm:text-lg pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openFAQ === index ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Answer Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className={`px-6 pb-4 text-sm sm:text-base leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQsSection;