// src/HowItWorksPage.jsx
import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Users, Search, Handshake, Calendar, Briefcase, BarChart3, TrendingUp, Filter, ShieldCheck, Heart, UserPlus, Zap, Award, DollarSign, Sparkles, ArrowRight, CheckCircle2, Target, MessageSquare } from './components/Icons.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { LayoutContext } from './App.jsx';

import fundervideo from './assets/funderrecording.mp4';
import grantvideo from './assets/grantvideo.mp4';
import nonprofits from './assets/nonprofits.mp4';

const STATIC_MEDIA = {
    engineIllustration: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    findGrantsVideo: grantvideo,
    researchFundersVideo: fundervideo,
    connectCommunityVideo: nonprofits,
};

const platformStats = [
    { label: "Grants Listed", value: 1250, icon: Award, color: "text-blue-500", format: val => val.toLocaleString() + '+' },
    { label: "Funders Profiled", value: 8000, icon: Briefcase, color: "text-green-500", format: val => val.toLocaleString() + '+' },
    { label: "Nonprofits", value: 33000, icon: Users, color: "text-rose-500", format: val => val.toLocaleString() + '+' },
    { label: "In Annual Funding", value: 13000000000, icon: DollarSign, color: "text-amber-500", format: val => `$${(val / 1000000000).toFixed(0)}B+` },
];

const StorySection = ({ children, className = '' }) => ( 
    <motion.div 
        className={`w-full flex flex-col justify-center items-center py-16 md:py-20 relative ${className}`} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        transition={{ staggerChildren: 0.3 }}
    >
        {children}
    </motion.div>
);

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

