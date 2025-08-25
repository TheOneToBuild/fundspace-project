import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from './supabaseClient.js';
import { parseMaxFundingAmount } from './utils.js';
// Removed heavy OrganizationCard for homepage showcase-specific lightweight cards
// import OrganizationCard from './components/OrganizationCard.jsx';

// Clickable FundCard showcasing live grant data (improved logo handling)
const FundCard = ({ grant, formatAmount }) => {
  const link = `/grants?open_grant=${grant.id}`;
  const funderLogo = grant.funder_logo_url || grant.organization?.image_url;
  const funderName = grant.funder_name || grant.foundationName || 'Funder';
  const initials = funderName.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const grantType = grant.grant_type || grant.grantType || 'Grant';
  return (
    <a href={link} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center bg-white border border-slate-200">
            {funderLogo ? (
              <img src={funderLogo} alt={funderName + ' logo'} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-[11px] font-semibold text-slate-600">{initials}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 leading-snug tracking-tight line-clamp-2 max-w-[12rem] group-hover:text-indigo-600">
            {grant.title || grant.name || 'Funding Opportunity'}
          </h3>
        </div>
        {grantType && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 border border-indigo-200">
            {grantType}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-grow">
        {grant.short_description || grant.summary || grant.description || 'Learn more about this opportunity.'}
      </p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500">Up to</span>
        <span className="text-sm font-bold text-emerald-600">{formatAmount(grant)}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-sky-500/0 to-indigo-500/0 opacity-0 group-hover:opacity-100 group-hover:from-indigo-500/5 group-hover:via-sky-500/5 group-hover:to-indigo-500/5 transition-all" />
    </a>
  );
};

// Ultra-compact organization showcase card (homepage only)
const OrgShowcaseCard = ({ org }) => {
  const locationLabel = (org.location || 'Unknown').split(',')[0];
  const focusAreas = Array.isArray(org.focus_areas)
    ? org.focus_areas
    : (typeof org.focus_areas === 'string' ? org.focus_areas.split(',').map(s=>s.trim()).filter(Boolean) : []);
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400 min-h-[280px]">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative h-12 w-12 rounded-xl overflow-hidden ring-2 ring-white shadow-md flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold items-center justify-center flex">
          {org.image_url ? (
            <img src={org.image_url} alt={org.name} className="h-full w-full object-cover" />
          ) : org.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">{org.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-medium text-blue-600 border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{locationLabel}
            </span>
            {(org.staff_count || org.staffCount) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-[10px] font-medium text-purple-600 border border-purple-200">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />{org.staff_count || org.staffCount} staff
              </span>) }
          </div>
        </div>
      </div>
      {/* Description */}
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3 flex-grow">{org.description}</p>
      {/* Focus Areas */}
      {focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {focusAreas.slice(0,3).map(a => (
            <span key={a} className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">{a}</span>
          ))}
          {focusAreas.length > 3 && <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">+{focusAreas.length-3}</span>}
        </div>
      )}
      <a href={`/organizations/${org.slug}`} className="mt-auto inline-flex items-center justify-center w-full text-[11px] font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all">
        View <span className="ml-1">›</span>
      </a>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-sky-500/0 to-indigo-500/0 opacity-0 group-hover:opacity-100 group-hover:from-indigo-500/5 group-hover:via-sky-500/5 group-hover:to-indigo-500/5 transition-all" />
    </div>
  );
};

// (Removed MicroMemberAvatar - no longer needed after deletion of community card)

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

const DYNAMIC_WORDS = ["build", "learn", "grow", "work",];
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
  {
    title: "Fund Your Mission",
    description: "Discover and access the right funding opportunities to power your vision and drive your mission forward—all in one place.",
    image: "https://images.unsplash.com/photo-1569292567773-229e2b7521ee?q=80&w=689&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    title: "Build Your Capacity",
    description: "Connect with a supportive community, gain new skills, and access resources to strengthen your organization and team.",
    image: "https://plus.unsplash.com/premium_photo-1705882849674-e8ecc5e53f6e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    title: "Scale Your Impact",
    description: "Grow your reach, amplify your results, and make a bigger difference with tools and connections designed to help you scale.",
    image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
];

// Fallback static funds (used only if live fetch fails)
const FALLBACK_FUNDS = [
  { id: 'fallback-1', title: 'Community Health Accelerator', grant_type: 'Program', max_funding_amount: 250000, funding_amount_text: '$250K', short_description: 'Supporting innovative health equity programs improving access & outcomes.', funder_name: 'Health Equity Foundation' },
  { id: 'fallback-2', title: 'Youth Innovation Seed', grant_type: 'Seed', max_funding_amount: 50000, funding_amount_text: '$50K', short_description: 'Early-stage support for youth-led social impact and STEM initiatives.', funder_name: 'Youth Impact Lab' },
  { id: 'fallback-3', title: 'Housing Justice Impact', grant_type: 'Impact', max_funding_amount: 150000, funding_amount_text: '$150K', short_description: 'Funding collaborative solutions addressing regional housing insecurity.', funder_name: 'Housing Justice Fund' },
];

const showcaseOrganizations = [
  { 
    slug: 'mission-economic-development-agency',
    name: 'Mission Economic Development Agency',
    description: 'Advancing economic equity for Latino & immigrant families through housing, education, and small business support.',
    focus_areas: ['Community', 'Housing', 'Education'],
    type: 'nonprofit',
    location: 'San Francisco, CA',
    followers_count: 182,
    likes_count: 91,
    staff_count: 120,
    banner_image_url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=1200&auto=format&fit=crop',
    image_url: 'https://devmission.org/wp-content/uploads/2024/08/53835579331_8a5c917d82_k.jpg'
  },
  { 
    slug: 'pacific-islander-community-partnership',
    name: 'Pacific Islander Community Partnership',
    description: 'Building leadership & cultural resilience across Pacific Islander communities in the Bay Area.',
    focus_areas: ['Culture', 'Health', 'Education'],
    type: 'nonprofit',
    location: 'San Mateo County, CA',
    followers_count: 76,
    likes_count: 44,
    staff_count: 18,
    banner_image_url: 'https://images.unsplash.com/photo-1526481280698-8fcc1ddfc1f8?q=80&w=1200&auto=format&fit=crop',
    image_url: 'https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/480823688_957226053233118_926561803234476192_n.jpg'
  },
  { 
    slug: 'future-construction-leaders-sv',
    name: 'Future Construction Leaders SV',
    description: 'Empowering young adults with technical skills & pathways to careers in sustainable construction.',
    focus_areas: ['Workforce Development', 'Technology', 'Education'],
    type: 'nonprofit',
    location: 'Santa Clara County, CA',
    followers_count: 54,
    likes_count: 21,
    staff_count: 9,
    banner_image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
    image_url: 'https://images.squarespace-cdn.com/content/v1/64bfe92e203a2c626566aaca/1751316493749-Z5OFLWE8QBDIP9H05ST6/DSC00129.JPG'
  },
  { 
    slug: 'the-riley-project',
    name: 'The RILEY Project',
    description: 'Cultivating youth leadership & innovation through collaborative STEM and community programs.',
    focus_areas: ['Youth', 'STEM', 'Community'],
    type: 'nonprofit',
    location: 'Alameda County, CA',
    followers_count: 61,
    likes_count: 27,
    staff_count: 14,
    banner_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    image_url: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde16?q=80&w=400&auto=format&fit=crop'
  },
];

// Live member avatars pulled from profiles (fallback to static if fetch fails)
const FALLBACK_SHOWCASE_MEMBERS = [
  { full_name: 'Alicia Gomez' },
  { full_name: 'Marcus Chen' },
  { full_name: 'Priya Patel' },
  { full_name: 'Samira Khalid' },
  { full_name: 'Jordan Lee' },
  { full_name: 'Devon Wright' },
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
  const [communityStats, setCommunityStats] = useState({ members: 0, organizations: 0, funders: 0 });
  const [showcaseMembers, setShowcaseMembers] = useState(FALLBACK_SHOWCASE_MEMBERS);
  const [liveFunds, setLiveFunds] = useState(FALLBACK_FUNDS);
  const [liveOrganizations, setLiveOrganizations] = useState(showcaseOrganizations); // fallback to static until fetched
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
    setPageBgColor('bg-white');
    return () => setPageBgColor('bg-white');
  }, [setPageBgColor]);

  // Fetch community stats (counts) with graceful fallbacks
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profilesRes, orgsRes, fundersRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('type', 'foundation'),
        ]);
        setCommunityStats({
          members: profilesRes?.count || 0,
          organizations: orgsRes?.count || 0,
            // Fallback: if funder count missing, approximate by % of orgs
          funders: fundersRes?.count || Math.round((orgsRes?.count || 0) * 0.18)
        });
      } catch (e) {
        // Silent fallback sample values
        setCommunityStats({ members: 2347, organizations: 512, funders: 94 });
      }
    };
    fetchStats();
  }, []);

  // Fetch recent active members with avatar_url for the avatar stack
  useEffect(() => {
    const fetchShowcaseMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .order('last_sign_in_at', { ascending: false })
          .limit(6);
        if (error) throw error;
        if (data && data.length) {
          setShowcaseMembers(data);
        }
      } catch (err) {
        // Keep fallback (no user-facing error)
      }
    };
    fetchShowcaseMembers();
  }, []);

  // Fetch live funds (grants) for homepage showcase
  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const { data, error } = await supabase
          .from('grants_with_taxonomy')
          .select('id,title,grant_type,short_description,summary,max_funding_amount,funding_amount_text,deadline,funder_logo_url,funder_name,funder_slug')
          .order('id', { ascending: false })
          .limit(18);
        if (error) throw error;
        let rows = data || [];
        // Attempt to enrich with organization logos if missing
        const slugsNeedingLogo = rows.filter(r => !r.funder_logo_url && r.funder_slug).map(r => r.funder_slug);
        if (slugsNeedingLogo.length) {
          const uniqueSlugs = [...new Set(slugsNeedingLogo)];
            const { data: orgs } = await supabase
              .from('organizations')
              .select('slug,image_url')
              .in('slug', uniqueSlugs);
            if (orgs) {
              rows = rows.map(r => {
                const org = orgs.find(o => o.slug === r.funder_slug);
                return org && !r.funder_logo_url ? { ...r, funder_logo_url: org.image_url } : r;
              });
            }
        }
        const active = rows.filter(g => !g.deadline || new Date(g.deadline) >= new Date());
        active.sort((a,b)=> {
          const amtA = parseFloat(a.max_funding_amount)|| parseMaxFundingAmount(a.funding_amount_text)||0;
          const amtB = parseFloat(b.max_funding_amount)|| parseMaxFundingAmount(b.funding_amount_text)||0;
          if (amtB !== amtA) return amtB - amtA;
          const da = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
          const db = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
          return da - db;
        });
        setLiveFunds((active.length ? active : rows).slice(0,3));
      } catch (err) {
        console.warn('Using fallback funds on homepage', err.message);
      }
    };
    fetchFunds();
  }, []);

  // Fetch live organizations for homepage showcase
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('slug,name,description,focus_areas,location,staff_count,image_url,followers_count,updated_at')
          .order('followers_count', { ascending: false })
          .limit(4);
        if (error) throw error;
        if (data && data.length) {
          const sanitized = data.map(o => ({
            ...o,
            focus_areas: Array.isArray(o.focus_areas)
              ? o.focus_areas
              : (typeof o.focus_areas === 'string'
                  ? o.focus_areas.split(',').map(s=>s.trim()).filter(Boolean)
                  : []),
          }));
          setLiveOrganizations(sanitized);
        }
      } catch (e) {
        console.warn('Using fallback organizations', e.message);
      }
    };
    fetchOrganizations();
  }, []);

  const formatFundAmount = (fund) => {
    const raw = parseFloat(fund.max_funding_amount) || parseMaxFundingAmount(fund.funding_amount_text) || 0;
    if (raw >= 1_000_000) return `$${(raw/1_000_000).toFixed(1)}M`;
    if (raw >= 1000) return `$${(raw/1000).toFixed(0)}K`;
    return raw ? `$${raw.toLocaleString()}` : (fund.funding_amount_text || '—');
  };

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
                  <div className="absolute inset-0 flex items-start justify-center pt-16 md:pt-20 lg:pt-24 p-8">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white text-center leading-tight tracking-tight drop-shadow-lg">
                      Accessible Capital,<br />
                      Powerful Community
                    </h2>
                  </div>
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
                  <a href="/login?view=signup" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 font-semibold rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200/70 transition-colors duration-300 w-full sm:w-auto text-sm sm:text-base">
                    Sign Up <Icons.ArrowRight className="ml-2" size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-4 md:py-8 bg-white">
          <div ref={scrollRef} className="scroller w-full overflow-hidden cursor-grab active:cursor-grabbing">
            <div className="scroller-inner">
              {[...carouselData, ...carouselData].map((item, i) => <CarouselCard key={i} item={item} />)}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
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

        {/* Community / Ecosystem Showcase Section */}
  <section className="relative py-16 md:py-24 overflow-hidden bg-white">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-10 md:gap-14 items-stretch">
              {/* Left narrative column */}
              <div className="lg:col-span-2 flex flex-col">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 leading-tight">
                  The Bay Area Impact <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-600">Ecosystem</span> Lives Here
                </h2>
                <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8">
                  Fundspace isn't just a database—it is a living network of funders, nonprofits, builders, and innovators. Explore local organizations, active funds, and the humans behind the work. 
                </p>
                <div className="grid grid-cols-3 gap-4 mb-10">
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600"><AnimatedCounter targetValue={communityStats.members || 0} /></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Members</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600"><AnimatedCounter targetValue={communityStats.organizations || 0} /></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Organizations</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600"><AnimatedCounter targetValue={communityStats.funders || 0} /></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Funders</p>
                  </div>
                </div>
        <div className="flex -space-x-4 mb-8">
      {showcaseMembers.slice(0,5).map((m,i) => (
                    <div key={i} className="relative inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-md hover:z-10 transition-transform hover:scale-110">
                      <div className="h-full w-full rounded-[0.8rem] overflow-hidden bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600">
        {m.avatar_url ? <img src={m.avatar_url} alt={m.full_name} className="h-full w-full object-cover" /> : (m.full_name || '').split(' ').map(w=>w[0]).join('').toUpperCase()}
                      </div>
                    </div>
                  ))}
      <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xs font-semibold text-white border-2 border-white">+{Math.max(0,(communityStats.members||0)-showcaseMembers.length)}</div>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-8">A growing network exchanging knowledge, unlocking capital, and building resilient communities.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="/organizations" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Explore Organizations</a>
                  <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:-translate-y-0.5 transition-all">Browse Funds</a>
                </div>
              </div>

              {/* Middle: Organization cards (lightweight redesign for homepage) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {liveOrganizations.map(o => <OrgShowcaseCard key={o.slug} org={o} />)}
              </div>

              {/* Right: Funds only (cleaned) */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {liveFunds.map((g) => (
                  <FundCard key={g.id} grant={g} formatAmount={formatFundAmount} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-sm">Fund.</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 drop-shadow-sm">Build.</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-sm">Scale.</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                From funding discovery to community building, we provide the tools and connections to help your organization thrive.
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