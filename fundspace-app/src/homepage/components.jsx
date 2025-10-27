// src/homepage/components.js - All HomePage components in one file
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Icons
export const Icons = {
  Search: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  ArrowRight: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  )
};

// AnimatedCounter Component
export const AnimatedCounter = ({ targetValue }) => {
  const [count, setCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const end = targetValue;
        let duration = 2000;
        let startTime = null;

        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * (end - start) + start));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(countRef.current);
      }
    }, { threshold: 0.5 });

    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [targetValue]);

  const formatCurrency = (amount) => {
    if (isMobile) {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };
  
  return <span ref={countRef}>{formatCurrency(count)}</span>;
};

// CarouselCard Component
export const CarouselCard = ({ item }) => (
  <div className="relative w-[360px] h-[480px] flex-shrink-0 rounded-2xl overflow-hidden group shadow-lg bg-slate-800">
    {item.type === 'video' ? (
      <video src={item.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    ) : (
      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
    {item.title && (
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white text-lg font-semibold">{item.title}</h3>
      </div>
    )}
  </div>
);

// CreatorCard Component
export const CreatorCard = ({ creator }) => {
  return (
    <div className="group relative rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] h-[360px] md:h-[420px] bg-slate-900">
      <img
        src={creator.image}
        alt={creator.name}
        className="absolute inset-0 w-full h-full object-cover object-top md:object-[50%_20%] scale-105 group-hover:scale-110 transition-transform duration-500 brightness-[1.08] group-hover:brightness-[1.12]"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/0" />
      <div className="relative z-10 p-8 flex flex-col justify-start h-full text-white">
        <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-2 drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]">{creator.name}</h3>
        <p className="text-base md:text-lg font-medium text-white/85 max-w-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{creator.title}</p>
      </div>
    </div>
  );
};

// CreatorTestimonialsSection Component
export const CreatorTestimonialsSection = () => {
  const creators = [
    {
      name: "The Housing Advocate",
      title: "",
      image: "https://images.unsplash.com/photo-1755541516453-201559bec161?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "The Community Leader",
      title: "",
      image: "https://images.unsplash.com/photo-1755541516450-644adb257ad0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "The Youth Mentor",
      title: "",
      image: "https://images.unsplash.com/photo-1755541516517-bb95790dc7ad?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
          <div>
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight text-slate-900">
                For changemakers building a brighter future.
              </h2>
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                From discovery to impact—all in one place. <span className="magic-fundspace font-bold">Fundspace</span> helps you find funding, build your capacity, and showcase your impact, so you can focus on what matters most: <span className="magic-mission font-semibold">your mission</span>
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="/explore" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200/70 transition-colors shadow-sm">
                  Explore Funding <Icons.Search className="ml-2" size={18} />
                </a>
                <Link to="/login?view=signup" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  Sign Up <Icons.ArrowRight className="ml-2" size={18} />
                </Link>
              </div>
            </div>
            <div className="mt-14">
              <CreatorCard creator={creators[0]} isPrimary={true} />
            </div>
          </div>
          <div className="space-y-12 mt-16 lg:mt-0">
            <CreatorCard creator={creators[1]} />
            <CreatorCard creator={creators[2]} />
          </div>
        </div>
      </div>
    </section>
  );
};

// ThemedSection Component
export const ThemedSection = ({ data }) => {
  const {
    badgeText,
    heading,
    profile,
    quote,
    introTitle,
    introParagraph,
    cta = { label: 'Start building', href: '/login?view=signup' },
    workspace,
    capacity,
    fullImage = false,
    showProfileMeta = true,
    largeBadge = false,
    platformShowcaseFeatures = null,
    extraImage = null,
    additionalTextBox = null,
    additionalTextBoxGradient = 'from-violet-200/70 via-indigo-200/70 to-sky-200/70',
    additionalTextBoxPlainWhite = false,
    additionalTextBoxesLeft = null,
    additionalTextBoxesRight = null,
    gradient = {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-amber-200/60 via-orange-100 to-rose-100',
      halo: 'from-orange-400/20 to-pink-400/10'
    }
  } = data;
  
  const animateCards = /(fund your vision|build your mission|scale your impact)/i.test(badgeText || '');
  const [leftImageHeight, setLeftImageHeight] = useState(null);
  const leftImageRef = useRef(null);
  
  useEffect(() => {
    const measure = () => {
      if (leftImageRef.current) {
        setLeftImageHeight(leftImageRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section className={`relative ${gradient.wrapperBg} py-28`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-20">
        <div className="flex flex-col">
          {(() => {
            const base = largeBadge ? 'text-sm tracking-wide px-5 py-3 rounded-lg' : 'tracking-wide text-[11px] px-3 py-1 rounded-full';
            let color = 'bg-amber-100 text-amber-800';
            if (/fund your vision/i.test(badgeText)) color = 'bg-blue-100 text-blue-700';
            else if (/build your mission/i.test(badgeText)) color = 'bg-emerald-100 text-emerald-700';
            else if (/scale your impact/i.test(badgeText)) color = 'bg-purple-100 text-purple-700';
            return (
              <span className={`inline-flex w-fit items-center uppercase font-semibold mb-8 shadow-sm transition-all ${base} ${color}`}>{badgeText}</span>
            );
          })()}
          
          <h3 className="text-4xl md:text-5xl font-black leading-[1.1] text-slate-900 mb-10" dangerouslySetInnerHTML={{ __html: heading }} />
          
          {profile && (
            fullImage ? (
              <div className="mb-12">
                <div ref={leftImageRef} className={`relative w-full rounded-3xl overflow-hidden shadow-xl bg-slate-300 ${animateCards ? 'mission-card' : ''}`} style={{ minHeight: '520px' }}>
                  <img src={profile.image} alt={profile.name} className="absolute inset-0 w-full h-full object-cover object-cover" />
                </div>
                {additionalTextBox && (
                  <div className={`mt-10 relative rounded-3xl p-10 md:p-16 ${additionalTextBoxPlainWhite ? 'bg-white' : 'bg-gradient-to-br ' + additionalTextBoxGradient} shadow-2xl ring-1 ring-slate-900/5 overflow-hidden flex items-center ${animateCards ? 'mission-card' : ''}`} style={{ minHeight: additionalTextBoxPlainWhite ? '420px' : '300px' }}> 
                    <div className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 bg-gradient-to-tr from-white/50 to-white/10 rounded-full blur-3xl opacity-70" />
                    <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 bg-gradient-to-tr from-white/40 to-white/5 rounded-full blur-3xl opacity-60" />
                    <p className={`relative w-full ${additionalTextBoxPlainWhite ? 'text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.4] tracking-tight text-slate-900' : 'text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.32] tracking-tight text-slate-900'}`}>
                      {additionalTextBox}
                    </p>
                  </div>
                )}
                {additionalTextBoxesLeft && additionalTextBoxesLeft.map((box, idx) => (
                  <div key={idx} className={`mt-10 relative rounded-3xl p-10 md:p-16 bg-gradient-to-br ${box.gradient || additionalTextBoxGradient} shadow-2xl ring-1 ring-slate-900/5 overflow-hidden flex items-center ${animateCards ? 'mission-card' : ''}`} style={ box.minHeight !== undefined ? { minHeight: box.minHeight } : { minHeight: '260px' } }>
                    <div className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 bg-gradient-to-tr from-white/50 to-white/10 rounded-full blur-3xl opacity-40" />
                    <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 bg-gradient-to-tr from-white/40 to-white/5 rounded-full blur-3xl opacity-30" />
                    <p className={box.textClass || 'relative w-full text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900'}>
                      {box.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-12">
                <div className="relative w-56 h-60 rounded-2xl overflow-hidden shadow-lg bg-slate-300">
                  <img src={profile.image} alt={profile.name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                {showProfileMeta && (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900 text-lg">{profile.name}</p>
                    <p className="text-sm text-slate-600">{profile.title}</p>
                  </div>
                )}
              </div>
            )
          )}
          
          {quote && (
            <blockquote className="mt-auto text-lg md:text-xl leading-relaxed text-slate-700 max-w-xl">{quote}</blockquote>
          )}
        </div>
        
        <div className="relative">
          <div className="mb-10">
            <h4 className="font-bold text-slate-900 text-lg md:text-xl leading-snug mb-3">{introTitle}</h4>
            <p className="text-slate-700 text-lg md:text-xl leading-relaxed mb-6 max-w-md">{introParagraph}</p>
            <a href={cta.href} className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors">
              {cta.label}
            </a>
          </div>
          
          <div className={`relative rounded-3xl bg-gradient-to-br ${gradient.card} p-6 md:p-10 shadow-xl ring-1 ring-amber-300/30 overflow-hidden ${animateCards ? 'mission-card' : ''}`} style={leftImageHeight ? { minHeight: leftImageHeight } : {}}>
            <div className={`absolute -top-24 -right-16 w-72 h-72 bg-gradient-to-tr ${gradient.halo} rounded-full blur-3xl`} />
            <div className={`relative ${platformShowcaseFeatures ? 'h-full flex items-center' : 'grid gap-6'}`}>
              {platformShowcaseFeatures ? (
                <p className="w-full text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight text-white drop-shadow-sm m-0">{platformShowcaseFeatures}</p>
              ) : (
                <>
                  <div className={`rounded-2xl overflow-hidden bg-white shadow-lg ring-1 ring-slate-900/5 flex ${animateCards ? 'mission-card' : ''}`} style={fullImage && leftImageHeight ? { height: leftImageHeight } : {}}>
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-slate-500 mb-2">{workspace.badge}</p>
                        <h5 className="text-slate-900 font-bold text-lg leading-tight mb-2">{workspace.title}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{workspace.description}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {workspace.metrics.map(m => (
                          <div key={m.label} className="rounded-md bg-slate-50 p-3">
                            <p className="text-[10px] tracking-wide font-medium text-slate-500 mb-1">{m.label}</p>
                            <p className="text-sm font-semibold text-slate-900">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {workspace.image && (
                      <div className={`hidden md:block bg-slate-100 relative overflow-hidden ${fullImage ? 'flex-1' : 'w-40'} h-full`}>
                        <img src={workspace.image} alt={workspace.title} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className={`rounded-2xl bg-white shadow-lg ring-1 ring-slate-900/5 p-6 grid gap-4 ${animateCards ? 'mission-card' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-medium tracking-wide text-slate-500">CAPACITY BUILT</p>
                        <p className="text-2xl font-extrabold text-slate-900">{capacity.assetsFrom} → {capacity.assetsTo} assets</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium tracking-wide text-slate-500">TIME SAVED</p>
                        <p className="text-xl font-bold text-emerald-600">↓ {capacity.timeSaved}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-4 grid gap-3">
                      {capacity.bullets.map((b,i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className={`mt-1 h-2 w-2 rounded-full ${b.color}`} />
                          <p className="text-xs text-slate-600 leading-relaxed">{b.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {extraImage && (
            <div className={`mt-10 rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-900/5 bg-slate-100 ${animateCards ? 'mission-card' : ''}`}>
              <img src={extraImage.src} alt={extraImage.alt || ''} className="w-full h-[520px] md:h-[580px] object-cover" />
            </div>
          )}
          
          {additionalTextBoxesRight && additionalTextBoxesRight.map((box, idx) => (
            <div key={idx} className={`mt-10 rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-900/5 ${animateCards ? 'mission-card' : ''}`}>
              <div className={`h-full w-full p-10 md:p-16 ${box.plainWhite ? 'bg-white' : `bg-gradient-to-br ${box.gradient || 'from-indigo-200/70 via-sky-200/70 to-cyan-200/70'}`} flex items-center`} style={{ minHeight: box.plainWhite ? '420px' : '260px' }}>
                <p className={`${box.plainWhite ? 'text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight bg-gradient-to-r from-rose-400 via-orange-400 to-indigo-500 bg-clip-text text-transparent' : 'text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900'}`}>{box.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};