// src/pages/ForFundersPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient.js';
import { motion } from 'framer-motion';
import { Heart, Users, UploadCloud, Loader, Briefcase, BarChart3, Handshake, UserPlus, Zap, Search, Sparkles, ArrowRight, MessageSquare, Target, CheckCircle2, TrendingUp } from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { LayoutContext } from './App.jsx';

const STATIC_IMAGES = {
    bridgeIllustration: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=1200&auto=format&fit=crop',
    impactIllustration: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1200&auto=format&fit=crop',
    nonprofits: [
        'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582213709088-348633c7f394?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop'
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
        focus_areas: ['Homelessness', 'Poverty', 'Addiction Recovery'],
        imageUrl: STATIC_IMAGES.nonprofits[0],
        type: 'nonprofit'
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
        focus_areas: ['Community Health', 'Sexual Health', 'Women\'s Health'],
        imageUrl: STATIC_IMAGES.nonprofits[1],
        type: 'nonprofit'
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
        focus_areas: ['Community Support', 'Legal Aid', 'Women\'s Empowerment'],
        imageUrl: STATIC_IMAGES.nonprofits[2],
        type: 'nonprofit'
    },
];

const organizationCountyData = [
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

const ForFundersPage = () => {
    const { setPageBgColor } = useContext(LayoutContext);
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        setPageBgColor('bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50');
        return () => {
            setPageBgColor('bg-white');
        };
    }, [setPageBgColor]);

    const handleGrantSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!url) {
            setMessage({ type: 'error', text: 'Please enter a valid URL.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('grant_submissions')
                .insert([{ url, notes }]);

            if (error) {
                throw error;
            }

            setMessage({ type: 'success', text: 'Thank you! Your submission has been received and will be reviewed by our team.' });
            setUrl('');
            setNotes('');
        } catch (error) {
            console.error('Error submitting grant:', error);
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFilterChange = () => {};

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* HERO SECTION */}
            <section className="text-center mb-16 relative">
                {/* Magical background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse"></div>
                    <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
                    <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
                </div>
                
                <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
                    <motion.div variants={fadeIn} className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center border border-purple-200 shadow-lg">
                        <Heart className="h-10 w-10 text-purple-600" />
                    </motion.div>
                    
                    <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="text-slate-900">It Starts with a </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600">
                            Vision
                        </span>
                    </motion.h1>
                    
                    <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="text-lg md:text-xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                        You see a better future for the Bay Area. Your funding is the spark that ignites change.
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> We help it find the right place to land.</span>
                    </motion.p>

                    {/* County Data Grid */}
                    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}>
                        <h3 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Organization Landscape by County</h3>
                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-6 max-w-6xl mx-auto">
                            {organizationCountyData.map(county => (
                                <motion.div variants={fadeIn} key={county.name} className="text-center">
                                    <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${
                                        county.color.includes('indigo') ? 'from-indigo-100 to-purple-100 border-indigo-200' :
                                        county.color.includes('green') ? 'from-green-100 to-emerald-100 border-green-200' :
                                        county.color.includes('rose') ? 'from-rose-100 to-pink-100 border-rose-200' :
                                        county.color.includes('sky') ? 'from-sky-100 to-blue-100 border-sky-200' :
                                        county.color.includes('amber') ? 'from-amber-100 to-yellow-100 border-amber-200' :
                                        county.color.includes('pink') ? 'from-pink-100 to-rose-100 border-pink-200' :
                                        county.color.includes('cyan') ? 'from-cyan-100 to-teal-100 border-cyan-200' :
                                        county.color.includes('violet') ? 'from-violet-100 to-purple-100 border-violet-200' :
                                        'from-red-100 to-rose-100 border-red-200'
                                    } rounded-2xl flex items-center justify-center border shadow-lg`}>
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

            {/* BRIDGE SECTION */}
            <StorySection>
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
                    <motion.div variants={fadeIn} className="text-left">
                        <div className="inline-block bg-gradient-to-br from-pink-100 to-rose-100 p-4 rounded-2xl mb-6 border border-pink-200">
                            <Handshake className="h-10 w-10 text-pink-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            We <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Build</span> the Bridge
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            The gap between a great idea and a community in need can be vast. We connect you to the passionate, on-the-ground leaders already working towards the future you envision.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200 flex-shrink-0">
                                    <Search className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Discover Aligned Organizations</h3>
                                    <p className="text-slate-600">Find organizations whose missions perfectly align with your funding priorities and values.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200 flex-shrink-0">
                                    <Target className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Strategic Grantmaking</h3>
                                    <p className="text-slate-600">Access comprehensive data to make informed decisions about where your funding will have the greatest impact.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="relative">
                        <img 
                            src={STATIC_IMAGES.bridgeIllustration} 
                            alt="Diverse hands coming together in collaboration" 
                            className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent rounded-2xl"></div>
                    </motion.div>
                </div>
            </StorySection>

            {/* FIND THE RIGHT MATCH SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center border border-green-200 shadow-lg">
                        <Users className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">Find the Right </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">Match</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Discover the grassroots innovators aligned with your mission. Every organization has a story of impact waiting to be amplified.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {nonprofitData.map((organization, index) => ( 
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
                        href="/organizations" 
                        className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        <Users className="mr-2" size={20} />
                        Explore All Organizations
                    </a>
                </motion.div>
            </StorySection>

            {/* TRANSFORMATIONAL CHANGE SECTION */}
            <StorySection>
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
                    <motion.div variants={fadeIn} className="relative order-2 lg:order-1">
                        <img 
                            src={STATIC_IMAGES.impactIllustration} 
                            alt="People collaborating in community work" 
                            className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-sky-600/20 to-transparent rounded-2xl"></div>
                    </motion.div>

                    <motion.div variants={fadeIn} className="text-left order-1 lg:order-2">
                        <div className="inline-block bg-gradient-to-br from-sky-100 to-blue-100 p-4 rounded-2xl mb-6 border border-sky-200">
                            <TrendingUp className="h-10 w-10 text-sky-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-6">
                            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Transformational</span> Change
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            When your vision connects with the right partner, the impact is real. It's a newly painted mural, a protected coastline, or a new career path. It's a story you can see and feel.
                        </p>

                        <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6 rounded-2xl border border-sky-100">
                            <h3 className="font-bold text-slate-800 mb-4">Real Impact Stories</h3>
                            <div className="space-y-3 text-sm text-slate-600">
                                <p>🎨 <strong>Arts Programs:</strong> Funding creative expression in underserved communities</p>
                                <p>🌱 <strong>Environmental Justice:</strong> Supporting grassroots climate action</p>
                                <p>💼 <strong>Workforce Development:</strong> Creating pathways to economic opportunity</p>
                                <p>🏠 <strong>Housing Solutions:</strong> Building stable communities</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </StorySection>

            {/* SUBMIT GRANT SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl w-full max-w-4xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border border-emerald-200 shadow-lg">
                            <UploadCloud className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Submit a Grant Opportunity</h2>
                        <p className="text-lg text-slate-600">Found an RFP we missed? Help us grow our comprehensive database.</p>
                    </div>

                    <form onSubmit={handleGrantSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="grant-url" className="block text-sm font-semibold text-slate-700 mb-2">
                                Grant URL <span className="text-red-500">*</span>
                            </label>
                            <input 
                                id="grant-url" 
                                type="url" 
                                value={url} 
                                onChange={(e) => setUrl(e.target.value)} 
                                placeholder="https://foundation.org/grants/apply" 
                                required 
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm" 
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="grant-notes" className="block text-sm font-semibold text-slate-700 mb-2">
                                Additional Information (Optional)
                            </label>
                            <textarea 
                                id="grant-notes" 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                rows="4" 
                                placeholder="Help us understand this opportunity better:&#10;• What's the focus area? (e.g., 'Arts education')&#10;• Deadline information?&#10;• Funding range?" 
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                            ></textarea>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="animate-spin h-5 w-5 mr-3" />
                                    Submitting Grant...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mr-2" size={20} />
                                    Submit Grant Opportunity
                                </>
                            )}
                        </button>
                    </form>

                    {message.text && (
                        <div className={`mt-6 p-4 rounded-2xl text-sm font-medium ${
                            message.type === 'success' 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                        }`}>
                            <div className="flex items-center gap-2">
                                {message.type === 'success' ? (
                                    <CheckCircle2 size={16} className="text-green-600" />
                                ) : (
                                    <MessageSquare size={16} className="text-red-600" />
                                )}
                                {message.text}
                            </div>
                        </div>
                    )}
                </motion.div>
            </StorySection>

            {/* FUTURE FEATURES SECTION */}
            <StorySection>
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-slate-800">And We're Just </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Getting Started</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        What's ahead? A dedicated platform for fund providers to connect, analyze, and manage their grantmaking portfolio with unprecedented insight and efficiency.
                    </p>
                </motion.div>

                <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl w-full max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center border border-indigo-200 flex-shrink-0">
                                <BarChart3 className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">Portfolio Analytics</h3>
                                <p className="text-slate-600">Visualize your impact and gain insights into the funding landscape with comprehensive data visualization.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200 flex-shrink-0">
                                <Briefcase className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">Streamlined Pipelines</h3>
                                <p className="text-slate-600">Manage your opportunities and applicant funnel from a single, intuitive dashboard.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-200 flex-shrink-0">
                                <Handshake className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">Direct Connections</h3>
                                <p className="text-slate-600">Engage directly with organizations and build relationships beyond the application process.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center border border-rose-200 flex-shrink-0">
                                <UserPlus className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">Targeted Outreach</h3>
                                <p className="text-slate-600">Proactively invite specific types of organizations to apply for your opportunities.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl flex items-center justify-center border border-yellow-200 flex-shrink-0">
                                <Zap className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">Impact Tracking</h3>
                                <p className="text-slate-600">Follow your grantees' progress and see the long-term impact of your funding decisions.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center border border-pink-200 flex-shrink-0">
                                <MessageSquare className="h-6 w-6 text-pink-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-2">Anonymous Feedback</h3>
                                <p className="text-slate-600">Receive anonymized feedback from applicants to continuously improve your grantmaking processes.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </StorySection>

            {/* BOTTOM CTA SECTION */}
            <section className="mt-20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Amplify Your Impact?
                    </h2>
                    <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                        Join the fund providers already discovering innovative organizations and strategic funding opportunities in the Bay Area. Your vision deserves the right partner.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href="/organizations" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 hover:bg-gray-100 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            <Search className="mr-2" size={20} />
                            Discover Organizations
                        </a>
                        <a 
                            href="/contact" 
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold transition-all duration-300"
                        >
                            <ArrowRight className="mr-2" size={20} />
                            Partner with Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ForFundersPage;