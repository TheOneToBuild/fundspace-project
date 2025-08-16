// src/ContactUsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient.js';
import { Mail, MessageSquare, User, Send, MapPin, Heart, Sparkles, UploadCloud, Loader, CheckCircle2, ExternalLink, Coffee } from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

const ContactUsPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  const [activeTab, setActiveTab] = useState('contact');
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // Grant submission state
  const [grantForm, setGrantForm] = useState({
    url: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prevState => ({ ...prevState, [name]: value }));
  };

  const handleGrantInputChange = (e) => {
    const { name, value } = e.target;
    setGrantForm(prevState => ({ ...prevState, [name]: value }));
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setMessage({ type: 'success', text: `Thank you, ${contactForm.name}! Your message has been sent. We'll get back to you soon.` });
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!isValidUrl(grantForm.url)) {
      setMessage({ type: 'error', text: 'Please enter a valid URL.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('grant_submissions')
        .insert([{ url: grantForm.url, notes: grantForm.notes }]);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Thank you! Your grant submission has been received and will be reviewed by our team.' });
      setGrantForm({ url: '', notes: '' });
    } catch (error) {
      console.error('Error submitting grant:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">Let's </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Connect
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Whether you have a question, want to suggest a grant, or are interested in partnering with us, we'd love to hear from you.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> We're here to help.</span>
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center bg-white rounded-2xl border border-slate-300 p-1 shadow-lg">
              <button 
                onClick={() => setActiveTab('contact')} 
                className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold ${
                  activeTab === 'contact' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={18}/>
                Send Message
              </button>
              <button 
                onClick={() => setActiveTab('submit')} 
                className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold ${
                  activeTab === 'submit' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UploadCloud size={18}/>
                Submit Grant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-white/60 shadow-2xl">
              {activeTab === 'contact' ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center border border-blue-200">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Send Us a Message</h2>
                      <p className="text-slate-600">We'd love to hear from you</p>
                    </div>
                  </div>

                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                        <input 
                          type="text" 
                          name="name" 
                          id="name" 
                          required 
                          value={contactForm.name} 
                          onChange={handleContactInputChange} 
                          className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm" 
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          name="email" 
                          id="email" 
                          required 
                          value={contactForm.email} 
                          onChange={handleContactInputChange} 
                          className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm" 
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                      <input 
                        type="text" 
                        name="subject" 
                        id="subject" 
                        required 
                        value={contactForm.subject} 
                        onChange={handleContactInputChange} 
                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm" 
                        placeholder="What's this about?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                      <textarea 
                        name="message" 
                        id="message" 
                        rows="6" 
                        required 
                        value={contactForm.message} 
                        onChange={handleContactInputChange} 
                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm resize-none" 
                        placeholder="Tell us what's on your mind..."
                      ></textarea>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="animate-spin h-5 w-5 mr-3" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={20} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                      <UploadCloud className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Submit a Grant</h2>
                      <p className="text-slate-600">Help us grow our database</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 mb-6">
                    <p className="text-emerald-800 text-sm leading-relaxed">
                      <strong>Found a grant we missed?</strong> Help us build the most comprehensive Bay Area grant database by submitting opportunities you've discovered. Our team will review and add them to our platform.
                    </p>
                  </div>

                  <form onSubmit={handleGrantSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="grant-url" className="block text-sm font-semibold text-slate-700 mb-2">
                        Grant URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="grant-url"
                        type="url"
                        name="url"
                        value={grantForm.url}
                        onChange={handleGrantInputChange}
                        placeholder="https://foundation.org/grants/apply"
                        required
                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="grant-notes" className="block text-sm font-semibold text-slate-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="grant-notes"
                        name="notes"
                        value={grantForm.notes}
                        onChange={handleGrantInputChange}
                        rows="4"
                        placeholder="Any helpful details? (e.g., 'Arts education grant', 'Rolling deadline', 'Maximum $50K')"
                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="animate-spin h-5 w-5 mr-3" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mr-2" size={20} />
                          Submit Grant
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Success/Error Messages */}
              {message.text && (
                <div className={`mt-6 p-4 rounded-2xl text-sm font-medium ${
                  message.type === 'success' 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <ExternalLink size={16} className="text-red-600" />
                    )}
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CONTACT INFO SIDEBAR */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white/60 shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Get In Touch
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Email Us</p>
                    <a href="mailto:contact@fundspace.ai" className="text-slate-600 hover:text-blue-600 transition-colors duration-300">contact@fundspace.ai</a>
                    <p className="text-xs text-slate-500 mt-1">We usually respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Social Media</p>
                    <p className="text-slate-600">@Fundspace_BayArea</p>
                    <p className="text-xs text-slate-500 mt-1">Follow us for updates</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Location</p>
                    <p className="text-slate-600">Bay Area, CA</p>
                    <p className="text-xs text-slate-500 mt-1">Remote-first team</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-3xl border border-blue-100 shadow-lg">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-500" />
                Quick Info
              </h4>
              <div className="space-y-3 text-sm text-slate-600">
                <p>💡 <strong>Response Time:</strong> Usually within 24 hours</p>
                <p>🌉 <strong>Focus:</strong> Bay Area nonprofits only</p>
                <p>🤝 <strong>Team:</strong> Small, passionate, community-driven</p>
                <p>📧 <strong>Best Contact:</strong> Email for detailed inquiries</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl text-white shadow-xl">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Ready to Explore?
              </h4>
              <p className="text-sm mb-4 opacity-90">
                While you're here, check out our grant database and see what funding opportunities await your organization.
              </p>
              <a 
                href="/grants" 
                className="inline-flex items-center justify-center px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                <ExternalLink className="mr-2" size={16} />
                Browse Grants
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUsPage;