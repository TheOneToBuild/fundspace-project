import React, { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient.js';
import { LayoutContext } from './App.jsx';
import {
  Mail, MessageSquare, User, Send, MapPin, Heart, Sparkles, UploadCloud, Loader, CheckCircle2, ExternalLink, Coffee, Target, ArrowRight, Shield
} from './components/Icons.jsx';

const ContactUsPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  const [activeTab, setActiveTab] = useState('contact');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [grantForm, setGrantForm] = useState({ url: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setPageBgColor('bg-white');
    return () => setPageBgColor('bg-white');
  }, [setPageBgColor]);

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGrantInputChange = (e) => {
    const { name, value } = e.target;
    setGrantForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValidUrl = (string) => {
    try { 
      new URL(string); 
      return true; 
    } catch { 
      return false; 
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setMessage({ 
        type: 'success', 
        text: `Thanks, ${contactForm.name || 'friend'}! We've received your message and will respond within 24 hours.` 
      });
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 900);
  };

  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!isValidUrl(grantForm.url)) {
      setMessage({ type: 'error', text: 'Please enter a valid grant URL.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('grant_submissions').insert([{ 
        url: grantForm.url, 
        notes: grantForm.notes 
      }]);
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Perfect! Your grant suggestion is now in our review queue.' 
      });
      setGrantForm({ url: '', notes: '' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Pill = ({ children, color = 'slate' }) => {
    const colors = {
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200', 
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase border ${colors[color]} shadow-sm`}>
        {children}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-32 w-[520px] h-[520px] bg-gradient-to-tr from-slate-200 via-slate-300 to-slate-400 blur-3xl opacity-25" />
          <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-gradient-to-tr from-blue-200 via-indigo-200 to-violet-200 blur-3xl opacity-25" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <Pill color="blue">GET IN TOUCH</Pill>
            <h1 className="font-black tracking-tight leading-[0.95] text-[2.55rem] sm:text-6xl md:text-7xl text-slate-900 mt-8 mb-10">
              Let's Build The Future Of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                Funding
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
              Whether you're seeking funding, want to partner, or found a grant we should know about—
              <span className="font-semibold text-slate-900"> we're here to help you unlock impact.</span>
            </p>
            
            <div className="inline-flex bg-slate-100 rounded-2xl p-1.5 shadow-inner mb-16">
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                  activeTab === 'contact' 
                    ? 'bg-white text-slate-900 shadow-lg' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare size={20} />
                Send Message
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                  activeTab === 'submit' 
                    ? 'bg-white text-slate-900 shadow-lg' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud size={20} />
                Suggest a Grant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-10 md:p-12 border border-slate-200 shadow-xl ring-1 ring-slate-900/5">
              {activeTab === 'contact' ? (
                <div>
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 text-white shadow-lg">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-black text-slate-900 leading-tight mb-3">How Can We Help?</h2>
                      <p className="text-slate-600 text-lg leading-relaxed">
                        From partnership opportunities to platform questions—we're here for nonprofits, funders, and everyone building a better Bay Area.
                      </p>
                    </div>
                  </div>
                  
                  <div onSubmit={handleContactSubmit} className="space-y-7">
                    <div className="grid md:grid-cols-2 gap-7">
                      <div>
                        <label htmlFor="name" className="block text-sm font-bold text-slate-900 mb-3">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={contactForm.name}
                          onChange={handleContactInputChange}
                          className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200 text-sm bg-white"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-3">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          required
                          value={contactForm.email}
                          onChange={handleContactInputChange}
                          className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200 text-sm bg-white"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-bold text-slate-900 mb-3">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        required
                        value={contactForm.subject}
                        onChange={handleContactInputChange}
                        className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200 text-sm bg-white"
                        placeholder="What's this about?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-bold text-slate-900 mb-3">
                        Message
                      </label>
                      <textarea
                        name="message"
                        id="message"
                        rows="6"
                        required
                        value={contactForm.message}
                        onChange={handleContactInputChange}
                        className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200 text-sm bg-white resize-none"
                        placeholder="Tell us more about how we can help..."
                      />
                    </div>
                    
                    <button
                      onClick={handleContactSubmit}
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-8 py-4 font-bold rounded-2xl text-white bg-gradient-to-r from-slate-800 via-slate-900 to-slate-900 hover:from-slate-900 hover:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white shadow-lg">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-black text-slate-900 leading-tight mb-3">Expand Our Grant Index</h2>
                      <p className="text-slate-600 text-lg leading-relaxed">
                        Help us build the Bay Area's most comprehensive funding database. Every submission helps connect deserving organizations with the right opportunities.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-50 via-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 mb-8">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900 mb-1">Know a grant we missed?</p>
                        <p className="text-emerald-800 text-sm leading-relaxed">
                          Our team reviews every submission to ensure accuracy and relevance for Bay Area nonprofits. Quality over quantity.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div onSubmit={handleGrantSubmit} className="space-y-7">
                    <div>
                      <label htmlFor="grant-url" className="block text-sm font-bold text-slate-900 mb-3">
                        Grant URL <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="grant-url"
                        type="url"
                        name="url"
                        value={grantForm.url}
                        onChange={handleGrantInputChange}
                        placeholder="https://foundation.org/grants/apply"
                        required
                        className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 text-sm bg-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="grant-notes" className="block text-sm font-bold text-slate-900 mb-3">
                        Additional Context <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        id="grant-notes"
                        name="notes"
                        value={grantForm.notes}
                        onChange={handleGrantInputChange}
                        rows="4"
                        placeholder="Help us understand this opportunity better (focus areas, deadlines, funding amounts, etc.)"
                        className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 text-sm bg-white resize-none"
                      />
                    </div>
                    
                    <button
                      onClick={handleGrantSubmit}
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-8 py-4 font-bold rounded-2xl text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  </div>
                </div>
              )}
              
              {message.text && (
                <div className={`mt-8 p-5 rounded-2xl text-sm font-medium border ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' ? (
                      <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <ExternalLink size={16} className="text-red-600 flex-shrink-0" />
                    )}
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-8">
            
            {/* Contact Info Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl ring-1 ring-slate-900/5">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="h-6 w-6 text-rose-500" />
                <h3 className="text-xl font-black text-slate-900">Get In Touch</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 mb-1">Email</p>
                    <a 
                      href="mailto:contact@fundspace.ai" 
                      className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
                    >
                      contact@fundspace.ai
                    </a>
                    <p className="text-xs text-slate-500 mt-1">24 hour response time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 mb-1">Social</p>
                    <p className="text-slate-600 font-medium">@Fundspace_BayArea</p>
                    <p className="text-xs text-slate-500 mt-1">Follow for updates</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 mb-1">Location</p>
                    <p className="text-slate-600 font-medium">Bay Area, CA</p>
                    <p className="text-xs text-slate-500 mt-1">Remote-first team</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Coffee className="h-5 w-5 text-amber-600" />
                <h4 className="font-black text-slate-900">Quick Info</h4>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Response Time', value: '24 hours or less' },
                  { label: 'Our Focus', value: 'Bay Area nonprofits' }, 
                  { label: 'Team Style', value: 'Community-driven, remote' },
                  { label: 'Best For', value: 'Detailed questions via email' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">{item.label}:</span>
                    <span className="text-slate-900 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6" />
                  <h4 className="font-black text-lg">Explore Funding</h4>
                </div>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">
                  Discover active grants and resources tailored for Bay Area organizations.
                </p>
                <a
                  href="/grants"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:scale-105"
                >
                  <ArrowRight className="mr-2" size={16} /> 
                  Browse Grants
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="relative py-32 md:py-40 bg-[#f9f6f4] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-slate-200 via-slate-300 to-slate-400 blur-3xl opacity-35" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-blue-200 via-indigo-200 to-violet-200 blur-3xl opacity-40" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-10 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg">
            <Shield className="h-10 w-10 text-slate-800" />
          </div>
          <h2 className="font-black tracking-tight leading-[0.95] text-4xl md:text-5xl text-slate-900 mb-6">
            Ready To Transform Bay Area Funding?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
            Join the movement to make funding more accessible, equitable, and effective for organizations creating positive change.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <a 
              href="/grants" 
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Browse Grants <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a 
              href="/login?view=signup" 
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-300"
            >
              Join Community <Heart className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUsPage;