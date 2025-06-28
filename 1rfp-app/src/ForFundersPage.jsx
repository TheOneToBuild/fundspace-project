// src/pages/ForFundersPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Feather, Heart, Users, UploadCloud, Loader, Briefcase, BarChart3, Handshake, UserPlus, Zap } from './components/Icons.jsx';
import NonprofitCard from './components/NonprofitCard.jsx';
import AnimatedShape from './components/AnimatedShape.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';

// Reliable static media using a mix of video and image sources for engagement
// Videos from reliable CDN sources, fallback images from Lorem Picsum
const STATIC_IMAGES = {
    // High-quality videos for key sections - using reliable CDN sources
    bridgeIllustration: 'https://cdn.pixabay.com/photo/2018/09/06/15/23/san-francisco-3658531_640.jpg', // Hands coming together/collaboration
    impactIllustration: 'https://cdn.pixabay.com/photo/2018/09/06/15/23/san-francisco-3658531_640.jpg', // Community impact/helping hands
    
    
    // Bay Area themed images using Lorem Picsum with location-based seeds
    circles: [
        // San Francisco landmarks and Bay Area scenes
        'https://cdn.pixabay.com/photo/2020/01/25/14/21/bay-bridge-4792657_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/06/25/00/51/sunrise-3495775_1280.jpg', 
        'https://cdn.pixabay.com/photo/2015/03/05/03/11/service-659805_640.jpg',
        'https://cdn.pixabay.com/photo/2016/03/18/15/21/help-1265227_1280.jpg',
        'https://cdn.pixabay.com/photo/2016/11/29/06/20/blonde-1867768_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/10/04/09/56/chemist-2815640_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/03/31/14/40/philippines-2191489_640.jpg',
        'https://cdn.pixabay.com/photo/2017/04/15/23/40/cambodia-2233637_640.jpg',
        'https://cdn.pixabay.com/photo/2023/02/16/06/18/elderly-7793090_640.jpg',
        'https://cdn.pixabay.com/photo/2020/03/18/20/01/frankfurt-4945405_640.jpg',
        'https://cdn.pixabay.com/photo/2015/09/26/13/50/san-francisco-959108_640.jpg',
        'https://cdn.pixabay.com/photo/2019/05/15/23/34/welcome-4206177_640.jpg',
        'https://cdn.pixabay.com/photo/2021/04/24/00/44/belief-6202977_640.jpg',
    ],
    
    // Nonprofit and community themed images
    nonprofits: [
        'https://picsum.photos/seed/homeless-services/800/600',
        'https://picsum.photos/seed/womens-healthcare/800/600',
        'https://picsum.photos/seed/community-empowerment/800/600'
    ]
};

// Hardcoded nonprofit data for instant loading, based on your latest screenshot
const nonprofitData = [
    { 
        slug: 'bay-area-rescue-mission',
        name: 'Bay Area Rescue Mission', 
        tagline: 'Transforming lives, one person at a time.',
        description: 'The Bay Area Rescue Mission provides comprehensive services to address homelessness and poverty in the San Francisco Bay Area. Their services include emergency shelter, food programs,...',
        location: 'San Francisco, CA',
        budget: '$6.2M',
        staff_count: '110',
        year_founded: '1936',
        impact_metric: 'Provides over 300,000 meals and 80,000 nights of shelter annually.',
        focusAreas: ['Homelessness', 'Poverty', 'Addiction Recovery'],
        imageUrl: STATIC_IMAGES.nonprofits[0]
    },
    { 
        slug: 'bay-area-womens-health-center',
        name: 'Bay Area Women\'s Health Center',
        tagline: 'Providing comprehensive reproductive healthcare.',
        description: 'The Bay Area Women\'s Health Center is a non-profit organization dedicated to providing comprehensive reproductive healthcare services to women in the San Francisco Bay Area, regardless of...',
        location: 'San Francisco, CA',
        budget: '$3.8M',
        staff_count: '65',
        year_founded: '1975',
        impact_metric: 'Serves over 15,000 patients annually with a focus on preventative care.',
        focusAreas: ['Community Health', 'Sexual Health', 'Women\'s Health', 'Reproductive Healthcare'],
        imageUrl: STATIC_IMAGES.nonprofits[1]
    },
    { 
        slug: 'bay-area-womens-resource-center',
        name: 'Bay Area Women\'s Resource Center',
        tagline: 'Supporting and empowering women in the Bay Area.',
        description: 'The Bay Area Women\'s Resource Center (BAWRC) is a non-profit organization focused on supporting and empowering women in the Bay Area. The Center offers a wide array of services design...',
        location: 'San Francisco, CA',
        budget: '$2.1M',
        staff_count: '40',
        year_founded: '1978',
        impact_metric: 'Provides job training and legal aid to over 2,000 women each year.',
        focusAreas: ['Community Support', 'Legal Aid', 'Women\'s Empowerment', 'Domestic Violence Prevention', 'Mental Health Support'],
        imageUrl: STATIC_IMAGES.nonprofits[2]
    },
];

