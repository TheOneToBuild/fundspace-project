// src/HowItWorksPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Users, Search, Handshake, ExternalLink, Calendar, Briefcase, BarChart3, TrendingUp, Filter, ShieldCheck, Heart, UserPlus, Zap } from './components/Icons.jsx';
import AnimatedShape from './components/AnimatedShape.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';

import fundervideo from './assets/funderrecording.mp4';
import grantvideo from './assets/grantvideo.mp4';
import nonprofits from './assets/nonprofits.mp4';

const STATIC_MEDIA = {
    engineIllustration: 'https://cdn.pixabay.com/photo/2018/03/27/21/43/startup-3267505_1280.jpg',
    findGrantsVideo: grantvideo,
    researchFundersVideo: fundervideo,
    connectCommunityVideo: nonprofits,
    gradients: [
        'from-purple-200 to-indigo-200',
        'from-sky-200 to-blue-200',
        'from-amber-100 to-yellow-200',
        'from-rose-200 to-pink-200',
        'from-teal-100 to-cyan-200',
        'from-lime-200 to-green-200',
        'from-orange-200 to-red-200',
        'from-violet-200 to-fuchsia-200',
    ]
};

// Reusable components
const StorySection = ({ children, className = '' }) => ( <motion.div className={`min-h-[85vh] w-full flex flex-col justify-center items-center py-16 md:py-24 relative ${className}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} transition={{ staggerChildren: 0.3 }}>{children}</motion.div>);
const DrawingLine = ({ path, className, ...props }) => ( <motion.svg className={`absolute z-0 pointer-events-none ${className}`} width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none" {...props}><motion.path d={path} fill="none" stroke="#A78BFA" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 'all' }} transition={{ duration: 2, ease: "easeInOut" }} /></motion.svg>);
const textFloatUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }};

const AnimatedGradientShape = ({ className, initial, animate, gradient }) => {
    return (
        <motion.div 
            className={`absolute hidden md:block rounded-full ${className} bg-gradient-to-br ${gradient}`} 
            initial={initial} 
            animate={animate} 
            transition={{
                duration: Math.random() * 10 + 8, 
                ease: 'easeInOut', 
                repeat: Infinity, 
                repeatType: 'reverse',
            }}
        />
    );
};


// Main Page Component
const HowItWorksPage = () => {
    return (
        <div className="bg-[#F8F3ED] text-[#333132] font-serif overflow-x-hidden">
            <div className="container mx-auto px-6 max-w-6xl">

                <StorySection>
                    {/* --- UPDATED: Added more gradient balls for a total of 6 --- */}
                    <AnimatedGradientShape className="w-48 h-48 top-[10%] left-[5%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} gradient={STATIC_MEDIA.gradients[0]} />
                    <AnimatedGradientShape className="w-20 h-20 top-[15%] right-[10%] z-0" initial={{ y: 10, x: -5 }} animate={{ y: -10, x: 5 }} gradient={STATIC_MEDIA.gradients[1]} />
                    <AnimatedGradientShape className="w-64 h-64 bottom-[5%] left-[10%] z-0" initial={{ y: 0 }} animate={{ y: -20 }} gradient={STATIC_MEDIA.gradients[2]} />
                    <AnimatedGradientShape className="w-32 h-32 bottom-[20%] right-[8%] z-0" initial={{ y: -10 }} animate={{ y: 10 }} gradient={STATIC_MEDIA.gradients[3]} />
                    <AnimatedGradientShape className="w-16 h-16 top-1/2 left-[20%] z-0" initial={{ scale: 1 }} animate={{ scale: 1.1 }} gradient={STATIC_MEDIA.gradients[4]} />
                    <AnimatedGradientShape className="w-12 h-12 bottom-[15%] right-[30%] z-0" initial={{ rotate: 0 }} animate={{ rotate: 180 }} gradient={STATIC_MEDIA.gradients[5]} />
                    
                    <div className="text-center z-20 relative">
                        <motion.div variants={textFloatUp}>
                            <div className="inline-block bg-orange-100 p-4 rounded-full shadow-lg">
                                <Search className="h-10 w-10 text-orange-600" />
                            </div>
                        </motion.div>
                        <motion.h1 variants={textFloatUp} className="text-5xl md:text-6xl text-slate-800 mt-4 font-bold">
                            Smarter Grantseeking Starts Here.
                        </motion.h1>
                        <motion.p variants={textFloatUp} className="font-sans text-xl text-slate-600 mt-6 max-w-3xl mx-auto leading-relaxed">
                            1RFP combines cutting-edge technology with the power of community to create the most efficient and comprehensive grant discovery platform for the Bay Area.
                        </motion.p>
                    </div>
                    
                    <DrawingLine path="M 250 400 C 250 500, 450 450, 450 500" className="w-[500px] h-[150px] bottom-0 left-1/2 -translate-x-1/2 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedGradientShape className="w-40 h-40 bottom-10 right-[25%] z-0" initial={{ y: 10 }} animate={{ y: -10 }} gradient={STATIC_MEDIA.gradients[2]} />
                    <DrawingLine path="M 50 0 C 50 50, 250 50, 250 100" className="w-[300px] h-[120px] top-0 left-1/4 z-0"/>
                    <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl mx-auto z-20 relative">
                        <motion.div variants={textFloatUp} className="md:w-1/2 text-left p-8">
                            <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">The <span className="text-blue-600">1RFP Engine</span></h2>
                            <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed">
                                Our unique hybrid approach ensures the data you see is timely, relevant, and comprehensive.
                            </p>
                            <div className="mt-6 space-y-4 font-sans">
                                <div className="flex items-start"><Bot className="h-7 w-7 text-blue-500 mr-4 flex-shrink-0" /><p><strong className="text-slate-700">AI-Powered Aggregation:</strong> Our engine scans thousands of public sources 24/7 to extract key grant information.</p></div>
                                <div className="flex items-start"><Users className="h-7 w-7 text-purple-500 mr-4 flex-shrink-0" /><p><strong className="text-slate-700">Community-Powered Accuracy:</strong> Users suggest edits and submit new opportunities, ensuring our data is always improving.</p></div>
                            </div>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="md:w-1/2"><img src={STATIC_MEDIA.engineIllustration} alt="Illustration of data and AI working together" className="w-full h-full object-contain"/></motion.div>
                    </div>
                    <DrawingLine path="M 480 400 C 480 500, 250 480, 250 500" className="w-[400px] h-[150px] bottom-0 right-1/4 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <DrawingLine path="M 250 0 C 250 50, 50 20, 50 100" className="w-[300px] h-[120px] top-0 left-1/2 -translate-x-1/2 z-0"/>
                    <motion.div variants={textFloatUp} className="text-center z-20 relative mb-12">
                        <h2 className="text-4xl md:text-5xl text-slate-800 font-bold">Your Grantseeking <span className="text-teal-500">Toolkit</span></h2>
                        <p className="font-sans text-xl text-slate-600 mt-4 leading-relaxed max-w-2xl mx-auto">Find what you need in just a few clicks.</p>
                    </motion.div>
                    
                    <div className="w-full max-w-6xl z-20 relative space-y-20">
                        {/* Step 1 */}
                        <motion.div variants={textFloatUp} className="flex flex-col items-center gap-8">
                            <div className="text-center md:w-4/5">
                                <span className="font-bold text-blue-600">STEP 1</span>
                                <h3 className="text-3xl font-bold mt-1">Find Your Next Grant</h3>
                                <p className="font-sans mt-2 text-slate-600 leading-relaxed">Use our powerful, intuitive search and filter bar to narrow down hundreds of opportunities. Filter by category, location, funding amount, and more to find the grants that are a perfect fit for your mission.</p>
                                <div className="mt-8">
                                    <Link to="/" className="font-sans inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                                        Explore Grants <Search size={20} className="ml-2" />
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full">
                                <video 
                                    src={STATIC_MEDIA.findGrantsVideo}
                                    className="w-full h-full object-contain rounded-lg shadow-xl"
                                    autoPlay loop muted playsInline
                                    alt="Video of scrolling through the grant search page"
                                />
                            </div>
                        </motion.div>
                        {/* Step 2 */}
                        <motion.div variants={textFloatUp} className="flex flex-col items-center gap-8">
                            <div className="text-center md:w-4/5">
                                <span className="font-bold text-green-600">STEP 2</span>
                                <h3 className="text-3xl font-bold mt-1">Research Potential Funders</h3>
                                <p className="font-sans mt-2 text-slate-600 leading-relaxed">Move beyond the grant to understand the funder. Our Funder Directory provides key insights into a foundation's giving history, focus areas, and average grant size, helping you build a more strategic fundraising pipeline.</p>
                                <div className="mt-8">
                                    <Link to="/funders" className="font-sans inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                                        Explore Funders <Users size={20} className="ml-2" />
                                    </Link>
                                </div>
                            </div>
                             <div className="w-full">
                                <video 
                                    src={STATIC_MEDIA.researchFundersVideo}
                                    className="w-full h-full object-contain rounded-lg shadow-xl"
                                    autoPlay loop muted playsInline
                                    alt="Video of scrolling through the funders page"
                                />
                            </div>
                        </motion.div>
                        {/* Step 3 */}
                        <motion.div variants={textFloatUp} className="flex flex-col items-center gap-8">
                            <div className="text-center md:w-4/5">
                                <span className="font-bold text-purple-600">STEP 3</span>
                                <h2 className="text-3xl font-bold mt-1">Connect with the Community</h2>
                                <p className="font-sans mt-2 text-slate-600 leading-relaxed">
                                    Explore the landscape of other nonprofits in your field. Use our Nonprofit Directory to identify potential collaborators, understand the ecosystem, and see where your organization fits into the bigger picture of social change in the Bay Area.
                                </p>
                                <div className="mt-8">
                                    <Link to="/nonprofits" className="font-sans inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                                        Explore Nonprofits <Handshake size={20} className="ml-2" />
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full">
                                 <video 
                                    src={STATIC_MEDIA.connectCommunityVideo}
                                    className="w-full h-full object-contain rounded-lg shadow-xl"
                                    autoPlay loop muted playsInline
                                    alt="Video of scrolling through the nonprofits page"
                                />
                            </div>
                        </motion.div>
                    </div>
                    <DrawingLine path="M 250 400 C 250 500, 450 450, 450 500" className="w-[500px] h-[150px] bottom-0 left-1/2 -translate-x-1/2 z-0"/>
                    <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
                </StorySection>

                <StorySection>
                    <AnimatedGradientShape className="w-24 h-24 top-10 left-[12%] z-0" initial={{ y: -15 }} animate={{ y: 15 }} gradient={STATIC_MEDIA.gradients[6]} />
                    <AnimatedGradientShape className="w-40 h-40 bottom-10 right-[10%] z-0" initial={{ y: 15 }} animate={{ y: -15 }} gradient={STATIC_MEDIA.gradients[0]} />
                    <div className="text-center z-20 relative">
                        <motion.h2 variants={textFloatUp} className="text-4xl md:text-5xl text-slate-800 font-bold">What's on the Horizon?</motion.h2>
                        <motion.p variants={textFloatUp} className="font-sans text-xl text-slate-600 mt-4 leading-relaxed max-w-3xl mx-auto">
                            We're building a full suite of tools to make the grant lifecycle easier for everyone.
                        </motion.p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto z-20 relative mt-12">
                        <motion.div variants={textFloatUp} className="bg-white p-8 rounded-lg border border-slate-200 shadow-lg flex flex-col">
                            <h3 className="text-2xl font-bold mb-4">For Nonprofits</h3>
                            <div className="space-y-4 font-sans text-slate-600 flex-grow">
                                <div className="flex items-start"><Calendar className="h-6 w-6 text-teal-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Grant Tracking:</strong> Save grants and manage deadlines in a personalized dashboard.</p></div>
                                <div className="flex items-start"><Bot className="h-6 w-6 text-sky-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">AI Proposal Assistant:</strong> Get help drafting and tailoring proposals to specific funders.</p></div>
                                <div className="flex items-start"><TrendingUp className="h-6 w-6 text-green-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Funder Trend Analysis:</strong> See a funder's historical giving patterns to improve your strategy.</p></div>
                                <div className="flex items-start"><Filter className="h-6 w-6 text-orange-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Saved Searches & Alerts:</strong> Get notified when new grants matching your criteria are posted.</p></div>
                                <div className="flex items-start"><ShieldCheck className="h-6 w-6 text-red-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Eligibility Verifier:</strong> Use AI to quickly check if your organization meets a grant's criteria.</p></div>
                                <div className="flex items-start"><Users className="h-6 w-6 text-indigo-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Collaboration Space:</strong> Find and connect with other nonprofits for joint applications.</p></div>
                            </div>
                            <div className="mt-8">
                                <Link to="/for-nonprofits" className="font-sans inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">Learn More</Link>
                            </div>
                        </motion.div>
                        <motion.div variants={textFloatUp} className="bg-white p-8 rounded-lg border border-slate-200 shadow-lg flex flex-col">
                            <h3 className="text-2xl font-bold mb-4">For Funders</h3>
                            <div className="space-y-4 font-sans text-slate-600 flex-grow">
                                <div className="flex items-start"><BarChart3 className="h-6 w-6 text-indigo-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Portfolio Analytics:</strong> Visualize your impact and gain insights into the funding landscape.</p></div>
                                <div className="flex items-start"><Briefcase className="h-6 w-6 text-green-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Streamlined Pipelines:</strong> Manage your opportunities and applicant funnel from a single dashboard.</p></div>
                                <div className="flex items-start"><Handshake className="h-6 w-6 text-purple-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Direct Connections:</strong> Engage directly with nonprofits and build relationships beyond the application.</p></div>
                                <div className="flex items-start"><UserPlus className="h-6 w-6 text-rose-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Targeted Outreach:</strong> Proactively invite specific types of nonprofits to apply for your grants.</p></div>
                                <div className="flex items-start"><Zap className="h-6 w-6 text-yellow-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Impact Tracking:</strong> Follow your grantees' progress and see the long-term impact of your funding.</p></div>
                                <div className="flex items-start"><Heart className="h-6 w-6 text-pink-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Anonymous Feedback:</strong> Receive anonymized feedback from applicants to improve your processes.</p></div>
                            </div>
                            <div className="mt-8">
                                <Link to="/for-funders" className="font-sans inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all">Learn More</Link>
                            </div>
                        </motion.div>
                         {/* --- UPDATED: "For the Community" Card --- */}
                         <motion.div variants={textFloatUp} className="bg-white p-8 rounded-lg border border-slate-200 shadow-lg flex flex-col">
                            <h3 className="text-2xl font-bold mb-4">For the Community</h3>
                            <div className="space-y-4 font-sans text-slate-600 flex-grow">
                                <div className="flex items-start"><Heart className="h-6 w-6 text-red-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Follow Nonprofits:</strong> Stay updated on the work of organizations you care about.</p></div>
                                <div className="flex items-start"><Users className="h-6 w-6 text-orange-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Community Forums:</strong> Discuss local issues and connect with passionate neighbors and leaders.</p></div>
                                <div className="flex items-start"><Zap className="h-6 w-6 text-yellow-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Direct Support:</strong> Discover opportunities to donate or volunteer for specific nonprofit campaigns.</p></div>
                                <div className="flex items-start"><Search className="h-6 w-6 text-blue-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Explore Impact:</strong> See how different funders and nonprofits are shaping your community.</p></div>
                                <div className="flex items-start"><Handshake className="h-6 w-6 text-purple-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Get Involved:</strong> Find local events, workshops, and volunteer drives happening near you.</p></div>
                                 <div className="flex items-start"><BarChart3 className="h-6 w-6 text-indigo-500 mr-4 flex-shrink-0 mt-1" /><p><strong className="text-slate-700">Local Data Hub:</strong> Access insights and data about the social sector in your county.</p></div>
                            </div>
                            <div className="mt-8">
                                <button disabled className="font-sans inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-slate-400 cursor-not-allowed">
                                    Coming Soon
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </StorySection>
                
            </div>
        </div>
    );
};

export default HowItWorksPage;
