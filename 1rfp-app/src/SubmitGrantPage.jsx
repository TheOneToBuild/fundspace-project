// src/SubmitGrantPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient.js';
import { UploadCloud, Loader, CheckCircle2, XCircle, Sparkles, Heart, Users, Target, Search, ArrowRight } from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

const SubmitGrantPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50');
    return () => setPageBgColor('bg-white');
  }, [setPageBgColor]);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!isValidUrl(url)) {
      setMessage({ type: 'error', text: 'Please enter a valid URL.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // ** THIS IS THE UPDATED PART **
      // We now call the Edge Function instead of inserting directly.
      const { data, error } = await supabase.functions.invoke('submit-grant', {
        body: { url, notes },
      });

      if (error) {
        // Try to parse a more specific error message from the function response
        const errorData = await error.context.json();
        throw new Error(errorData.error || 'An unexpected error occurred.');
      }

      // Use the success message from our Edge Function
      setMessage({ type: 'success', text: data.message });
      setUrl('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting grant:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getIconForMessage = () => {
      if (message.type === 'success') return <CheckCircle2 size={16} className="text-green-600" />;
      if (message.type === 'error') return <XCircle size={16} className="text-red-600" />;
      return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO SECTION */}
      <section className="text-center mb-16 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center border border-emerald-200 shadow-lg">
            <UploadCloud className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">Help Grow Our </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600">
              Community
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Found a grant opportunity we missed? Help us build the most comprehensive Bay Area grant database by submitting opportunities you've discovered.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold"> Every submission makes our community stronger.</span>
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-white/60 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                  <UploadCloud className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Submit a Grant Opportunity</h2>
                  <p className="text-slate-600">Help expand our database</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 mb-8">
                <h3 className="font-semibold text-emerald-800 mb-2">How It Works:</h3>
                <ol className="text-sm text-emerald-700 space-y-1">
                  <li>1. Share the grant URL you discovered</li>
                  <li>2. Add any helpful details or context</li>
                  <li>3. Our team reviews and verifies the submission</li>
                  <li>4. Grant gets added to our database for all nonprofits to discover</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="grant-url" className="block text-sm font-semibold text-slate-700 mb-2">
                    Grant Opportunity URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="grant-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://foundation.org/grants/apply"
                    required
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Please include the full URL including https://</p>
                </div>

                <div>
                  <label htmlFor="grant-notes" className="block text-sm font-semibold text-slate-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="grant-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="5"
                    placeholder="Help us understand this grant better:&#10;• What's the focus area? (e.g., 'Arts education', 'Environmental justice')&#10;• What's the deadline? (e.g., 'Rolling', 'March 15, 2025')&#10;• Funding range? (e.g., '$10K - $50K')&#10;• Any eligibility requirements?"
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm resize-none"
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-1">Any context helps our team process submissions faster</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-3" />
                      Submitting Grant...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2" size={20} />
                      Submit Grant Opportunity
                    </>
                  )}
                </button>
              </form>

              {/* Success/Error Messages */}
              {message.text && (
                <div className={`mt-6 p-4 rounded-2xl text-sm font-medium ${
                  message.type === 'success' 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {getIconForMessage()}
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* Community Impact */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white/60 shadow-xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Community Impact
              </h3>
              
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Saves Time:</strong> Every submission helps nonprofits discover funding faster</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Builds Community:</strong> Collaborative approach strengthens our ecosystem</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Ensures Quality:</strong> Our team verifies every submission</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Stays Current:</strong> Community submissions keep data fresh</p>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-lg">
              <h4 className="font-semibold text-slate-800 mb-3">Submission Guidelines</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>✅ <strong>Bay Area focus:</strong> Must serve our 9-county region</p>
                <p>✅ <strong>Active grants:</strong> Currently accepting applications</p>
                <p>✅ <strong>Nonprofit eligible:</strong> Open to 501(c)(3) organizations</p>
                <p>✅ <strong>Public access:</strong> Information publicly available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THANK YOU SECTION */}
      <section className="mt-16 text-center">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Thank You for Building Community
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl mx-auto">
            Every grant submission brings us closer to our goal of connecting every Bay Area nonprofit with the perfect funding opportunity. Together, we're making social impact more accessible.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SubmitGrantPage;