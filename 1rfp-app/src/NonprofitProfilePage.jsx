// src/NonprofitProfilePage.jsx - Modern Social-Forward Design
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { 
  Loader, ArrowLeft, ExternalLink, MapPin, DollarSign, Users, Calendar, Award, Tag, 
  Heart, Building, Globe, Eye, Star, Coffee, MessageSquare, TrendingUp, 
  Lightbulb, CheckCircle, Rocket, HandHeart, Target, BarChart3, Handshake
} from './components/Icons.jsx';
import { getPillClasses, formatDate } from './utils.js';
import NonprofitCard from './components/NonprofitCard.jsx';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import Avatar from './components/Avatar.jsx';

const NonprofitProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // Core data states
  const [nonprofit, setNonprofit] = useState(null);
  const [allNonprofits, setAllNonprofits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Social/Interactive states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [starRating, setStarRating] = useState(4.6);
  const [activeTab, setActiveTab] = useState('home');
  
  // Content states
  const [organizationPosts, setOrganizationPosts] = useState([]);
  const [impactStories, setImpactStories] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [kudos, setKudos] = useState([]);
  const [newKudos, setNewKudos] = useState('');
  const [impactMetrics, setImpactMetrics] = useState({});

  // Social interaction handlers
  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSimilarNonprofitFilterClick = useCallback((key, value) => {
    navigate('/nonprofits', { state: { prefilledFilter: { key, value } } });
  }, [navigate]);

  useEffect(() => {
    const fetchNonprofitData = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      
      try {
        const { data: nonprofitIdData, error: nonprofitIdError } = await supabase
          .from('nonprofits')
          .select('id')
          .eq('slug', slug)
          .single();

        if (nonprofitIdError) throw nonprofitIdError;
        const nonprofitId = nonprofitIdData.id;
        
        const [nonprofitRes, allNonprofitsRes] = await Promise.all([
          supabase
            .from('nonprofits')
            .select('*, nonprofit_categories(categories(name))')
            .eq('id', nonprofitId)
            .single(),
          supabase
            .from('nonprofits')
            .select('*, nonprofit_categories(categories(name))')
        ]);

        if (nonprofitRes.error) throw nonprofitRes.error;
        if (allNonprofitsRes.error) console.warn("Could not fetch all nonprofits:", allNonprofitsRes.error.message);
        
        const nonprofitData = nonprofitRes.data;
        if (nonprofitData) {
          nonprofitData.focusAreas = nonprofitData.nonprofit_categories.map(npc => npc.categories.name);
        }
        setNonprofit(nonprofitData);

        if (allNonprofitsRes.data) {
          const formattedAllNonprofits = allNonprofitsRes.data.map(np => ({ 
            ...np, 
            imageUrl: np.image_url,
            focusAreas: np.nonprofit_categories.map(npc => npc.categories.name) 
          }));
          setAllNonprofits(formattedAllNonprofits);
        }

        // Mock team members
        setTeamMembers([
          { id: 1, full_name: "Maria Rodriguez", title: "Executive Director", avatar_url: null, role_type: "leadership" },
          { id: 2, full_name: "Dr. James Chen", title: "Program Director", avatar_url: null, role_type: "leadership" },
          { id: 3, full_name: "Sarah Johnson", title: "Development Manager", avatar_url: null, role_type: "staff" },
          { id: 4, full_name: "Michael Davis", title: "Outreach Coordinator", avatar_url: null, role_type: "staff" },
          { id: 5, full_name: "Dr. Patricia Williams", title: "Board Chair", avatar_url: null, role_type: "board" },
          { id: 6, full_name: "Robert Kim", title: "Board Treasurer", avatar_url: null, role_type: "board" }
        ]);
        
        // Set social metrics
        setFollowersCount(Math.floor(Math.random() * 800) + 200);
        setLikesCount(Math.floor(Math.random() * 300) + 100);
        setStarRating((Math.random() * 1.2 + 3.8).toFixed(1));
        
        // Mock organization posts
        setOrganizationPosts([
          {
            id: 1,
            content: "🎉 Amazing news! We just reached our goal of serving 1,000 families this quarter. Thank you to all our volunteers and supporters who made this possible!",
            type: 'celebration',
            timestamp: '2024-01-22T09:00:00Z',
            likes: 89,
            comments: 23,
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600'
          },
          {
            id: 2,
            content: "Join us this Saturday for our monthly community garden event! We'll be planting winter vegetables and need volunteers to help. Bring your gloves and we'll provide everything else. 🌱",
            type: 'event',
            timestamp: '2024-01-20T14:30:00Z',
            likes: 54,
            comments: 17
          },
          {
            id: 3,
            content: "Reflecting on our mission: Every small action creates ripples of change in our community. Today we're grateful for the 47 volunteers who showed up to help sort donations at our warehouse.",
            type: 'reflection',
            timestamp: '2024-01-18T11:15:00Z',
            likes: 72,
            comments: 11
          }
        ]);

        // Mock impact stories
        setImpactStories([
          {
            id: 1,
            title: 'From Homelessness to Homeownership',
            participant: 'Jennifer M.',
            timeframe: '18-month program',
            outcome: 'Successfully purchased her first home and started a small business',
            image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'
          },
          {
            id: 2,
            title: 'Youth Leadership Development',
            participant: 'Marcus T.',
            timeframe: '3-year mentorship',
            outcome: 'Graduated high school with honors and received college scholarship',
            image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400'
          }
        ]);

        // Mock programs
        setPrograms([
          {
            id: 1,
            name: 'Emergency Food Assistance',
            description: 'Weekly food distribution serving 300+ families',
            participants: '1,200 families served annually',
            budget: '$240,000',
            image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400'
          },
          {
            id: 2,
            name: 'Youth Mentorship Program',
            description: 'One-on-one mentoring for at-risk teens',
            participants: '85 youth enrolled',
            budget: '$120,000',
            image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400'
          },
          {
            id: 3,
            name: 'Job Training & Placement',
            description: 'Skills training and career placement services',
            participants: '150 adults trained',
            budget: '$180,000',
            image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400'
          }
        ]);

        // Mock supporters
        setSupporters([
          {
            id: 1,
            name: 'Silicon Valley Community Foundation',
            type: 'Foundation',
            relationship: 'Major Grant Partner',
            amount: '$75,000',
            year: '2024'
          },
          {
            id: 2,
            name: 'Bay Area Food Bank',
            type: 'Nonprofit Partner',
            relationship: 'Program Collaborator',
            year: '2023-2024'
          },
          {
            id: 3,
            name: 'Local Tech Companies',
            type: 'Corporate Partners',
            relationship: 'Volunteer & Funding Support',
            amount: '$45,000',
            year: '2024'
          }
        ]);

        // Mock impact metrics
        setImpactMetrics({
          totalServed: 2400,
          volunteersActive: 156,
          programsRunning: 8,
          communityPartners: 23,
          yearsOfService: nonprofitData.year_founded ? new Date().getFullYear() - nonprofitData.year_founded : 12
        });

      } catch (err) {
        console.error('Error fetching nonprofit data:', err);
        setError('Could not load nonprofit profile.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNonprofitData();
  }, [slug]);

  const similarNonprofits = useMemo(() => {
    if (!nonprofit || !allNonprofits.length) return [];
    return allNonprofits
      .filter(np => np.id !== nonprofit.id)
      .map(otherNonprofit => ({ 
        ...otherNonprofit, 
        similarityScore: otherNonprofit.focusAreas.filter(area => nonprofit.focusAreas.includes(area)).length 
      }))
      .filter(np => np.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);
  }, [nonprofit, allNonprofits]);

  useEffect(() => {
    if (nonprofit) document.title = `1RFP - ${nonprofit.name}`;
  }, [nonprofit]);

  // Kudos component
  const renderKudosCarousel = () => {
    const handleAddKudos = () => {
      if (newKudos.trim()) {
        const newKudosItem = {
          id: Date.now(),
          text: newKudos,
          author: {
            name: "You",
            organization: "Your Organization",
            avatar: null
          },
          createdAt: new Date().toISOString()
        };
        setKudos(prev => [newKudosItem, ...prev]);
        setNewKudos('');
      }
    };

    const displayKudos = kudos.slice(0, 20);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="text-yellow-500" />
            Community Kudos
          </h3>
          <span className="text-sm text-slate-500">{kudos.length} testimonials</span>
        </div>

        {/* Add Kudos Form */}
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <h4 className="font-semibold text-slate-800 mb-3">Share your experience with {nonprofit.name}</h4>
          <div className="space-y-3">
            <textarea
              value={newKudos}
              onChange={(e) => setNewKudos(e.target.value)}
              placeholder="Tell us about your experience as a volunteer, participant, or supporter..."
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[100px]"
            />
            <button
              onClick={handleAddKudos}
              disabled={!newKudos.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Kudos
            </button>
          </div>
        </div>

        {/* Kudos Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayKudos.map((kudo) => (
            <div key={kudo.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <p className="text-slate-700 leading-relaxed mb-4">{kudo.text}</p>
              <div className="flex items-start gap-4">
                <Avatar src={kudo.author.avatar} fullName={kudo.author.name} size="md" />
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800">{kudo.author.name}</h5>
                  <p className="text-sm text-purple-600">{kudo.author.organization}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeroSection = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                {nonprofit.image_url ? (
                  <img 
                    src={nonprofit.image_url} 
                    alt={`${nonprofit.name} logo`} 
                    className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl object-cover bg-white/10 backdrop-blur border border-white/20 p-1" 
                  />
                ) : (
                  <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center font-bold text-3xl lg:text-4xl text-purple-600">
                    {nonprofit.name?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-purple-500 rounded-full p-2">
                  <Heart size={16} className="text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-slate-800">{nonprofit.name}</h1>
                {nonprofit.tagline && (
                  <p className="text-lg text-slate-600 mb-4 italic">{nonprofit.tagline}</p>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                    501(c)(3) Nonprofit
                  </span>
                  {nonprofit.location && (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 flex items-center gap-1">
                        <MapPin size={12} />
                        {nonprofit.location}
                      </span>
                      {nonprofit.website && (
                        <a 
                          href={nonprofit.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm"
                        >
                          <Globe size={14} className="mr-1" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-purple-600" />
                    <span>{followersCount} followers</span>
                    <button 
                      onClick={handleFollow}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isFollowing 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                  </div>
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <Heart size={14} className={`text-red-600 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount} likes</span>
                    <button
                      onClick={handleLike}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isLiked 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isLiked ? '❤️ Liked' : '👍 Like'}
                    </button>
                  </div>
                </div>

                {/* Focus Areas Pills */}
                {nonprofit.focusAreas && nonprofit.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nonprofit.focusAreas.slice(0, 4).map(area => (
                      <span key={area} className={`text-xs font-medium px-3 py-1.5 rounded-full ${getPillClasses(area)}`}>
                        {area}
                      </span>
                    ))}
                    {nonprofit.focusAreas.length > 4 && (
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                        +{nonprofit.focusAreas.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabNavigation = () => (
    <div className="sticky top-0 bg-white border-b border-slate-200 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'home', label: 'Home', icon: Globe },
            { id: 'overview', label: 'Overview', icon: Building },
            { id: 'programs', label: 'Programs', icon: Rocket },
            { id: 'impact', label: 'Impact Stories', icon: TrendingUp },
            { id: 'kudos', label: 'Community Kudos', icon: Star },
            { id: 'supporters', label: 'Supporters', icon: Handshake },
            { id: 'team', label: 'Team', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const renderOrganizationPosts = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <MessageSquare className="text-purple-500" />
        Latest Updates
      </h3>
      
      {organizationPosts.map((post) => (
        <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <Avatar src={nonprofit.image_url} fullName={nonprofit.name} size="md" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">{nonprofit.name}</h4>
              <p className="text-sm text-slate-500">{formatDate(post.timestamp)}</p>
            </div>
          </div>
          
          <p className="text-slate-700 mb-4 leading-relaxed">{post.content}</p>
          
          {post.image && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img src={post.image} alt="Post image" className="w-full h-64 object-cover" />
            </div>
          )}
          
          <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
            <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
              <Heart size={16} />
              <span className="text-sm">{post.likes} likes</span>
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-purple-500 transition-colors">
              <MessageSquare size={16} />
              <span className="text-sm">{post.comments} comments</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderImpactMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-purple-600 mb-1">{impactMetrics.totalServed?.toLocaleString()}</div>
        <div className="text-purple-700 font-medium text-sm">People Served</div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-blue-600 mb-1">{impactMetrics.volunteersActive}</div>
        <div className="text-blue-700 font-medium text-sm">Active Volunteers</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-green-600 mb-1">{impactMetrics.programsRunning}</div>
        <div className="text-green-700 font-medium text-sm">Programs</div>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-orange-600 mb-1">{impactMetrics.communityPartners}</div>
        <div className="text-orange-700 font-medium text-sm">Partners</div>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-indigo-600 mb-1">{impactMetrics.yearsOfService}</div>
        <div className="text-indigo-700 font-medium text-sm">Years Serving</div>
      </div>
    </div>
  );

  const renderProgramsSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Our Programs</h3>
        <p className="text-slate-600">Making a difference through focused initiatives</p>
      </div>

      {renderImpactMetrics()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={program.image} 
                alt={program.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {program.budget}
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-slate-800 mb-2">{program.name}</h4>
              <p className="text-slate-600 text-sm mb-3">{program.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">{program.participants}</span>
              </div>
              <div className="text-xs text-slate-500">
                Active since 2023
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSupportersSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Our Supporters & Partners</h3>
        <p className="text-slate-600">Grateful for the organizations that make our work possible</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supporters.map((supporter) => (
          <div key={supporter.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Handshake size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{supporter.name}</h4>
                <p className="text-sm text-purple-600">{supporter.type}</p>
              </div>
            </div>
            <p className="text-slate-600 mb-3">{supporter.relationship}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{supporter.year}</span>
              {supporter.amount && (
                <span className="font-medium text-green-600">{supporter.amount}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderImpactStories = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Real Impact Stories</h3>
        <p className="text-slate-600">See how {nonprofit.name} is changing lives in our community</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {impactStories.map((story) => (
          <div key={story.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={story.image} 
                alt={story.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Success Story
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-xl font-bold text-slate-800 mb-2">{story.title}</h4>
              <p className="text-purple-600 font-medium mb-3">{story.participant}</p>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600">{story.timeframe}</span>
              </div>
              <p className="text-slate-600 mb-4">{story.outcome}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Program Impact</span>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                  Read Full Story →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamSection = () => {
    const leadership = teamMembers.filter(member => member.role_type === 'leadership');
    const staff = teamMembers.filter(member => member.role_type === 'staff');
    const boardMembers = teamMembers.filter(member => member.role_type === 'board');

    const renderTeamGroup = (title, members, gridCols = "xl:grid-cols-5") => (
      <div className="mb-10">
        <h4 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200">{title}</h4>
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridCols} gap-6`}>
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg border border-slate-200 p-6 text-center hover:shadow-md transition-shadow flex flex-col items-center justify-center">
              <div className="flex justify-center mb-4">
                <Avatar src={member.avatar_url} fullName={member.full_name} size="lg" />
              </div>
              <h5 className="font-bold text-slate-800 mb-2 text-sm">{member.full_name}</h5>
              <p className="text-purple-600 font-medium mb-3 text-xs">{member.title}</p>
              <button className="text-xs text-slate-500 hover:text-slate-700">
                View Profile →
              </button>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Meet Our Team</h3>
          <p className="text-slate-600">The passionate people behind our mission</p>
        </div>
        
        {leadership.length > 0 && renderTeamGroup("Leadership", leadership, "xl:grid-cols-4")}
        {staff.length > 0 && renderTeamGroup("Staff", staff, "xl:grid-cols-5")}
        {boardMembers.length > 0 && renderTeamGroup("Board Members", boardMembers, "xl:grid-cols-5")}
      </div>
    );
  };

  if (loading) return ( 
    <div className="text-center py-20">
      <Loader size={40} className="mx-auto text-purple-400 mb-3 animate-spin" />
      <p>Loading Nonprofit Profile...</p>
    </div> 
  );
  
  if (error || !nonprofit) return (
    <div className="text-center py-20">
      <p className="text-red-600">{error || "Nonprofit not found."}</p>
      <Link to="/nonprofits" className="mt-4 inline-flex items-center text-purple-600 hover:underline">
        <ArrowLeft size={16} className="mr-1" />Back to Nonprofits
      </Link>
    </div>
  );

  return (
    <PublicPageLayout bgColor="bg-slate-50">
      {renderHeroSection()}
      {renderTabNavigation()}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-screen py-8">
            {/* Home Tab - Social Feed */}
            {activeTab === 'home' && (
              <div className="max-w-6xl mx-auto">
                {renderOrganizationPosts()}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 space-y-0">
                  {/* Mission and Approach with Integrated Quick Facts */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Lightbulb className="text-yellow-500" />
                      Our Mission & Impact
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg mb-8">{nonprofit.description}</p>
                    
                    {/* Impact Metrics */}
                    {renderImpactMetrics()}
                    
                    {/* Integrated Quick Facts with Visual Design */}
                    <div className="border-t border-slate-200 pt-8">
                      <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Building className="text-purple-500" />
                        Quick Facts
                      </h4>
                      
                      {/* Focus Areas - At the top */}
                      {nonprofit.focusAreas && nonprofit.focusAreas.length > 0 && (
                        <div className="mb-6 bg-pink-50 rounded-lg p-4 border border-pink-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                              <Tag size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Focus / Priority Areas</span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-11">
                            {nonprofit.focusAreas.map(area => (
                              <span key={area} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(area)}`}>
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location Card */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <MapPin size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Headquarters</span>
                          </div>
                          <p className="text-slate-600 ml-11">{nonprofit.location || 'Not specified'}</p>
                        </div>

                        {/* Annual Budget Card */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <DollarSign size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Annual Budget</span>
                          </div>
                          <p className="text-slate-600 ml-11">{nonprofit.budget || 'Not specified'}</p>
                        </div>

                        {/* Year Founded Card */}
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <Calendar size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Year Founded</span>
                          </div>
                          <p className="text-slate-600 ml-11">{nonprofit.year_founded || 'Not specified'}</p>
                        </div>

                        {/* Staff Count Card */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                              <Users size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Staff Count</span>
                          </div>
                          <p className="text-slate-600 ml-11">{nonprofit.staff_count || 'Not specified'}</p>
                        </div>
                      </div>

                      {/* EIN */}
                      {nonprofit.ein && (
                        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                              <CheckCircle size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Tax ID (EIN)</span>
                          </div>
                          <p className="text-slate-600 ml-11">{nonprofit.ein}</p>
                        </div>
                      )}

                      {/* Similar Nonprofits Section */}
                      {similarNonprofits.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                          <h5 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users size={18} className="text-indigo-500" />
                            Similar Nonprofits
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {similarNonprofits.map(similarNonprofit => (
                              <NonprofitCard 
                                key={similarNonprofit.id} 
                                nonprofit={similarNonprofit} 
                                handleFilterChange={handleSimilarNonprofitFilterClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Programs Tab */}
            {activeTab === 'programs' && (
              <div>
                {renderProgramsSection()}
              </div>
            )}

            {/* Impact Stories Tab */}
            {activeTab === 'impact' && (
              <div>
                {renderImpactStories()}
              </div>
            )}

            {/* Kudos Tab */}
            {activeTab === 'kudos' && (
              <div className="max-w-6xl mx-auto">
                {renderKudosCarousel()}
              </div>
            )}

            {/* Supporters Tab */}
            {activeTab === 'supporters' && (
              <div>
                {renderSupportersSection()}
              </div>
            )}
            
            {/* Team Tab */}
            {activeTab === 'team' && (
              <div>
                {renderTeamSection()}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default NonprofitProfilePage;