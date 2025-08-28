// Redesigned ForFundersPage (funders-centric experience)
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient.js';
import { motion } from 'framer-motion';
import { LayoutContext } from './App.jsx';
import {
    Search, BarChart3, Users, Handshake, Target, Rocket, Sparkles, ArrowRight, UploadCloud, Loader, CheckCircle2, MessageSquare, Briefcase, Zap, Heart, TrendingUp
} from './components/Icons.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';

const fadeIn = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.75 } } };
const Section = ({ children, className = 'py-32 md:py-44' }) => (
    <motion.section
        className={`relative w-full ${className}`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.18 }}
    >{children}</motion.section>
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

const ValueCard = ({ icon: Icon, title, description, accent }) => (
    <motion.div variants={fadeIn} className="group relative rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 p-8 flex flex-col gap-5 overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className={`absolute -top-24 -right-32 w-72 h-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${accent}`} />
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${accent} text-white shadow-lg`}>
            <Icon className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed flex-1">{description}</p>
    </motion.div>
);

const WorkflowStep = ({ index, icon: Icon, title, description, accent }) => (
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

const ForFundersPage = () => {
    const { setPageBgColor } = useContext(LayoutContext);
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        setPageBgColor('bg-white');
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    const submitOpportunity = async (e) => {
        e.preventDefault();
        if (!url) { setMsg({ type: 'error', text: 'Please include a URL.' }); return; }
        setSubmitting(true); setMsg(null);
        try {
            const { error } = await supabase.from('grant_submissions').insert([{ url, notes }]);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Received. We\'ll review & index shortly.' });
            setUrl(''); setNotes('');
        } catch (err) {
            setMsg({ type: 'error', text: 'Submission failed. Try again.' });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative pt-28 md:pt-36 pb-32 bg-[#f9f6f4] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -left-32 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-300 via-violet-300 to-fuchsia-300 blur-3xl opacity-25" />
                    <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-gradient-to-tr from-emerald-300 via-teal-300 to-sky-300 blur-3xl opacity-25" />
                </div>
                <div className="relative max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-14 items-start">
                    <div className="space-y-10 relative">
                        <h1 className="font-black tracking-tight leading-[0.95] text-[2.55rem] sm:text-6xl md:text-7xl text-slate-900">
                            For <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">Funders</span> & Capital Partners
                        </h1>
                        <div className="group inline-flex flex-col rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-sm px-7 py-6 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all w-full md:w-auto">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-2">WHY FUNDSPACE FOR FUNDERS</p>
                            <p className="text-slate-800/95 text-base md:text-lg leading-relaxed max-w-lg">Surface high-potential grassroots organizations, streamline intake, reduce diligence friction, and monitor impact in one collaborative ecosystem. Move from reactive cycles to strategic, data‑informed deployment.</p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <a href="/organizations" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all text-sm">Explore Orgs <Search className="ml-2 h-4 w-4" /></a>
                            <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all text-sm">Partner With Us <ArrowRight className="ml-2 h-4 w-4" /></a>
                        </div>

                    </div>
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1653669486980-7891ab4b261e?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Funder collaboration" className="w-full h-96 md:h-[480px] object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                <h3 className="text-2xl font-bold mb-3">Deploy Capital With Confidence</h3>
                                <p className="text-lg opacity-90 leading-relaxed">Unified intelligence reduces friction, uncovers underrepresented talent, and amplifies measurable outcomes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Pillars */}
            <Section className="bg-white pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
                    <Pill color="blue">CORE VALUE</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Source. Evaluate. Amplify.</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">A modern infrastructure layer for foundations, corporate & public funders to discover, diligence, and steward community partners—without manual sprawl.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <ValueCard icon={Search} title="Strategic Discovery" accent="from-indigo-500 via-violet-500 to-fuchsia-500" description="AI + taxonomy powered search surfaces mission‑aligned, readiness‑signaled organizations you might otherwise miss." />
                    <ValueCard icon={Target} title="Fit & Readiness Signals" accent="from-emerald-500 via-teal-500 to-cyan-500" description="Eligibility, focus area, geography, stage & capacity indicators reduce top‑of‑funnel noise." />
                    <ValueCard icon={Handshake} title="Collaborative Ecosystem" accent="from-orange-500 via-rose-500 to-pink-500" description="Co‑funding visibility & network intelligence reveal partnership opportunities and reduce duplication." />
                    <ValueCard icon={BarChart3} title="Impact Transparency" accent="from-sky-500 via-blue-500 to-indigo-500" description="Standardized outcome storytelling & dashboards create faster renewal + scaling decisions." />
                    <ValueCard icon={Briefcase} title="Streamlined Intake" accent="from-slate-800 via-slate-900 to-slate-900" description="Reusable narrative assets, structured data capture & guided forms replace ad‑hoc PDFs & inbox chaos." />
                    <ValueCard icon={Rocket} title="Learning Flywheel" accent="from-purple-500 via-fuchsia-500 to-pink-600" description="Every cycle improves matching accuracy, benchmarks & pattern detection across focus areas." />
                </div>
            </Section>

            {/* Intelligence + Platform Layer */}
            <Section className="bg-[#f9f6f4] pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-start">
                    <motion.div variants={fadeIn} className="space-y-8">
                        <Pill color="violet">INTELLIGENCE LAYER</Pill>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">A Dynamic Signal Graph For Community Capital</h2>
                        <p className="text-lg text-slate-700 leading-relaxed">Fundspace continuously learns from successful awards, declined patterns, narrative structures, and anonymized readiness data—producing actionable scoring & pipeline insights for funders.</p>
                        <ul className="space-y-4 text-slate-600 text-sm md:text-base">
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-indigo-500" /> <p><strong className="text-slate-700">Adaptive Matching:</strong> Opportunity + org fingerprint model improves relevance each cycle.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-fuchsia-500" /> <p><strong className="text-slate-700">Gap Mapping:</strong> Identify underserved geographies & focus areas to inform proactive sourcing.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" /> <p><strong className="text-slate-700">Outcome Layer:</strong> Structured impact narratives unify quantitative KPIs & qualitative stories.</p></li>
                            <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-sky-500" /> <p><strong className="text-slate-700">Portfolio View:</strong> Rollups highlight concentration risk, renewal readiness & co‑fund alignment.</p></li>
                        </ul>
                        <div className="flex gap-4 pt-2">
                            <a href="/contact" className="inline-flex items-center px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg">Request Funder Preview <ArrowRight className="ml-2 h-4 w-4" /></a>
                            <a href="/organizations" className="inline-flex items-center px-6 py-3 rounded-full bg-white text-slate-900 font-semibold text-sm border border-slate-200 shadow-sm hover:bg-slate-50">Browse Orgs</a>
                        </div>
                    </motion.div>
                    <motion.div variants={fadeIn} className="relative">
                        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[2px] shadow-2xl">
                            <div className="rounded-3xl bg-slate-900/95 backdrop-blur-sm p-8 md:p-10 flex flex-col gap-8 text-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/10"><Sparkles className="h-6 w-6 text-white" /></div>
                                    <h3 className="text-2xl font-bold tracking-tight">Signal Console</h3>
                                </div>
                                <div className="grid gap-5">
                                    {[
                                        {icon:Search, label:'Discovery Coverage', text:'Aggregates public, foundation & community-submitted opportunities.'},
                                        {icon:Users, label:'Org Graph', text:'Maps relationships & shared collaborators to surface coalition potential.'},
                                        {icon:BarChart3, label:'Outcome Dashboards', text:'Normalized metrics + narrative assets ready for portfolio reporting.'},
                                        {icon:TrendingUp, label:'Pattern Insights', text:'Highlights emerging themes & traction signals across cohorts.'}
                                    ].map((row,i)=>(
                                        <div key={i} className="flex gap-4">
                                            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10"><row.icon className="h-5 w-5 text-white" /></div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold tracking-wide text-slate-400 mb-1">{row.label.toUpperCase()}</p>
                                                <p className="text-sm leading-relaxed text-slate-200">{row.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[13px] leading-relaxed text-slate-400">Privacy-first: organization data contributes only anonymized aggregate patterns unless explicitly shared.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Section>

            {/* Workflow */}
            <Section className="bg-white pt-32 pb-40 md:pt-44 md:pb-48">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 mb-16 text-center">
                    <Pill color="emerald">FUNDER WORKFLOW</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">From Priority Definition To Portfolio Learning</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">Every interaction compounds intelligence— accelerating sourcing, diligence and renewal decisions.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <WorkflowStep index={1} icon={Target} title="Define Focus & Signals" description="Geographies, impact themes & baseline eligibility establish your sourcing fingerprint." accent="from-indigo-500 to-violet-600" />
                    <WorkflowStep index={2} icon={Search} title="Surface & Shortlist" description="Adaptive engine ranks emerging & established organizations by strategic fit." accent="from-emerald-500 to-teal-600" />
                    <WorkflowStep index={3} icon={Handshake} title="Assess & Engage" description="Readiness signals + reusable assets streamline diligence & invite fairness." accent="from-orange-500 to-pink-600" />
                    <WorkflowStep index={4} icon={Users} title="Collaborate & Co‑Fund" description="Reveal overlap & invite aligned partners into joint initiative windows." accent="from-sky-500 to-indigo-600" />
                    <WorkflowStep index={5} icon={BarChart3} title="Track Outcomes" description="Unified impact narrative + KPI dashboards enable faster renewal confidence." accent="from-purple-500 to-fuchsia-600" />
                    <WorkflowStep index={6} icon={Rocket} title="Learn & Amplify" description="Pattern insights inform next cycle focus, equity gaps & scaling bets." accent="from-slate-800 to-slate-900" />
                </div>
            </Section>

            {/* Submit Opportunity */}
            <Section className="bg-[#f9f6f4] pt-32 pb-40 md:pt-44 md:pb-48">
                <motion.div variants={fadeIn} className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center border border-indigo-200 shadow-lg">
                            <UploadCloud className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Submit an Opportunity</h2>
                        <p className="text-lg text-slate-600">Share a new RFP, program, or capital resource. We will review & index to expand equitable access.</p>
                    </div>
                    <form onSubmit={submitOpportunity} className="space-y-6">
                        <div>
                            <label htmlFor="opp-url" className="block text-sm font-semibold text-slate-700 mb-2">Opportunity URL <span className="text-red-500">*</span></label>
                            <input id="opp-url" type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://foundation.org/rfp" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/80" />
                        </div>
                        <div>
                            <label htmlFor="opp-notes" className="block text-sm font-semibold text-slate-700 mb-2">Notes (Optional)</label>
                            <textarea id="opp-notes" value={notes} onChange={e=>setNotes(e.target.value)} rows="4" placeholder="Helpful context: focus area, funding range, deadline details, eligibility nuances." className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/80 resize-none" />
                        </div>
                        <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:via-violet-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                            {submitting ? (<><Loader className="animate-spin h-5 w-5 mr-3" />Submitting...</>) : (<><UploadCloud className="mr-2" size={20} />Submit Opportunity</>)}
                        </button>
                    </form>
                    {msg && (
                        <div className={`mt-6 p-4 rounded-2xl text-sm font-medium ${msg.type==='success' ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200' : 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border border-rose-200'}`}> <div className="flex items-center gap-2"> {msg.type==='success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <MessageSquare size={16} className="text-rose-600" />} {msg.text}</div></div>
                    )}
                </motion.div>
            </Section>

            {/* Roadmap */}
            <Section className="bg-white pt-32 pb-40 md:pt-44 md:pb-56">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-14">
                    <Pill color="slate">ON THE HORIZON</Pill>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Upcoming Tools For Funders</h2>
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">We build alongside community & funding partners to close equity & efficiency gaps.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {icon:BarChart3, title:'Portfolio Heatmaps', text:'Visualize geographic & focus area allocation including equity gap alerts.'},
                        {icon:Users, title:'Collaborative Windows', text:'Launch co‑funded thematic rounds & shared diligence spaces.'},
                        {icon:Zap, title:'Automated Eligibility Pre‑Check', text:'Instant rubric scoring against funder-defined criteria.'},
                        {icon:Briefcase, title:'Integrated Renewal Workflows', text:'Signal expiring multi‑year agreements & surface performance context.'},
                        {icon:Heart, title:'Grantee Capacity Signals', text:'Early indicators of organizational strain or scaling readiness.'},
                        {icon:TrendingUp, title:'Predictive Outcome Modeling', text:'Model projected impact scenarios based on historical analogs.'},
                    ].map((f,i)=>(
                        <ValueCard key={i} icon={f.icon} title={f.title} description={f.text} accent={i%2? 'from-indigo-500 to-violet-600':'from-emerald-500 to-teal-600'} />
                    ))}
                </div>
            </Section>

            {/* Final CTA */}
            <section className="relative py-32 md:py-40 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-10 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-indigo-200 via-violet-200 to-fuchsia-200 blur-3xl opacity-35" />
                    <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-200 via-teal-200 to-sky-200 blur-3xl opacity-40" />
                </div>
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-10 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg">
                        <Sparkles className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">Partner With Fundspace To Accelerate Equitable Capital Flow</h2>
                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-12">Bring efficiency, transparency & inclusive reach to your grantmaking. Let\'s build the connective tissue for sustained community outcomes.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">Request A Conversation <ArrowRight className="ml-2 h-5 w-5" /></a>
                        <a href="/organizations" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Explore Organizations <Search className="ml-2 h-5 w-5" /></a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ForFundersPage;