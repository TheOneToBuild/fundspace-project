import React, { useEffect, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Briefcase, CheckCircle, Search, Calendar, Bot, Users, TrendingUp, Filter, ShieldCheck, Sparkles, ArrowRight, Target, Heart,
    BarChart3, Network, Rocket, Layers, FileText, Mail, Zap
} from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx'; // (kept if reused elsewhere)
import GrantCard from './components/GrantCard.jsx';
import { supabase } from './supabaseClient.js';
import { refreshGrantBookmarkCounts } from './utils/grantUtils';
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

// Live grants snapshot state will replace static provider showcase

// Generic section wrapper for reveal animations
const StorySection = ({ children, className = 'py-20 md:py-28' }) => (
    <motion.section
        className={`relative w-full ${className}`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.2 }}
    >
        {children}
    </motion.section>
);

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

// Small reusable building blocks
const Pill = ({ children, color = 'blue' }) => {
    const map = {
        blue: 'bg-blue-100 text-blue-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        violet: 'bg-violet-100 text-violet-700',
        rose: 'bg-rose-100 text-rose-700',
        slate: 'bg-slate-100 text-slate-700',
        orange: 'bg-orange-100 text-orange-700',
        indigo: 'bg-indigo-100 text-indigo-700'
    };
    return <span className={`inline-flex items-center uppercase tracking-wide text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm ${map[color]}`}>{children}</span>;
};

const FeatureCard = ({ icon: Icon, title, description, accent }) => (
    <motion.div variants={fadeIn} className="group relative rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 p-8 flex flex-col gap-5 overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className={`absolute -top-20 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${accent}`} />
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${accent} text-white shadow-lg`}>
            <Icon className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed flex-1">{description}</p>
    </motion.div>
);

const ProcessStep = ({ index, icon: Icon, title, description, accent }) => (
    <motion.div variants={fadeIn} className="relative rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5 flex gap-5 items-start hover:shadow-xl transition-all">
        <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white font-semibold shadow-md`}>
            <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-slate-500">STEP {index}</p>
            <h4 className="font-bold text-slate-800 text-lg leading-snug">{title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">{description}</p>
        </div>
    </motion.div>
);

// Robust snapshot grant card (larger typography + richer metadata)
const SnapshotGrantCard = ({ grant }) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const dueDate = grant.dueDate ? new Date(grant.dueDate) : null;
    const daysLeft = dueDate ? Math.ceil((dueDate - today)/(1000*60*60*24)) : null;
    const isEndingSoon = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0;
    const dueDateFormatted = grant.dueDate ? new Date(grant.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year: (new Date().getFullYear() !== new Date(grant.dueDate).getFullYear()) ? 'numeric': undefined }) : null;

    const formatFunding = (amount) => {
        if (typeof amount === 'string' && amount.includes('$')) return amount.replace(/\s+/g,'');
        const clean = amount?.toString().replace(/[^0-9]/g,'') || '0';
        const num = parseInt(clean);
        if (num >= 1_000_000) return `$${(num/1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `$${(num/1_000).toFixed(0)}K`;
        return `$${num}`;
    };

    const primaryLocation = grant.locations?.[0]?.name;
    const focusAreas = (grant.categories||[]).slice(0,2).map(c=>c.name || c);

    return (
        <div className="group relative bg-white rounded-3xl ring-1 ring-slate-200 hover:ring-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-default flex flex-col h-full min-h-[450px]">
            {/* Banner */}
            <div className="h-36 relative">
                {grant.organization?.banner_image_url ? (
                    <img src={grant.organization.banner_image_url} alt="org banner" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    {grant.organization?.image_url ? (
                        <img src={grant.organization.image_url} alt={grant.foundationName} className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-md" />
                    ) : (
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md border-2 border-white">
                            {(grant.foundationName||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide font-semibold text-white/80">Funder</span>
                        <span className="text-sm font-medium text-white line-clamp-1 max-w-[160px]">{grant.foundationName}</span>
                    </div>
                </div>
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    {isEndingSoon && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md">
                            {daysLeft === 0 ? 'DUE TODAY' : daysLeft === 1 ? '1 DAY LEFT' : `${daysLeft} DAYS`}
                        </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/90 text-white flex items-center gap-1 shadow">
                        <span className="leading-none">★</span> {grant.save_count||0}
                    </span>
                </div>
            </div>
            {/* Content */}
            <div className="p-6 flex flex-col gap-4 flex-1">
                <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-colors">
                    {grant.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
                    {grant.description}
                </p>
                {/* Meta Row */}
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            {formatFunding(grant.fundingAmount)}
                        </span>
                        {grant.dueDate && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {dueDateFormatted}
                            </span>
                        )}
                        {primaryLocation && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{primaryLocation}</span>
                        )}
                        {grant.grantType && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{grant.grantType}</span>
                        )}
                    </div>
                    {focusAreas.length>0 && (
                        <div className="flex gap-2 flex-wrap">
                            {focusAreas.map(a=> (
                                <span key={a} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">{a}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {grant.dueDate ? (
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-slate-200 overflow-hidden">
                                {/* simple progress: closer to 0 days -> fuller bar */}
                                {daysLeft !== null && daysLeft >=0 && (
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${Math.max(10, Math.min(100, (14 - Math.min(daysLeft,14)) / 14 * 100))}%` }} />
                                )}
                            </div>
                            <span className={`text-[11px] font-medium ${isEndingSoon ? 'text-rose-600' : 'text-slate-600'}`}>{daysLeft !== null ? (daysLeft===0? 'Due Today': daysLeft===1? '1 day left': `${daysLeft} days left`) : 'Rolling'}</span>
                        </div>
                    ) : (
                        <span className="text-[11px] font-medium text-slate-600">Rolling Deadline</span>
                    )}
                </div>
                <a href="/grants" className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                    View Details <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
            </div>
        </div>
    );
};

