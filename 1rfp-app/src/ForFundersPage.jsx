// src/pages/ForFundersPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Feather, Heart, Users, UploadCloud, Loader, Briefcase, BarChart3, Handshake, UserPlus, Zap } from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';
import AnimatedShape from './components/AnimatedShape.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
// MODIFIED: Import the PublicPageLayout component
import PublicPageLayout from './components/PublicPageLayout.jsx';

const STATIC_IMAGES = {
    bridgeIllustration: 'https://cdn.pixabay.com/photo/2018/09/06/15/23/san-francisco-3658531_640.jpg',
    impactIllustration: 'https://cdn.pixabay.com/photo/2018/09/06/15/23/san-francisco-3658531_640.jpg',
    circles: [
        'https://cdn.pixabay.com/photo/2020/01/25/14/21/bay-bridge-4792657_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/06/25/00/51/sunrise-3495775_1280.jpg', 
        'https://cdn.pixabay.com/photo/2015/03/05/03/11/service-659805_640.jpg',
        'https://cdn.pixabay.com/photo/2016/03/18/15/21/help-1265227_1280.jpg',
    ],
    nonprofits: [
        'https://picsum.photos/seed/homeless-services/800/600',
        'https://picsum.photos/seed/womens-healthcare/800/600',
        'https://picsum.photos/seed/community-empowerment/800/600'
    ],
    gradients: [
        'from-pink-300 to-rose-300',
        'from-teal-200 to-cyan-200',
        'from-purple-300 to-indigo-300',
        'from-green-200 to-emerald-200',
        'from-amber-200 to-orange-300'
    ]
};

const nonprofitData = [
    { 
        slug: 'bay-area-rescue-mission',
        name: 'Bay Area Rescue Mission', 
        tagline: 'Transforming lives, one person at a time.',
        description: 'The Bay Area Rescue Mission provides comprehensive services to address homelessness and poverty...',
        location: 'San Francisco, CA',
        budget: '$6.2M',
        staff_count: '110',
        year_founded: '1936',
        impact_metric: 'Provides over 300,000 meals annually.',
        focusAreas: ['Homelessness', 'Poverty', 'Addiction Recovery'],
        imageUrl: STATIC_IMAGES.nonprofits[0]
    },
    { 
        slug: 'bay-area-womens-health-center',
        name: 'Bay Area Women\'s Health Center',
        tagline: 'Providing comprehensive reproductive healthcare.',
        description: 'The Bay Area Women\'s Health Center is dedicated to providing reproductive healthcare services...',
        location: 'San Francisco, CA',
        budget: '$3.8M',
        staff_count: '65',
        year_founded: '1975',
        impact_metric: 'Serves over 15,000 patients annually.',
        focusAreas: ['Community Health', 'Sexual Health', 'Women\'s Health'],
        imageUrl: STATIC_IMAGES.nonprofits[1]
    },
    { 
        slug: 'bay-area-womens-resource-center',
        name: 'Bay Area Women\'s Resource Center',
        tagline: 'Supporting and empowering women in the Bay Area.',
        description: 'BAWRC is a non-profit organization focused on supporting and empowering women...',
        location: 'San Francisco, CA',
        budget: '$2.1M',
        staff_count: '40',
        year_founded: '1978',
        impact_metric: 'Provides job training to over 2,000 women each year.',
        focusAreas: ['Community Support', 'Legal Aid', 'Women\'s Empowerment'],
        imageUrl: STATIC_IMAGES.nonprofits[2]
    },
];

