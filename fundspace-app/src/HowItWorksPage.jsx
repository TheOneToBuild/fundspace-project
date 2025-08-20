import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, Search, Handshake, Calendar, Briefcase, BarChart3, TrendingUp, Filter, ShieldCheck, Heart, UserPlus, Zap, Award, DollarSign, Sparkles, ArrowRight, CheckCircle2, Target, MessageSquare, Database, Globe, Lightbulb, Share2, Rocket, Eye, Network } from 'lucide-react';

// Mock AnimatedCounter component
const AnimatedCounter = ({ targetValue, formatValue, className }) => {
    const formattedValue = formatValue ? formatValue(targetValue) : targetValue.toLocaleString();
    return <span className={className}>{formattedValue}</span>;
};

// Mock LayoutContext
const LayoutContext = React.createContext({ setPageBgColor: () => {} });

const STATIC_MEDIA = {
    aiEngine: 'https://art4d.com/wp-content/uploads/2025/03/1-9.jpg',
    opportunitiesVideo: 'https://videos.pexels.com/video-files/3191353/3191353-uhd_2732_1440_25fps.mp4',
    communityVideo: 'https://videos.pexels.com/video-files/6893839/6893839-uhd_2560_1440_25fps.mp4',
    ecosystemMap: 'https://videos.pexels.com/video-files/8320073/8320073-uhd_2560_1440_25fps.mp4'
};

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
    // Mock setPageBgColor for demo
    const setPageBgColor = () => {};

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
                <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
                    <motion.div variants={fadeIn} className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center border border-purple-200 shadow-lg">
                        <Sparkles className="h-10 w-10 text-purple-600" />
                    </motion.div>
                    
                    <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="text-slate-900">The Future of </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                            Funding & Community
                        </span>
                    </motion.h1>
                    
                    <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="text-lg md:text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                        Imagine a world where finding funding is as easy as posting on social media, where great ideas get discovered automatically, and where every changemaker has a community cheering them on.
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Welcome to that world.</span>
                    </motion.p>
                </div>
            </section>

            {/* THE AI ENGINE SECTION */}
            <StorySection>
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
                    <motion.div variants={fadeIn} className="text-left">
                        <div className="inline-block bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-2xl mb-6 border border-blue-200">
                            <Bot className="h-10 w-10 text-blue-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Smart AI Engine</span><br />
                            That Never Sleeps
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            While you're building the future, our AI is scanning thousands of funding sources 24/7, 
                            organizing opportunities by relevance, and learning what matters most to your community.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200 flex-shrink-0">
                                    <Database className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Intelligent Aggregation</h3>
                                    <p className="text-slate-600">Crawls grants, VCs, accelerators, government programs, crowdfunding, and private opportunities in real-time.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200 flex-shrink-0">
                                    <Network className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Community-Enhanced Intelligence</h3>
                                    <p className="text-slate-600">Gets smarter with every user interaction, suggestion, and success story shared by our community.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="relative">
                        <img 
                            src={STATIC_MEDIA.aiEngine} 
                            alt="AI and data visualization" 
                            className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-2xl"></div>
                    </motion.div>
                </div>
            </StorySection>

            {/* THE PLATFORM FLOWS SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">Three Ways to </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">Get Funded</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Whether you're seeking traditional grants, launching a campaign, or building community support, we've got you covered.
                    </p>
                </motion.div>
                
                <div className="w-full max-w-7xl space-y-20">
                    {/* Flow 1 - Search & Discover */}
                    <motion.div variants={fadeIn} className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                SEARCH & DISCOVER
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Find Perfect-Fit Funding</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Use our AI-powered search to discover grants, accelerators, VCs, and funding programs that match your mission, stage, and location. 
                                Filter by amount, deadline, industry, or let our smart recommendations surprise you.
                            </p>
                            <a 
                                href="/grants" 
                                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Search className="mr-2" size={20} />
                                Explore Funding
                            </a>
                        </div>
                        <div className="relative">
                            <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-2xl border-4 border-white flex items-center justify-center">
                                <div className="text-center">
                                    <Search className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                                    <p className="text-blue-700 font-semibold">AI-Powered Discovery</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Flow 2 - Launch & Share */}
                    <motion.div variants={fadeIn} className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <video 
                                src={STATIC_MEDIA.opportunitiesVideo} 
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
                                LAUNCH & SHARE
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Showcase Your Vision</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Create a dynamic profile for your project, startup, or nonprofit. Share your story, goals, and impact. 
                                Get discovered by funders, collaborators, and supporters who believe in what you're building.
                            </p>
                            <a 
                                href="/opportunities/create" 
                                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Rocket className="mr-2" size={20} />
                                Share Your Project
                            </a>
                        </div>
                    </motion.div>

                    {/* Flow 3 - Connect & Collaborate */}
                    <motion.div variants={fadeIn} className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                CONNECT & COLLABORATE
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Build Your Tribe</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                Join communities around causes you care about. Connect with potential co-founders, advisors, and supporters. 
                                Share resources, celebrate wins, and learn from each other's journeys.
                            </p>
                            <a 
                                href="/community" 
                                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Users className="mr-2" size={20} />
                                Join Community
                            </a>
                        </div>
                        <div className="relative">
                            <video 
                                src={STATIC_MEDIA.communityVideo} 
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

            {/* THE ECOSYSTEM SECTION */}
            <StorySection>
                <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl">
                    <motion.div variants={fadeIn}>
                        <video
                            src={STATIC_MEDIA.ecosystemMap}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-96 md:h-[480px] object-cover rounded-3xl shadow-2xl border-4 border-white"
                            alt="Network visualization"
                        />
                    </motion.div>
                    <motion.div variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}}>
                        <div className="inline-block bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl mb-6 border border-rose-200">
                            <Globe className="h-10 w-10 text-rose-600" />
                        </div>
                        
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            One Platform.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">Endless Possibilities.</span>
                        </h2>
                        
                        <div className="text-lg text-slate-700 space-y-6 leading-relaxed">
                            <p>
                                Think of us as the connective tissue of the funding ecosystem. We bring together 
                                everything you need to turn ideas into impact.
                            </p>
                            
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                <p className="font-semibold text-slate-800 mb-4 text-xl flex items-center">
                                    <span className="text-2xl mr-2">🌐</span>
                                    What we're building:
                                </p>
                                <div className="grid grid-cols-1 gap-3 text-slate-700">
                                    {[
                                        '🔍 Smart Database + AI Search',
                                        '🚀 Project Showcase Platform', 
                                        '💬 Community & Messaging',
                                        '📊 Progress Tracking & Analytics',
                                        '🤝 Collaboration Tools',
                                        '🎯 Personalized Recommendations'
                                    ].map(feature => (
                                        <div key={feature} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                                            <span className="font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <p className="text-blue-700 font-semibold">
                                Because the best ideas shouldn't be limited by who you know or how much time you have to search. 🚀
                            </p>
                        </div>
                    </motion.div>
                </div>
            </StorySection>

            {/* FUTURE VISION SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">What's </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Coming Next?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        We're just getting started. Here's a peek at the future we're building together.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* For Idea Launchers */}
                    <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200 mb-6">
                            <Lightbulb className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">For Idea Launchers</h3>
                        <div className="space-y-4 text-slate-600 mb-8">
                            <div className="flex items-start gap-3">
                                <Zap className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">AI Proposal Assistant:</strong> Get help crafting compelling pitches and applications.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Smart Matching:</strong> Get automatically notified when perfect opportunities arise.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Impact Tracking:</strong> Showcase your progress and wins to build credibility.
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* For Capital Providers */}
                    <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200 mb-6">
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">For Capital Providers</h3>
                        <div className="space-y-4 text-slate-600 mb-8">
                            <div className="flex items-start gap-3">
                                <Eye className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Discovery Dashboard:</strong> Find and track promising projects and founders.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Portfolio Management:</strong> Track your investments and their community impact.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MessageSquare className="h-5 w-5 text-pink-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Direct Connect:</strong> Message promising candidates and build relationships.
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* For the Ecosystem */}
                    <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200 mb-6">
                            <Network className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">For the Ecosystem</h3>
                        <div className="space-y-4 text-slate-600 mb-8">
                            <div className="flex items-start gap-3">
                                <Share2 className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Knowledge Sharing:</strong> Community-driven resources, templates, and best practices.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Events & Meetups:</strong> Connect in person at funding showcases and community events.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Award className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-700">Success Stories:</strong> Celebrate wins and learn from the community's journey.
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </StorySection>

            {/* BOTTOM CTA SECTION */}
            <section className="mt-20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <Rocket className="h-8 w-8 text-white" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Join the Future of Funding?
                    </h2>
                    <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                        Whether you're launching the next big thing or looking to fund it, your community is waiting.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href="/opportunities/create" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 hover:bg-gray-100 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            <Rocket className="mr-2" size={20} />
                            Launch Your Project
                        </a>
                        <a 
                            href="/signup" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold transition-all duration-300"
                        >
                            <ArrowRight className="mr-2" size={20} />
                            Join the Community
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowItWorksPage;