// src/pages/ForNonprofitsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, Search, Calendar, Bot, BarChart3, Users, Handshake, TrendingUp, Filter, ShieldCheck } from './components/Icons.jsx';
import FunderCard from './components/FunderCard.jsx';
import AnimatedShape from './components/AnimatedShape.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';

// Kept all images exactly as you provided.
const STATIC_IMAGES = {
    heroIllustration: 'https://cdn.pixabay.com/photo/2017/08/01/20/52/happy-holidays-2567915_1280.jpg',
    painIllustration: 'https://cdn.pixabay.com/photo/2022/04/08/18/15/woman-7120016_640.jpg',
    circles: [
        'https://cdn.pixabay.com/photo/2020/02/28/10/17/fishing-net-4887070_640.jpg',
        'https://cdn.pixabay.com/photo/2015/07/17/22/43/student-849824_640.jpg',
        'https://cdn.pixabay.com/photo/2016/11/29/07/59/architecture-1868265_640.jpg',
        'https://cdn.pixabay.com/photo/2015/07/27/19/43/road-863298_640.jpg',
        'https://cdn.pixabay.com/photo/2019/05/12/15/59/parasurfing-4198392_640.jpg',
        'https://cdn.pixabay.com/photo/2023/05/21/20/30/sky-8009386_640.jpg', // Placeholder for potential new images
        'https://cdn.pixabay.com/photo/2017/08/08/00/59/nature-2609858_640.jpg',
    ],
    funderLogos: [
        'https://koret.org/wp-content/uploads/2018/01/twitter-koret-home.jpg', 
        'https://headwatersfoundation.org/wp-content/uploads/2020/04/HFJ-Logo-Strong-Arctic-Blue.png',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTytwjH8xshAT4ATgsXQlXzE8hcpbuNGZLmpA&s',
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

// Reusable components
// --- UPDATED: Reduced min-height for tighter scrolling ---
const StorySection = ({ children, className = '' }) => ( <motion.div className={`min-h-[90vh] w-full flex flex-col justify-center items-center py-16 md:py-24 relative ${className}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} transition={{ staggerChildren: 0.3 }}>{children}</motion.div>);
const DrawingLine = ({ path, className, ...props }) => ( <motion.svg className={`absolute z-0 pointer-events-none ${className}`} width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none" {...props}><motion.path d={path} fill="none" stroke="#A78BFA" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 'all' }} transition={{ duration: 2, ease: "easeInOut" }} /></motion.svg>);
const textFloatUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }};
const animatedH1 = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const animatedWord = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

// Main Page Component
const ForNonprofitsPage = ({ navigateToPage }) => {
    const handleDummyFilter = () => {};
    
    return (
        <div className="bg-[#F8F3ED] text-[#333132] font-serif overflow-x-hidden">
            <div className="container mx-auto px-6 max-w-7xl">

                <StorySection>
                    <AnimatedShape className="w-48 h-80 -top-5 left-[5%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} imageUrl={STATIC_IMAGES.circles[0]} />
                    <AnimatedShape className="w-30 h-40 top-10 right-[10%] z-0" initial={{ y: 10 }} animate={{ y: -10 }} imageUrl={STATIC_IMAGES.circles[1]} />
                    <AnimatedShape className="w-54 h-44 bottom-5 left-[15%] z-0" initial={{ y: 0 }} animate={{ y: -20 }} imageUrl={STATIC_IMAGES.circles[2]} />
                    <AnimatedShape className="w-55 h-40 bottom-[20%] right-[5%] z-0" initial={{ y: -10 }} animate={{ y: 10 }} imageUrl={STATIC_IMAGES.circles[3]} />
                    
                    <div className="text-center z-20 relative">
                        <motion.div variants={textFloatUp}><div className="inline-block bg-blue-100 p-4 rounded-full shadow-lg"><Briefcase className="h-10 w-10 text-blue-600" /></div></motion.div>
                        <motion.h1 variants={animatedH1} className="text-5xl md:text-6xl text-slate-800 mt-4 font-bold">
                            {"Less Prospecting.".split(" ").map((word, i) => <motion.span key={i} variants={animatedWord} className="inline-block mr-3">{word}</motion.span>)}
                            <br />
                            <motion.span variants={animatedWord} className="inline-block text-blue-600">More Impact.</motion.span>
                        </motion.h1>
                        <motion.p variants={textFloatUp} className="font-sans text-xl text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
                            Stop juggling dozens of websites. 1RFP centralizes Bay Area grant opportunities so you can focus on what matters most: your mission.
                        </motion.p>
                    </div>
                    
                    <DrawingLine path="M 250 400 C 250 500, 50 450, 50 500" className="w-[500px] h-[150px] bottom-0 left-[20%] z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedShape className="w-20 h-20 top-20 right-[20%] z-0" initial={{ y: -10 }} animate={{ y: 10 }} imageUrl={STATIC_IMAGES.circles[4]} />
                    <DrawingLine path="M 450 0 C 450 50, 250 50, 250 100" className="w-[300px] h-[120px] top-0 right-1/4 z-0"/>
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12 max-w-6xl mx-auto z-20 relative">
                        <motion.div variants={textFloatUp} className="md:w-1/2 text-left p-8">
                            <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">The Endless <span className="font-bold text-red-500">Search</span>.</h2>
                            <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed">
                                You know the drill. Countless hours lost to scattered foundation websites, outdated databases, and missed deadlines. It's a frustrating cycle that pulls you away from your actual work.
                            </p>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2"><img src={STATIC_IMAGES.painIllustration} alt="Illustration of a person overwhelmed by paperwork" className="w-full h-full object-contain"/></motion.div>
                    </div>
                    <DrawingLine path="M 20 400 C 20 500, 250 480, 250 500" className="w-[300px] h-[150px] bottom-0 left-1/4 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedShape className="w-56 h-56 top-10 right-[15%] z-0" initial={{ y: -15, scale: 1}} animate={{ y: 15, scale: 1.05}} imageUrl={STATIC_IMAGES.circles[5]} />
                    <DrawingLine path="M 250 0 C 250 50, 450 20, 450 100" className="w-[300px] h-[120px] top-0 right-1/2 -translate-x-1/2 z-0"/>
                    <motion.div variants={textFloatUp} className="text-center z-20 relative mb-12">
                        <div className="inline-block bg-green-100 p-4 rounded-full shadow-lg"><CheckCircle className="h-10 w-10 text-green-600" /></div>
                        <h2 className="text-4xl md:text-5xl text-slate-800 mt-4 font-bold">A <span className="font-bold text-green-600">Smarter</span> Way to Fundraise.</h2>
                        <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                            We centralize hundreds of Bay Area RFPs and provide powerful tools to help you find the right opportunities in minutes, not weeks. Discover funders who care about the work you do.
                        </p>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto z-20 relative">
                        {funderData.map((funder, index) => ( 
                            <motion.div variants={textFloatUp} key={funder.slug || index}>
                                <FunderCard funder={funder} handleFilterChange={handleDummyFilter} />
                            </motion.div> 
                        ))}
                    </div>
                    <DrawingLine path="M 450 400 C 450 500, 250 480, 250 500" className="w-[300px] h-[150px] bottom-0 right-1/4 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedShape className="w-28 h-28 bottom-20 left-[18%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} imageUrl={STATIC_IMAGES.circles[6]} />
                    <DrawingLine path="M 50 0 C 50 50, 250 50, 250 100" className="w-[300px] h-[120px] top-0 left-1/4 z-0"/>
                    <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl mx-auto z-20 relative">
                         <motion.div variants={textFloatUp} className="md:w-1/2 text-left p-8">
                           <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">Free, <span className="font-bold text-purple-600">Forever</span>. For Nonprofits.</h2>
                           <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed">
                               Our commitment is to the Bay Area's nonprofit sector. Access to our entire grant database and discovery tools will always be free for 501(c)(3) organizations. No trials, no tiers, no hidden fees.
                           </p>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2"><img src={STATIC_IMAGES.heroIllustration} alt="Illustration of finding opportunities" className="w-full h-full object-contain"/></motion.div>
                    </div>
                     <DrawingLine path="M 250 400 C 250 500, 450 450, 450 500" className="w-[500px] h-[150px] bottom-0 left-1/2 -translate-x-1/2 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>
                
                <StorySection>
                    <div className="text-center z-20 relative">
                        <motion.h2 variants={textFloatUp} className="text-4xl md:text-5xl text-slate-800 font-bold">What's on the Horizon?</motion.h2>
                        <motion.p variants={textFloatUp} className="font-sans text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                            We're building powerful new tools to give you an even greater advantage in your fundraising efforts.
                        </motion.p>
                    </div>
                    {/* --- UPDATED: Replaced with nonprofit-specific upcoming features --- */}
                    <motion.div variants={textFloatUp} className="bg-white p-8 md:p-12 mt-12 rounded-lg border border-slate-200 shadow-xl w-full max-w-4xl z-20 relative">
                        <h3 className="text-2xl font-bold mb-6 text-center">Upcoming Tools for Nonprofits</h3>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 font-sans text-slate-600">
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