const nonprofitCountyData = [
    { name: "Santa Clara", count: 6835, icon: Users, color: "text-indigo-500" },
    { name: "Alameda", count: 8542, icon: Users, color: "text-green-500" },
    { name: "Contra Costa", count: 4350, icon: Users, color: "text-rose-500" },
    { name: "San Francisco", count: 7211, icon: Users, color: "text-sky-500" },
    { name: "San Mateo", count: 3490, icon: Users, color: "text-amber-500" },
    { name: "Sonoma", count: 3125, icon: Users, color: "text-pink-500" },
    { name: "Solano", count: 1543, icon: Users, color: "text-cyan-500" },
    { name: "Marin", count: 2108, icon: Users, color: "text-violet-500" },
    { name: "Napa", count: 896, icon: Users, color: "text-red-500" },
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

const ForFundersPage = () => {
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleGrantSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setMessage({ type: 'success', text: 'Thank you! Your submission has been received.' });
            setIsSubmitting(false);
            setUrl('');
            setNotes('');
        }, 1500);
    };
    
    // No-op for now, can be replaced with real filter logic if needed
    const handleFilterChange = () => {};

    return (
        // MODIFIED: Wrap the component in PublicPageLayout and provide the gradient class
        <PublicPageLayout bgColor="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
            {/* MODIFIED: Removed the hardcoded background class from this div */}
            <div className="text-[#333132] font-serif overflow-x-hidden">
                <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

                    <StorySection>
                        <AnimatedShape className="w-32 h-44 top-16 left-[10%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} imageUrl={STATIC_IMAGES.circles[1]} />
                        <AnimatedShape className="w-28 h-28 -top-5 right-[5%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} imageUrl={STATIC_IMAGES.circles[0]} />
                        
                        <div className="text-center z-20 relative">
                            <motion.div variants={textFloatUp}><div className="inline-block bg-purple-100 p-4 rounded-full shadow-lg"><Heart className="h-8 sm:h-10 w-8 sm:h-10 text-purple-600" /></div></motion.div>
                            <motion.h1 variants={animatedH1} className="text-4xl sm:text-5xl md:text-6xl text-slate-800 mt-4 font-bold">
                                {"It Starts with a".split(" ").map((word, i) => <motion.span key={i} variants={animatedWord} className="inline-block mr-2 sm:mr-3">{word}</motion.span>)}
                                <motion.span variants={animatedWord} className="inline-block text-pink-500">Vision.</motion.span>
                            </motion.h1>
                            <motion.p variants={textFloatUp} className="font-sans text-lg sm:text-xl text-slate-600 mt-6 max-w-xl mx-auto leading-relaxed">You see a better future for the Bay Area. Your funding is the spark. We help it find the right place to land.</motion.p>
                        </div>
                        
                        <motion.div 
                            variants={textFloatUp}
                            className="mt-12 w-full max-w-5xl"
                        >
                            <h3 className="text-center font-sans text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Nonprofit Landscape by County</h3>
                            <div className="grid grid-cols-3 gap-x-4 gap-y-8">
                                {nonprofitCountyData.map(county => (
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
                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto z-20 relative">
                            <motion.div variants={textFloatUp} className="md:w-1/2 text-center md:text-left">
                                <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">We <span className="font-bold text-pink-500">Build</span> the Bridge.</h2>
                                <p className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed">The gap between a great idea and a community in need can be vast. We connect you to the passionate, on-the-ground leaders already working towards the future you envision.</p>
                            </motion.div>
                            <motion.div variants={textFloatUp} className="md:w-1/2 w-full">
                                <div className="aspect-w-16 aspect-h-9 rounded-lg shadow-xl overflow-hidden">
                                    <img src={STATIC_IMAGES.bridgeIllustration} alt="Diverse hands coming together in collaboration" className="w-full h-full object-cover" />
                                </div>
                            </motion.div>
                        </div>
                        <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                    </StorySection>

                    <StorySection>
                        <AnimatedGradientShape className="w-80 h-80 bottom-10 left-10" initial={{ y: 20, x: 15 }} animate={{ y: -20, x: -15 }} gradient={STATIC_IMAGES.gradients[1]} />
                        <AnimatedGradientShape className="w-48 h-48 top-10 right-16" initial={{ scale: 0.9 }} animate={{ scale: 1.1 }} gradient={STATIC_IMAGES.gradients[3]} />
                        <motion.div variants={textFloatUp} className="text-center z-20 relative mb-12">
                            <div className="inline-block bg-green-100 p-4 rounded-full shadow-lg"><Users className="h-8 sm:h-10 w-8 sm:h-10 text-green-600" /></div>
                            <h2 className="text-4xl md:text-5xl text-slate-800 mt-4 font-bold">Find the Right <span className="font-bold text-teal-500">Match</span>.</h2>
                            <p className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed max-w-2xl mx-auto">Discover the grassroots innovators aligned with your mission.</p>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto z-20 relative">
                            {nonprofitData.map((nonprofit, index) => ( 
                                <motion.div variants={textFloatUp} key={nonprofit.slug || index}>
                                    <OrganizationCard 
                                        key={nonprofit.id}
                                        organization={nonprofit}
                                        handleFilterChange={handleFilterChange}
                                        linkTo={`/nonprofits/${nonprofit.slug}`}
                                        buttonText="View Profile"
                                    />
                                </motion.div> 
                            ))}
                        </div>
                        <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                    </StorySection>

                    <StorySection>
                        <AnimatedGradientShape className="w-64 h-64 top-20 right-20" initial={{ scale: 0.9, rotate: 45 }} animate={{ scale: 1.1, rotate: -45 }} gradient={STATIC_IMAGES.gradients[2]} />
                        <AnimatedGradientShape className="w-32 h-32 bottom-16 left-24" initial={{ scale: 1.1 }} animate={{ scale: 0.9 }} gradient={STATIC_IMAGES.gradients[0]} />
                        <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto z-20 relative">
                            <motion.div variants={textFloatUp} className="md:w-1/2 text-center md:text-left">
                            <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">Create <span className="font-bold text-sky-500">Transformational</span> Change.</h2>
                            <p className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed">When your vision connects with the right partner, the impact is real. It's a newly painted mural, a protected coastline, or a new career path. It's a story you can see and feel.</p>
                            </motion.div>
                            <motion.div variants={textFloatUp} className="md:w-1/2 w-full">
                                <div className="aspect-w-16 aspect-h-9 rounded-lg shadow-xl overflow-hidden">
                                <img src={STATIC_IMAGES.impactIllustration} alt="People collaborating in community work" className="w-full h-full object-cover"/>
                            </div>
                            </motion.div>
                        </div>
                        <ScrollArrow className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                    </StorySection>
                    
                    <StorySection>
                        <AnimatedGradientShape className="w-72 h-72 -bottom-24 left-1/4" initial={{ x: -20 }} animate={{ x: 20 }} gradient={STATIC_IMAGES.gradients[3]} />
                        <AnimatedGradientShape className="w-48 h-48 top-10 right-1/4" initial={{ y: 20 }} animate={{ y: -20 }} gradient={STATIC_IMAGES.gradients[4]} />
                        <motion.div variants={textFloatUp} className="bg-white rounded-xl p-6 sm:p-8 md:p-12 border border-slate-200 shadow-xl w-full max-w-4xl z-20 relative">
                            <div className="text-center">
                                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Submit a Grant Opportunity</h2>
                                <p className="text-lg text-slate-600 font-sans">Found an RFP we missed? Add it to our database.</p>
                            </div>
                            <form onSubmit={handleGrantSubmit} className="mt-8 space-y-6">
                                <div><label htmlFor="grant-url" className="block text-sm font-medium text-slate-700 mb-1 font-sans">Grant URL <span className="text-red-500">*</span></label><input id="grant-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://foundation.org/grants/apply" required className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none font-sans" /></div>
                                <div><label htmlFor="grant-notes" className="block text-sm font-medium text-slate-700 mb-1 font-sans">Optional Notes</label><textarea id="grant-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="e.g., 'For arts education', 'Deadline is rolling'" className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none font-sans"></textarea></div>
                                <div><button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-md disabled:bg-green-400 font-sans">{isSubmitting ? <><Loader className="animate-spin h-5 w-5 mr-3" />Submitting...</> : <>Submit Grant <UploadCloud className="h-5 w-5 ml-2" /></>}</button></div>
                            </form>
                            {message.text && (<div className={`mt-6 text-center p-4 rounded-md text-sm font-sans ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>)}
                        </motion.div>
                    </StorySection>

                    <StorySection>
                        <div className="text-center z-20 relative">
                            <motion.h2 variants={textFloatUp} className="text-4xl md:text-5xl text-slate-800 font-bold">And We're Just Getting Started.</motion.h2>
                            <motion.p variants={textFloatUp} className="font-sans text-lg sm:text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                                What's ahead? A dedicated platform for funders to connect, analyze, and manage their grant-making portfolio.
                            </motion.p>
                        </div>

                        <motion.div 
                            variants={textFloatUp} 
                            className="bg-white p-6 sm:p-8 md:p-12 mt-12 rounded-lg border border-slate-200 shadow-xl w-full max-w-5xl z-20 relative"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 font-sans text-slate-600">
                                <div className="flex items-start">
                                    <BarChart3 className="h-7 w-7 text-indigo-500 mr-4 flex-shrink-0 mt-1" />
                                    <p><strong className="text-slate-700">Portfolio Analytics:</strong> Visualize your impact and gain insights into the funding landscape.</p>
                                </div>
                                <div className="flex items-start">
                                    <Briefcase className="h-7 w-7 text-green-500 mr-4 flex-shrink-0 mt-1" />
                                    <p><strong className="text-slate-700">Streamlined Pipelines:</strong> Manage your opportunities and applicant funnel from a single dashboard.</p>
                                </div>
                                <div className="flex items-start">
                                    <Handshake className="h-7 w-7 text-purple-500 mr-4 flex-shrink-0 mt-1" />
                                    <p><strong className="text-slate-700">Direct Connections:</strong> Engage directly with nonprofits and build relationships beyond the application.</p>
                                </div>
                                <div className="flex items-start">
                                    <UserPlus className="h-7 w-7 text-rose-500 mr-4 flex-shrink-0 mt-1" />
                                    <p><strong className="text-slate-700">Targeted Outreach:</strong> Proactively invite specific types of nonprofits to apply for your grants.</p>
                                </div>
                                <div className="flex items-start">
                                    <Zap className="h-7 w-7 text-yellow-500 mr-4 flex-shrink-0 mt-1" />
                                    <p><strong className="text-slate-700">Impact Tracking:</strong> Follow your grantees' progress and see the long-term impact of your funding.</p>
                                </div>
                                <div className="flex items-start">
                                    <Heart className="h-7 w-7 text-pink-500 mr-4 flex-shrink-0 mt-1" />
                                    <p><strong className="text-slate-700">Anonymous Feedback:</strong> Receive anonymized feedback from applicants to improve your processes.</p>
                                </div>
                            </div>
                        </motion.div>
                    </StorySection>

                </div>
            </div>
        </PublicPageLayout>
    );
};

export default ForFundersPage;