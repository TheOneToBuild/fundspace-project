// src/homepage/HomePage.jsx - Complete Homepage Component
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { parseMaxFundingAmount } from '../utils.js';

// Import from same folder - cleaner paths
import { carouselData, homepageSections } from './data.js';
import { 
  Icons, 
  AnimatedCounter, 
  CarouselCard, 
  CreatorTestimonialsSection, 
  ThemedSection 
} from './components.jsx';

// Import styles
import './styles.css';

export default function HomePage() {
  const [totalFunding, setTotalFunding] = useState(87_500_000);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('grants_with_taxonomy')
          .select('max_funding_amount, funding_amount_text, deadline')
          .limit(500);
        if (error) throw error;
        const sum = (data||[])
          .filter(g => !g.deadline || new Date(g.deadline) >= new Date())
          .reduce((acc,g)=>{
            const amt = parseFloat(g.max_funding_amount) || parseMaxFundingAmount(g.funding_amount_text) || 0;
            return acc + (isNaN(amt)?0:amt);
          },0);
        if (sum>0) setTotalFunding(sum);
      } catch (e) { 
        console.error('Error fetching funding data:', e);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main>
        <CreatorTestimonialsSection />
        
        <section className="relative overflow-hidden pt-24 md:pt-32 pb-24 md:pb-28 bg-[#f9f6f4]">
          <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-10 relative">
                <h1 className="font-black tracking-tight leading-[0.95] text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl text-slate-900">
                  Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">Capital</span>
                  <br />
                  Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-red-600">Purpose.</span>
                </h1>
                
                <a
                  href="/grants"
                  aria-label="View all current funding opportunities on Fundspace"
                  className="group inline-flex flex-col items-start rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-sm px-8 py-6 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 cursor-pointer"
                >
                  <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-2 group-hover:text-slate-600 transition-colors">CURRENT FUNDING INDEXED</p>
                  <div className="flex items-baseline gap-3">
                    <span className="relative inline-block font-black tabular-nums text-4xl sm:text-5xl lg:text-6xl">
                      <span aria-hidden="true" className="invisible select-none">$999,999,999</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-600 bg-clip-text text-transparent">
                        $<AnimatedCounter targetValue={totalFunding} />
                      </span>
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600 flex items-center gap-1">
                    Active grants & capital sources available now
                    <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">→</span>
                  </p>
                </a>
              </div>
              
              <div className="max-w-xl md:pt-2 lg:pt-4">
                <div className="group relative">
                  <div className="absolute -inset-[1px] rounded-[38px] bg-gradient-to-br from-slate-900/10 via-white to-white opacity-60 group-hover:opacity-90 transition-opacity"></div>
                  <div className="relative rounded-[38px] p-[1px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50 shadow-[0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_-8px_rgba(0,0,0,0.06)]">
                    <div className="rounded-[36px] bg-white/95 backdrop-blur-sm px-8 md:px-12 py-10 md:py-12 flex flex-col gap-7">
                      <p className="text-[1.15rem] md:text-[1.3rem] leading-relaxed tracking-tight font-medium text-slate-900">
                        Fundspace is where purpose-driven changemakers, founders, and organizations find the capital and community they need to thrive.
                      </p>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                      <p className="text-[1.05rem] md:text-lg leading-relaxed text-slate-800/95">
                        The traditional path to funding is broken. It's fragmented, bureaucratic, and often leaves the most promising ideas undiscovered. We built Fundspace to change that.
                      </p>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                      <p className="text-[1.05rem] md:text-lg leading-relaxed text-slate-800/95">
                        Our platform streamlines the entire funding lifecycle—from finding the right grants and investors with our AI-powered engine to building your capacity with expert resources and a supportive community. <span className="magic-fundspace font-bold">Together, we can unlock the capital needed to make a real impact. Your mission has a home here.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative mt-28 md:mt-40">
            <div ref={scrollRef} className="scroller w-full overflow-hidden cursor-grab active:cursor-grabbing px-2 sm:px-4">
              <div className="scroller-inner">
                {[...carouselData, ...carouselData].map((item, i) => <CarouselCard key={i} item={item} />)}
              </div>
            </div>
          </div>
        </section>
        
        {homepageSections.map((section, i) => <ThemedSection key={i} data={section} />)}
      </main>
    </div>
  );
}