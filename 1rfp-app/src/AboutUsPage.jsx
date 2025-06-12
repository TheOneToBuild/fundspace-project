// src/AboutUsPage.jsx
import React from 'react';
import { Target, Heart, Zap, Users, MapPin } from './components/Icons.jsx';

const teamMembers = [
  {
    name: 'Elena Rodriguez',
    title: 'Co-Founder, Former Nonprofit Director',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop',
    bio: 'After 15 years on the front lines of nonprofit development, Elena has submitted hundreds of grant proposals. She co-founded 1RFP to build the tool she always wished she had—one that respects a nonprofit\'s time and helps great programs find the spotlight they deserve.'
  },
  {
    name: 'David Chen',
    title: 'Co-Founder, Former Foundation Program Officer',
    imageUrl: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=2071&auto=format&fit=crop',
    bio: 'From his seat inside a major Bay Area foundation, David saw the disconnect. He knew countless innovative organizations were out there, but funders struggled to find them. He brings his grantmaking experience to 1RFP to build a more transparent and effective funding ecosystem.'
  }
];

const AboutUsPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* --- Hero Section --- */}
      <div className="text-center py-20 md:py-28 px-4">
        <div className="container mx-auto">
          <p className="text-base font-semibold text-blue-600 tracking-wider uppercase">Our Story</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
            We've been there.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            We started 1RFP because we've lived the challenges. We've spent the late nights searching for grants and the long days wishing we could connect with the right community partners. We knew there had to be a better way.
          </p>
        </div>
      </div>

      {/* --- Our Mission Section with a photo --- */}
      <div className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          {/* THIS IS THE UPDATED SECTION */}
          <div>
              <h2 className="text-3xl font-bold text-slate-800">Our Mission: Clarity in a Complex World</h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                The grantseeking process is often a maze of siloed databases, outdated information, and missed opportunities. This inefficiency doesn't just waste time—it slows down the velocity of positive change in our communities.
              </p>
              <p className="mt-4 text-lg text-slate-700 font-semibold leading-relaxed">
                Our mission is to bridge this gap by creating a single, intelligent, and equitable platform for the Bay Area's social impact sector. We connect nonprofits with the funding they need and help funders discover the transformative work happening in their own backyard.
              </p>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop" 
              alt="Community collaboration in the Bay Area"
              className="rounded-xl shadow-lg w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
      
      {/* --- Meet the Team Section --- */}
      <div className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">A Bridge Built from Both Sides</h2>
            <p className="text-lg text-slate-500 mt-2 max-w-2xl mx-auto">Our team has direct experience from both sides of the funding table.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {teamMembers.map(member => (
              <div key={member.name} className="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-lg">
                <img className="mx-auto h-32 w-32 rounded-full mb-4 object-cover" src={member.imageUrl} alt={member.name} />
                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                <p className="font-semibold text-blue-600 mb-3">{member.title}</p>
                <p className="text-slate-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Our Commitment Section --- */}
      <div className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-block bg-rose-100 p-3 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-rose-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Our Commitment to the Bay Area</h2>
          <p className="text-lg text-slate-600 mt-4 leading-relaxed">
            1RFP is exclusively focused on the 9-county San Francisco Bay Area. We believe that local focus is our greatest strength. By concentrating our efforts here, we can build deeper relationships, provide more relevant data, and better understand the unique challenges and opportunities facing our local communities—from San Jose to Santa Rosa, and everywhere in between.
          </p>
        </div>
      </div>

      {/* --- Values Section --- */}
      <div className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Our Guiding Values</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-lg mt-4 mb-1">Rooted in Community</h4>
                <p className="text-slate-600 text-sm">A stronger nonprofit sector leads to a more resilient and equitable Bay Area for everyone.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-bold text-lg mt-4 mb-1">Efficiency as Impact</h4>
                <p className="text-slate-600 text-sm">Saving nonprofits time on fundraising directly translates to more resources for their programs.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-lg mt-4 mb-1">Access & Equity</h4>
                <p className="text-slate-600 text-sm">Great ideas can come from anywhere. We aim to level the playing field for organizations of all sizes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;