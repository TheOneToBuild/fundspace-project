// src/NonprofitSpotlightSection.jsx
import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, Twitter, Linkedin, Facebook, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { spotlightNonprofitsData } from './data.js';
import { getPillClasses } from './utils.js'; // Import the new function

const NonprofitSpotlightSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = spotlightNonprofitsData.length;
  const autoPlayInterval = 7000;

  const handleSetSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    handleSetSlide((currentSlide + 1) % totalSlides);
  };

  const prevSlide = () => {
    handleSetSlide((currentSlide - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index) => {
    handleSetSlide(index);
  };

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setTimeout(nextSlide, autoPlayInterval);
    return () => clearTimeout(timer);
  }, [currentSlide, isPaused, totalSlides, autoPlayInterval]);

  const nonprofit = spotlightNonprofitsData[currentSlide];

  const generalThemeColors = {
    cyan: { text: 'text-cyan-700', bg: 'bg-cyan-600', hoverBg: 'hover:bg-cyan-700', ring: 'focus:ring-cyan-500', impactBorder: 'border-sky-600', impactText: 'text-sky-800' },
    green: { text: 'text-green-700', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700', ring: 'focus:ring-green-500', impactBorder: 'border-emerald-600', impactText: 'text-emerald-800' },
    red: { text: 'text-red-700', bg: 'bg-red-600', hoverBg: 'hover:bg-red-700', ring: 'focus:ring-red-500', impactBorder: 'border-rose-600', impactText: 'text-rose-800' },
  };
  const currentGeneralTheme = generalThemeColors[nonprofit.themeColor] || generalThemeColors.cyan;

  return (
    <section
      id="nonprofit-spotlight"
      className="py-16 md:py-24 scroll-mt-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
           <div className="inline-flex items-center justify-center mb-4">
             <Heart size={28} className={`mr-2 ${currentGeneralTheme.text}`} />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Nonprofit <span className={currentGeneralTheme.text}>Spotlight</span>
            </h2>
          </div>
          <p className="text-md md:text-lg text-slate-600 max-w-2xl mx-auto">
            Highlighting the incredible work of nonprofits making a difference in our community.
          </p>
        </div>

        <div className="relative">
          <div
            key={nonprofit.id}
            className="bg-white rounded-xl shadow-xl overflow-hidden animate-fadeInSlide relative"
          >
            <div className="md:flex">
              <div className="md:w-1/2 h-64 md:h-[550px] relative group">
                <img
                  src={nonprofit.imageUrl}
                  alt={nonprofit.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                  onError={(e) => { e.target.src = `https://placehold.co/600x550/FEE2E2/991B1B?text=Error+Loading+${nonprofit.name.replace(/\s/g, '+')}&font=inter`; }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
              </div>
              <div className="md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col">
                <h3 className={`text-2xl sm:text-3xl font-bold text-slate-900 mb-1`}>
                  {nonprofit.name}
                </h3>
                <div className={`h-1 w-16 mb-3 rounded-full ${currentGeneralTheme.bg}`}></div>
                <p className={`text-md font-medium ${currentGeneralTheme.text} mb-3`}>
                  {nonprofit.tagline}
                </p>
                {nonprofit.focusAreas && nonprofit.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Use the new function here */}
                    {nonprofit.focusAreas.map(area => (
                      <span
                        key={area}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm ${getPillClasses(area)}`}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative mb-4">
                  <p className="text-slate-600 text-sm leading-relaxed h-32 overflow-y-auto custom-scrollbar-small pr-2">
                    {nonprofit.description}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-md"></div>
                </div>

                <div className={`relative p-4 pl-10 rounded-lg mb-5 border-l-4 ${currentGeneralTheme.impactBorder} shadow-md`}>
                  <span className={`absolute top-2 left-1 text-6xl ${currentGeneralTheme.text} opacity-20 font-serif leading-none select-none`}>“</span>
                  <h4 className={`text-sm font-semibold ${currentGeneralTheme.impactText} mb-1.5 relative z-10`}>Impact Highlight</h4>
                  <div className="relative">
                    <p className="text-slate-700 text-base italic leading-relaxed h-32 overflow-y-auto custom-scrollbar-small pr-2 relative z-10">
                      {nonprofit.impactStory}”
                    </p>
                     <div className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-md`}></div>
                  </div>
                </div>

                {nonprofit.waysToHelp && nonprofit.waysToHelp.length > 0 && (
                  <div className="mt-auto pt-4">
                    <h5 className={`text-sm font-semibold ${currentGeneralTheme.text} mb-2`}>Ways to Help:</h5>
                    <ul className="space-y-1.5">
                      {nonprofit.waysToHelp.map(action => (
                        <li key={action.text} className="flex items-center">
                          <ArrowRight size={14} className={`mr-2 ${currentGeneralTheme.text} opacity-80 flex-shrink-0`} />
                          <a href={action.url || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:underline hover:text-slate-900">
                            {action.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <a
                      href={nonprofit.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${currentGeneralTheme.bg} ${currentGeneralTheme.hoverBg} hover:brightness-110 focus:outline-none focus:ring-2 ring-offset-2 ${currentGeneralTheme.ring} transition-all duration-200 group hover:shadow-lg active:scale-95`}
                    >
                      Learn More <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </a>
                    <div className="flex space-x-2 items-center">
                        <span className="text-xs text-slate-500 hidden sm:inline">Share:</span>
                        <button onClick={() => console.log("Share Twitter")} aria-label="Share on Twitter" className={`p-2 rounded-full hover:opacity-75 transition-opacity ${currentGeneralTheme.bg.replace('bg-', 'bg-')}/10`}><Twitter size={16} className={currentGeneralTheme.text} /></button>
                        <button onClick={() => console.log("Share LinkedIn")} aria-label="Share on LinkedIn" className={`p-2 rounded-full hover:opacity-75 transition-opacity ${currentGeneralTheme.bg.replace('bg-', 'bg-')}/10`}><Linkedin size={16} className={currentGeneralTheme.text} /></button>
                        <button onClick={() => console.log("Share Facebook")} aria-label="Share on Facebook" className={`p-2 rounded-full hover:opacity-75 transition-opacity ${currentGeneralTheme.bg.replace('bg-', 'bg-')}/10`}><Facebook size={16} className={currentGeneralTheme.text} /></button>
                        <button onClick={() => console.log("Generic Share")} aria-label="Share" className={`p-2 rounded-full hover:opacity-75 transition-opacity ${currentGeneralTheme.bg.replace('bg-', 'bg-')}/10`}><Share2 size={16} className={currentGeneralTheme.text} /></button>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {totalSlides > 1 && (
            <>
              <button onClick={prevSlide} className={`absolute top-1/2 left-0 sm:-left-5 transform -translate-y-1/2 bg-slate-100/80 hover:bg-slate-100 text-slate-800 p-3 rounded-full shadow-xl focus:outline-none focus:ring-2 ring-offset-1 ${currentGeneralTheme.ring} transition-all duration-200 z-10`} aria-label="Previous slide"><ChevronLeft size={28} /></button>
              <button onClick={nextSlide} className={`absolute top-1/2 right-0 sm:-right-5 transform -translate-y-1/2 bg-slate-100/80 hover:bg-slate-100 text-slate-800 p-3 rounded-full shadow-xl focus:outline-none focus:ring-2 ring-offset-1 ${currentGeneralTheme.ring} transition-all duration-200 z-10`} aria-label="Next slide"><ChevronRight size={28} /></button>
            </>
          )}
        </div>

        {totalSlides > 1 && (
          <div className="flex justify-center space-x-2.5 mt-10">
            {spotlightNonprofitsData.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={"w-3 h-3 rounded-full transition-all duration-300 ease-in-out " +
                  (currentSlide === index ? (currentGeneralTheme.bg + ' opacity-100 scale-125 shadow-md') : 'bg-slate-400 opacity-50 hover:opacity-75 hover:bg-slate-500 hover:scale-110')
                }/>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NonprofitSpotlightSection;