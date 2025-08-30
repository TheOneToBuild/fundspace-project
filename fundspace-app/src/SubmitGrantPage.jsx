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
    setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* HERO SECTION */}
      <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-32 w-[520px] h-[520px] bg-gradient-to-tr from-blue-200 via-indigo-200 to-violet-200 blur-3xl opacity-25" />
          <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-gradient-to-tr from-emerald-200 via-teal-200 to-sky-200 blur-3xl opacity-25" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-white rounded-3xl flex items-center justify-center border border-blue-200 shadow-lg">
            <UploadCloud className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">Submit a Grant</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Found a grant opportunity we missed? Help us build the most comprehensive Bay Area grant database by submitting opportunities you've discovered.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600 font-semibold"> Every submission makes our community stronger.</span>
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-10 md:p-12 border border-slate-200 shadow-xl ring-1 ring-slate-900/5">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight mb-3">Submit a Grant Opportunity</h2>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Help expand our database and empower the Bay Area community.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-8">
                <h3 className="font-semibold text-blue-800 mb-2">How It Works:</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Share the grant URL you discovered</li>
                  <li>2. Add any helpful details or context</li>
                  <li>3. Our AI model reads the content and pulls relevant information</li>
                  <li>4. Grant gets added to our database for all organizations to discover</li>
                </ol>
              </div>
              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label htmlFor="grant-url" className="block text-sm font-bold text-slate-900 mb-3">
                    Grant Opportunity URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="grant-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://foundation.org/grants/apply"
                    required
                    className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm bg-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Please include the full URL including https://</p>
                </div>
                <div>
                  <label htmlFor="grant-notes" className="block text-sm font-bold text-slate-900 mb-3">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="grant-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="5"
                    placeholder="Help us understand this grant better:&#10;• What's the focus area? (e.g., 'Arts education', 'Environmental justice')&#10;• What's the deadline? (e.g., 'Rolling', 'March 15, 2025')&#10;• Funding range? (e.g., '$10K - $50K')&#10;• Any eligibility requirements?"
                    className="block w-full px-4 py-4 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm bg-white resize-none"
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-1">Any context helps our team process submissions faster</p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-8 py-4 font-bold rounded-2xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl ring-1 ring-slate-900/5">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Community Impact
              </h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Saves Time:</strong> Every submission helps our communities discover funding faster</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Builds Community:</strong> Collaborative approach strengthens our ecosystem</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Ensures Quality:</strong> Our team verifies every submission</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Stays Current:</strong> Community submissions keep data fresh</p>
                </div>
              </div>
            </div>
            {/* Guidelines */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 shadow-lg">
              <h4 className="font-semibold text-slate-800 mb-3">Submission Guidelines</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>✅ <strong>Bay Area focus:</strong> Must serve our 9-county region</p>
                <p>✅ <strong>Active grants:</strong> Currently accepting applications</p>
                <p>✅ <strong>Open to all:</strong> Open to all organization types and individuals</p>
                <p>✅ <strong>Public access:</strong> Information publicly available</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* THANK YOU SECTION */}
      <section className="mt-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Thank You for Building Community
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl mx-auto">
            Every grant submission brings us one step closer to advancing our mission of making funding accessible to everyone. 
          </p>
        </div>
      </section>
    </div>
  );
};

export default SubmitGrantPage;