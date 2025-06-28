// src/AboutUsPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Briefcase, Heart, Home, AlertTriangle, Coffee, Building } from './components/Icons.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';

// Using picsum.photos for reliable image loading with themed seeds
const STATIC_MEDIA = {
    collage: [
        'https://cdn.pixabay.com/photo/2017/03/18/14/56/panorama-2154194_1280.jpg',
        'https://cdn.pixabay.com/photo/2019/06/13/16/06/dance-4271941_640.jpg',
        'https://cdn.pixabay.com/photo/2020/02/25/15/46/parade-4879243_640.jpg',
        'https://cdn.pixabay.com/photo/2021/11/06/00/32/volunteer-6772196_640.jpg',
        'https://cdn.pixabay.com/photo/2014/03/25/18/24/latin-297932_640.jpg',
    ],
    map: 'https://cdn.pixabay.com/photo/2023/08/29/10/07/golden-gate-8220894_640.jpg', // Static map of 9 counties
    gradients: [
        'from-purple-200 to-indigo-200',
        'from-sky-200 to-blue-200',
        'from-amber-100 to-yellow-200',
        'from-rose-200 to-pink-200',
        'from-teal-100 to-cyan-200',
        'from-lime-200 to-green-200',
    ]
};

const advisoryBoard = [
  {
    name: 'Jeremy Nguyen',
    title: 'Advisory Board, Chan Zuckerberg Initiative',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D5603AQET5tsjlPDvOA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1705692479717?e=1756339200&v=beta&t=pUrtqQOE_DKvBg_ZXfiIYqckGn5cNs54CvTGFc7Zwu4',
    bio: 'Jeremy brings 10 years of experience advancing social impact through data-driven strategies and cross-sector collaboration. At the Chan Zuckerberg Initiative and CSBio Community Foundation, he led community-focused initiatives and educational programs that expanded access, built partnerships, and increased equity across the Bay Area. Previously at Stanford University, he supported research-practice partnerships to inform systems change in education, healthcare, and public services.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://picsum.photos/seed/placeholder-headshot-2/400/400',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://picsum.photos/seed/placeholder-headshot-3/400/400',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://picsum.photos/seed/placeholder-headshot-4/400/400',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://picsum.photos/seed/placeholder-headshot-5/400/400',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://picsum.photos/seed/placeholder-headshot-6/400/400',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  }
];

// Reusable components
const StorySection = ({ children, className = '' }) => ( <motion.div className={`min-h-screen w-full flex flex-col justify-center items-center py-24 md:py-32 relative overflow-hidden ${className}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ staggerChildren: 0.3 }}>{children}</motion.div>);
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

const AnimatedGradientShape = ({ className, initial, animate, gradient }) => (
    <motion.div 
        className={`absolute hidden md:block rounded-full z-0 ${className} bg-gradient-to-br ${gradient}`} 
        initial={initial} 
        animate={animate} 
        transition={{
            duration: Math.random() * 10 + 10, 
            ease: 'easeInOut', 
            repeat: Infinity, 
            repeatType: 'reverse',
        }}
    />
);

const AboutUsPage = () => {
  const formatCurrency = (amount) => `$${(amount / 1000000000).toFixed(0)}B+`;
  const formatNumber = (num) => num.toLocaleString() + '+';
  const formatPercentage = (num) => `${num}%`;

  return (
    <div className="bg-[#F8F3ED] text-[#333132] font-serif overflow-x-hidden">
      <div className="container mx-auto px-6 max-w-7xl">

        <StorySection>
          {/* --- UPDATED: Gradient balls are fully visible --- */}
          <AnimatedGradientShape className="w-48 h-48 top-20 left-16" initial={{ y: -15, x: 5 }} animate={{ y: 15, x: -5 }} gradient={STATIC_MEDIA.gradients[0]} />
          <AnimatedGradientShape className="w-24 h-24 bottom-24 right-20" initial={{ y: 10, x: -5 }} animate={{ y: -10, x: 5 }} gradient={STATIC_MEDIA.gradients[1]} />
          <div className="text-center z-20 relative">
            <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              A Region of Unmatched Potential.<br /> A Community with Unmet Needs.
            </motion.h1>
            <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="font-sans text-lg md:text-xl text-slate-600 mt-6 max-w-4xl mx-auto leading-relaxed">
              The San Francisco Bay Area is a global engine of innovation, fueled by incredible wealth and human capital. Yet, this prosperity exists alongside deep-seated community challenges. Our work begins by understanding the true scale of both the resources and the need.
            </motion.p>
          </div>
          <motion.div 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
            className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mt-20 w-full max-w-6xl z-10 font-sans text-center"
          >
            <motion.div variants={fadeIn}>
              <Users className="h-10 w-10 mx-auto text-sky-500 mb-2" />
              <AnimatedCounter targetValue={7700000} formatValue={formatNumber} className="text-4xl font-bold text-sky-600" />
              <p className="text-sm font-medium text-slate-500 mt-1">Bay Area Residents</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Heart className="h-10 w-10 mx-auto text-rose-500 mb-2" />
              <AnimatedCounter targetValue={33000} formatValue={formatNumber} className="text-4xl font-bold text-rose-600" />
              <p className="text-sm font-medium text-slate-500 mt-1">Nonprofits</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Briefcase className="h-10 w-10 mx-auto text-amber-500 mb-2" />
              <AnimatedCounter targetValue={8000} formatValue={formatNumber} className="text-4xl font-bold text-amber-600" />
              <p className="text-sm font-medium text-slate-500 mt-1">Foundations</p>
            </motion.div>
            <motion.div variants={fadeIn}>
               <BarChart3 className="h-10 w-10 mx-auto text-teal-500 mb-2" />
              <AnimatedCounter targetValue={13000000000} duration={3000} formatValue={formatCurrency} className="text-4xl font-bold text-teal-600" />
              <p className="text-sm font-medium text-slate-500 mt-1">Given Annually</p>
            </motion.div>
            <motion.div variants={fadeIn}>
                <Home className="h-10 w-10 mx-auto text-red-500" />
                <AnimatedCounter targetValue={38000} formatValue={formatNumber} className="text-4xl font-bold text-red-600" />
                <p className="text-sm font-medium text-slate-500 mt-1">People Experiencing Homelessness</p>
            </motion.div>
            <motion.div variants={fadeIn}>
                <AlertTriangle className="h-10 w-10 mx-auto text-orange-500" />
                <AnimatedCounter targetValue={20} formatValue={formatPercentage} className="text-4xl font-bold text-orange-600" />
                <p className="text-sm font-medium text-slate-500 mt-1">Residents Living in Poverty</p>
            </motion.div>
            <motion.div variants={fadeIn}>
                <Building className="h-10 w-10 mx-auto text-indigo-500" />
                <AnimatedCounter targetValue={45} formatValue={formatPercentage} className="text-4xl font-bold text-indigo-600" />
                <p className="text-sm font-medium text-slate-500 mt-1">Renters Who Are Rent-Burdened</p>
            </motion.div>
             <motion.div variants={fadeIn}>
                <Coffee className="h-10 w-10 mx-auto text-blue-500" />
                <AnimatedCounter targetValue={25} formatValue={formatPercentage} className="text-4xl font-bold text-blue-600" />
                <p className="text-sm font-medium text-slate-500 mt-1">Households Facing Food Insecurity</p>
            </motion.div>
          </motion.div>
          <ScrollArrow className="bottom-4 left-1/2 -translate-x-1/2" />
        </StorySection>

        <StorySection>
            <AnimatedGradientShape className="w-56 h-56 bottom-16 left-10" initial={{ scale: 0.9 }} animate={{ scale: 1.1 }} gradient={STATIC_MEDIA.gradients[2]} />
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <motion.div variants={fadeIn} className="text-left z-10">
                    <h2 className="text-4xl font-bold text-slate-800 leading-tight">From Complexity to Clarity</h2>
                    <div className="font-sans text-lg text-slate-600 mt-6 space-y-4 leading-relaxed">
                        <p>The numbers tell a story of a fractured landscape. Vital information is scattered across thousands of foundation websites, outdated databases, and word-of-mouth networks. For nonprofits, this means countless hours lost on prospecting instead of mission-driven work. For funders, it creates a blind spot, making it difficult to discover emerging organizations and new solutions.</p>
                        <p className="text-slate-700 font-semibold">This inefficiency is a tax on progress. It slows down the very work that aims to uplift our communities.</p>
                        <p>1RFP was created to solve this problem. Our mission is to build a centralized, intelligent, and equitable platform that serves as the connective tissue for the Bay Area's social impact sector. We use technology not as an end, but as a means to foster deeper human connection, build stronger partnerships, and accelerate the flow of resources to where they are needed most.</p>
                    </div>
                </motion.div>
                <motion.div 
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
                  className="grid grid-cols-3 grid-rows-3 gap-3 aspect-[4/3] z-10"
                >
                    <motion.div variants={fadeIn} className="col-span-2 row-span-2 rounded-lg bg-cover bg-center shadow-lg" style={{backgroundImage: `url(${STATIC_MEDIA.collage[0]})`}}></motion.div>
                    <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-lg bg-cover bg-center shadow-lg" style={{backgroundImage: `url(${STATIC_MEDIA.collage[1]})`}}></motion.div>
                    <motion.div variants={fadeIn} className="col-span-1 row-span-2 rounded-lg bg-cover bg-center shadow-lg" style={{backgroundImage: `url(${STATIC_MEDIA.collage[2]})`}}></motion.div>
                    <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-lg bg-cover bg-center shadow-lg" style={{backgroundImage: `url(${STATIC_MEDIA.collage[3]})`}}></motion.div>
                    <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-lg bg-cover bg-center shadow-lg" style={{backgroundImage: `url(${STATIC_MEDIA.collage[4]})`}}></motion.div>
                </motion.div>
            </div>
        </StorySection>

        <StorySection>
            <AnimatedGradientShape className="w-40 h-40 top-16 right-16" initial={{ y: -15, rotate: 0 }} animate={{ y: 15, rotate: 90 }} gradient={STATIC_MEDIA.gradients[3]} />
            <div className="text-center mb-12 md:mb-16 z-10">
                <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-slate-800">A Bridge Built from Both Sides</motion.h2>
                <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}} className="font-sans text-lg text-slate-500 mt-2 max-w-2xl mx-auto">Our advisory board has direct experience from both sides of the funding table.</motion.p>
            </div>
            <motion.div 
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.4 } } }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl z-10"
            >
                {advisoryBoard.map((member, index) => (
                <motion.div 
                    key={index} 
                    variants={{ hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border border-slate-200 shadow-lg flex flex-col items-center"
                >
                    <img className="mx-auto h-28 w-28 rounded-full mb-4 object-cover" src={member.imageUrl} alt={member.name} />
                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="font-sans font-semibold text-blue-600 mb-3 text-sm">{member.title}</p>
                    <p className="font-sans text-slate-600 text-sm flex-grow">{member.bio}</p>
                </motion.div>
                ))}
            </motion.div>
        </StorySection>

        <StorySection>
            <AnimatedGradientShape className="w-64 h-64 bottom-16 right-16" initial={{ y: 15, x: -10 }} animate={{ y: -15, x: 10 }} gradient={STATIC_MEDIA.gradients[4]} />
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center w-full max-w-6xl z-10">
                <motion.div variants={fadeIn}>
                    <img src={STATIC_MEDIA.map} alt="Map of the 9 Bay Area counties" className="w-full h-auto object-contain drop-shadow-xl" />
                </motion.div>
                <motion.div variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}}>
                    <div className="inline-block bg-rose-100 p-3 rounded-full mb-4">
                        <Heart className="h-8 w-8 text-rose-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Committed to Home</h2>
                    <p className="font-sans text-lg text-slate-600 mt-4 leading-relaxed">
                        1RFP is exclusively for and about the 9-county San Francisco Bay Area. This local focus is our greatest strength. It allows us to build deeper relationships, provide more relevant data, and truly understand the nuanced challenges and opportunities our communities face. 
                    </p>
                     <div className="mt-6 font-sans border-t border-slate-200 pt-6">
                        <p className="font-semibold text-slate-700 mb-3">Serving the counties of:</p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-500">
                            <li>Alameda</li>
                            <li>Contra Costa</li>
                            <li>Marin</li>
                            <li>Napa</li>
                            <li>San Francisco</li>
                            <li>San Mateo</li>
                            <li>Santa Clara</li>
                            <li>Solano</li>
                            <li>Sonoma</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </StorySection>
      </div>
    </div>
  );
};

export default AboutUsPage;