// src/SubmitGrantPage.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient.js';
import { UploadCloud, Loader, CheckCircle2 } from './components/Icons.jsx';
// MODIFIED: Import the PublicPageLayout component
import PublicPageLayout from './components/PublicPageLayout.jsx';

const SubmitGrantPage = () => {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      const { error } = await supabase
        .from('grant_submissions')
        .insert([{ url, notes }]);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Thank you! Your submission has been received.' });
      setUrl('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting grant:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // MODIFIED: Wrap the component in PublicPageLayout and provide the gradient class
    <PublicPageLayout bgColor="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      <div className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-slate-200">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
                Help Grow the Community
              </h1>
              <p className="text-lg text-slate-600">
                Found a grant opportunity we missed? Submit the URL below and we'll review it for inclusion in our database.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="grant-url" className="block text-sm font-medium text-slate-700 mb-1">
                  Grant URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="grant-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://foundation.org/grants/apply"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="grant-notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Optional Notes
                </label>
                <textarea
                  id="grant-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="4"
                  placeholder="Any additional info? (e.g., 'This is for arts education', 'The deadline is rolling')"
                  className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm shadow-sm"
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-3" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Grant <UploadCloud className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {message.text && (
              <div className={`mt-6 text-center p-4 rounded-md text-sm ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default SubmitGrantPage;