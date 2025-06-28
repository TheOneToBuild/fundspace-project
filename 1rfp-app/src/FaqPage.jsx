// src/FaqPage.jsx
import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from './components/Icons.jsx';

const faqData = {
  general: [
    {
      id: 'g1',
      question: 'What is 1RFP?',
      answer: '1RFP is a centralized grant discovery platform designed specifically for the San Francisco Bay Area. Our mission is to bridge the gap between funders and nonprofits by making it easier for organizations to find funding and for funders to discover innovative local projects.'
    },
    {
      id: 'g2',
      question: 'Who is behind 1RFP?',
      answer: '1RFP was founded by a team with direct experience from both sides of the funding table—former nonprofit directors and foundation program officers. We started 1RFP because we\'ve lived the challenges and knew there had to be a better way to connect purpose with progress in the Bay Area.'
    },
    {
      id: 'g3',
      question: 'What geographic area does 1RFP cover?',
      answer: 'We are exclusively focused on the 9-county San Francisco Bay Area: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma counties.'
    },
    {
      id: 'g4',
      question: 'Where does your grant data come from?',
      answer: 'Our data comes from a hybrid model. Our AI-powered engine constantly scans public sources like foundation websites and 990 tax forms. This is supplemented and verified by community-powered crowdsourcing, where users can suggest edits or submit new opportunities to ensure our data is as accurate and timely as possible.'
    },
    {
      id: 'g5',
      question: 'What are the "Spotlight" pages?',
      answer: 'Our Spotlight pages are deep dives into the funding landscape of specific counties or cities within the Bay Area. They provide data-driven insights, highlight key community organizations, and tell the story of the social impact sector in that specific region.'
    },
  ],
  forNonprofits: [
    {
      id: 'n1',
      question: 'Is 1RFP free for nonprofits to use?',
      answer: 'Yes. Our core search and discovery tools will always be free for registered 501(c)(3) nonprofit organizations. We are committed to empowering the sector, not creating new cost barriers.'
    },
    {
      id: 'n2',
      question: 'Do I need to create an account?',
      answer: 'You do not need an account to search our grant database. However, creating a free account will be required to access upcoming features like our grant tracking dashboard, saved searches, and application alerts.'
    },
    {
      id: 'n3',
      question: 'Can I track my grant applications on 1RFP?',
      answer: 'This is one of our most anticipated upcoming features! We are building a personalized dashboard where you can save grants, track deadlines, and manage your application pipeline all in one place. Stay tuned!'
    },
    {
      id: 'n4',
      question: 'How can our nonprofit get a profile on 1RFP?',
      answer: 'Nonprofit profiles are automatically generated from publicly available data. We are building tools that will allow organization leaders to claim and update their profiles directly. In the meantime, if you see an error, please let us know via our Contact Us page.'
    },
     {
      id: 'n5',
      question: 'I found an error or want to add a grant. What should I do?',
      answer: 'Fantastic! Community input is vital. Please use the "Submit a Grant" link in our site\'s navigation or send us details through our Contact Us page. Our team will review and update the listing promptly.'
    },
  ],
  forFunders: [
    {
      id: 'f1',
      question: 'What is your business model if the platform is free for nonprofits?',
      answer: 'Our core belief is that access to opportunity should be free for nonprofits. We plan to sustain the platform by offering premium, paid tools for funders, such as advanced portfolio analytics, streamlined grant management pipelines, and targeted outreach capabilities.'
    },
    {
      id: 'f2',
      question: 'What tools do you offer for funders?',
      answer: 'Currently, funders can use our platform to gain visibility into the nonprofit landscape. We are actively developing a suite of tools designed to help you manage your grantmaking portfolio, track your impact, and connect directly with potential grantees beyond the formal application process.'
    },
    {
      id: 'f3',
      question: 'I\'m a funder. How can I get my RFP listed?',
      answer: 'We\'d love to partner with you. Please reach out to us via our Contact Us page or use the "Submit a Grant" form. We can ensure your opportunities are accurately listed and visible to thousands of Bay Area nonprofits.'
    },
     {
      id: 'f4',
      question: 'How can we update our foundation\'s profile?',
      answer: 'Currently, profile updates can be requested through our Contact Us page. We are building out a dedicated funder portal that will allow you to manage your public-facing information directly.'
    },
  ]
};

const AccordionItem = ({ faq, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200">
      <button onClick={onClick} className="w-full flex justify-between items-center text-left py-4 px-1 group">
        <span className="text-lg font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{faq.question}</span>
        <ChevronDown className={`h-6 w-6 text-slate-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''} group-hover:text-blue-600`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-slate-600 pb-4 px-1 leading-relaxed font-sans">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};

const FaqCategory = ({ title, faqs }) => {
  const [openId, setOpenId] = useState(null);

  const handleToggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 border-l-4 border-blue-500 pl-4">{title}</h2>
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-slate-200">
          {faqs.map((faq) => (
            <AccordionItem 
              key={faq.id} 
              faq={faq} 
              isOpen={openId === faq.id}
              onClick={() => handleToggle(faq.id)}
            />
          ))}
      </div>
    </div>
  );
};


const FaqPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-sans">
            Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <FaqCategory title="General Questions" faqs={faqData.general} />
          <FaqCategory title="For Nonprofits" faqs={faqData.forNonprofits} />
          <FaqCategory title="For Funders" faqs={faqData.forFunders} />
        </div>
      </div>
    </div>
  );
};

export default FaqPage;