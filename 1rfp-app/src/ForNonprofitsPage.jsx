// src/pages/ForNonprofitsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, Search, Calendar, Bot, BarChart3, Users, Handshake, TrendingUp, Filter, ShieldCheck } from './components/Icons.jsx';
import FunderCard from './components/FunderCard.jsx';
import AnimatedShape from './components/AnimatedShape.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';

const STATIC_IMAGES = {
    heroIllustration: 'https://cdn.pixabay.com/photo/2017/08/01/20/52/happy-holidays-2567915_1280.jpg',
    painIllustration: 'https://cdn.pixabay.com/photo/2022/04/08/18/15/woman-7120016_640.jpg',
    circles: [
        'https://cdn.pixabay.com/photo/2020/02/28/10/17/fishing-net-4887070_640.jpg',
        'https://cdn.pixabay.com/photo/2015/07/17/22/43/student-849824_640.jpg',
        'https://cdn.pixabay.com/photo/2016/11/29/07/59/architecture-1868265_640.jpg',
        'https://cdn.pixabay.com/photo/2015/07/27/19/43/road-863298_640.jpg',
    ],
    funderLogos: [
        'https://koret.org/wp-content/uploads/2018/01/twitter-koret-home.jpg', 
        'https://headwatersfoundation.org/wp-content/uploads/2020/04/HFJ-Logo-Strong-Arctic-Blue.png',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTytwjH8xshAT4ATgsXQlXzE8hcpbuNGZLmpA&s',
    ],
    gradients: [
        'from-blue-200 to-cyan-200',
        'from-green-200 to-teal-200',
        'from-purple-200 to-violet-200',
        'from-rose-200 to-pink-200',
        'from-amber-200 to-yellow-300'
    ]
};

const funderData = [
    { 
        slug: 'the-koret-foundation',
        name: 'The Koret Foundation', 
        description: 'A family foundation dedicated to supporting innovative projects in education, environmental conservation, and the arts across all nine Bay Area counties.',
        focus_areas: ['Education', 'Environment', 'Arts & Culture'],
        logo_url: STATIC_IMAGES.funderLogos[0],
        funder_type: { name: 'Family Foundation' },
        location: 'Palo Alto, CA',
        funding_locations: ['Bay Area Wide'],
        total_funding_annually: '$15M - $20M',
        notable_grant: 'The "Tech for Teachers" classroom hardware initiative.',
        average_grant_size: '$75,000 - $150,000',
        grant_types: ['Project Support', 'Capacity Building'],
    },
    { 
        slug: 'the-headwaters-foundation',
        name: 'The Headwaters Foundation',
        description: 'Focused on providing seed funding and capacity-building grants to early-stage nonprofits addressing issues of social and economic justice.',
        focus_areas: ['Social Justice', 'Workforce Development', 'Poverty Relief'],
        logo_url: STATIC_IMAGES.funderLogos[1],
        funder_type: { name: 'Community Foundation' },
        location: 'Oakland, CA',
        funding_locations: ['Alameda County', 'Contra Costa County'],
        total_funding_annually: '$5M - $10M',
        notable_grant: 'The "First Step" entrepreneurship program for formerly incarcerated individuals.',
        average_grant_size: '$25,000 - $75,000',
        grant_types: ['General Operating', 'Seed Funding'],
    },
    { 
        slug: 'the-zellerbach-family-foundation',
        name: 'The Zellerbach Family Foundation',
        description: 'A public trust that funds community clinics and organizations providing direct health and wellness services to underserved populations in San Francisco.',
        focus_areas: ['Community Health', 'Mental Health', 'Housing'],
        logo_url: STATIC_IMAGES.funderLogos[2],
        funder_type: { name: 'Public Charity' },
        location: 'San Francisco, CA',
        funding_locations: ['San Francisco'],
        total_funding_annually: '$12M+',
        notable_grant: 'Funding for free mobile health clinics in the Tenderloin.',
        average_grant_size: '$100,000 - $250,000',
        grant_types: ['General Operating', 'Project Support', 'Capital Campaigns'],
    },
];

const funderCountyData = [
    { name: "San Francisco", count: 1845, icon: Briefcase, color: "text-blue-500" },
    { name: "Santa Clara", count: 1102, icon: Briefcase, color: "text-sky-500" },
    { name: "San Mateo", count: 980, icon: Briefcase, color: "text-cyan-500" },
    { name: "Alameda", count: 955, icon: Briefcase, color: "text-teal-500" },
    { name: "Contra Costa", count: 651, icon: Briefcase, color: "text-emerald-500" },
    { name: "Marin", count: 523, icon: Briefcase, color: "text-green-500" },
    { name: "Sonoma", count: 488, icon: Briefcase, color: "text-lime-500" },
    { name: "Solano", count: 210, icon: Briefcase, color: "text-yellow-500" },
    { name: "Napa", count: 195, icon: Briefcase, color: "text-amber-500" },
];

