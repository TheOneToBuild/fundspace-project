import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, Search, Calendar, Bot, Users, TrendingUp, Filter, ShieldCheck, Sparkles, ArrowRight, Target, Heart } from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { LayoutContext } from './App.jsx';

const STATIC_IMAGES = {
    heroIllustration: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
    painIllustration: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop',
    funderLogos: [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    ]
};

const fundProviderData = [
    { 
        slug: 'the-koret-foundation',
        name: 'The Koret Foundation', 
        description: 'A family foundation dedicated to supporting innovative projects in education, environmental conservation, and the arts across all nine Bay Area counties.',
        focus_areas: ['Education', 'Environment', 'Arts & Culture'],
        logo_url: STATIC_IMAGES.funderLogos[0],
        type: 'foundation',
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
        description: 'Focused on providing seed funding and capacity-building grants to early-stage organizations addressing issues of social and economic justice.',
        focus_areas: ['Social Justice', 'Workforce Development', 'Poverty Relief'],
        logo_url: STATIC_IMAGES.funderLogos[1],
        type: 'foundation',
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
        type: 'foundation',
        location: 'San Francisco, CA',
        funding_locations: ['San Francisco'],
        total_funding_annually: '$12M+',
        notable_grant: 'Funding for free mobile health clinics in the Tenderloin.',
        average_grant_size: '$100,000 - $250,000',
        grant_types: ['General Operating', 'Project Support', 'Capital Campaigns'],
    },
];

const fundProviderCountyData = [
    { name: 'San Francisco', count: 1845, icon: Briefcase, color: 'text-blue-500' },
    { name: 'Santa Clara', count: 1102, icon: Briefcase, color: 'text-sky-500' },
    { name: 'San Mateo', count: 980, icon: Briefcase, color: 'text-cyan-500' },
    { name: 'Alameda', count: 955, icon: Briefcase, color: 'text-teal-500' },
    { name: 'Contra Costa', count: 651, icon: Briefcase, color: 'text-emerald-500' },
    { name: 'Marin', count: 523, icon: Briefcase, color: 'text-green-500' },
    { name: 'Sonoma', count: 488, icon: Briefcase, color: 'text-lime-500' },
    { name: 'Solano', count: 210, icon: Briefcase, color: 'text-yellow-500' },
    { name: 'Napa', count: 195, icon: Briefcase, color: 'text-amber-500' },
];

// Maps tailwind hue keywords to gradient + border utility sets
const countyGradientMap = {
    blue: 'from-blue-100 to-indigo-100 border-blue-200',
    sky: 'from-sky-100 to-blue-100 border-sky-200',
    cyan: 'from-cyan-100 to-teal-100 border-cyan-200',
    teal: 'from-teal-100 to-emerald-100 border-teal-200',
    emerald: 'from-emerald-100 to-green-100 border-emerald-200',
    green: 'from-green-100 to-emerald-100 border-green-200',
    lime: 'from-lime-100 to-green-100 border-lime-200',
    yellow: 'from-yellow-100 to-amber-100 border-yellow-200',
    amber: 'from-amber-100 to-orange-100 border-amber-200'
};

