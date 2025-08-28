import React, { useEffect } from 'react';
import { Bot, Sparkles, Search, Rocket, Users, Database, Network, Target, Zap, BarChart3, MessageSquare, Globe, Lightbulb, Share2, Award, Calendar, DollarSign, ArrowRight, Eye, CheckCircle, TrendingUp, Building } from 'lucide-react';

const gradientWord = (text, gradient) => (
    <span className={`text-transparent bg-clip-text ${gradient}`}>{text}</span>
);

const SectionWrapper = ({ children, className = '' }) => (
    <section className={`relative py-24 md:py-32 ${className}`}>{children}</section>
);

const Pill = ({ children, color = 'blue' }) => {
    const map = {
        blue: 'bg-blue-100 text-blue-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        violet: 'bg-violet-100 text-violet-700',
        rose: 'bg-rose-100 text-rose-700',
        slate: 'bg-slate-100 text-slate-700',
        orange: 'bg-orange-100 text-orange-700'
    };
    return <span className={`inline-flex items-center uppercase tracking-wide text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm ${map[color]}`}>{children}</span>;
};

const StepCard = ({ index, title, description, icon: Icon, accent, stat }) => (
    <div className="group relative rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 p-8 flex flex-col gap-5 overflow-hidden transition-all duration-500 will-change-transform hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.015]">
        <div className={`absolute -top-20 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${accent}`}></div>
        <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${accent} text-white shadow-lg shrink-0`}>
                <Icon className="h-7 w-7" />
            </div>
            <div>
                <p className="text-xs font-semibold tracking-wider text-slate-500">STEP {index}</p>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
            </div>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        {stat && (
            <div className="mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat}</span>
                </div>
            </div>
        )}
    </div>
);

const ProblemCard = ({ title, description, stat, icon: Icon, gradient }) => {
    return (
    <div className="relative group flex flex-col rounded-[30px] overflow-hidden p-8 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.07),0_20px_48px_-14px_rgba(0,0,0,0.15)] transition-all duration-500 will-change-transform hover:-translate-y-1 hover:scale-[1.02]">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient.replace(/(from|via|to)-([a-z]+)-(\d+)/g,'$1-$2-100')} opacity-70`} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.9),rgba(255,255,255,0)_60%)]" />
            <div className="relative flex items-start gap-4 mb-6">
                <div className="shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 ring-1 ring-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 leading-snug">
                    {title}
                </h3>
            </div>
            <p className="relative flex-1 text-sm md:text-[15px] leading-relaxed text-slate-600 mb-6">
                {description}
            </p>
            <div className="relative mt-auto">
                <div className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                    {stat}
                </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-transparent group-hover:ring-slate-900/5 transition-colors" />
        </div>
    );
};

