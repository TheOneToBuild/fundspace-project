// src/ContactUsPage.jsx
import React, { useState } from 'react';
import { Mail, MessageSquare, User } from './components/Icons.jsx';
// MODIFIED: Import the PublicPageLayout component
import PublicPageLayout from './components/PublicPageLayout.jsx';

const ContactUsPage = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For demonstration purposes, we'll just show an alert.
    // In a real application, this would send the data to a server or email service.
    alert(`Thank you, ${formState.name}! Your message has been sent.`);
    // Reset form
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  return (
    // MODIFIED: Wrap the component in PublicPageLayout and provide the gradient class
    <PublicPageLayout bgColor="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* MODIFIED: Removed the hardcoded background class from this div */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* --- Header --- */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-base font-semibold text-blue-600 tracking-wider uppercase">Get In Touch</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
              We'd Love to Hear From You
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Whether you have a question, a suggestion, or want to partner with us, we're ready to listen.
            </p>
          </div>

          {/* --- Main Content: Form and Info --- */}
          <div className="max-w-4xl mx-auto bg-white p-8 md:p-10 rounded-xl shadow-2xl border border-slate-200">
            <div className="grid md:grid-cols-2 gap-10">
              {/* --- Contact Form --- */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="mt-1">
                    <input type="text" name="name" id="name" required value={formState.name} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                  <div className="mt-1">
                    <input type="email" name="email" id="email" required value={formState.email} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
                  <div className="mt-1">
                    <input type="text" name="subject" id="subject" required value={formState.subject} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700">Message</label>
                  <div className="mt-1">
                    <textarea name="message" id="message" rows="4" required value={formState.message} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                  </div>
                </div>
                <div>
                  <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md">
                    Send Message
                  </button>
                </div>
              </form>

              {/* --- Contact Info --- */}
              <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Other Ways to Connect</h3>
                  <p className="text-slate-600 mb-6">
                      We're a small, remote-first team based throughout the Bay Area. The best way to reach us is by email.
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Mail className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                              <p className="text-base font-medium text-slate-800">General Inquiries</p>
                              <a href="mailto:contact@1rfp.com" className="text-slate-600 hover:text-blue-600">contact@1rfp.com</a>
                          </div>
                      </div>
                      <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                              <p className="text-base font-medium text-slate-800">Follow Us</p>
                              <p className="text-slate-600">@1RFP_BayArea</p>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default ContactUsPage;