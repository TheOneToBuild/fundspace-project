import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, BarChart3, Briefcase, Heart, Sparkles, TrendingUp, Star, Clock, Target, Zap, Bot, Shield, Search, ArrowRight, Building
} from './components/Icons.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { LayoutContext } from './App.jsx';

// --- Data (lightweight + story forward) ---
const ADVISORY = [
  { name: 'Hana Ma', title: 'Senior Program Officer, Sobrato Philanthropies', imageUrl: 'https://media.licdn.com/dms/image/v2/D4E03AQFLpGmrPIPhJw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1698185669765?e=1757548800&v=beta&t=E0SzY2HFu542nR4AWlTFDkl5X8fkCBI5P-arsHwhcYM', linkedinUrl: 'https://www.linkedin.com/in/hanahsiao/' },
  { name: 'Yen Pang', title: 'Director of Contracts & Compliance, San Francisco International Airport', imageUrl: 'https://media.licdn.com/dms/image/v2/C5603AQFAMGYFJIyhzA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1600903357926?e=1756944000&v=beta&t=t_MdadgWSG5ei1r_su5CiUgwnUQ167iWvefbSAogAIY', linkedinUrl: 'https://www.linkedin.com/in/yenpang/' },
  { name: 'Maurcio Palma', title: 'Director of Community Partnerships, Silicon Valley Community Foundation', imageUrl: 'https://www.hfsv.org/wp-content/uploads/2023/11/mauricio-palma-2023.jpg', linkedinUrl: 'https://www.linkedin.com/in/mauricio-palma-b2ba587/' },
  { name: 'Advisory Member', title: 'To be announced', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHwixQadVwZrBlXomewWDWczwJTQ-OSo77HA9HTljP8BiadrZ8ae2TEMGlfCs-dL0VGNI&usqp=CAU', linkedinUrl: null },
  { name: 'Advisory Member', title: 'To be announced', imageUrl: 'https://avatar.iran.liara.run/public/7', linkedinUrl: null },
  { name: 'Advisory Member', title: 'To be announced', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePvPIcfgyTA_2uby6QSsAG7PDe0Ai1Pv9x6cpYZYRGyxKSufwKmkibEpGZDw1fw5JUSs&usqp=CAU', linkedinUrl: null }
];

const CORE_VALUES = [
  { icon: Search, title: 'Radical Clarity', text: 'Surface aligned capital & remove noise so energy goes to impact—not scavenger hunts.' },
  { icon: Users, title: 'Community First', text: 'People > portal. Relationships compound faster than cold submissions.' },
  { icon: Target, title: 'Fit Over Volume', text: 'Precision matching replaces spray & pray cycles that exhaust small teams.' },
  { icon: Zap, title: 'Momentum Preservation', text: 'Reusable assets + automation protect flow from deadline & admin drag.' },
  { icon: Shield, title: 'Trust & Stewardship', text: 'Data stays private; only anonymized signals strengthen the ecosystem.' },
  { icon: Star, title: 'Equity By Design', text: 'Infrastructure that narrows network privilege gaps instead of widening them.' }
];


const METRICS = [
  { label: 'Indexed Opportunities', value: 1800, gradient: 'from-blue-500 to-indigo-600' },
  { label: 'Organizations Mapped', value: 8500, gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Focus Areas Tagged', value: 22000, gradient: 'from-fuchsia-500 to-pink-600' } // counts aligned with other pages
];

// --- Helpers ---
const fade = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.75 } } };
const Section = ({ children, className = 'py-28 md:py-40' }) => (
  <motion.section
    className={`relative w-full ${className}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ staggerChildren: 0.18 }}
  >{children}</motion.section>
);
const Pill = ({ children, color='blue' }) => {
  const map = { blue:'bg-blue-100 text-blue-700', emerald:'bg-emerald-100 text-emerald-700', violet:'bg-violet-100 text-violet-700', rose:'bg-rose-100 text-rose-700', slate:'bg-slate-100 text-slate-700', orange:'bg-orange-100 text-orange-700' };
  return <span className={`inline-flex items-center uppercase tracking-wide text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm ${map[color]}`}>{children}</span>;
};

const ValueCard = ({ icon:Icon, title, text }) => (
  <motion.div variants={fade} className="group relative rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 p-8 flex flex-col gap-5 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
    <div className="absolute -top-20 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-slate-200 via-white to-white" />
    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 text-white shadow-lg"><Icon className="h-7 w-7" /></div>
    <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
    <p className="text-slate-600 text-sm leading-relaxed flex-1">{text}</p>
  </motion.div>
);


// --- Page ---
const AboutUsPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  useEffect(()=>{ setPageBgColor('bg-white'); return ()=> setPageBgColor('bg-white'); },[setPageBgColor]);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <Section className="pt-32 md:pt-40 pb-32 bg-[#f9f6f4] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-32 w-[520px] h-[520px] bg-gradient-to-tr from-blue-300 via-indigo-300 to-violet-300 blur-3xl opacity-25" />
          <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-gradient-to-tr from-emerald-300 via-teal-300 to-sky-300 blur-3xl opacity-25" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-16 items-start">
          <motion.div variants={fade} className="space-y-10 relative">
            <h1 className="font-black tracking-tight leading-[0.95] text-[2.55rem] sm:text-6xl md:text-7xl text-slate-900">
              The Story Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">Fundspace</span>
            </h1>
            <div className="group inline-flex flex-col rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-sm px-7 py-6 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-2">WHY WE EXIST</p>
              <p className="text-slate-800/95 text-base md:text-lg leading-relaxed max-w-lg">Late-night spreadsheets. Vanishing RFP links. Rewriting the same narrative for an opportunity that never fit. We lived the fragmentation. We decided the infrastructure had to change—starting locally, building openly, and centering community intelligence over closed databases.</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-sm">Explore Funding <Search className="ml-2 h-4 w-4" /></a>
              <a href="/login?view=signup" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all text-sm">Join Community <ArrowRight className="ml-2 h-4 w-4" /></a>
            </div>
          </motion.div>
          <motion.div variants={fade} className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1612115958726-9af4b6bd28d1?q=80&w=1744&auto=format&fit=crop" alt="Community collaboration" className="w-full h-96 md:h-[480px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-3">Built With & For Bay Area Changemakers</h3>
                <p className="text-lg opacity-90 leading-relaxed">Infrastructure that connects capital, capacity, and outcome storytelling.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ORIGIN / PROBLEM */}
      <Section className="bg-white pt-28 pb-32 md:pt-40 md:pb-44">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-start">
          <motion.div variants={fade} className="space-y-8">
            <Pill color="rose">THE GAP</Pill>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05]">Great Ideas Stalled By Invisible Infrastructure</h2>
            <p className="text-lg text-slate-700 leading-relaxed">Fragmented listings, network privilege, and reinvention overhead quietly tax emerging organizations. Meanwhile: aligned dollars remain unclaimed, duplicate diligence drains time, and outcome proof lacks a home.</p>
            <ul className="space-y-4 text-slate-600 text-sm md:text-base">
              <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-rose-500" /> <p><strong className="text-slate-700">Discovery drag:</strong> Dozens of tabs & stale PDFs each month.</p></li>
              <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-pink-500" /> <p><strong className="text-slate-700">Readiness churn:</strong> Rewriting budgets & narratives from scratch.</p></li>
              <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-violet-500" /> <p><strong className="text-slate-700">Equity gap:</strong> Warm networks decide reach more than mission fit.</p></li>
            </ul>
          </motion.div>
          <motion.div variants={fade} className="space-y-8">
            <Pill color="blue">OUR RESPONSE</Pill>
            <h3 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900">Fund. Build. Scale. — As A Connected Workflow</h3>
            <div className="grid gap-6">
              {[{icon:Search,title:'Fund',text:'AI + community augmented index surfaces aligned capital with precision.'},{icon:Briefcase,title:'Build',text:'Reusable asset & peer review workspaces compress readiness cycles.'},{icon:BarChart3,title:'Scale',text:'Impact intelligence converts wins into renewal & partnership momentum.'}].map((b,i)=> (
                <div key={i} className="relative rounded-2xl bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm ring-1 ring-slate-200 flex gap-5 items-start">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white shadow-md"><b.icon className="h-6 w-6" /></div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">{b.title}</p>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-sm">{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* VALUES */}
      <Section className="bg-[#f9f6f4] pt-28 pb-40 md:pt-40 md:pb-48">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
          <Pill color="violet">OUR PRINCIPLES</Pill>
          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">The Operating System Of Our Culture</h2>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">Designing infrastructure that compounds community power requires guardrails. These values shape product decisions & partnerships.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {CORE_VALUES.map(v => <ValueCard key={v.title} icon={v.icon} title={v.title} text={v.text} />)}
        </div>
      </Section>



      {/* REGIONAL COMMITMENT */}
      <Section className="bg-white pt-28 pb-40 md:pt-40 md:pb-48">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-16 items-start">
          <motion.div variants={fade} className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <video src="https://videos.pexels.com/video-files/8320073/8320073-uhd_2560_1440_25fps.mp4" autoPlay loop muted playsInline className="w-full h-96 md:h-[480px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-3">All 9 Bay Area Counties</h3>
                <p className="text-lg opacity-90 leading-relaxed">Starting local to build depth, context & trust before scaling outward.</p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={fade} className="space-y-8">
            <Pill color="orange">GEOGRAPHIC FOCUS</Pill>
            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900">Rooted Locally. Architected To Scale.</h2>
            <p className="text-lg text-slate-700 leading-relaxed">We live here. The Bay Area gives us dense diversity in focus areas, org sizes, and capital sources—perfect for iterating equitable matching systems. Regional grounding lets us avoid abstract platform bloat & ship pragmatic tools.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {['Alameda','Contra Costa','Marin','Napa','San Francisco','San Mateo','Santa Clara','Solano','Sonoma'].map(c => (
                <span key={c} className="px-3 py-2 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm text-slate-700 font-medium text-center">{c}</span>
              ))}
            </div>
            <p className="text-sky-600 font-semibold">We look forwar</p>
          </motion.div>
        </div>
      </Section>

      {/* ADVISORY / PEOPLE */}
      <Section className="bg-[#f9f6f4] pt-28 pb-40 md:pt-40 md:pb-48">
        <div className="text-center max-w-5xl mx-auto px-6 mb-16">
          <Pill color="blue">OUR GUIDES</Pill>
          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Advisory Voices From Philanthropy, Public & Private</h2>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">We co‑design with leaders who believe infrastructure should shift power closer to community problem solvers.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
      {ADVISORY.map((m,i) => (
            <motion.div
        key={`${m.name}-${i}`}
              variants={fade}
              whileHover={{ scale: 1.05, y: -5, transition: { duration: 0.25 } }}
              className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-50 -translate-y-10 translate-x-10"></div>
              <div className="text-center relative">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <img
                    src={m.imageUrl}
                    alt={m.name}
                    className="w-full h-full rounded-full object-cover border-4 border-amber-100 shadow-lg"
                  />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{m.name}</h3>
                {/* Split combined title into role & organization (first comma delimiter), unify text size, gradient for org */}
                {(() => {
                  let role = m.title;
                  let org = null;
                  if (typeof m.title === 'string' && m.title.includes(',')) {
                    const parts = m.title.split(/,(.+)/); // split only on first comma
                    role = parts[0].trim();
                    org = parts[1]?.trim();
                  }
                  return (
                    <div className="mb-4 max-w-xs mx-auto leading-snug">
                      <p className="text-blue-600 font-medium text-base">{role}</p>
                      {org && (
                        <p className="font-medium text-base mt-1 bg-gradient-to-r from-purple-600 via-violet-500 to-pink-400 bg-clip-text text-transparent">{org}</p>
                      )}
                    </div>
                  );
                })()}
                {m.linkedinUrl ? (
                  <a
                    href={m.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-blue-700 hover:text-white text-base font-semibold transition-colors bg-gradient-to-r from-blue-100 via-indigo-100 to-violet-100 hover:from-blue-600 hover:to-violet-600 hover:bg-gradient-to-r px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:bg-blue-700"
                  >
                    <span role="img" aria-label="wave">👋</span> Say hello on LinkedIn
                  </a>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="inline-block text-base font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-full mb-2">🎉 Joining the party soon!</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>


      {/* CTA */}
      <Section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-blue-200 via-indigo-200 to-violet-200 blur-3xl opacity-35" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-200 via-teal-200 to-sky-200 blur-3xl opacity-40" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-10 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg">
            <Sparkles className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">Help Us Build Equitable Funding Infrastructure</h2>
            <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-12">Join the founders, organizers, funders & civic partners shaping a smarter flow of capital and capacity. Your mission — and the ones you champion — deserve leverage.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login?view=signup" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">Create Free Account <ArrowRight className="ml-2 h-5 w-5" /></a>
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Partner With Us <Building className="ml-2 h-5 w-5" /></a>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default AboutUsPage;