const PillarCard = ({ badge, title, description, bullets, icon: Icon, gradient, example }) => {
    const badgeGradients = {
        FUND: 'from-indigo-600 via-violet-600 to-fuchsia-600',
        BUILD: 'from-emerald-500 via-teal-500 to-green-500',
        SCALE: 'from-sky-600 via-blue-600 to-cyan-600'
    };
    const surfaceGradients = {
        FUND: 'from-indigo-50 via-violet-50 to-fuchsia-50',
        BUILD: 'from-emerald-50 via-teal-50 to-green-50',
        SCALE: 'from-sky-50 via-blue-50 to-cyan-50'
    };
    const accentHalos = {
        FUND: 'from-violet-400/25 to-fuchsia-400/10',
        BUILD: 'from-emerald-400/25 to-teal-400/10',
        SCALE: 'from-sky-400/25 to-cyan-400/10'
    };
    const badgeGradient = badgeGradients[badge] || 'from-slate-600 to-slate-800';
    const surfaceGradient = surfaceGradients[badge] || 'from-slate-50 via-slate-50 to-slate-100';
    const halo = accentHalos[badge] || 'from-slate-300/25 to-slate-300/10';

    return (
    <div className={`relative flex flex-col rounded-3xl shadow-xl ring-1 ring-slate-900/5 overflow-hidden transition-all duration-500 will-change-transform hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.015] h-full bg-gradient-to-br ${surfaceGradient}`}>
            {gradient && <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />}
            <div className={`pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full blur-3xl bg-gradient-to-tr ${halo}`} />
            <div className="relative p-8 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-white/80 backdrop-blur-sm ring-1 ring-slate-200 shadow-sm">
                        <Icon className="h-6 w-6 text-slate-800" />
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gradient-to-r ${badgeGradient} text-white shadow-sm`}>{badge}</span>
                </div>
                <div className="mb-6">
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">{title}</h3>
                    <p className="text-slate-700 leading-relaxed text-sm md:text-base max-w-md min-h-[104px] md:min-h-[96px]">{description}</p>
                </div>
                <ul className="grid gap-3 text-sm text-slate-600 flex-1 mb-6">
                    {bullets.map((b,i)=>(
                        <li key={i} className="flex gap-3 items-start">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
                            <span className="leading-relaxed">{b}</span>
                        </li>
                    ))}
                </ul>
                {example && (
                    <div className="mt-auto p-4 rounded-xl bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-sm">
                        <p className="text-[11px] font-medium tracking-wide text-slate-500 mb-2">EXAMPLE</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{example}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const HowItWorksPage = () => {
    useEffect(()=>{ window.scrollTo(0,0); },[]);

    return (
    <div className="min-h-screen bg-white">
            <SectionWrapper className="pb-12 pt-28 md:pt-36 bg-[#f9f6f4] overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-14 items-start">
                    <div className="space-y-10 relative">
                        <h1 className="font-black tracking-tight leading-[0.95] text-[2.65rem] sm:text-6xl md:text-7xl text-slate-900">
                            Stop Hunting. Start {gradientWord('Building','bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600')}.
                        </h1>
                        <div className="relative group inline-flex flex-col rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-sm px-7 py-6 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all w-full md:w-auto">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-2">THE PROBLEM</p>
                            <p className="text-slate-800/95 text-base md:text-lg leading-relaxed max-w-lg">
                                76% of small nonprofits struggle to even find relevant grant opportunities. Meanwhile, 40% of local government grants go unclaimed. The system is broken—but we're fixing it.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-sm">Find Funding Now <Search className="ml-2 h-4 w-4" /></a>
                            <a href="/login?view=signup" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all text-sm">Join Community <ArrowRight className="ml-2 h-4 w-4" /></a>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img 
                                src="https://images.unsplash.com/photo-1612115958726-9af4b6bd28d1?q=80&w=1744&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                                alt="Diverse team collaborating on funding solutions"
                                className="w-full h-96 md:h-[480px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                <h3 className="text-2xl font-bold mb-4">The Future of Democratized Funding</h3>
                                <p className="text-lg opacity-90 leading-relaxed">
                                    Infrastructure that connects great ideas with the resources they need to thrive.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
                    <Pill color="rose">THE OPPORTUNITY GAP</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">The Current System is Broken</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">Fragmented networks, gatekeepers, and bureaucracy mean great ideas never get funded.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ProblemCard
                        title="Discovery Problem"
                        description="Organizations spend 50%+ of their time hunting for relevant opportunities across scattered sources."
                        stat="76%"
                        icon={Search}
                        gradient="from-sky-600 via-blue-600 to-indigo-700"
                    />
                    <ProblemCard
                        title="Access Barrier"
                        description="Without connections, promising organizations remain invisible to funders."
                        stat="40%"
                        icon={Building}
                        gradient="from-violet-600 via-purple-600 to-fuchsia-600"
                    />
                    <ProblemCard
                        title="Manual Process"
                        description="1 in 3 community groups rely on Google Docs and word-of-mouth."
                        stat="33%"
                        icon={MessageSquare}
                        gradient="from-emerald-600 via-teal-600 to-cyan-600"
                    />
                    <ProblemCard
                        title="Wasted Capital"
                        description="Over $1B is lost annually to inefficient review processes and missed opportunities."
                        stat="$1B+"
                        icon={DollarSign}
                        gradient="from-rose-600 via-pink-600 to-purple-700"
                    />
                </div>
            </SectionWrapper>

            <SectionWrapper className="py-24 bg-[#f9f6f4]">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
                    <Pill color="blue">OUR SOLUTION</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Fund. Build. Scale.</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">A complete ecosystem that replaces gatekeepers with direct pathways to capital and community.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-3 gap-10">
                    <PillarCard
                        badge="FUND"
                        title="AI-Powered Discovery"
                        description="Find the right funding faster with our intelligent matching system that learns from your organization and mission."
                        bullets={[
                            'Comprehensive Bay Area database updated weekly',
                            'Smart semantic search and AI recommendations',
                            'Real-time alerts for new opportunities'
                        ]}
                        icon={Search}
                        gradient="from-blue-400/25 via-indigo-300/30 to-violet-300/30"
                        example="A youth nonprofit focused on education instantly finds 12 matching grants from foundations, government, and corporate sources—all in one search."
                    />
                    <PillarCard
                        badge="BUILD"
                        title="Community-Powered Growth"
                        description="Connect with peers, mentors, and collaborators who understand your challenges and can accelerate your impact."
                        bullets={[
                            'Direct connections to successful grantees',
                            'Collaborative proposal review and feedback',
                            'Shared resources and best practices'
                        ]}
                        icon={Users}
                        gradient="from-emerald-300/30 via-teal-300/30 to-cyan-300/30"
                        example="Connect with 3 similar organizations in your area who've successfully secured funding from your target foundation, plus get feedback on your proposal draft."
                    />
                    <PillarCard
                        badge="SCALE"
                        title="Data-Driven Impact"
                        description="Track outcomes, tell compelling stories, and build credibility that attracts recurring and larger funding."
                        bullets={[
                            'Impact dashboard with automated reporting',
                            'Success story templates and media galleries',
                            'Funder relationship management tools'
                        ]}
                        icon={BarChart3}
                        gradient="from-sky-300/30 via-blue-300/30 to-indigo-300/30"
                        example="Generate professional impact reports that helped secure 40% more funding in year two, with automated data visualization and compelling narrative."
                    />
                </div>
            </SectionWrapper>

            <SectionWrapper className="bg-white">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 mb-16 text-center">
                    <Pill color="violet">THE PROCESS</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">From First Search to Multi-Year Partnership</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">Every interaction makes the platform smarter and your future searches more precise.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <StepCard 
                        index={1} 
                        title="Set Up Your Profile" 
                        description="Tell us your mission, focus areas, and stage. This creates your relevance fingerprint for smarter matching." 
                        icon={Target} 
                        accent="from-blue-500 via-indigo-500 to-violet-500"
                    />
                    <StepCard 
                        index={2} 
                        title="Discover Aligned Funding" 
                        description="Our AI surfaces grants, investors, and programs matched to your specific mission and capacity." 
                        icon={Search} 
                        accent="from-emerald-500 via-teal-500 to-cyan-500"
                    />
                    <StepCard 
                        index={3} 
                        title="Connect & Collaborate" 
                        description="Get introduced to past awardees, join proposal review groups, and access proven templates." 
                        icon={Users} 
                        accent="from-orange-500 via-rose-500 to-pink-500"
                    />
                    <StepCard 
                        index={4} 
                        title="Track & Apply" 
                        description="Manage deadlines, application status, and funder communications in one organized dashboard." 
                        icon={CheckCircle} 
                        accent="from-purple-500 via-fuchsia-500 to-pink-500"
                    />
                    <StepCard 
                        index={5} 
                        title="Report Impact" 
                        description="Automated reporting tools help you communicate results and build credibility for future asks." 
                        icon={BarChart3} 
                        accent="from-sky-500 via-blue-500 to-indigo-500"
                    />
                    <StepCard 
                        index={6} 
                        title="Scale Your Mission" 
                        description="With proven success, access larger opportunities and become a mentor for other organizations." 
                        icon={Rocket} 
                        accent="from-slate-700 via-slate-800 to-slate-900"
                    />
                </div>
            </SectionWrapper>

            <SectionWrapper className="bg-[#f9f6f4]">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-start">
                    <div className="space-y-8">
                        <Pill color="orange">INTELLIGENCE LAYER</Pill>
                        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900">A Platform That Learns From Every Success</h2>
                        <p className="text-lg text-slate-700 leading-relaxed">Unlike static databases, we use community intelligence and AI to continuously improve matching accuracy and surface hidden opportunities.</p>
                        <ul className="space-y-4 text-slate-600 text-sm md:text-base">
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-blue-500"></span><p><span className="font-semibold text-slate-700">Smart Matching:</span> Learns from successful applications to predict fit scores.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-indigo-500"></span><p><span className="font-semibold text-slate-700">Community Data:</span> Verified information from organizations who've actually applied.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-violet-500"></span><p><span className="font-semibold text-slate-700">Real-Time Updates:</span> Automated scanning keeps opportunity data fresh.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-rose-500"></span><p><span className="font-semibold text-slate-700">Success Patterns:</span> Algorithm identifies what successful applications have in common.</p></li>
                        </ul>
                        <div className="flex gap-4 pt-2">
                            <a href="/login?view=signup" className="inline-flex items-center px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg">Try It Free <ArrowRight className="ml-2 h-4 w-4" /></a>
                            <a href="/grants" className="inline-flex items-center px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-lg">Browse Database</a>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-[2px] shadow-2xl">
                            <div className="rounded-3xl bg-slate-900/95 backdrop-blur-sm p-8 md:p-10 flex flex-col gap-8 text-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/10"><Bot className="h-6 w-6 text-white" /></div>
                                    <h3 className="text-2xl font-bold tracking-tight">Platform Intelligence</h3>
                                </div>
                                <div className="grid gap-5">
                                    {[
                                        {icon:Database, label:'Data Sources', text:'Continuous scanning foundation websites, government portals, and community submissions.'},
                                        {icon:Target, label:'Smart Matching', text:'Algorithm trained on successful applications identifies your best-fit opportunities.'},
                                        {icon:Network, label:'Community Insights', text:'Real application experience from organizations just like yours improves recommendations.'},
                                        {icon:TrendingUp, label:'Success Analytics', text:'Track patterns in successful applications to optimize your strategy and messaging.'}
                                    ].map((row,i)=>(
                                        <div key={i} className="flex gap-4">
                                            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                                                <row.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold tracking-wide text-slate-400 mb-1">{row.label.toUpperCase()}</p>
                                                <p className="text-sm leading-relaxed text-slate-200">{row.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[13px] leading-relaxed text-slate-400">Privacy-first: Your data stays private while contributing anonymous patterns that strengthen the entire ecosystem.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper className="py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="relative rounded-[34px] bg-[#cde6ff]/85 backdrop-blur-sm border border-sky-200 shadow-[0_8px_28px_-8px_rgba(0,60,120,0.25)] overflow-hidden flex flex-col md:flex-row items-stretch gap-12 md:gap-6 p-10 md:p-16">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.6),rgba(255,255,255,0)_55%)]" />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_80%,rgba(255,255,255,0.55),rgba(255,255,255,0)_60%)]" />
                        <div className="relative flex-1 flex flex-col justify-center max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05] mb-6">
                                Ready. Set. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-600">Build.</span>
                            </h2>
                            <p className="text-base md:text-lg leading-relaxed text-slate-800/90 mb-8 max-w-lg">
                                Fundspace scales with you. Manage opportunities, track relationships, and surface aligned grants faster—free for Bay Area nonprofits.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="/login?view=signup" className="inline-flex items-center justify-center px-7 py-3 rounded-xl font-semibold bg-slate-900 text-white shadow-sm shadow-slate-900/30 hover:bg-slate-800 transition-colors text-sm md:text-base">Sign Up <ArrowRight className="ml-2 h-4 w-4" /></a>
                                <a href="/grants" className="inline-flex items-center justify-center px-7 py-3 rounded-xl font-semibold bg-white/70 hover:bg-white text-slate-900 shadow-sm border border-slate-200/60 transition-colors text-sm md:text-base">Explore Database</a>
                            </div>
                        </div>
                        <div className="relative w-full md:w-[40%] flex items-center justify-center">
                            <div className="relative w-72 md:w-80 aspect-square">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-300 via-blue-300 to-indigo-300 blur-2xl opacity-60" />
                                <img
                                    src="https://images.unsplash.com/photo-1620828771830-fb3fa87866b6?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                    alt="Paper plane launching toward target representing growth"
                                    className="relative w-full h-full object-cover rounded-3xl shadow-xl border border-white/40"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    );
};

export default HowItWorksPage;