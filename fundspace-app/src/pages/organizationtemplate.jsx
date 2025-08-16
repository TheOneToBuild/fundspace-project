import React, { useState, useRef } from 'react';
import { 
  Heart, 
  Sparkles, 
  Building2, 
  GraduationCap,
  Stethoscope,
  Church,
  Shield,
  MapPin,
  ExternalLink,
  Calendar,
  Users,
  DollarSign,
  Award,
  MessageSquare,
  Camera,
  Upload,
  X,
  Save,
  Eye,
  Star,
  TrendingUp,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';

// Mock organization data based on your schema
const mockOrganization = {
  id: 1,
  name: "Bay Area Community Foundation",
  type: "foundation",
  slug: "bay-area-community-foundation",
  isVerified: true,
  description: "We are a leading philanthropic organization dedicated to strengthening communities, fostering civic engagement, and addressing regional challenges through strategic grantmaking and community leadership. Our work spans education, housing, economic opportunity, and environmental sustainability.",
  website: "https://bacf.org",
  location: "San Francisco, CA",
  contact_email: "info@bacf.org",
  image_url: "https://www.sobrato.com/wp-content/uploads/2019/09/SBR_PurposeValues_SCU_Hall_1440x420.jpg",
  logo_url: "https://www.bayareacouncil.org/wp-content/uploads/2019/11/The-Sobrato-Organization.jpg",
  featured_image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop',
  year_founded: 1985,
  focusAreas: ["Education", "Housing", "Economic Opportunity", "Environment"],
  fundingLocations: ["San Francisco", "Oakland", "San Jose", "Peninsula", "Marin"],
  stats: {
    followers: 2847,
    likes: 1950,
    grants_awarded: 1200,
    total_funding: "$125M",
    organizations_supported: 850
  },
  northStar: {
      title: "Our North Star",
      description: "Our strategic vision guides every decision, partnership, and grant we make.",
      vision: {
          title: "Vision 2030",
          text: "A Bay Area where every community has equitable access to opportunities for prosperity, education, and environmental sustainability."
      },
      focus: {
          title: "Strategic Focus",
          text: "Catalyzing systemic change through collaborative partnerships, innovative funding models, and community-led solutions."
      },
      priorities: [
          { title: "Education Equity", text: "Closing opportunity gaps through innovative educational approaches" },
          { title: "Housing Stability", text: "Creating pathways to affordable, stable housing for all" },
          { title: "Climate Resilience", text: "Building community capacity for environmental challenges" },
      ]
  },
  posts: [
    { image: "https://images.unsplash.com/photo-1542744095-291d1f67b221?w=400&h=300&fit=crop", title: "New Education Initiative Launched", desc: "We're excited to announce our new $2M commitment to early childhood education programs.", time: "2 days ago" },
    { image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop", title: "Housing Partnership Announced", desc: "Partnering with local organizations to address housing affordability in underserved communities.", time: "5 days ago" },
    { image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&h=300&fit=crop", title: "Climate Action Grant Opens", desc: "Applications now open for our $500K climate resilience fund.", time: "1 week ago" }
  ],
  photos: [
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop'
  ],
  impactData: {
    spotlights: [
      { title: "Rewiring the Local Economy", text: "Our focus on economic opportunity aims to build a more inclusive and resilient local economy through strategic partnerships with job training programs and small business incubators.", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop" },
      { title: "A Home for Everyone", text: "Addressing the housing crisis requires a multi-faceted approach. We fund organizations that not only build affordable housing but also provide legal aid to prevent evictions and advocate for policies that protect tenants.", image: "https://images.unsplash.com/photo-1600585153492-5a2b75a6a1e0?w=600&h=400&fit=crop" }
    ],
    testimonials: [
      { quote: "Their funding was a game-changer. It allowed us to scale our operations and reach twice as many families in need. They're more than a funder; they're a true partner in our mission.", name: "Alicia Chen", title: "Executive Director, Oakland Housing Initiative", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" },
      { quote: "With the Foundation's support, we launched a coding bootcamp that has placed dozens of young adults into tech careers. This partnership is transforming lives.", name: "David Kim", title: "Founder, CodeForward", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" }
    ]
  }
};

// Organization type configurations
const ORG_TYPE_CONFIG = {
  foundation: { label: 'Foundation', icon: Sparkles, gradient: 'from-purple-500 to-indigo-600' },
  // ... other types would be defined here
};

const ModernOrganizationProfile = () => {
  const [organization, setOrganization] = useState(mockOrganization);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  const typeConfig = ORG_TYPE_CONFIG[organization.type] || ORG_TYPE_CONFIG.foundation;
  const IconComponent = typeConfig.icon;

  const getTabsForOrganizationType = (orgType) => {
    if (orgType === 'foundation') {
      return ['Home', 'Posts', 'Impact', 'North Star', 'Programs', 'Grants', 'Grantees', 'Team'];
    }
    return ['Home', 'Posts', 'Impact', 'Programs', 'Team'];
  };

  const FocusAreaPill = ({ area }) => {
    const gradients = ['from-amber-100 to-orange-100 text-amber-700 border-orange-200', 'from-emerald-100 to-teal-100 text-emerald-700 border-teal-200', 'from-rose-100 to-pink-100 text-rose-700 border-rose-200', 'from-blue-100 to-indigo-100 text-blue-700 border-indigo-200'];
    const gradient = gradients[area.length % gradients.length];
    return <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r ${gradient}`}>{area}</span>;
  };

  const PhotoGallery = ({ photos, title }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
        </div>
        <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4">{photos.map((photo, index) => (<div key={index} className="flex-shrink-0 w-72 h-52 rounded-lg overflow-hidden bg-slate-100 hover:scale-105 transition-transform cursor-pointer shadow-md"><img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" /></div>))}</div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-80 bg-slate-200"><img src={organization.image_url} alt="Organization banner" className="w-full h-full object-cover" /></div>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-start gap-6">
            <div className="relative -mt-20">
              <div className="w-40 h-40 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden"><img src={organization.logo_url} alt="Organization logo" className="w-full h-full object-cover" /></div>
            </div>
            <div className="flex-1 py-4">
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeConfig.gradient} text-white`}><IconComponent className="w-4 h-4 mr-2" />{typeConfig.label}</span>
                {organization.year_founded && <span className="text-slate-500 font-medium text-sm">Since {organization.year_founded}</span>}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold text-slate-900">{organization.name}</h1>
                {organization.isVerified && <CheckCircle className="w-7 h-7 text-blue-500 fill-white" />}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"><MapPin className="w-4 h-4" />{organization.location}</span>
                <a href={organization.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"><ExternalLink className="w-4 h-4" />Website</a>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-600"><Users className="w-4 h-4" /><span className="font-semibold text-slate-900">{new Intl.NumberFormat('en-US').format(organization.stats.followers)}</span><span className="text-sm">Followers</span></div>
                <div className="flex items-center gap-2 text-slate-600"><Heart className="w-4 h-4" /><span className="font-semibold text-slate-900">{new Intl.NumberFormat('en-US').format(organization.stats.likes)}</span><span className="text-sm">Likes</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4">
              <button onClick={() => setIsFollowing(!isFollowing)} className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${isFollowing ? 'bg-slate-200 text-slate-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>{isFollowing ? 'Following' : 'Follow'}</button>
              <button onClick={() => setIsLiked(!isLiked)} className="p-3 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"><Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex items-center gap-2 mb-8 p-2 bg-slate-100 rounded-2xl overflow-x-auto">
          {getTabsForOrganizationType(organization.type).map((tab) => (<button key={tab} onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))} className={`px-6 py-3 font-bold transition-all duration-300 whitespace-nowrap rounded-xl ${activeTab === tab.toLowerCase().replace(' ', '') ? `bg-gradient-to-r ${typeConfig.gradient} text-white shadow-lg` : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'}`}>{tab}</button>))}
        </div>

        {activeTab === 'home' && (
          <div className="space-y-10">
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm grid md:grid-cols-2 gap-10 items-center">
                <div className="flex flex-col h-full">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Our Mission ✨</h2>
                    <p className="text-slate-700 leading-relaxed text-lg flex-grow">{organization.description}</p>
                    <div className="mt-8 pt-6 border-t border-slate-200"><h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Focus Areas</h4><div className="flex flex-wrap gap-3">{organization.focusAreas.map((area) => (<FocusAreaPill key={area} area={area} />))}</div></div>
                </div>
                <img src={organization.featured_image} alt="Our Mission" className="rounded-2xl object-cover w-full h-full max-h-[450px]" />
            </div>
            
            <PhotoGallery photos={organization.photos} title="Community in Action" />

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-900">Recent Posts</h3><button onClick={() => setActiveTab('posts')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All Posts</button></div>
                <div className="flex overflow-x-auto space-x-6 pb-4 -mb-4">{organization.posts.map((post, i) => (<div key={i} className="flex-shrink-0 w-80 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:shadow-lg transition-shadow cursor-pointer"><div className="h-40 overflow-hidden"><img src={post.image} alt={post.title} className="w-full h-full object-cover rounded-t-xl" /></div><div className="p-4"><h4 className="font-bold text-slate-900 mb-2 truncate">{post.title}</h4><p className="text-slate-600 text-sm mb-3 line-clamp-2">{post.desc}</p><span className="text-xs text-slate-500 font-medium">{post.time}</span></div></div>))}</div>
            </div>
          </div>
        )}
        
        {activeTab === 'impact' && (
            <div className="space-y-16">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Impact Spotlights</h2>
                    <p className="text-lg text-slate-600 mb-8 max-w-4xl">Diving deeper into our strategic initiatives and their effect on the community.</p>
                    <div className="space-y-12">{organization.impactData.spotlights.map((spotlight, index) => (<div key={index} className="grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-2xl border border-slate-200"><div className={index % 2 === 1 ? 'md:order-2' : ''}><h3 className="text-2xl font-bold text-slate-800 mb-4">{spotlight.title}</h3><p className="text-slate-600 leading-relaxed">{spotlight.text}</p></div><div className={index % 2 === 1 ? 'md:order-1' : ''}><img src={spotlight.image} alt={spotlight.title} className="rounded-xl object-cover w-full h-64" /></div></div>))}</div>
                </div>
                <PhotoGallery photos={organization.photos} title="Our Work in Photos" />
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Voices from the Community</h2>
                    <p className="text-lg text-slate-600 mb-8 max-w-4xl">Hear directly from the partners we are proud to support.</p>
                    <div className="grid md:grid-cols-2 gap-8">{organization.impactData.testimonials.map((testimonial, index) => (<div key={index} className="bg-white p-8 rounded-2xl border border-slate-200"><p className="text-slate-700 text-lg mb-6">"{testimonial.quote}"</p><div className="flex items-center gap-4"><img src={testimonial.image} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover" /><div><p className="font-bold text-slate-900">{testimonial.name}</p><p className="text-sm text-slate-600">{testimonial.title}</p></div></div></div>))}</div>
                </div>
            </div>
        )}

        {activeTab === 'northstar' && (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
              <div className="text-center mb-12 max-w-3xl mx-auto"><div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Target className="w-8 h-8 text-white" /></div><h2 className="text-4xl font-bold text-slate-900 mb-4">{organization.northStar.title}</h2><p className="text-xl text-slate-600">{organization.northStar.description}</p></div>
              <div className="grid md:grid-cols-2 gap-8 mb-8"><div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100"><div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4"><Eye className="w-6 h-6 text-white" /></div><h3 className="text-xl font-bold text-slate-900 mb-3">{organization.northStar.vision.title}</h3><p className="text-slate-700">{organization.northStar.vision.text}</p></div><div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100"><div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4"><Zap className="w-6 h-6 text-white" /></div><h3 className="text-xl font-bold text-slate-900 mb-3">{organization.northStar.focus.title}</h3><p className="text-slate-700">{organization.northStar.focus.text}</p></div></div>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-xl border border-emerald-100"><h3 className="text-xl font-bold text-slate-900 mb-6">2024-2026 Strategic Priorities</h3><div className="grid md:grid-cols-3 gap-8">{organization.northStar.priorities.map(p => <div key={p.title}><h4 className="font-semibold text-emerald-800 mb-2">{p.title}</h4><p className="text-sm text-slate-700">{p.text}</p></div>)}</div></div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'home' && activeTab !== 'impact' && activeTab !== 'posts' && activeTab !== 'northstar' && activeTab !== 'grants' && activeTab !== 'grantees' && activeTab !== 'team' && (
           <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
             <h3 className="text-2xl font-bold text-slate-800">Content Coming Soon</h3>
             <p className="text-slate-600 mt-2">This section is currently under construction.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ModernOrganizationProfile;