const StorySection = ({ children, className = '' }) => ( 
    <motion.div 
        className={`w-full flex flex-col justify-center items-center min-h-[95vh] py-20 md:py-32 relative ${className}`} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        transition={{ staggerChildren: 0.3 }}
    >
        {children}
    </motion.div>
);

const AnimatedGradientShape = ({ className, initial, animate, gradient }) => (
    <motion.div 
        className={`absolute hidden md:block rounded-full z-0 ${className} bg-gradient-to-br ${gradient}`} 
        initial={initial} 
        animate={animate} 
        transition={{
            duration: Math.random() * 20 + 15, 
            ease: 'easeInOut', 
            repeat: Infinity, 
            repeatType: 'reverse',
        }}
    />
);

const textFloatUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }};
const animatedH1 = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const animatedWord = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

const ForNonprofitsPage = () => {
    
    return (
        <div className="bg-[#F8F3ED] text-[#333132] font-serif overflow-x-hidden">
            <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

                <StorySection>
                    <AnimatedShape className="w-48 h-80 -top-10 left-[5%] z-0" initial={{ y: -20 }} animate={{ y: 20 }} imageUrl={STATIC_IMAGES.circles[0]} />
                    <AnimatedShape className="w-32 h-44 top-16 right-[10%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} imageUrl={STATIC_IMAGES.circles[1]} />
                    
                    <div className="text-center z-20 relative">
                        <motion.div variants={textFloatUp}><div className="inline-block bg-blue-100 p-4 rounded-full shadow-lg"><Briefcase className="h-8 sm:h-10 w-8 sm:h-10 text-blue-600" /></div></motion.div>
                        <motion.h1 variants={animatedH1} className="text-4xl sm:text-5xl md:text-6xl text-slate-800 mt-4 font-bold">
                           Find Your Funder. <br className="hidden sm:block" /> Fuel Your Mission.
                        </motion.h1>
                        <motion.p variants={textFloatUp} className="font-sans text-lg sm:text-xl text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
                            Stop the endless search. 1RFP centralizes Bay Area grant opportunities so you can focus on what matters most.
                        </motion.p>
                    </div>

                    <motion.div 
                        variants={textFloatUp}
                        className="mt-12 w-full max-w-5xl"
                    >
                        <h3 className="text-center font-sans text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Funder Landscape by County</h3>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-8">
                            {funderCountyData.map(county => (
                                <div key={county.name} className="text-center">
                                    <county.icon className={`h-7 w-7 mx-auto ${county.color} mb-1`} />
                                    <AnimatedCounter targetValue={county.count} className="text-2xl sm:text-3xl font-bold text-slate-700" />
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{county.name}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    
                    <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedGradientShape className="w-72 h-72 top-10 right-10" initial={{ y: -20, rotate: 0 }} animate={{ y: 20, rotate: 60 }} gradient={STATIC_IMAGES.gradients[0]} />
                    <AnimatedGradientShape className="w-40 h-40 bottom-20 left-16" initial={{ y: 20, rotate: 20 }} animate={{ y: -20, rotate: -40 }} gradient={STATIC_IMAGES.gradients[1]} />
                    <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 max-w-6xl mx-auto z-20 relative">
                        <motion.div variants={textFloatUp} className="md:w-1/2 text-center md:text-left">
                            <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">The Endless <span className="font-bold text-red-500">Search</span>.</h2>
                            <p className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed">
                                You know the drill. Countless hours lost to scattered foundation websites, outdated databases, and missed deadlines. It's a frustrating cycle that pulls you away from your actual work.
                            </p>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2 w-full mt-8 md:mt-0">
                            <img src={STATIC_IMAGES.painIllustration} alt="Illustration of a person overwhelmed by paperwork" className="w-full h-auto object-contain rounded-lg shadow-xl"/>
                        </motion.div>
                    </div>
                    <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedGradientShape className="w-80 h-80 bottom-10 left-10" initial={{ y: 20, x: 15 }} animate={{ y: -20, x: -15 }} gradient={STATIC_IMAGES.gradients[1]} />
                    <AnimatedGradientShape className="w-48 h-48 top-10 right-16" initial={{ scale: 0.9 }} animate={{ scale: 1.1 }} gradient={STATIC_IMAGES.gradients[3]} />
                    <motion.div variants={textFloatUp} className="text-center z-20 relative mb-12">
                        <div className="inline-block bg-green-100 p-4 rounded-full shadow-lg"><CheckCircle className="h-8 sm:h-10 w-8 sm:h-10 text-green-600" /></div>
                        <h2 className="text-4xl md:text-5xl text-slate-800 mt-4 font-bold">A <span className="font-bold text-green-600">Smarter</span> Way to Fundraise.</h2>
                        <p className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                            We centralize hundreds of Bay Area RFPs and provide powerful tools to help you find the right opportunities in minutes, not weeks. Discover funders who care about the work you do.
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto z-20 relative">
                        {funderData.map((funder, index) => ( 
                            <motion.div variants={textFloatUp} key={funder.slug || index}>
                                <FunderCard funder={funder} />
                            </motion.div> 
                        ))}
                    </div>
                    <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedGradientShape className="w-64 h-64 top-20 right-20" initial={{ scale: 0.9, rotate: 45 }} animate={{ scale: 1.1, rotate: -45 }} gradient={STATIC_IMAGES.gradients[2]} />
                    <AnimatedGradientShape className="w-32 h-32 bottom-16 left-24" initial={{ scale: 1.1 }} animate={{ scale: 0.9 }} gradient={STATIC_IMAGES.gradients[0]} />
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto z-20 relative">
                         <motion.div variants={textFloatUp} className="md:w-1/2 text-center md:text-left">
                           <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">Free, <span className="font-bold text-purple-600">Forever</span>. For Nonprofits.</h2>
                           <p className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed">
                               Our commitment is to the Bay Area's nonprofit sector. Access to our entire grant database and discovery tools will always be free for 501(c)(3) organizations. No trials, no tiers, no hidden fees.
                           </p>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2 w-full mt-8 md:mt-0">
                            <img src={STATIC_IMAGES.heroIllustration} alt="Illustration of finding opportunities" className="w-full h-auto object-contain rounded-lg shadow-xl"/>
                        </motion.div>
                    </div>
                    <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>
                
                <StorySection>
                    <AnimatedGradientShape className="w-72 h-72 -bottom-24 left-1/4" initial={{ x: -20 }} animate={{ x: 20 }} gradient={STATIC_IMAGES.gradients[3]} />
                    <AnimatedGradientShape className="w-48 h-48 top-10 right-1/4" initial={{ y: 20 }} animate={{ y: -20 }} gradient={STATIC_IMAGES.gradients[4]} />
                    <div className="text-center z-20 relative">
                        <motion.h2 variants={textFloatUp} className="text-4xl md:text-5xl text-slate-800 font-bold">What's on the Horizon?</motion.h2>
                        <motion.p variants={textFloatUp} className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                            We're building powerful new tools to give you an even greater advantage in your fundraising efforts.
                        </motion.p>
                    </div>
                    <motion.div variants={textFloatUp} className="bg-white p-6 sm:p-8 md:p-12 mt-12 rounded-lg border border-slate-200 shadow-xl w-full max-w-4xl z-20 relative">
                        <h3 className="text-2xl font-bold mb-6 text-center">Upcoming Tools for Nonprofits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 font-sans text-slate-600">
                            <div className="flex items-start"><Calendar className="h-6 w-6 text-teal-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Grant Tracking:</strong> Save grants and manage deadlines in a personalized dashboard.</p></div>
                            <div className="flex items-start"><Bot className="h-6 w-6 text-sky-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">AI Proposal Assistant:</strong> Get help drafting and tailoring proposals to specific funders.</p></div>
                            <div className="flex items-start"><TrendingUp className="h-6 w-6 text-green-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Funder Trend Analysis:</strong> See a funder's historical giving patterns to improve your strategy.</p></div>
                            <div className="flex items-start"><Filter className="h-6 w-6 text-orange-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Saved Searches & Alerts:</strong> Get notified when new grants matching your criteria are posted.</p></div>
                            <div className="flex items-start"><ShieldCheck className="h-6 w-6 text-red-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Eligibility Verifier:</strong> Use AI to quickly check if your organization meets a grant's criteria.</p></div>
                            <div className="flex items-start"><Users className="h-6 w-6 text-indigo-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Collaboration Space:</strong> Find and connect with other nonprofits for joint applications.</p></div>
                        </div>
                    </motion.div>
                </StorySection>

            </div>
        </div>
    );
};

export default ForNonprofitsPage;
