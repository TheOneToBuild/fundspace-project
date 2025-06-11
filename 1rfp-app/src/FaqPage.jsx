// src/FaqPage.jsx
import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from './components/Icons.jsx';

const faqData = [
  {
    question: 'What is 1RFP?',
    answer: '1RFP is a centralized grant discovery platform designed specifically for the San Francisco Bay Area. Our mission is to bridge the gap between funders and nonprofits by making it easier for organizations to find funding and for funders to discover innovative local projects.'
  },
  {
    question: 'Is 1RFP free for nonprofits to use?',
    answer: 'Yes. Our core search and discovery tools will always be free for registered 501(c)(3) nonprofit organizations. We are committed to empowering the sector, not creating new cost barriers.'
  },
  {
    question: 'Where does your grant data come from?',
    answer: 'Our data comes from a hybrid model. Our AI-powered engine constantly scans public sources like foundation websites and 990 tax forms. This is supplemented by community-powered crowdsourcing, where users can suggest edits or submit new opportunities to ensure our data is as accurate and timely as possible.'
  },
  {
    question: 'What geographic area does 1RFP cover?',
    answer: 'We are exclusively focused on the 9-county San Francisco Bay Area: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma counties.'
  },
  {
    question: 'I found an error or want to add a grant. What should I do?',
    answer: 'That\'s fantastic! Community input is vital to our platform. Please use our Contact Us page to send us the details, and our team will review and update the listing.'
  },
  {
    question: 'I\'m a funder. How can I get my RFP listed?',
    answer: 'We\'d love to partner with you. Please reach out to us via our Contact Us page. We can ensure your opportunities are accurately listed and visible to thousands of Bay Area nonprofits.'
  }
];

const AccordionItem = ({ faq, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200">
      <button onClick={onClick} className="w-full flex justify-between items-center text-left py-4 px-1">
        <span className="text-lg font-medium text-slate-800">{faq.question}</span>
        <ChevronDown className={`h-6 w-6 text-slate-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-slate-600 pb-4 px-1 leading-relaxed">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-xl border border-slate-200">
          {faqData.map((faq, index) => (
            <AccordionItem 
              key={index} 
              faq={faq} 
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqPage;