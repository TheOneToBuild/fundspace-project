// src/components/organization-profile/OrganizationImpact.jsx
import React from 'react';

const OrganizationImpact = ({ organization, photos = [] }) => {
  if (!organization?.impactData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">Impact Stories Coming Soon</h3>
        <p className="text-slate-600">
          We're working on showcasing the impact of {organization?.name}.
        </p>
      </div>
    );
  }

  const { spotlights = [], testimonials = [] } = organization.impactData;

  const PhotoGallery = ({ photos, title }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-72 h-52 rounded-lg overflow-hidden bg-slate-100 hover:scale-105 transition-transform cursor-pointer shadow-md"
          >
            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-16">
      {/* Impact Spotlights */}
      {spotlights.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Impact Spotlights</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-4xl">
            Diving deeper into our strategic initiatives and their effect on the community.
          </p>
          <div className="space-y-12">
            {spotlights.map((spotlight, index) => (
              <div 
                key={index} 
                className="grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-2xl border border-slate-200"
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">{spotlight.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{spotlight.text}</p>
                </div>
                <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                  <img 
                    src={spotlight.image} 
                    alt={spotlight.title} 
                    className="rounded-xl object-cover w-full h-64" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <PhotoGallery photos={photos} title="Our Work in Photos" />
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Voices from the Community</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-4xl">
            Hear directly from the partners we are proud to support.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-slate-200">
                <p className="text-slate-700 text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-14 h-14 rounded-full object-cover" 
                  />
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationImpact;