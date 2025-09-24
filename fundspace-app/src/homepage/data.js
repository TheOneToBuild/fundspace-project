// src/homepage/data.js - Exact data from original HomePage.jsx
export const carouselData = [
  { type: 'image', title: 'Mission Economic Development Agency', image: 'https://media.licdn.com/dms/image/v2/C561BAQGwhXHEN7fTVg/company-background_10000/company-background_10000/0/1585481344716/mission_economic_development_agency_cover?e=2147483647&v=beta&t=qypVn1yoDmdyZVIuhXoxuGyv7JmMM-NmkuNdv8OPtnI' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/9363691/9363691-hd_1080_1920_25fps.mp4' },
  { type: 'image', title: 'Pacific Islander Community Partnership', image: 'https://impactaapi.org/org/pacific-islander-community-partnership/attaf0kGrmdkK7Wmi.jpg' },
  { type: 'image', title: 'Future Construction Leaders Silicon Valley', image: 'https://images.squarespace-cdn.com/content/v1/64bfe92e203a2c626566aaca/1751316493749-Z5OFLWE8QBDIP9H05ST6/DSC00129.JPG' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/3191353/3191353-uhd_2732_1440_25fps.mp4' },
  { type: 'image', title: 'The RILEY Project', image: 'https://www.therileyproject.org/wp-content/uploads/2022/07/Elaina-.jpeg' },
  { type: 'image', title: 'Pilipino Bayanihan Resource Center', image: 'https://static.wixstatic.com/media/de0c33_57840cb972484c00ae6423895af087a2~mv2_d_2048_1365_s_2.jpg/v1/fill/w_640,h_808,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/de0c33_57840cb972484c00ae6423895af087a2~mv2_d_2048_1365_s_2.jpg' },
  { type: 'video', title: '', videoSrc: 'https://videos.pexels.com/video-files/6893839/6893839-uhd_2560_1440_25fps.mp4' },
  { type: 'image', title: 'Dev/Mission', image: 'https://devmission.org/wp-content/uploads/2024/08/53835579331_8a5c917d82_k.jpg' },
];

export const homepageSections = [
  {
    badgeText: 'Fund your Vision',
    heading: 'Fundspace helps organizations surface aligned capital, streamline readiness, and unlock sustainable funding momentum.',
    profile: {
      image: 'https://images.unsplash.com/photo-1755541516554-7c5126ec7f7b?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    quote: '',
    introTitle: 'Great ideas need more than discovery—they need fuel, credibility, and a repeatable pathway to capital.',
    introParagraph: 'Use smart matching, reusable assets, and collaborative review to move from scattered opportunities to a strategic funding pipeline.',
    cta: { label: 'Start visioning', href: '/login?view=signup' },
    fullImage: true,
    showProfileMeta: false,
    largeBadge: true,
    platformShowcaseFeatures: 'Discover a new path to capital, where our AI-powered database and community submissions help you find and secure the funding you need to thrive.',
    additionalTextBox: 'Discover a new path to capital where aligned funders and funding opportunities meet your mission with precision.',
    additionalTextBoxGradient: 'from-amber-200/70 via-orange-200/70 to-rose-200/70',
    additionalTextBoxPlainWhite: true,
    additionalTextBoxesLeft: [
      {
        text: 'Unlock sustainable funding momentum by streamlining readiness and matching directly with the resources that fit your vision.',
        gradient: 'from-orange-400 via-rose-400 to-pink-400',
        textClass: 'relative w-full text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight text-white',
        minHeight: 420
      }
    ],
    additionalTextBoxesRight: [
      {
        text: 'Join a network that shares more than funding — collaborate, learn, and build resilience alongside changemakers who are rewriting what opportunity feels like.',
        plainWhite: true
      }
    ],
    extraImage: { src: 'https://images.unsplash.com/photo-1633113214207-1568ec4b3298?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Funding collaboration' },
    gradient: {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-amber-300/70 via-orange-300/70 to-rose-300/70',
      halo: 'from-orange-400/25 to-rose-400/10'
    },
    workspace: {
      badge: 'FUNDING WORKSPACE',
      title: 'Grant & Capital Pipeline',
      description: 'Central dashboard of opportunities with readiness score, deadlines, owner, and progress state.',
      metrics: [
        { label: 'ACTIVE LEADS', value: 22 },
        { label: 'READY PACKETS', value: 14 },
        { label: 'SUBMISSIONS', value: 9 }
      ],
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=600&auto=format&fit=crop'
    },
    capacity: {
      assetsFrom: 5,
      assetsTo: 18,
      timeSaved: '58%',
      bullets: [
        { color: 'bg-orange-500', text: 'Reusable asset library reduced first‑draft creation time.' },
        { color: 'bg-rose-500', text: 'Automated deadline & task reminders lowered missed submissions.' },
        { color: 'bg-pink-500', text: 'Pipeline visibility improved internal coordination & prioritization.' }
      ]
    }
  },
  {
    badgeText: 'Build your Mission',
    heading: 'Fundspace helps organizations build capacity, connect, and sustain impact beyond funding.',
    profile: {
      image: 'https://images.unsplash.com/photo-1631203928521-bde1e727e8b7?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    quote: '',
    introTitle: 'The journey doesn\'t stop at funding—it\'s where growth truly begins.',
    introParagraph: 'Organizations don\'t just find funding—they build the resilience, capacity, and connections that turn resources into long-term impact.',
    fullImage: true,
    showProfileMeta: false,
    largeBadge: true,
    platformShowcaseFeatures: 'Meet peers, funders, and experts in a collaborative hub for sharing resources, exchanging knowledge, and sparking partnerships.',
    additionalTextBox: 'Grow resilience by building systems and practices that sustain your work beyond a single grant cycle.',
    additionalTextBoxGradient: 'from-fuchsia-200/70 via-pink-200/70 to-rose-200/70',
    additionalTextBoxPlainWhite: true,
    additionalTextBoxesLeft: [
      { 
        text: 'Transform ambition into action by building the foundation—people, processes, and partnerships—that make your mission thrive.', 
        gradient: 'from-violet-300 via-purple-200 to-fuchsia-200',
        textClass: 'relative w-full text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight text-white',
        minHeight: 420
      }
    ],
    additionalTextBoxesRight: [
      { 
        text: 'Clarify your mission with tools that help you articulate impact, sharpen goals, and tell your story with confidence.', 
        plainWhite: true 
      }
    ],
    extraImage: { src: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Collaborative workspace' },
    gradient: {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-lime-300/70 via-emerald-300/70 to-teal-300/70',
      halo: 'from-emerald-400/25 to-teal-400/10'
    },
    workspace: {
      badge: 'CAPACITY WORKSPACE',
      title: 'Reusable Grant Asset Library',
      description: 'Centralized narratives, budgets, logic models, and impact stats—versioned, AI‑assisted, and ready to adapt.',
      metrics: [
        { label: 'CORE DOCS', value: 12 },
        { label: 'TEMPLATES', value: 8 },
        { label: 'PEER REVIEWS', value: 26 }
      ],
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop'
    },
    capacity: {
      assetsFrom: 3,
      assetsTo: 12,
      timeSaved: '64%',
      bullets: [
        { color: 'bg-blue-500', text: 'Template library standardized narrative, budget & logic model—cut first‑draft time dramatically.' },
        { color: 'bg-orange-500', text: 'Peer & mentor review loops reduced revision cycles by over half.' },
        { color: 'bg-indigo-500', text: 'Centralized impact metrics made partnership outreach faster & more credible.' }
      ]
    }
  },
  {
    badgeText: 'Scale your Impact',
    heading: 'Fundspace helps organizations amplify outcomes, deepen partnerships, and convert momentum into lasting systems change.',
    profile: {
      image: 'https://images.unsplash.com/photo-1663743556587-b0cd1a9cd61d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    quote: '',
    introTitle: 'Growth is only the beginning—impact multiplies when insights and relationships compound.',
    introParagraph: 'Turn wins into repeatable systems. Fundspace equips teams to measure, communicate, and expand the value they create across communities and partners.',
    cta: { label: 'Start scaling', href: '/login?view=signup' },
    fullImage: true,
    showProfileMeta: false,
    largeBadge: true,
    platformShowcaseFeatures: 'Measure what matters most by capturing real outcomes, transforming data into proof of impact, and giving funders and communities a clear view of the change you\'re driving.',
    additionalTextBox: 'Expand your reach by scaling local successes into regional and national movements, turning grassroots momentum into a wider force for lasting change.',
    additionalTextBoxGradient: 'from-sky-200/70 via-blue-200/70 to-indigo-200/70',
    additionalTextBoxPlainWhite: true,
    additionalTextBoxesLeft: [
      {
        text: 'Scale your vision into reality by combining the right resources, connections, and strategies—so the impact you spark today grows into the systems-level change the world needs tomorrow.',
        gradient: 'from-indigo-400 via-blue-400 to-cyan-400',
        textClass: 'relative w-full text-3xl sm:text-4xl lg:text-[2.85rem] font-black leading-[1.15] tracking-tight text-white',
        minHeight: 420
      }
    ],
    additionalTextBoxesRight: [
      {
        text: 'Multiply your influence by sharing your stories, insights, and results in ways that inspire action, attract new allies, and position your organization as a leader in your field.',
        plainWhite: true
      }
    ],
    extraImage: { src: 'https://images.unsplash.com/photo-1674574124340-c00cc2dae99c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Impact data collaboration' },
    gradient: {
      wrapperBg: 'bg-[#f9f6f4]',
      card: 'from-sky-300/70 via-blue-300/70 to-indigo-300/70',
      halo: 'from-sky-400/25 to-indigo-400/10'
    },
    workspace: {
      badge: 'IMPACT WORKSPACE',
      title: 'Impact Intelligence Dashboard',
      description: 'Centralized KPIs, outcome narratives, media assets, and partner engagement activity—kept current & presentation ready.',
      metrics: [
        { label: 'ACTIVE KPIs', value: 18 },
        { label: 'DATA SOURCES', value: 9 },
        { label: 'PARTNER LOGINS', value: 34 }
      ],
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=600&auto=format&fit=crop'
    },
    capacity: {
      assetsFrom: 6,
      assetsTo: 24,
      timeSaved: '71%',
      bullets: [
        { color: 'bg-blue-500', text: 'Automated rollups replaced manual spreadsheet consolidation.' },
        { color: 'bg-cyan-500', text: 'Unified dashboard reduced ad‑hoc status requests from stakeholders.' },
        { color: 'bg-indigo-500', text: 'Sharable visuals accelerated renewal & multi‑year discussions.' }
      ]
    }
  }
];