const HowItWorksPage = () => {
    const { setPageBgColor } = useContext(LayoutContext);

    useEffect(() => {
        setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
        return () => {
            setPageBgColor('bg-white');
        };
    }, [setPageBgColor]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* HERO SECTION */}
            <section className="text-center mb-16 relative">
                {/* Magical background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
                    <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-rose-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
                    <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
                </div>
                
                <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
                    <motion.div variants={fadeIn} className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center border border-orange-200 shadow-lg">
                        <Search className="h-10 w-10 text-orange-600" />
                    </motion.div>
                    
                    <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="text-slate-900">Smarter Grantseeking </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                            Starts Here
                        </span>
                    </motion.h1>
                    
                    <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="text-lg md:text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                        Fundspace combines cutting-edge technology with the power of community to create the most efficient and comprehensive grant discovery platform for the Bay Area.
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Technology that empowers, not overwhelms.</span>
                    </motion.p>

                    {/* Platform Stats */}
                    <motion.div 
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-12 w-full max-w-4xl mx-auto"
                    >
                        {platformStats.map(stat => (
                            <motion.div variants={fadeIn} key={stat.label} className="text-center">
                                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${
                                    stat.color.includes('blue') ? 'from-blue-100 to-indigo-100 border-blue-200' :
                                    stat.color.includes('green') ? 'from-green-100 to-emerald-100 border-green-200' :
                                    stat.color.includes('rose') ? 'from-rose-100 to-pink-100 border-rose-200' :
                                    'from-amber-100 to-yellow-100 border-amber-200'
                                } rounded-2xl flex items-center justify-center border shadow-lg`}>
                                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                </div>
                                <AnimatedCounter targetValue={stat.value} formatValue={stat.format} className="text-3xl sm:text-4xl font-bold text-slate-700" />
                                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* THE Fundspace ENGINE SECTION */}
            <StorySection>
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
                    <motion.div variants={fadeIn} className="text-left">
                        <div className="inline-block bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-2xl mb-6 border border-blue-200">
                            <Bot className="h-10 w-10 text-blue-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Fundspace Engine</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Our unique hybrid approach ensures the data you see is timely, relevant, and comprehensive. We've built technology that serves community, not the other way around.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200 flex-shrink-0">
                                    <Bot className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">AI-Powered Aggregation</h3>
                                    <p className="text-slate-600">Our engine scans thousands of public sources 24/7 to extract key grant information, ensuring you never miss an opportunity.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200 flex-shrink-0">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Community-Powered Accuracy</h3>
                                    <p className="text-slate-600">Users suggest edits and submit new opportunities, ensuring our data is always improving through collective intelligence.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="relative">
                        <img 
                            src={STATIC_MEDIA.engineIllustration} 
                            alt="Illustration of data and AI working together" 
                            className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-2xl"></div>
                    </motion.div>
                </div>
            </StorySection>

            {/* YOUR GRANTSEEKING TOOLKIT SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">Your Grantseeking </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">Toolkit</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Find what you need in just a few clicks. Our platform is designed to be intuitive, powerful, and focused on results.
                    </p>
                </motion.div>
                
                <div className="w-full max-w-7xl space-y-20">
                    {/* Step 1 - Find Grants */}
                    <motion.div variants={fadeIn} className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                STEP ONE
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Find Your Next Grant</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Use our powerful, intuitive search and filter system to narrow down hundreds of opportunities. Filter by category, location, funding amount, and more to find grants that perfectly match your mission.
                            </p>
                            <Link 
                                to="/grants" 
                                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Search className="mr-2" size={20} />
                                Explore Grants
                            </Link>
                        </div>
                        <div className="relative">
                            <video 
                                src={STATIC_MEDIA.findGrantsVideo} 
                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent rounded-2xl pointer-events-none"></div>
                        </div>
                    </motion.div>

                    {/* Step 2 - Research Funders */}
                    <motion.div variants={fadeIn} className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <video 
                                src={STATIC_MEDIA.researchFundersVideo} 
                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-green-600/10 to-transparent rounded-2xl pointer-events-none"></div>
                        </div>
                        <div className="order-1 lg:order-2 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                STEP TWO
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Research Potential Funders</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Move beyond the grant to understand the funder. Our Funder Directory provides key insights into giving history, focus areas, and average grant sizes to help you build a strategic fundraising pipeline.
                            </p>
                            <Link 
                                to="/organizations?prefilter=foundation" 
                                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Users className="mr-2" size={20} />
                                Explore Funders
                            </Link>
                        </div>
                    </motion.div>

                    {/* Step 3 - Connect with Community */}
                    <motion.div variants={fadeIn} className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                STEP THREE
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Connect with the Community</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Explore the landscape of other nonprofits in your field. Use our Nonprofit Directory to identify potential collaborators, understand the ecosystem, and see where your organization fits into the bigger picture of Bay Area social change.
                            </p>
                            <Link 
                                to="/organizations" 
                                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Handshake className="mr-2" size={20} />
                                Explore Organizations
                            </Link>
                        </div>
                        <div className="relative">
                            <video 
                                src={STATIC_MEDIA.connectCommunityVideo} 
                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent rounded-2xl pointer-events-none"></div>
                        </div>
                    </motion.div>
                </div>
            </StorySection>

            {/* WHAT'S ON THE HORIZON SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">What's on the </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Horizon?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        We're building a full suite of tools to make the grant lifecycle easier for everyone in the Bay Area social impact ecosystem.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* For Grant Seekers */}
                    <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200 mb-6">
                            <Heart className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">For Grant Seekers</h3>
                        <div className="space-y-4 text-slate-600 mb-8">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-teal-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Grant Tracking:</strong> Save opportunities and manage deadlines in a personalized dashboard.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Bot className="h-5 w-5 text-sky-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">AI Proposal Assistant:</strong> Get help drafting and tailoring applications.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <TrendingUp className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Funding Trend Analysis:</strong> See historical giving patterns to improve strategy.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Filter className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Saved Searches & Alerts:</strong> Get notified when new matching opportunities are posted.
                                </div>
                            </div>
                        </div>
                        <Link 
                            to="/roadmap" 
                            className="inline-flex items-center justify-center w-full px-6 py-3 font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Learn More
                        </Link>
                    </motion.div>

                    {/* For Fund Providers */}
                    <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200 mb-6">
                            <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">For Fund Providers</h3>
                        <div className="space-y-4 text-slate-600 mb-8">
                            <div className="flex items-start gap-3">
                                <BarChart3 className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Portfolio Analytics:</strong> Visualize your impact and gain insights into the funding landscape.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Streamlined Pipelines:</strong> Manage your application funnel from a single dashboard.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <UserPlus className="h-5 w-5 text-rose-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Targeted Outreach:</strong> Proactively invite organizations to apply for your opportunities.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MessageSquare className="h-5 w-5 text-pink-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Anonymous Feedback:</strong> Receive anonymized feedback from applicants.
                                </div>
                            </div>
                        </div>
                        <Link 
                            to="/roadmap" 
                            className="inline-flex items-center justify-center w-full px-6 py-3 font-semibold rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Learn More
                        </Link>
                    </motion.div>

                    {/* For the Community */}
                    <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200 mb-6">
                            <Users className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">For the Community</h3>
                        <div className="space-y-4 text-slate-600 mb-8">
                            <div className="flex items-start gap-3">
                                <Heart className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Follow Organizations:</strong> Stay updated on the work of organizations you care about.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Community Forums:</strong> Discuss local issues and connect with passionate neighbors.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Zap className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Direct Support:</strong> Find opportunities to donate or volunteer for campaigns.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Explore Impact:</strong> See how fund providers and grant seekers are shaping your community.
                                </div>
                            </div>
                        </div>
                        <button 
                            disabled 
                            className="inline-flex items-center justify-center w-full px-6 py-3 font-semibold rounded-2xl text-slate-500 bg-slate-200 cursor-not-allowed border border-slate-300"
                        >
                            Coming Soon
                        </button>
                    </motion.div>
                </div>
            </StorySection>

            {/* BOTTOM CTA SECTION */}
            <section className="mt-20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Transform Your Grant Search?
                    </h2>
                    <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                        Join the Bay Area nonprofits already discovering funding faster and focusing on what matters most: their mission.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/grants" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 hover:bg-gray-100 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            <Search className="mr-2" size={20} />
                            Start Exploring Grants
                        </Link>
                        <Link 
                            to="/signup" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold transition-all duration-300"
                        >
                            <ArrowRight className="mr-2" size={20} />
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowItWorksPage;