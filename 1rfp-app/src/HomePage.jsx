// We need to import supabase at the top
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from './supabaseClient.js';
import { parseMaxFundingAmount } from './utils.js';

// ---------- FONT & STYLING ----------
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { 
      font-family: 'Inter', sans-serif; 
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .tracking-tighter { letter-spacing: -0.05em; }
    .scroller {
      -webkit-mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
      mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
    }
    .scroller-inner {
      display: flex;
      gap: 1.5rem;
      animation: scroll 80s linear infinite;
      width: calc(300px * 16 + 1.5rem * 15); /* Explicit width for smooth animation */
    }
    @keyframes scroll {
      to {
        transform: translate(calc(-50% - 0.75rem));
      }
    }
    .scroller:hover .scroller-inner {
      animation-play-state: paused;
    }
    .magical-hover {
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .magical-hover:hover {
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
      transform: scale(1.05);
    }
    /* Mobile optimization */
    @media (max-width: 768px) {
      .scroller-inner {
        animation-duration: 60s;
      }
    }
  `}</style>
);

// ---------- ICONS ----------
const Icon = ({ children, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const Search = (props) => <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>;
const ArrowRight = (props) => <Icon {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;
const Plus = (props) => <Icon {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></Icon>;

// ---------- MOCK DATA ----------
const DYNAMIC_WORDS = ["build", "grow", "dream", "learn", "thrive", "stands"];

const carouselData = [
  { type: 'image', title: '', image: 'https://images.unsplash.com/photo-1519671845924-1fd18db430b8?q=80&w=816&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { type: 'image', title: '', image: 'https://cdn.pixabay.com/photo/2016/03/18/15/21/help-1265227_1280.jpg' },
  { type: 'image', title: '', image: 'https://images.unsplash.com/photo-1722963220293-aff91802d709?q=80&w=687' },
  { type: 'video', title: '', videoSrc: 'https://cdn.pixabay.com/video/2024/01/20/197486-905015022_tiny.mp4' },
  { type: 'image', title: '', image: 'https://plus.unsplash.com/premium_photo-1677171749367-85d6d2d1f81f?q=80&w=687' },
  { type: 'image', title: '', image: 'https://images.unsplash.com/photo-1643321610692-719deb378a33?q=80&w=687' },
  { type: 'image', title: '', image: 'https://images.unsplash.com/photo-1583743220494-3da91330c2fd?q=80&w=930' },
  { type: 'video', title: '', videoSrc: 'https://cdn.pixabay.com/video/2024/02/02/198898-909564555_tiny.mp4' },
];

const platformFeatures = [
  { title: "Find Funding, Faster", description: "Our AI-powered search matches you with relevant grants in minutes, not weeks.", image: "https://images.unsplash.com/photo-1569292567773-229e2b7521ee?q=80&w=689&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { title: "Tell Your Story", description: "Create a dynamic profile that showcases your impact and connects you with supporters.", image: "https://plus.unsplash.com/premium_photo-1705882849674-e8ecc5e53f6e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { title: "Build Your Network", description: "Connect with funders, collaborators, and peers in a community built for social impact.", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

// ---------- CONTEXT ----------
const LayoutContext = createContext({ setPageBgColor: () => {} });

// ---------- COMPONENTS ----------
const CarouselCard = ({ item }) => (
  <div className="relative w-[300px] h-[400px] flex-shrink-0 rounded-2xl overflow-hidden group shadow-lg bg-slate-800">
    {item.type === 'video' ? (
      <video src={item.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    ) : (
      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
    <h3 className="absolute top-4 left-4 text-white text-lg font-bold">{item.title}</h3>
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
        <Plus className="h-5 w-5 text-white group-hover:text-black transition-colors" />
      </div>
    </div>
  </div>
);

const AnimatedCounter = ({ targetValue }) => {
  const [count, setCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
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
      // Mobile: Use shorthand format (87.5M)
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toLocaleString();
    } else {
      // Desktop: Use full format (87,500,000)
      return amount.toLocaleString();
    }
  };

  return <span ref={countRef}>{formatCurrency(count)}</span>;
};

// ---------- MAIN ----------
function HomePage() {
  const { setPageBgColor } = useContext(LayoutContext);
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [grants, setGrants] = useState([]);
  const [totalFunding, setTotalFunding] = useState(0);

  // Fetch grants data to calculate actual total funding
  useEffect(() => {
    const fetchGrantsData = async () => {
      try {
        console.log('Fetching grants data for homepage counter...');
        const { data, error } = await supabase
          .from('grants_with_taxonomy')
          .select('max_funding_amount, funding_amount_text, deadline, status')
          .order('id', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Raw grants data:', data?.length || 0, 'grants found');
        
        if (data && data.length > 0) {
          // Filter for active grants (same logic as GrantsPageContent)
          const activeGrants = data.filter(grant => {
            // Include grants without deadline (rolling deadlines) or future deadlines
            if (!grant.deadline) return true;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return new Date(grant.deadline) >= today;
          });

          console.log('Active grants:', activeGrants.length, 'out of', data.length);

          // Calculate total funding using same method as GrantsPageContent
          const activeFunding = activeGrants.reduce((sum, grant) => {
            let amount = 0;
            
            // Try max_funding_amount first, then fall back to parsing funding_amount_text
            if (grant.max_funding_amount) {
              amount = parseFloat(grant.max_funding_amount);
            } else if (grant.funding_amount_text) {
              amount = parseMaxFundingAmount(grant.funding_amount_text);
            }
            
            if (amount && !isNaN(amount) && amount > 0) {
              console.log('Adding grant funding:', amount, 'from grant:', grant.max_funding_amount || grant.funding_amount_text);
              return sum + amount;
            }
            
            return sum;
          }, 0);
          
          console.log('Total calculated funding:', activeFunding);
          setTotalFunding(activeFunding);
          setGrants(data);
        } else {
          console.log('No grants data found, using fallback');
          setTotalFunding(87500000); // Fallback
        }
      } catch (error) {
        console.error('Error fetching grants data:', error);
        // Fallback to the previous static number
        setTotalFunding(87500000);
      }
    };

    fetchGrantsData();
  }, []);

  useEffect(() => {
    const handleTyping = () => {
      const currentWord = DYNAMIC_WORDS[wordIndex];
      if (isDeleting) {
        if (displayedText.length > 0) {
          setDisplayedText(currentWord.substring(0, displayedText.length - 1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % DYNAMIC_WORDS.length);
        }
      } else {
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      }
    };
    const timeout = setTimeout(handleTyping, isDeleting ? 100 : 150);
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, wordIndex]);

  useEffect(() => {
    setPageBgColor('bg-slate-50');
    return () => setPageBgColor('bg-white');
  }, [setPageBgColor]);

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="relative text-center py-16 sm:py-20 md:py-28 overflow-hidden bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 mb-4 sm:mb-6 leading-tight tracking-tighter">
            Where community <span className="inline-block min-w-[160px] sm:min-w-[200px] md:min-w-[220px] text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-600">{displayedText}</span> together.
          </h1>
          <p className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-700 mb-8 sm:mb-10 leading-relaxed font-display px-4 sm:px-0">
  A space for Bay Area 🌉  changemakers to 
  <span className="text-pink-500 font-semibold animate-bounce-slow"> connect </span> 🤝, 
  <span className="text-emerald-500 font-semibold animate-bounce-slow"> collaborate </span> 🫶, and 
  <span className="text-sky-500 font-semibold animate-bounce-slow"> build </span> 🏗️ 
  something 
  <span className="magical-hover font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 transition-all duration-500 ease-in-out hover:brightness-125 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"> magical </span> 🌟 together.
</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <a href="/grants" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto text-sm sm:text-base">
              Find Grants <Search className="ml-2" size={18} />
            </a>
            <a href="/login?view=sign_up" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 font-semibold rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200/70 transition-colors duration-300 w-full sm:w-auto text-sm sm:text-base">
              Sign Up <ArrowRight className="ml-2" size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      <section className="py-8 md:py-16 bg-white">
        <div className="scroller w-full overflow-hidden">
          <div className="scroller-inner">
            {[...carouselData, ...carouselData].map((item, i) => <CarouselCard key={i} item={item} />)}
          </div>
        </div>
      </section>

      {/* COUNTER */}
      <section className="py-16 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight">Unlock Millions in Funding Opportunities</h2>
              <p className="mt-4 text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
                Our platform aggregates grants from across the Bay Area, putting a comprehensive database of funding at your fingertips.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                $<AnimatedCounter targetValue={totalFunding || 87500000} />
              </div>
              <p className="mt-2 text-base md:text-lg font-semibold text-slate-600">Total Funding Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Designed by Community. Built for Community.</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Our platform is built by community members, for community members. We understand the unique challenges and opportunities in the Bay Area, and we're here to support you every step of the way.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 h-auto md:h-[600px]">
            {platformFeatures.map((f, i) => <PlatformFeatureCard key={i} feature={f} />)}
          </div>
        </div>
      </section>

    </div>
  );
}

export default function App() {
  const [pageBgColor, setPageBgColor] = useState('bg-white');
  return (
    <LayoutContext.Provider value={{ setPageBgColor }}>
      <Styles />
      <div className={`min-h-screen transition-colors duration-300 ${pageBgColor}`}>
        <main><HomePage /></main>
      </div>
    </LayoutContext.Provider>
  );
}