// Reusable components for story layout
const StorySection = ({ children, className = '' }) => ( <motion.div className={`min-h-screen w-full flex flex-col justify-center items-center py-20 md:py-28 relative ${className}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} transition={{ staggerChildren: 0.3 }}>{children}</motion.div>);
const DrawingLine = ({ path, className, ...props }) => ( <motion.svg className={`absolute z-0 pointer-events-none ${className}`} width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none" {...props}><motion.path d={path} fill="none" stroke="#A78BFA" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 'all' }} transition={{ duration: 2, ease: "easeInOut" }} /></motion.svg>);
const textFloatUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }};
const animatedH1 = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const animatedWord = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

// Main Page Component
const ForFundersPage = ({ navigateToPage }) => {
    const handleDummyFilter = () => {};
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
    
    return (
        <div className="bg-[#F8F3ED] text-[#333132] font-serif overflow-x-hidden">
            <div className="container mx-auto px-6 max-w-7xl">

                <StorySection>
                    <AnimatedShape className="w-144 h-44 top-[15%] left-[8%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} imageUrl={STATIC_IMAGES.circles[10]} />
                    <AnimatedShape className="w-98 h-80 -top-5 right-[5%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} imageUrl={STATIC_IMAGES.circles[0]} />
                    <AnimatedShape className="w-64 h-64 bottom-5 left-[8%] z-0" initial={{ y: 0 }} animate={{ y: -20 }} imageUrl={STATIC_IMAGES.circles[1]} />
                    <AnimatedShape className="w-132 h-40 bottom-[25%] right-[5%] z-0" initial={{ y: 0, x: 10 }} animate={{ y: -15, x: -10 }} imageUrl={STATIC_IMAGES.circles[2]} />
                    
                    <div className="text-center z-20 relative">
                        <motion.div variants={textFloatUp}><div className="inline-block bg-purple-100 p-4 rounded-full shadow-lg"><Heart className="h-10 w-10 text-purple-600" /></div></motion.div>
                        <motion.h1 variants={animatedH1} className="text-5xl md:text-6xl text-slate-800 mt-4 font-bold">
                            {"It Starts with a".split(" ").map((word, i) => <motion.span key={i} variants={animatedWord} className="inline-block mr-3">{word}</motion.span>)}
                            <motion.span variants={animatedWord} className="inline-block text-pink-500">Vision.</motion.span>
                        </motion.h1>
                        <motion.p variants={textFloatUp} className="font-sans text-xl text-slate-600 mt-6 max-w-xl mx-auto leading-relaxed">You see a better future for the Bay Area. Your funding is the spark. We help it find the right place to land.</motion.p>
                    </div>
                    
                    <DrawingLine path="M 250 400 C 250 500, 450 450, 450 500" className="w-[500px] h-[150px] bottom-0 left-1/2 -translate-x-1/2 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedShape className="w-20 h-20 top-20 left-[20%] z-0" initial={{ y: -10 }} animate={{ y: 10 }} imageUrl={STATIC_IMAGES.circles[3]} />
                    <AnimatedShape className="w-40 h-40 bottom-10 right-[5%] z-0" initial={{ y: 10 }} animate={{ y: -10 }} imageUrl={STATIC_IMAGES.circles[4]} />
                    <DrawingLine path="M 50 0 C 50 50, 250 50, 250 100" className="w-[300px] h-[120px] top-0 left-1/4 z-0"/>
                    <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl mx-auto z-20 relative">
                        <motion.div variants={textFloatUp} className="md:w-1/2 text-left p-8">
                            <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">We <span className="font-bold text-pink-500">Build</span> the Bridge.</h2>
                            <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed">The gap between a great idea and a community in need can be vast. We connect you to the passionate, on-the-ground leaders already working towards the future you envision.</p>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2">
                            <video 
                                src={STATIC_IMAGES.bridgeIllustration} 
                                alt="Diverse hands coming together in collaboration" 
                                className="w-full h-full object-cover rounded-lg shadow-xl"
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                onError={(e) => {
                                    // Fallback to alternative video source if main fails
                                    e.target.src = STATIC_IMAGES.bridgeIllustrationAlt;
                                    e.target.onerror = () => {
                                        // Ultimate fallback to static image
                                        e.target.outerHTML = `<img src="https://cdn.pixabay.com/photo/2016/03/05/10/02/san-francisco-1237484_960_720.jpg" alt="Diverse hands coming together in collaboration" className="w-full h-full object-cover rounded-lg shadow-xl" />`;
                                    };
                                }}
                            />
                        </motion.div>
                    </div>
                    <DrawingLine path="M 480 400 C 480 500, 250 480, 250 500" className="w-[400px] h-[150px] bottom-0 right-1/4 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedShape className="w-56 h-56 top-5 left-[5%] z-0" initial={{ y: -15, scale: 1}} animate={{ y: 15, scale: 1.05}} imageUrl={STATIC_IMAGES.circles[8]} />
                    <AnimatedShape className="w-32 h-32 bottom-12 right-[10%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} imageUrl={STATIC_IMAGES.circles[9]} />
                    <DrawingLine path="M 250 0 C 250 50, 50 20, 50 100" className="w-[300px] h-[120px] top-0 left-1/2 -translate-x-1/2 z-0"/>
                    <motion.div variants={textFloatUp} className="text-center z-20 relative mb-12">
                        <div className="inline-block bg-green-100 p-4 rounded-full shadow-lg"><Users className="h-10 w-10 text-green-600" /></div>
                        <h2 className="text-4xl md:text-5xl text-slate-800 mt-4 font-bold">Find the Right <span className="font-bold text-teal-500">Match</span>.</h2>
                        <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed max-w-2xl mx-auto">Discover the grassroots innovators aligned with your mission.</p>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto z-20 relative">
                        {nonprofitData.map((nonprofit, index) => ( 
                            <motion.div variants={textFloatUp} key={nonprofit.slug || index}>
                                <NonprofitCard nonprofit={nonprofit} handleFilterChange={handleDummyFilter} />
                            </motion.div> 
                        ))}
                    </div>
                    <DrawingLine path="M 50 400 C 50 500, 250 480, 250 500" className="w-[300px] h-[150px] bottom-0 left-1/4 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedShape className="w-24 h-24 top-10 right-[15%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} imageUrl={STATIC_IMAGES.circles[5]} />
                    <AnimatedShape className="w-28 h-28 bottom-20 left-[18%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} imageUrl={STATIC_IMAGES.circles[6]} />
                    <DrawingLine path="M 450 0 C 450 50, 250 50, 250 100" className="w-[300px] h-[120px] top-0 right-1/4 z-0"/>
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12 max-w-6xl mx-auto z-20 relative">
                        <motion.div variants={textFloatUp} className="md:w-1/2 text-left p-8">
                           <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">Create <span className="font-bold text-sky-500">Transformational</span> Change.</h2>
                           <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed">When your vision connects with the right partner, the impact is real. It's a newly painted mural, a protected coastline, or a new career path. It's a story you can see and feel.</p>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2">
                            <video 
                                src={STATIC_IMAGES.impactIllustration} 
                                alt="People collaborating in community work" 
                                className="w-full h-full object-cover rounded-lg shadow-xl"
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                onError={(e) => {
                                    // Fallback to alternative video source if main fails
                                    e.target.src = STATIC_IMAGES.impactIllustrationAlt;
                                    e.target.onerror = () => {
                                        // Ultimate fallback to static image
                                        e.target.outerHTML = `<img src="https://cdn.pixabay.com/photo/2023/08/04/07/22/people-8168554_640.jpg" alt="People collaborating in community work" className="w-full h-full object-cover rounded-lg shadow-xl" />`;
                                    };
                                }}
                            />
                        </motion.div>
                    </div>
                    <DrawingLine path="M 250 400 C 250 500, 450 450, 450 500" className="w-[500px] h-[150px] bottom-0 left-1/2 -translate-x-1/2 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>
                
                <StorySection>
                    <AnimatedShape className="w-20 h-20 -top-10 left-[10%] z-0" initial={{ y: -10 }} animate={{ y: 10 }} imageUrl={STATIC_IMAGES.circles[7]} />
                    <AnimatedShape className="w-32 h-32 -bottom-10 right-[5%] z-0" initial={{ y: 10 }} animate={{ y: -10 }} imageUrl={STATIC_IMAGES.circles[11]} />
                    <motion.div variants={textFloatUp} className="bg-white rounded-xl p-8 md:p-12 border border-slate-200 shadow-xl w-full max-w-4xl z-20 relative">
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
                    <DrawingLine path="M 250 400 C 250 500, 450 450, 450 500" className="w-[500px] h-[150px] bottom-0 left-1/2 -translate-x-1/2 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                {/* --- UPDATED: This section is now expanded --- */}
                <StorySection>
                    <AnimatedShape className="w-24 h-24 top-10 left-[12%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} imageUrl={STATIC_IMAGES.circles[12]} />
                    <AnimatedShape className="w-40 h-40 bottom-10 right-[10%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} imageUrl={STATIC_IMAGES.circles[0]} />
                    <div className="text-center z-20 relative">
                        <motion.h2 variants={textFloatUp} className="text-4xl md:text-5xl text-slate-800 font-bold">And We're Just Getting Started.</motion.h2>
                        <motion.p variants={textFloatUp} className="font-sans text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                            What's ahead? A dedicated platform for funders to connect, analyze, and manage their grant-making portfolio.
                        </motion.p>
                    </div>

                    <motion.div 
                        variants={textFloatUp} 
                        className="bg-white p-8 md:p-12 mt-12 rounded-lg border border-slate-200 shadow-xl w-full max-w-5xl z-20 relative"
                    >
                        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 font-sans text-slate-600">
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
    );
};

export default ForFundersPage;