const getCountyGradientClasses = (colorClass) => {
    if (!colorClass) return countyGradientMap.amber;
    const match = Object.keys(countyGradientMap).find(key => colorClass.includes(key));
    return countyGradientMap[match] || countyGradientMap.amber;
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

const ForSeekersPage = () => {
    const { setPageBgColor } = useContext(LayoutContext);

    useEffect(() => {
        setPageBgColor('bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50');
        return () => {
            setPageBgColor('bg-white');
        };
    }, [setPageBgColor]);

    const handleFilterChange = () => {};

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <section className="text-center mb-16 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse" />
                    <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full opacity-10 animate-pulse delay-1000" />
                    <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse delay-2000" />
                </div>

                <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
                    <motion.div variants={fadeIn} className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center border border-blue-200 shadow-lg">
                        <Briefcase className="h-10 w-10 text-blue-600" />
                    </motion.div>

                    <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="text-slate-900">Find Your Funder. </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600">Fuel Your Mission.</span>
                    </motion.h1>

                    <motion.p variants={{ ...fadeIn, transition: { ...fadeIn.transition, delay: 0.2 } }} className="text-lg md:text-xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                        Stop the endless search. Fundspace centralizes Bay Area grant opportunities so you can focus on what matters most: creating change in your community.
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold"> Your mission deserves the right support.</span>
                    </motion.p>

                    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}>
                        <h3 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Fund Provider Landscape by County</h3>
                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-6 max-w-6xl mx-auto">
                            {fundProviderCountyData.map(county => (
                                <motion.div variants={fadeIn} key={county.name} className="text-center">
                                    <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${getCountyGradientClasses(county.color)} rounded-2xl flex items-center justify-center border shadow-lg`}>
                                        <county.icon className={`h-8 w-8 ${county.color}`} />
                                    </div>
                                    <AnimatedCounter targetValue={county.count} className="text-2xl sm:text-3xl font-bold text-slate-700" />
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">{county.name}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <StorySection>
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
                    <motion.div variants={fadeIn} className="relative order-2 lg:order-1">
                        <img 
                            src={STATIC_IMAGES.painIllustration} 
                            alt="Illustration of a person overwhelmed by paperwork" 
                            className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent rounded-2xl"></div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="text-left order-1 lg:order-2">
                        <div className="inline-block bg-gradient-to-br from-red-100 to-rose-100 p-4 rounded-2xl mb-6 border border-red-200">
                            <Search className="h-10 w-10 text-red-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            The Endless <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">Search</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            You know the drill. Countless hours lost to scattered foundation websites, outdated databases, and missed deadlines. It's a frustrating cycle that pulls you away from your actual work—serving your community.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center border border-orange-200 flex-shrink-0">
                                    <Target className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Scattered Information</h3>
                                    <p className="text-slate-600">Critical funding details spread across hundreds of different websites and databases.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center border border-red-200 flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Missed Opportunities</h3>
                                    <p className="text-slate-600">Perfect grants slip by because they're buried in hard-to-find places or have unexpected deadlines.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </StorySection>

            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center border border-green-200 shadow-lg">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">A </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Smarter</span>
                        <span className="text-slate-800"> Way to Find Funding</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                        We centralize hundreds of Bay Area RFPs and provide powerful tools to help you find the right opportunities in minutes, not weeks. Discover fund providers who care about the work you do.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {fundProviderData.map((organization, index) => ( 
                        <motion.div variants={fadeIn} key={organization.slug || index}>
                            <OrganizationCard 
                                organization={organization}
                                handleFilterChange={handleFilterChange}
                            />
                        </motion.div> 
                    ))}
                </div>
                
                <motion.div variants={fadeIn} className="text-center mt-12">
                    <a 
                        href="/organizations?prefilter=foundation" 
                        className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        <Briefcase className="mr-2" size={20} />
                        Explore All Fund Providers
                    </a>
                </motion.div>
            </StorySection>

            <StorySection>
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
                    <motion.div variants={fadeIn} className="text-left">
                        <div className="inline-block bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-2xl mb-6 border border-purple-200">
                            <Heart className="h-10 w-10 text-purple-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            Free, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Forever</span>. For Grant Seekers.
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Our commitment is to the Bay Area's social impact organizations. Access to our entire grant database and discovery tools will always be free for 501(c)(3) organizations and other mission-driven groups.
                        </p>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                            <h3 className="font-bold text-slate-800 mb-4">Our Promise to Grant Seekers:</h3>
                            <div className="space-y-3 text-sm text-slate-600">
                                <p>✓ <strong>No trials, no tiers, no hidden fees</strong></p>
                                <p>✓ <strong>Complete access to our grant database</strong></p>
                                <p>✓ <strong>Advanced search and filtering tools</strong></p>
                                <p>✓ <strong>Regular updates with new opportunities</strong></p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="relative">
                        <img 
                            src={STATIC_IMAGES.heroIllustration} 
                            alt="Illustration of finding opportunities" 
                            className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent rounded-2xl"></div>
                    </motion.div>
                </div>
            </StorySection>

            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">What's on the </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Horizon?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        We're building powerful new tools to give you an even greater advantage in your grantseeking efforts.
                    </p>
                </motion.div>

                <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl w-full max-w-6xl mx-auto">
                    <h3 className="text-2xl font-bold mb-8 text-center text-slate-800">Upcoming Tools for Grant Seekers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center border border-teal-200 flex-shrink-0">
                                <Calendar className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Grant Tracking</h4>
                                <p className="text-slate-600">Save opportunities and manage deadlines in a personalized dashboard tailored to your organization's needs.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center border border-sky-200 flex-shrink-0">
                                <Bot className="h-6 w-6 text-sky-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">AI Proposal Assistant</h4>
                                <p className="text-slate-600">Get intelligent help drafting and tailoring proposals to specific fund providers and their giving preferences.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200 flex-shrink-0">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Funding Trend Analysis</h4>
                                <p className="text-slate-600">See historical giving patterns of fund providers to improve your strategic approach and timing.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center border border-orange-200 flex-shrink-0">
                                <Filter className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Saved Searches & Alerts</h4>
                                <p className="text-slate-600">Get notified instantly when new opportunities matching your criteria are posted to the platform.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center border border-red-200 flex-shrink-0">
                                <ShieldCheck className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Eligibility Verifier</h4>
                                <p className="text-slate-600">Use AI to quickly check if your organization meets a grant's criteria before investing time in applications.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center border border-indigo-200 flex-shrink-0">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Collaboration Space</h4>
                                <p className="text-slate-600">Find and connect with other organizations for joint applications and collaborative funding opportunities.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </StorySection>

            <section className="mt-20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Transform Your Grant Search?
                    </h2>
                    <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                        Join the Bay Area organizations already discovering funding faster and focusing on what matters most: creating positive change in our communities.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href="/grants" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 hover:bg-gray-100 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            <Search className="mr-2" size={20} />
                            Start Exploring Grants
                        </a>
                        <a 
                            href="/signup" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold transition-all duration-300"
                        >
                            <ArrowRight className="mr-2" size={20} />
                            Create Free Account
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ForSeekersPage;