import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from './supabaseClient.js';
import { parseMaxFundingAmount } from './utils.js';

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .tracking-tighter { letter-spacing: -0.05em; }
    .scroller { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
    .scroller::-webkit-scrollbar { display: none; }
    .scroller-inner { display: flex; gap: 1.5rem; animation: scroll 80s linear infinite; width: calc(300px * 18 + 1.5rem * 17); }
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(calc(-300px * 9 - 1.5rem * 8)); }
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
  ),
  Plus: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
};

const DYNAMIC_WORDS = ["build", "learn", "grow", "work", "solve"];
const carouselData = [
  { type: 'image', title: 'Mission Economic Development Agency', image: 'https://media.licdn.com/dms/image/v2/C561BAQGwhXHEN7fTVg/company-background_10000/company-background_10000/0/1585481344716/mission_economic_development_agency_cover?e=2147483647&v=beta&t=qypVn1yoDmdyZVIuhXoxuGyv7JmMM-NmkuNdv8OPtnI' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/9363691/9363691-hd_1080_1920_25fps.mp4' },
  { type: 'image', title: 'Pacific Islander Community Partnership', image: 'https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/480823688_957226053233118_926561803234476192_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=aox946v1B-cQ7kNvwE20EdA&_nc_oc=Adkk_cPsfZAJmE81L5KbdGAmSfFbhzwVOQz_tll4VOlxc2cU5yE4wDyg_l7WK17UGoU&_nc_zt=23&_nc_ht=scontent-sjc3-1.xx&_nc_gid=5qjemzmdB3TZWjKjAHNj6Q&oh=00_AfXV00wQzOlwAV79ZcCXqzfmxtcxWP3pipfGqXo68WhIXw&oe=68AE0246' },
  { type: 'image', title: 'Future Construction Leaders Silicon Valley', image: 'https://images.squarespace-cdn.com/content/v1/64bfe92e203a2c626566aaca/1751316493749-Z5OFLWE8QBDIP9H05ST6/DSC00129.JPG' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/3191353/3191353-uhd_2732_1440_25fps.mp4' },
  { type: 'image', title: 'The RILEY Project', image: 'https://scontent-sjc6-1.xx.fbcdn.net/v/t39.30808-6/480182066_674930054891057_6225268670759551493_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=bBeS_lu6fwYQ7kNvwFhwpux&_nc_oc=AdlxjAr1GRJ3cNfUPDVVn8xruH1vY2_JwDpMeXm7GDAeDAfZ6aPLAtCEpbPOaiaHzXM&_nc_zt=23&_nc_ht=scontent-sjc6-1.xx&_nc_gid=QqwEgyvQYuHiguDY668Dbg&oh=00_AfVirmDp3xJdnb-OQ7VDapsn6c8yzDN_G-s6VuFwAOXqcw&oe=68AB250F' },
  { type: 'image', title: 'Pilipino Bayanihan Resource Center', image: 'https://static.wixstatic.com/media/de0c33_57840cb972484c00ae6423895af087a2~mv2_d_2048_1365_s_2.jpg/v1/fill/w_640,h_808,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/de0c33_57840cb972484c00ae6423895af087a2~mv2_d_2048_1365_s_2.jpg' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/6893839/6893839-uhd_2560_1440_25fps.mp4' },
  { type: 'image', title: 'Dev/Mission', image: 'https://devmission.org/wp-content/uploads/2024/08/53835579331_8a5c917d82_k.jpg' },
];
const platformFeatures = [
  { title: "Find Funding, Faster", description: "Our AI-powered search matches you with relevant funds in minutes, not weeks.", image: "https://images.unsplash.com/photo-1569292567773-229e2b7521ee?q=80&w=689&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { title: "Tell Your Story", description: "Create a dynamic profile that showcases your impact and connects you with supporters.", image: "https://plus.unsplash.com/premium_photo-1705882849674-e8ecc5e53f6e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { title: "Build Your Network", description: "Connect with funders, collaborators, and peers in a community built for social impact.", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

const CarouselCard = ({ item }) => (
  <div className="relative w-[300px] h-[400px] flex-shrink-0 rounded-2xl overflow-hidden group shadow-lg bg-slate-800">
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

const PlatformFeatureCard = ({ feature }) => (
  <div className="relative rounded-2xl overflow-hidden shadow-lg h-full min-h-[400px] md:min-h-[600px] group transition-transform duration-300 ease-in-out hover:scale-105">
    <img src={feature.image} alt={feature.title} className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"></div>
    <div className="relative h-full flex flex-col justify-end p-4 md:p-6 text-white">
      <h3 className="text-lg md:text-xl font-bold">{feature.title}</h3>
      <p className="mt-2 text-sm md:text-base text-white/90">{feature.description}</p>
      <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white transition-colors">
        <Icons.Plus className="h-5 w-5 text-white group-hover:text-black transition-colors" />
      </div>
    </div>
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

export default function App() {
  const [pageBgColor, setPageBgColor] = useState('bg-white');
  const [wordIndex, setWordIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState('entering');
  const [totalFunding, setTotalFunding] = useState(87500000);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchTotalFunding = async () => {
      try {
        const { data, error } = await supabase
          .from('grants_with_taxonomy')
          .select('max_funding_amount, funding_amount_text, deadline')
          .order('id', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          const activeFunding = data
            .filter(grant => !grant.deadline || new Date(grant.deadline) >= new Date())
            .reduce((sum, grant) => {
              const amount = parseFloat(grant.max_funding_amount) || parseMaxFundingAmount(grant.funding_amount_text) || 0;
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
          setTotalFunding(activeFunding || 87500000);
        }
      } catch (error) {
        console.error('Error fetching grants data:', error.message);
      }
    };
    fetchTotalFunding();
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (scrollRef.current) {
        e.preventDefault();
        scrollRef.current.scrollLeft += e.deltaY;
      }
    };
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollElement.removeEventListener('wheel', handleWheel);
    }
  }, []);

  useEffect(() => {
    let timeout;
    if (animationPhase === 'entering') {
      timeout = setTimeout(() => setAnimationPhase('leaving'), 2000);
    } else {
      timeout = setTimeout(() => {
        setWordIndex(prev => (prev + 1) % DYNAMIC_WORDS.length);
        setAnimationPhase('entering');
      }, 500);
    }
    return () => clearTimeout(timeout);
  }, [animationPhase, wordIndex]);

  useEffect(() => {
    setPageBgColor('bg-slate-50');
    return () => setPageBgColor('bg-white');
  }, [setPageBgColor]);

  const currentWord = DYNAMIC_WORDS[wordIndex];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBgColor}`}>
      <Styles />
      <main>
        <section className="relative py-16 sm:py-20 md:py-28 overflow-hidden bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img src="https://images.pexels.com/photos/3584437/pexels-photo-3584437.jpeg" alt="San Francisco Golden Gate Bridge" className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover rounded-2xl shadow-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
              </div>
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 mb-4 sm:mb-6 leading-tight tracking-tighter">
                  Where community <span className="inline-block relative h-[1.2em] w-40 overflow-hidden align-middle">
                      <span className={`absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-600 ${animationPhase === 'entering' ? 'fade-in-up' : 'fade-out-up'}`}>{currentWord}</span>
                  </span> together.
                </h1>
                <p className="max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-none text-base sm:text-lg md:text-xl text-slate-700 mb-8 sm:mb-10 leading-relaxed font-display px-4 sm:px-0 lg:px-0">
                  A space for Bay Area 🌉  changemakers to 
                  <span className="text-pink-500 font-semibold animate-bounce-slow"> connect </span> 🤝, 
                  <span className="text-emerald-500 font-semibold animate-bounce-slow"> dream </span> 🫶, and 
                  <span className="text-sky-500 font-semibold animate-bounce-slow"> build </span> 🏗️ 
                  something 
                  <span className="magical-hover font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 transition-all duration-500 ease-in-out hover:brightness-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"> magical </span> 🌟 together.
                </p>
                <div className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-3 sm:gap-4 px-4 sm:px-0 lg:px-0">
                  <a href="/grants" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto text-sm sm:text-base">
                    Find Funding <Icons.Search className="ml-2" size={18} />
                  </a>
                  <a href="/login?view=sign_up" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 font-semibold rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200/70 transition-colors duration-300 w-full sm:w-auto text-sm sm:text-base">
                    Sign Up <Icons.ArrowRight className="ml-2" size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-16 bg-white">
          <div ref={scrollRef} className="scroller w-full overflow-hidden cursor-grab active:cursor-grabbing">
            <div className="scroller-inner">
              {[...carouselData, ...carouselData].map((item, i) => <CarouselCard key={i} item={item} />)}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight">Unlock Millions in Funding Opportunities</h2>
                <p className="mt-4 text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
                  Our platform aggregates opportunities from across the Bay Area, putting a comprehensive database of funding at your fingertips.
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                  $<AnimatedCounter targetValue={totalFunding} />
                </div>
                <p className="mt-2 text-base md:text-lg font-semibold text-slate-600">Total Funding Available</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Accessible Capital, Powerful Community</h2>
              <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
                Our platform is powered by the very people it serves—a vibrant network of changemakers helping each other find funding and build connections. 
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 h-auto md:h-[600px]">
              {platformFeatures.map((f, i) => <PlatformFeatureCard key={i} feature={f} />)}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}