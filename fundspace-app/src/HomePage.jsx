import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { parseMaxFundingAmount } from './utils.js';

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .tracking-tighter { letter-spacing: -0.05em; }
    .scroller { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
    .scroller::-webkit-scrollbar { display: none; }
  .scroller-inner { display: flex; gap: 1.5rem; animation: scroll 80s linear infinite; width: calc(360px * 18 + 1.5rem * 17); }
    @keyframes scroll {
      0% { transform: translateX(0); }
  100% { transform: translateX(calc(-360px * 9 - 1.5rem * 8)); }
    }
    .scroller:hover .scroller-inner { animation-play-state: paused; }
    .magical-hover { transition: all 0.3s ease; cursor: pointer; }
    .magical-hover:hover { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8); transform: scale(1.05); }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fade-out-up { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
    .fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
    .fade-out-up { animation: fade-out-up 0.5s ease-in forwards; }
    @media (max-width: 768px) {
      .scroller-inner { animation-duration: 60s; }
    }
    .magic-fundspace { 
      background: linear-gradient(90deg,#7e3af2,#ec4899,#f97316,#3b82f6); 
      background-size: 250% 250%;
      -webkit-background-clip: text; 
      background-clip: text; 
      color: transparent; 
      position: relative;
      transition: background-position 1s ease, text-shadow .4s ease, transform .4s ease;
    }
    .magic-fundspace:hover { 
      background-position: 100% 0; 
      text-shadow: 0 0 6px rgba(236,72,153,.4), 0 0 18px rgba(126,58,242,.5);
    }
  .magic-fundspace::after {
      content:""; position:absolute; inset:0; background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.6) 45%,transparent 55%); 
      background-size:200% 200%; mix-blend-mode:overlay; opacity:0; transition:opacity .4s ease, transform .9s ease; transform:translateX(-30%);
    }
    .magic-fundspace:hover::after { opacity:.9; transform:translateX(30%); }
    .magic-mission {
      background: linear-gradient(90deg,#0ea5e9,#10b981,#14b8a6,#0ea5e9);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      position: relative;
      transition: background-position 1s ease, text-shadow .4s ease, transform .4s ease;
    }
    .magic-mission:hover { background-position: 100% 0; text-shadow: 0 0 8px rgba(16,185,129,.45); }
    .magic-mission::after {
      content:""; position:absolute; inset:0; background:linear-gradient(110deg,transparent 0%,rgba(255,255,255,.55) 40%,transparent 60%);
      background-size:220% 220%; mix-blend-mode:overlay; opacity:0; transform:translateX(-25%);
      transition:opacity .5s ease, transform 1s ease;
    }
    .magic-mission:hover::after { opacity:.9; transform:translateX(25%); }
    /* Popup hover animation for Build Your Mission section cards */
    .mission-card { 
      transition: transform .45s cubic-bezier(.22,.9,.3,1), box-shadow .5s ease, filter .45s ease; 
      will-change: transform; 
    }
    .mission-card:hover { 
      transform: translateY(-8px) scale(1.035); 
      box-shadow: 0 8px 28px -6px rgba(0,0,0,.15), 0 12px 48px -12px rgba(16,24,40,.25); 
      filter: brightness(1.02) saturate(1.05);
    }
    .mission-card:active { transform: translateY(-4px) scale(1.02); }
    @media (prefers-reduced-motion: reduce) { .mission-card { transition: none; } }
  `}</style>
);

const Icons = {
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

const carouselData = [
  { type: 'image', title: 'Mission Economic Development Agency', image: 'https://media.licdn.com/dms/image/v2/C561BAQGwhXHEN7fTVg/company-background_10000/company-background_10000/0/1585481344716/mission_economic_development_agency_cover?e=2147483647&v=beta&t=qypVn1yoDmdyZVIuhXoxuGyv7JmMM-NmkuNdv8OPtnI' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/9363691/9363691-hd_1080_1920_25fps.mp4' },
  { type: 'image', title: 'Pacific Islander Community Partnership', image: 'https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/480823688_957226053233118_926561803234476192_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=aox946v1B-cQ7kNvwE20EdA&_nc_oc=Adkk_cPsfZAJmE81L5KbdGAmSfFbhzwVOQz_tll4VOlxc2cU5yE4wDyg_l7WK17UGoU&_nc_zt=23&_nc_ht=scontent-sjc3-1.xx&_nc_gid=5qjemzmdB3TZWjKjAHNj6Q&oh=00_AfXV00wQzOlwAV79ZcCXqzfmxtcxWP3pipfGqXo68WhIXw&oe=68AE0246' },
  { type: 'image', title: 'Future Construction Leaders Silicon Valley', image: 'https://images.squarespace-cdn.com/content/v1/64bfe92e203a2c626566aaca/1751316493749-Z5OFLWE8QBDIP9H05ST6/DSC00129.JPG' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/3191353/3191353-uhd_2732_1440_25fps.mp4' },
  { type: 'image', title: 'The RILEY Project', image: 'https://www.therileyproject.org/wp-content/uploads/2022/07/Elaina-.jpeg' },
  { type: 'image', title: 'Pilipino Bayanihan Resource Center', image: 'https://static.wixstatic.com/media/de0c33_57840cb972484c00ae6423895af087a2~mv2_d_2048_1365_s_2.jpg/v1/fill/w_640,h_808,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/de0c33_57840cb972484c00ae6423895af087a2~mv2_d_2048_1365_s_2.jpg' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/6893839/6893839-uhd_2560_1440_25fps.mp4' },
  { type: 'image', title: 'Dev/Mission', image: 'https://devmission.org/wp-content/uploads/2024/08/53835579331_8a5c917d82_k.jpg' },
];
// Carousel content above


const CarouselCard = ({ item }) => (
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

const AnimatedCounter = ({ targetValue }) => {
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

const CreatorCard = ({ creator }) => {
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

const CreatorTestimonialsSection = () => {
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
                <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200/70 transition-colors shadow-sm">
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

// Generic 2-column section block used for Vision / Mission / Impact themes
const ThemedSection = ({ data }) => {
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
  platformShowcaseFeatures = null, // optional array for platform showcase variant
  extraImage = null, // optional extra image card beneath the text card
  additionalTextBox = null, // optional extra gradient text box under the left image
  additionalTextBoxGradient = 'from-violet-200/70 via-indigo-200/70 to-sky-200/70', // default gradient for extra box
  additionalTextBoxPlainWhite = false, // render additional text box with plain white bg instead of gradient
  additionalTextBoxesLeft = null, // array of { text, gradient }
  additionalTextBoxesRight = null, // array of { text, gradient }
    gradient = {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-amber-200/60 via-orange-100 to-rose-100',
      halo: 'from-orange-400/20 to-pink-400/10'
    }
  } = data;
  const animateCards = /(fund your vision|build your mission|scale your impact)/i.test(badgeText || '');
  // Dynamic height syncing: enlarge right side container to match left image height
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
        // Render single descriptive sentence as large black headline filling the card
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
              {/* Enlarged height from h-72/md:h-80 to h-96/md:h-[430px] */}
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

const homepageSections = [
  {
    badgeText: 'Fund your Vision',
    heading: 'Fundspace helps organizations surface aligned capital, streamline readiness, and unlock sustainable funding momentum.',
    profile: {
      image: 'https://images.unsplash.com/photo-1755541516554-7c5126ec7f7b?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    quote: '',
    introTitle: 'Great ideas need more than discovery—they need fuel, credibility, and a repeatable pathway to capital.',
    introParagraph: 'Use smart matching, reusable assets, and collaborative review to move from scattered opportunities to a strategic funding pipeline.',
  cta: { label: 'Start visioning', href: '/login?view=signup' },
    fullImage: true,
    showProfileMeta: false,
    largeBadge: true,
    platformShowcaseFeatures: 'Discover a new path to capital, where our AI-powered database and community submissions help you find and secure the funding you need to thrive.',
    additionalTextBox: 'Discover a new path to capital where aligned funders and funding opportunities meet your mission with precision.',
    additionalTextBoxGradient: 'from-amber-200/70 via-orange-200/70 to-rose-200/70',
    additionalTextBoxPlainWhite: true,
    additionalTextBoxesLeft: [
      {
        text: 'Unlock sustainable funding momentum by streamlining readiness and matching directly with the resources that fit your vision.',
        gradient: 'from-orange-400 via-rose-400 to-pink-400',
        textClass: 'relative w-full text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight text-white',
        minHeight: 420
      }
    ],
    additionalTextBoxesRight: [
      {
        text: 'Join a network that shares more than funding — collaborate, learn, and build resilience alongside changemakers who are rewriting what opportunity feels like.',
        plainWhite: true
      }
    ],
    extraImage: { src: 'https://images.unsplash.com/photo-1633113214207-1568ec4b3298?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Funding collaboration' },
    gradient: {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-amber-300/70 via-orange-300/70 to-rose-300/70',
      halo: 'from-orange-400/25 to-rose-400/10'
    },
    workspace: {
      badge: 'FUNDING WORKSPACE',
      title: 'Grant & Capital Pipeline',
      description: 'Central dashboard of opportunities with readiness score, deadlines, owner, and progress state.',
      metrics: [
        { label: 'ACTIVE LEADS', value: 22 },
        { label: 'READY PACKETS', value: 14 },
        { label: 'SUBMISSIONS', value: 9 }
      ],
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=600&auto=format&fit=crop'
    },
    capacity: {
      assetsFrom: 5,
      assetsTo: 18,
      timeSaved: '58%',
      bullets: [
        { color: 'bg-orange-500', text: 'Reusable asset library reduced first‑draft creation time.' },
        { color: 'bg-rose-500', text: 'Automated deadline & task reminders lowered missed submissions.' },
        { color: 'bg-pink-500', text: 'Pipeline visibility improved internal coordination & prioritization.' }
      ]
    }
  },
  {
  badgeText: 'Build your Mission',
    heading: 'Fundspace helps organizations build capacity, connect, and sustain impact beyond funding.',
    profile: {
      image: 'https://images.unsplash.com/photo-1631203928521-bde1e727e8b7?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
  quote: '',
    introTitle: 'The journey doesn’t stop at funding—it’s where growth truly begins.',
    introParagraph: 'Organizations don’t just find funding—they build the resilience, capacity, and connections that turn resources into long-term impact.',
  fullImage: true,
  showProfileMeta: false,
  largeBadge: true,
  platformShowcaseFeatures: 'Meet peers, funders, and experts in a collaborative hub for sharing resources, exchanging knowledge, and sparking partnerships.',
  additionalTextBox: 'Grow resilience by building systems and practices that sustain your work beyond a single grant cycle.',
  additionalTextBoxGradient: 'from-fuchsia-200/70 via-pink-200/70 to-rose-200/70',
  additionalTextBoxPlainWhite: true,
  additionalTextBoxesLeft: [
    { 
      text: 'Transform ambition into action by building the foundation—people, processes, and partnerships—that make your mission thrive.', 
  gradient: 'from-violet-300 via-purple-200 to-fuchsia-200',
  textClass: 'relative w-full text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight text-white',
  minHeight: 420
    }
  ],
  additionalTextBoxesRight: [
    { 
      text: 'Clarify your mission with tools that help you articulate impact, sharpen goals, and tell your story with confidence.', 
      plainWhite: true 
    }
  ],
  extraImage: { src: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Collaborative workspace' },
  gradient: {
    wrapperBg: 'bg-[#f9f6f4]', // reverted to original background
    card: 'from-lime-300/70 via-emerald-300/70 to-teal-300/70',
    halo: 'from-emerald-400/25 to-teal-400/10'
  },
    workspace: {
      badge: 'CAPACITY WORKSPACE',
      title: 'Reusable Grant Asset Library',
      description: 'Centralized narratives, budgets, logic models, and impact stats—versioned, AI‑assisted, and ready to adapt.',
      metrics: [
        { label: 'CORE DOCS', value: 12 },
        { label: 'TEMPLATES', value: 8 },
        { label: 'PEER REVIEWS', value: 26 }
      ],
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop'
    },
    capacity: {
      assetsFrom: 3,
      assetsTo: 12,
      timeSaved: '64%',
      bullets: [
        { color: 'bg-blue-500', text: 'Template library standardized narrative, budget & logic model—cut first‑draft time dramatically.' },
        { color: 'bg-orange-500', text: 'Peer & mentor review loops reduced revision cycles by over half.' },
        { color: 'bg-indigo-500', text: 'Centralized impact metrics made partnership outreach faster & more credible.' }
      ]
    }
  },
  {
    badgeText: 'Scale your Impact',
    heading: 'Fundspace helps organizations amplify outcomes, deepen partnerships, and convert momentum into lasting systems change.',
    profile: {
      image: 'https://images.unsplash.com/photo-1663743556587-b0cd1a9cd61d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    quote: '',
    introTitle: 'Growth is only the beginning—impact multiplies when insights and relationships compound.',
    introParagraph: 'Turn wins into repeatable systems. Fundspace equips teams to measure, communicate, and expand the value they create across communities and partners.',
  cta: { label: 'Start scaling', href: '/login?view=signup' },
    fullImage: true,
    showProfileMeta: false,
    largeBadge: true,
    platformShowcaseFeatures: 'Measure what matters most by capturing real outcomes, transforming data into proof of impact, and giving funders and communities a clear view of the change you’re driving.',
    additionalTextBox: 'Expand your reach by scaling local successes into regional and national movements, turning grassroots momentum into a wider force for lasting change.',
    additionalTextBoxGradient: 'from-sky-200/70 via-blue-200/70 to-indigo-200/70',
    additionalTextBoxPlainWhite: true,
    additionalTextBoxesLeft: [
      {
        text: 'Scale your vision into reality by combining the right resources, connections, and strategies—so the impact you spark today grows into the systems-level change the world needs tomorrow.',
        gradient: 'from-indigo-400 via-blue-400 to-cyan-400',
        textClass: 'relative w-full text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight text-white',
        minHeight: 420
      }
    ],
    additionalTextBoxesRight: [
      {
        text: 'Multiply your influence by sharing your stories, insights, and results in ways that inspire action, attract new allies, and position your organization as a leader in your field.',
        plainWhite: true
      }
    ],
    extraImage: { src: 'https://images.unsplash.com/photo-1674574124340-c00cc2dae99c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Impact data collaboration' },
    gradient: {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-sky-300/70 via-blue-300/70 to-indigo-300/70',
      halo: 'from-sky-400/25 to-indigo-400/10'
    },
    workspace: {
      badge: 'IMPACT WORKSPACE',
      title: 'Impact Intelligence Dashboard',
      description: 'Centralized KPIs, outcome narratives, media assets, and partner engagement activity—kept current & presentation ready.',
      metrics: [
        { label: 'ACTIVE KPIs', value: 18 },
        { label: 'DATA SOURCES', value: 9 },
        { label: 'PARTNER LOGINS', value: 34 }
      ],
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=600&auto=format&fit=crop'
    },
    capacity: {
      assetsFrom: 6,
      assetsTo: 24,
      timeSaved: '71%',
      bullets: [
        { color: 'bg-blue-500', text: 'Automated rollups replaced manual spreadsheet consolidation.' },
        { color: 'bg-cyan-500', text: 'Unified dashboard reduced ad‑hoc status requests from stakeholders.' },
        { color: 'bg-indigo-500', text: 'Sharable visuals accelerated renewal & multi‑year discussions.' }
      ]
    }
  }
];

export default function HomePage() {
  const [totalFunding, setTotalFunding] = useState(87_500_000);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('grants_with_taxonomy')
          .select('max_funding_amount, funding_amount_text, deadline')
          .limit(500); // guard
        if (error) throw error;
        const sum = (data||[])
          .filter(g => !g.deadline || new Date(g.deadline) >= new Date())
          .reduce((acc,g)=>{
            const amt = parseFloat(g.max_funding_amount) || parseMaxFundingAmount(g.funding_amount_text) || 0;
            return acc + (isNaN(amt)?0:amt);
          },0);
        if (sum>0) setTotalFunding(sum);
  } catch (e) { }
    })();
  }, []);

  // Removed dynamic word animation & background color state during cleanup

  return (
  <div className="min-h-screen bg-white">
      <Styles />
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