const ForSeekersPage = () => {
    const { setPageBgColor } = useContext(LayoutContext);
    const [liveGrants, setLiveGrants] = useState([]);
    const [loadingGrants, setLoadingGrants] = useState(true);

    useEffect(() => {
        setPageBgColor('bg-white');
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    useEffect(()=>{
        let isMounted = true;
        (async ()=>{
            try {
                setLoadingGrants(true);
                const { data: grantsData, error } = await supabase
                    .from('grants_with_taxonomy')
                    .select('*')
                    .order('id', { ascending:false })
                    .limit(6);
                if (error) throw error;
                // Fetch minimal org info
                const orgIds = [...new Set(grantsData.map(g=>g.organization_id).filter(Boolean))];
                let orgMap = {};
                if (orgIds.length){
                    const { data: orgs } = await supabase
                        .from('organizations')
                        .select('id, name, image_url, banner_image_url, slug')
                        .in('id', orgIds);
                    orgs?.forEach(o=>{orgMap[o.id]=o;});
                }
                const formatted = grantsData.map(grant=>({
                    ...grant,
                    foundationName: grant.funder_name || 'Unknown Funder',
                    funderSlug: grant.funder_slug || orgMap[grant.organization_id]?.slug || null,
                    fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified',
                    dueDate: grant.deadline,
                    grantType: grant.grant_type,
                    categories: grant.category_names ? grant.category_names.map((name, idx)=>({id:idx, name})) : [],
                    locations: grant.location_names ? grant.location_names.map((name, idx)=>({id:idx, name})) : [],
                    eligible_organization_types: grant.taxonomy_codes || [],
                    organization: {
                        image_url: orgMap[grant.organization_id]?.image_url || grant.funder_logo_url || null,
                        banner_image_url: orgMap[grant.organization_id]?.banner_image_url || null
                    },
                    save_count: 0
                }));
                // Remove expired
                const todayStripped = new Date(); todayStripped.setHours(0,0,0,0);
                const active = formatted.filter(g => !g.dueDate || new Date(g.dueDate) >= todayStripped);
                const ids = formatted.map(g=>g.id);
                const bookmarkCounts = await refreshGrantBookmarkCounts(ids);
                active.forEach(g=>{ g.save_count = bookmarkCounts[g.id] || 0; });
                if (isMounted) setLiveGrants(active);
            } catch(e){
                console.warn('Live grants snapshot failed', e);
            } finally {
                if (isMounted) setLoadingGrants(false);
            }
        })();
        return ()=>{ isMounted = false; };
    },[]);

    const handleFilterChange = () => {};

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative pt-28 md:pt-36 pb-28 bg-[#f9f6f4] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 -left-32 w-[480px] h-[480px] bg-gradient-to-tr from-emerald-300 via-teal-300 to-sky-300 blur-3xl opacity-30" />
                    <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-gradient-to-tr from-indigo-300 via-violet-300 to-pink-300 blur-3xl opacity-25" />
                </div>
                <div className="relative max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-14 items-start">
                    <div className="space-y-10 relative">
                        <h1 className="font-black tracking-tight leading-[0.95] text-[2.65rem] sm:text-6xl md:text-7xl text-slate-900">
                            For Nonprofits &<br /> Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600">Fund Seekers</span>
                        </h1>
                        <div className="group inline-flex flex-col rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-sm px-7 py-6 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all w-full md:w-auto">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-2">WHY FUNDSPACE</p>
                            <p className="text-slate-800/95 text-base md:text-lg leading-relaxed max-w-lg">Turn scattered grant hunting into a focused funding engine. Fundspace centralizes Bay Area opportunities, builds your reusable assets, and connects you with peers who have navigated the process before.</p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all text-sm">Explore Grants <Search className="ml-2 h-4 w-4" /></a>
                            <a href="/login?view=signup" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all text-sm">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></a>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src={STATIC_IMAGES.heroIllustration}
                                alt="Community organizations collaborating"
                                className="w-full h-96 md:h-[480px] object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                <h3 className="text-2xl font-bold mb-3">Capital That Matches Your Mission</h3>
                                <p className="text-lg opacity-90 leading-relaxed">Smart discovery + community intelligence reduce time-to-fit and increase submission confidence.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <StorySection className="bg-white pt-32 pb-36 md:pt-48 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-start">
                    <motion.div variants={fadeIn} className="space-y-8">
                        <Pill color="rose">THE REALITY</Pill>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05]">The System Wasn't Built For Small & Mid-Sized Organizations.</h2>
                        <p className="text-lg text-slate-700 leading-relaxed">Fragmented listings, outdated PDFs, guesswork on fit, and reinventing narratives for every cycle. Meanwhile aligned dollars go unclaimed or flow to the well-connected.</p>
                        <ul className="space-y-4 text-slate-600 text-sm md:text-base">
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-rose-500" /> <p><strong className="text-slate-700">76%</strong> of small nonprofits report spending excessive time just finding opportunities.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-pink-500" /> <p><strong className="text-slate-700">40%</strong> of local grants risk under-subscription due to discovery gaps.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-violet-500" /> <p>Manual spreadsheets, ad‑hoc folders, and siloed knowledge slow collaboration and readiness.</p></li>
                        </ul>
                    </motion.div>
                    <motion.div variants={fadeIn} className="relative">
                        <img src={STATIC_IMAGES.painIllustration} alt="Team overwhelmed by scattered grant info" className="w-full h-auto rounded-3xl shadow-2xl border border-slate-200" />
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-rose-600/20 to-transparent" />
                    </motion.div>
                </div>
            </StorySection>

            {/* Solution Pillars */}
            <StorySection className="bg-[#f9f6f4] pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
                    <Pill color="blue">OUR APPROACH</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Fund. Build. Scale.</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">A connected workflow that takes you from first relevant search to a resilient, multi‑year funding engine.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-3 gap-10">
                    <FeatureCard icon={Search} title="FUND" accent="from-blue-500 via-indigo-500 to-violet-500" description="AI-enhanced discovery surfaces aligned grants & capital across foundations, public, and collaborative sources—ranked by mission fit." />
                    <FeatureCard icon={Users} title="BUILD" accent="from-emerald-500 via-teal-500 to-cyan-500" description="Peer intelligence, reusable narrative assets, and community review loops accelerate quality & reduce duplication." />
                    <FeatureCard icon={BarChart3} title="SCALE" accent="from-sky-500 via-blue-500 to-indigo-500" description="Impact dashboards & outcome storytelling strengthen renewal cases, larger asks, and partnership expansion." />
                </div>
            </StorySection>

            {/* Key Feature Clusters (inspired by kit.com sections) */}
            <StorySection className="bg-white pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-14">
                    <Pill color="emerald">FEATURE SET</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Everything You Need In One Place</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">Replace tabs and spreadsheets with an integrated suite purpose-built for community organizations.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={Layers} title="Unified Grant Index" accent="from-emerald-500 to-teal-600" description="Continuously refreshed Bay Area grant & capital listings with semantic tagging and focus area taxonomy." />
                    <FeatureCard icon={Filter} title="Smart Matching" accent="from-indigo-500 to-violet-600" description="Relevance scoring learns from your profile & community wins to highlight high‑probability opportunities." />
                    <FeatureCard icon={Calendar} title="Deadline Radar" accent="from-rose-500 to-pink-600" description="Automated reminders & conflict detection so overlapping submissions don't derail momentum." />
                    <FeatureCard icon={FileText} title="Reusable Asset Library" accent="from-orange-500 to-amber-600" description="Store core narratives, budgets, logic models, and adapt quickly with AI‑assisted versioning." />
                    <FeatureCard icon={Network} title="Peer Intelligence" accent="from-sky-500 to-cyan-600" description="See anonymized patterns & connect with past awardees open to collaborative feedback." />
                    <FeatureCard icon={ShieldCheck} title="Eligibility Pre-Check" accent="from-green-600 to-emerald-600" description="Instant guidance on baseline requirements before investing hours in a misaligned proposal." />
                    <FeatureCard icon={Bot} title="AI Proposal Assist" accent="from-purple-500 to-fuchsia-600" description="Draft sections, refine tone, and tailor language to funder priorities while retaining authenticity." />
                    <FeatureCard icon={Briefcase} title="Pipeline Workspace" accent="from-slate-800 to-slate-900" description="Track status, owners, and progress across an organized submission funnel." />
                    <FeatureCard icon={TrendingUp} title="Impact Story Engine" accent="from-teal-500 to-emerald-600" description="Convert KPIs & outcomes into funder-ready visuals and renewal narratives." />
                </div>
            </StorySection>

            {/* Live Grants Snapshot */}
            <StorySection className="bg-[#f9f6f4] pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-14">
                    <Pill color="violet">LIVE SNAPSHOT</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Recently Indexed Opportunities</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">Freshly added or updated grants pulled directly from our live index. Explore more inside the platform.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    {loadingGrants ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({length:6}).map((_,i)=> (
                                <div key={i} className="h-80 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 animate-pulse" />
                            ))}
                        </div>
                    ) : liveGrants.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                            {liveGrants.map(grant => (
                                <motion.div key={grant.id} variants={fadeIn} className="h-full">
                                    <SnapshotGrantCard grant={grant} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/60 rounded-3xl border border-slate-200">
                            <p className="text-slate-600 font-medium">No recent grants found. Check back soon.</p>
                        </div>
                    )}
                </div>
                <motion.div variants={fadeIn} className="text-center mt-14">
                    <a href="/grants" className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:shadow-xl shadow-lg transition-all hover:scale-105">
                        <Search className="mr-2" size={20} /> Browse Full Database
                    </a>
                </motion.div>
            </StorySection>

            {/* Process steps */}
            <StorySection className="bg-white pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 mb-16 text-center">
                    <Pill color="indigo">WORKFLOW</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">From First Login To Multi-Year Partnership</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">Every interaction compounds intelligence—making your next search faster and more precise.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ProcessStep index={1} icon={Target} title="Create Mission Profile" description="Focus areas, geography, stage & impact themes create your matching fingerprint." accent="from-emerald-500 to-teal-600" />
                    <ProcessStep index={2} icon={Search} title="Discover & Prioritize" description="Smart filters & relevance scores cut noise—build a strategic shortlist in minutes." accent="from-blue-500 to-indigo-600" />
                    <ProcessStep index={3} icon={Users} title="Peer Insight & Review" description="Connect with prior awardees & co-author refined narratives using shared assets." accent="from-orange-500 to-rose-600" />
                    <ProcessStep index={4} icon={FileText} title="Build Reusable Assets" description="Narratives, budgets, logic models & metrics centralized for rapid adaptation." accent="from-purple-500 to-fuchsia-600" />
                    <ProcessStep index={5} icon={CheckCircle} title="Submit & Track" description="Pipeline dashboard manages deadlines, tasks, and status states—no spreadsheet drifts." accent="from-slate-800 to-slate-900" />
                    <ProcessStep index={6} icon={BarChart3} title="Report & Scale" description="Impact dashboards & story engine drive renewals and larger multi‑year conversations." accent="from-sky-500 to-cyan-600" />
                </div>
            </StorySection>

            {/* Free Forever Section */}
            <StorySection className="bg-[#f9f6f4] pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div variants={fadeIn} className="space-y-8">
                        <Pill color="orange">ACCESS MODEL</Pill>
                        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900">Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600">Forever</span> For Bay Area Nonprofits.</h2>
                        <p className="text-lg text-slate-700 leading-relaxed">We believe discovery and core readiness tools should not be a paywall. Funders & ecosystem partners support platform growth—so you can focus on impact.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[ 'No trials. No tiers.', 'Full grant index access.', 'AI matching + filters.', 'Community intelligence.', 'Asset library workspace.', 'Regular new sources.' ].map(line => (
                                <div key={line} className="flex items-start gap-3 text-sm text-slate-700"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" /> {line}</div>
                            ))}
                        </div>
                        <div className="flex gap-4 pt-2">
                            <a href="/login?view=signup" className="inline-flex items-center px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg">Create Account <ArrowRight className="ml-2 h-4 w-4" /></a>
                            <a href="/grants" className="inline-flex items-center px-6 py-3 rounded-full bg-white text-slate-900 font-semibold text-sm border border-slate-200 shadow-sm hover:bg-slate-50">Browse Grants</a>
                        </div>
                    </motion.div>
                    <motion.div variants={fadeIn} className="relative">
                        <img src={STATIC_IMAGES.heroIllustration} alt="Nonprofit team celebrating" className="w-full h-auto rounded-3xl shadow-2xl border border-white" />
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-orange-500/25 to-transparent" />
                    </motion.div>
                </div>
            </StorySection>

            {/* Roadmap */}
            <StorySection className="bg-white pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
                    <Pill color="slate">ON THE HORIZON</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Upcoming Tools To Extend Your Edge</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">We build with community feedback. Here's what we're shaping next.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-8">
                    {[
                        {icon:Calendar, title:'Advanced Grant Tracker', text:'Custom stages, internal notes, collaborative tasks & renewal prompts.'},
                        {icon:Bot, title:'Context-Aware Drafting', text:'Feed prior narratives & metrics to produce tailored first drafts.'},
                        {icon:TrendingUp, title:'Funder Trend Analytics', text:'Multi-year giving pattern visualizations for strategic timing.'},
                        {icon:Filter, title:'Saved Searches & Alerts', text:'Real-time push + email when new matches land in the index.'},
                        {icon:ShieldCheck, title:'Deep Eligibility Scanner', text:'Parse RFP language to highlight potential disqualifiers early.'},
                        {icon:Users, title:'Collaboration Spaces', text:'Private shared workrooms for joint proposals & fiscal sponsor flows.'},
                        {icon:Mail, title:'Funder Comms Log', text:'Centralize outreach history & commitments for continuity.'},
                        {icon:Zap, title:'Automation Hooks', text:'Integrations & triggers (Slack, email, task tools) for pipeline events.'}
                    ].map((f,i)=>(
                        <FeatureCard key={i} icon={f.icon} title={f.title} description={f.text} accent={i%2===0? 'from-teal-500 to-emerald-600':'from-indigo-500 to-violet-600'} />
                    ))}
                </div>
            </StorySection>

            {/* Final CTA (light gradient) */}
            <section className="relative py-32 md:py-40 bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-10 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-emerald-200 via-teal-200 to-sky-200 blur-3xl opacity-35" />
                    <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-200 via-violet-200 to-fuchsia-200 blur-3xl opacity-40" />
                </div>
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-10 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg">
                        <Sparkles className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">Ready To Transform Your Funding Workflow?</h2>
                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-12">Join the Bay Area organizations moving from reactive scrambling to strategic, data‑informed funding momentum.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/login?view=signup" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all">Create Free Account <ArrowRight className="ml-2 h-5 w-5" /></a>
                        <a href="/grants" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Browse Grants <Search className="ml-2 h-5 w-5" /></a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ForSeekersPage;