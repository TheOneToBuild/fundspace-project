// src/FaqPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ChevronDown, HelpCircle, Users, Shield, Search, MessageSquare, Sparkles, ArrowRight, CheckCircle2 } from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

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
    <div className="border-b border-slate-100 last:border-b-0">
      <button 
        onClick={onClick} 
        className="w-full flex justify-between items-center text-left py-6 px-2 group hover:bg-slate-50/50 rounded-lg transition-all duration-300"
      >
        <span className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors pr-4">
          {faq.question}
        </span>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-blue-100 text-blue-600 rotate-180' 
            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
        }`}>
          <ChevronDown size={16} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isOpen ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0'
      }`}>
        <div className="text-slate-600 px-2 leading-relaxed">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};

const FaqCategory = ({ title, faqs, icon, color }) => {
  const [openId, setOpenId] = useState(null);

  const handleToggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const colorClasses = {
    blue: 'from-blue-100 to-indigo-100 border-blue-200 text-blue-700',
    purple: 'from-purple-100 to-pink-100 border-purple-200 text-purple-700',
    emerald: 'from-emerald-100 to-teal-100 border-emerald-200 text-emerald-700'
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colorClasses[color]} border shadow-lg`}>
          {icon}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{title}</h2>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-white/60 shadow-2xl">
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
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO SECTION */}
      <section className="text-center mb-16 relative">
        {/* Magical background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-rose-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center border border-blue-200 shadow-lg">
            <HelpCircle className="h-10 w-10 text-blue-600" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">Questions? </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              We've Got Answers.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about 1RFP, from getting started to maximizing your impact.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Can't find what you're looking for? Just ask.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <MessageSquare className="mr-2" size={18} />
              Ask a Question
            </a>
            <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full text-purple-700 bg-purple-100 hover:bg-purple-200/70 transition-colors duration-300">
              <Search className="mr-2" size={18} />
              Start Exploring
            </a>
          </div>
        </div>
      </section>

      {/* FAQ SECTIONS */}
      <section className="max-w-5xl mx-auto">
        <FaqCategory 
          title="General Questions" 
          faqs={faqData.general} 
          icon={<HelpCircle size={24} />}
          color="blue"
        />
        
        <FaqCategory 
          title="For Nonprofits" 
          faqs={faqData.forNonprofits} 
          icon={<Users size={24} />}
          color="purple"
        />
        
        <FaqCategory 
          title="For Funders" 
          faqs={faqData.forFunders} 
          icon={<Shield size={24} />}
          color="emerald"
        />
      </section>

      {/* BOTTOM CTA SECTION */}
      <section className="mt-20">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Still Have Questions?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Our team is here to help. Whether you're a nonprofit looking for funding or a funder wanting to maximize your impact, we'd love to connect.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <MessageSquare className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Get in Touch</h3>
              <p className="text-sm opacity-80 mb-4">Send us a message and we'll get back to you within 24 hours.</p>
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                Contact Us
              </a>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <CheckCircle2 className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Submit a Grant</h3>
              <p className="text-sm opacity-80 mb-4">Help us build a comprehensive database of Bay Area funding.</p>
              <a 
                href="/submit-grant" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                Submit Grant
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;