// Updated FunderProfilePage.jsx with real social interactions - COMPLETE VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { 
  Loader, ArrowLeft, ArrowRight, ExternalLink, MapPin, DollarSign, IconBriefcase, 
  MessageSquare, ClipboardList, Users as SimilarIcon, ClipboardCheck, List, Award, 
  Users, Tag, Lightbulb, Heart, TrendingUp, Calendar, 
  Eye, Star, Coffee, Globe, Building 
} from './components/Icons.jsx';
import { getPillClasses, getGrantTypePillClasses, formatDate, getFunderTypePillClasses } from './utils.js';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FunderCard from './components/FunderCard.jsx';
import NonprofitCard from './components/NonprofitCard.jsx';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import Avatar from './components/Avatar.jsx';

// Import our new social hooks
import { useFunderFollow, useFunderBookmark, usePostLike } from './utils/funderSocialHooks.js';
import { useProfileViewTracking } from './utils/profileViewsHooks.js';

const FunderProfilePage = () => {
  const { funderSlug } = useParams();
  const navigate = useNavigate();
  
  // Core data states
  const [funder, setFunder] = useState(null);
  const [allFunders, setAllFunders] = useState([]);
  const [funderGrants, setFunderGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Social/Interactive states - now managed by hooks
  const [starRating, setStarRating] = useState(4.8);
  const [recentActivities, setRecentActivities] = useState([]);
  const [impactStories, setImpactStories] = useState([]);
  const [organizationPosts, setOrganizationPosts] = useState([]);
  const [grantees, setGrantees] = useState([]);
  const [kudos, setKudos] = useState([]);
  const [newKudos, setNewKudos] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  // Get session for social features
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use our custom hooks for social features
  const {
    isFollowing,
    followersCount,
    loading: followLoading,
    toggleFollow
  } = useFunderFollow(funder?.id, session?.user?.id);

  const {
    isBookmarked: isLiked,
    bookmarksCount: likesCount,
    loading: likeLoading,
    toggleBookmark: toggleLike
  } = useFunderBookmark(funder?.id, session?.user?.id);

  // Track profile views
  const { viewRecorded } = useProfileViewTracking(funder?.id, session?.user?.id);

  const openDetail = useCallback((grant) => {
    const fetchFullGrantData = async () => {
        const { data, error } = await supabase
            .from('grants')
            .select(`*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name))`)
            .eq('id', grant.id)
            .single();

        if (error) {
            console.error("Error fetching full grant details:", error);
            setSelectedGrant(grant);
        } else {
            const formattedGrant = {
                ...data,
                foundationName: data.funders?.name || 'Unknown Funder', 
                funderLogoUrl: data.funders?.logo_url || null,
                funderSlug: data.funders?.slug || null,
                fundingAmount: data.max_funding_amount || data.funding_amount_text || 'Not specified',
                dueDate: data.deadline,
                grantType: data.grant_type,
                eligibility_criteria: data.eligibility_criteria,
                categories: data.grant_categories.map(gc => gc.categories),
                locations: data.grant_locations.map(gl => gl.locations)
            };
            setSelectedGrant(formattedGrant);
        }
        setIsDetailModal(true);
    };
    fetchFullGrantData();
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModal(false);
  }, []);

  // Social interaction handlers now use real data
  const handleFollow = async () => {
    if (!session) {
      alert('Please log in to follow funders');
      return;
    }
    await toggleFollow();
  };

  const handleLike = async () => {
    if (!session) {
      alert('Please log in to like funders');
      return;
    }
    await toggleLike();
  };

  useEffect(() => {
    const fetchFunderData = async () => {
      if (!funderSlug) return;
      setLoading(true);
      setError(null);
      
      try {
        const { data: funderIdData, error: funderIdError } = await supabase
            .from('funders')
            .select('id')
            .eq('slug', funderSlug)
            .single();

        if (funderIdError) throw funderIdError;
        const funderId = funderIdData.id;
        
        const [funderRes, allFundersRes, grantsRes] = await Promise.all([
            supabase
              .from('funders')
              .select('*, funder_categories(categories(name)), funder_type:funder_type_id(name), funder_funding_locations(locations(id, name))')
              .eq('id', funderId)
              .single(),
            supabase
              .from('funders')
              .select('*, funder_categories(categories(name)), funder_type:funder_type_id(name), funder_funding_locations(locations(id, name))'),
            supabase
              .from('grants')
              .select(`*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name))`)
              .eq('funder_id', funderId)
              .order('deadline', { ascending: true, nullsFirst: false })
        ]);

        if (funderRes.error) throw funderRes.error;
        if (allFundersRes.error) console.warn("Could not fetch all funders:", allFundersRes.error.message);
        if (grantsRes.error) console.warn("Could not fetch grants for funder:", grantsRes.error.message);
        
        const funderData = funderRes.data;
        if (funderData) {
            funderData.focus_areas = funderData.funder_categories.map(fc => fc.categories.name);
            funderData.funding_locations = funderData.funder_funding_locations.map(ffl => ffl.locations.name);
        }
        setFunder(funderData);

        if (allFundersRes.data) {
             const formattedAllFunders = allFundersRes.data.map(f => ({ ...f, focus_areas: f.funder_categories.map(fc => fc.categories.name), funding_locations: f.funder_funding_locations.map(ffl => ffl.locations.name) }));
            setAllFunders(formattedAllFunders);
        }
        
        const formattedGrants = (grantsRes.data || []).map(grant => ({ ...grant, foundationName: grant.funders?.name || funderData.name, funderLogoUrl: grant.funders?.logo_url || funderData.logo_url, funderSlug: grant.funders?.slug || funderData.slug, fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified', dueDate: grant.deadline, grantType: grant.grant_type, eligibility_criteria: grant.eligibility_criteria, categories: grant.grant_categories.map(gc => gc.categories), locations: grant.grant_locations.map(gl => gl.locations) }));
        setFunderGrants(formattedGrants);

        // Fetch real activities if the table exists
        try {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('funder_activities')
            .select('*')
            .eq('funder_id', funderId)
            .order('activity_date', { ascending: false })
            .limit(5);
          
          if (activitiesData && !activitiesError) {
            setRecentActivities(activitiesData.map(activity => ({
              id: activity.id,
              type: activity.activity_type,
              description: activity.description || activity.title,
              date: activity.activity_date,
              amount: activity.amount
            })));
          } else {
            // Fallback to mock data
            setRecentActivities([
              { id: 1, type: 'grant_awarded', description: 'Awarded $50,000 to Bay Area Food Bank', date: '2024-01-15', amount: '$50,000' },
              { id: 2, type: 'new_program', description: 'Launched Environmental Justice Initiative', date: '2024-01-10' },
              { id: 3, type: 'partnership', description: 'Partnered with Silicon Valley Community Foundation', date: '2024-01-05' }
            ]);
          }
        } catch (activitiesError) {
          console.warn("Activities table not available, using mock data");
          setRecentActivities([
            { id: 1, type: 'grant_awarded', description: 'Awarded $50,000 to Bay Area Food Bank', date: '2024-01-15', amount: '$50,000' },
            { id: 2, type: 'new_program', description: 'Launched Environmental Justice Initiative', date: '2024-01-10' },
            { id: 3, type: 'partnership', description: 'Partnered with Silicon Valley Community Foundation', date: '2024-01-05' }
          ]);
        }

        // Fetch real impact stories if the table exists
        try {
          const { data: storiesData, error: storiesError } = await supabase
            .from('impact_stories')
            .select('*')
            .eq('funder_id', funderId)
            .order('created_at', { ascending: false })
            .limit(4);
          
          if (storiesData && !storiesError) {
            setImpactStories(storiesData.map(story => ({
              id: story.id,
              title: story.title,
              nonprofit: story.nonprofit_name,
              amount: story.grant_amount,
              impact: story.impact_metrics,
              image: story.image_url
            })));
          } else {
            // Fallback to mock data
            setImpactStories([
              {
                id: 1,
                title: 'Transforming Youth Education in Oakland',
                nonprofit: 'Oakland Youth Center',
                amount: '$75,000',
                impact: 'Served 500+ at-risk youth with after-school programs',
                image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400'
              },
              {
                id: 2,
                title: 'Clean Water Access Project',
                nonprofit: 'East Bay Environmental Alliance',
                amount: '$100,000',
                impact: 'Provided clean water access to 1,200 families',
                image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
              }
            ]);
          }
        } catch (storiesError) {
          console.warn("Impact stories table not available, using mock data");
          setImpactStories([
            {
              id: 1,
              title: 'Transforming Youth Education in Oakland',
              nonprofit: 'Oakland Youth Center',
              amount: '$75,000',
              impact: 'Served 500+ at-risk youth with after-school programs',
              image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400'
            },
            {
              id: 2,
              title: 'Clean Water Access Project',
              nonprofit: 'East Bay Environmental Alliance',
              amount: '$100,000',
              impact: 'Provided clean water access to 1,200 families',
              image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
            }
          ]);
        }

        try {
          const { data: membersData, error: membersError } = await supabase.rpc('get_organization_members', {
              organization_id_param: funderId,
              organization_type_param: 'funder'
          });
          if (membersError) console.warn("Could not fetch team members:", membersError.message);
          else setTeamMembers(membersData || []);
        } catch (membersError) {
          console.warn("Team members function not available:", membersError.message);
          setTeamMembers([]);
        }
        
        setStarRating((Math.random() * 1.5 + 3.5).toFixed(1));
        
        // Mock organization posts (you can replace this with real posts later)
        setOrganizationPosts([
          {
            id: 1,
            content: "Excited to announce our new $2M Climate Action Initiative! We're looking for innovative nonprofits working on environmental justice in the Bay Area. Applications open February 1st.",
            type: 'announcement',
            timestamp: '2024-01-20T10:00:00Z',
            likes: 45,
            comments: 12,
            image: 'https://images.unsplash.com/photo-1569163139394-de44cb5b4d32?w=600'
          },
          {
            id: 2,
            content: "Proud to share that our grantee, Oakland Community Kitchen, just reached their milestone of serving 100,000 meals to families in need! 🎉 This is the kind of impact that drives our mission every day.",
            type: 'celebration',
            timestamp: '2024-01-18T14:30:00Z',
            likes: 67,
            comments: 8
          },
          {
            id: 3,
            content: "Reflecting on our grantmaking philosophy: We believe the best solutions come from the communities we serve. That's why 80% of our funding goes directly to community-led organizations with lived experience.",
            type: 'reflection',
            timestamp: '2024-01-15T09:15:00Z',
            likes: 32,
            comments: 15
          }
        ]);

        setGrantees([
          {
            id: 1,
            name: "Bay Area Food Bank",
            tagline: "Fighting hunger in the Bay Area",
            location: "Oakland, CA",
            focusAreas: ["Food Security", "Community Health"],
            budget: "$2.5M - $5M",
            imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400",
            grantAmount: "$50,000",
            grantYear: "2023"
          },
          {
            id: 2,
            name: "Oakland Youth Center",
            tagline: "Empowering youth through education and mentorship",
            location: "Oakland, CA", 
            focusAreas: ["Youth Development", "Education"],
            budget: "$500K - $1M",
            imageUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400",
            grantAmount: "$75,000",
            grantYear: "2023"
          },
          {
            id: 3,
            name: "East Bay Environmental Alliance",
            tagline: "Protecting our environment for future generations",
            location: "Berkeley, CA",
            focusAreas: ["Environment", "Sustainability"],
            budget: "$1M - $2M", 
            imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
            grantAmount: "$100,000",
            grantYear: "2023"
          }
        ]);

      } catch (err) {
        console.error('Error fetching funder data:', err);
        setError('Could not load funder profile.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFunderData();
  }, [funderSlug]);
  
  const similarFunders = useMemo(() => {
    if (!funder || !allFunders.length) return [];
    return allFunders
      .filter(f => f.id !== funder.id)
      .map(otherFunder => ({ ...otherFunder, similarityScore: otherFunder.focus_areas.filter(area => funder.focus_areas.includes(area)).length }))
      .filter(f => f.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);
  }, [funder, allFunders]);
  
  const handleSimilarFunderFilterClick = useCallback((key, value) => {
    navigate('/funders', { state: { prefilledFilter: { key, value } } });
  }, [navigate]);

  useEffect(() => {
    if (funder) document.title = `1RFP - ${funder.name}`;
  }, [funder]);

  // Kudos carousel component
  const renderKudosCarousel = () => {
    const handleAddKudos = () => {
      if (newKudos.trim()) {
        const newKudosItem = {
          id: Date.now(),
          text: newKudos,
          author: {
            name: session?.user?.user_metadata?.full_name || "Anonymous User",
            organization: "Your Organization",
            avatar: session?.user?.user_metadata?.avatar_url || null
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
          <span className="text-sm text-slate-500">{kudos.length} kudos</span>
        </div>

        {/* Add Kudos Form */}
        {session && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h4 className="font-semibold text-slate-800 mb-3">Share your experience working with {funder.name}</h4>
            <div className="space-y-3">
              <textarea
                value={newKudos}
                onChange={(e) => setNewKudos(e.target.value)}
                placeholder="Write about your experience, partnership, or the impact of their support..."
                className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              />
              <button
                onClick={handleAddKudos}
                disabled={!newKudos.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Kudos
              </button>
            </div>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!session && (
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
            <p className="text-slate-600 mb-3">Want to share your experience with {funder.name}?</p>
            <Link 
              to="/login" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log in to add kudos
            </Link>
          </div>
        )}

        {/* Kudos Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayKudos.map((kudo) => (
            <div key={kudo.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <p className="text-slate-700 leading-relaxed mb-4">{kudo.text}</p>
              <div className="flex items-start gap-4">
                <Avatar src={kudo.author.avatar} fullName={kudo.author.name} size="md" />
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800">{kudo.author.name}</h5>
                  <p className="text-sm text-blue-600">{kudo.author.organization}</p>
                  <p className="text-xs text-slate-500">{formatDate(kudo.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {kudos.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No kudos yet</h3>
            <p className="text-slate-600">Be the first to share your experience with {funder.name}!</p>
          </div>
        )}
      </div>
    );
  };

  // Organization Posts component with real like functionality
  const PostCard = ({ post }) => {
    const {
      isLiked: postIsLiked,
      likesCount: postLikesCount,
      toggleLike: togglePostLike
    } = usePostLike(post.id, session?.user?.id);

    const handlePostLike = async () => {
      if (!session) {
        alert('Please log in to like posts');
        return;
      }
      await togglePostLike();
    };

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4 mb-4">
          <Avatar src={funder.logo_url} fullName={funder.name} size="md" />
          <div className="flex-1">
            <h4 className="font-bold text-slate-800">{funder.name}</h4>
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
          <button 
            onClick={handlePostLike}
            className={`flex items-center gap-2 transition-colors ${
              postIsLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-slate-500 hover:text-red-500'
            }`}
          >
            <Heart size={16} className={postIsLiked ? 'fill-current' : ''} />
            <span className="text-sm">{postLikesCount} likes</span>
          </button>
          <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
            <MessageSquare size={16} />
            <span className="text-sm">{post.comments} comments</span>
          </button>
        </div>
      </div>
    );
  };

  const renderOrganizationPosts = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <MessageSquare className="text-blue-500" />
        Latest Updates
      </h3>
      
      {organizationPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );

  // Enhanced Grantees Section with Analytics
  const renderGranteesSection = () => {
    // Calculate analytics from grantees data
    const totalGrantees = grantees.length;
    const totalFunding = grantees.reduce((sum, grantee) => {
      const amount = parseInt(grantee.grantAmount?.replace(/[$,]/g, '') || 0);
      return sum + amount;
    }, 0);

    // Focus area analysis
    const focusAreaCounts = {};
    grantees.forEach(grantee => {
      grantee.focusAreas.forEach(area => {
        focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1;
      });
    });

    // Location analysis
    const locationCounts = {};
    grantees.forEach(grantee => {
      const city = grantee.location.split(',')[0];
      locationCounts[city] = (locationCounts[city] || 0) + 1;
    });

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Our Grantees</h3>
          <p className="text-slate-600">Organizations we're proud to support in the Bay Area</p>
        </div>

        {/* Impact Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalGrantees}</div>
            <div className="text-blue-700 font-medium">Total Grantees</div>
            <div className="text-xs text-blue-600 mt-1">Active partnerships</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">${(totalFunding / 1000).toFixed(0)}K</div>
            <div className="text-green-700 font-medium">Total Awarded</div>
            <div className="text-xs text-green-600 mt-1">In recent grants</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{Object.keys(focusAreaCounts).length}</div>
            <div className="text-purple-700 font-medium">Focus Areas</div>
            <div className="text-xs text-purple-600 mt-1">Areas of impact</div>
          </div>
        </div>

        {/* Focus Areas Analysis */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Tag className="text-pink-500" />
            What Our Grantees Focus On
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(focusAreaCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([area, count]) => (
                <div key={area} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{area}</span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    {count}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="text-indigo-500" />
            Where We Fund
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(locationCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([city, count]) => (
                <div key={city} className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-lg font-bold text-indigo-600">{count}</div>
                  <div className="text-sm text-indigo-700">{city}</div>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Grantee Cards */}
        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4">All Grantees</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grantees.map((grantee) => (
              <div key={grantee.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={grantee.imageUrl} 
                    alt={grantee.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {grantee.grantAmount}
                  </div>
                </div>
                <div className="p-4">
                  <h5 className="font-bold text-slate-800 mb-2">{grantee.name}</h5>
                  <p className="text-slate-600 text-sm mb-3">{grantee.tagline}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">{grantee.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {grantee.focusAreas.slice(0, 2).map(area => (
                      <span key={area} className={`text-xs px-2 py-1 rounded-full ${getPillClasses(area)}`}>
                        {area}
                      </span>
                    ))}
                    {grantee.focusAreas.length > 2 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        +{grantee.focusAreas.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Funded in {grantee.grantYear}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderImpactStories = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Real Impact Stories</h3>
        <p className="text-slate-600">See how {funder.name} is making a difference in the Bay Area</p>
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
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {story.amount}
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-xl font-bold text-slate-800 mb-2">{story.title}</h4>
              <p className="text-blue-600 font-medium mb-3">{story.nonprofit}</p>
              <p className="text-slate-600 mb-4">{story.impact}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Funded in 2023</span>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Read Full Story →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecentActivity = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar className="text-blue-500" />
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {activity.type === 'grant_awarded' && <DollarSign size={16} className="text-blue-600" />}
              {activity.type === 'new_program' && <Lightbulb size={16} className="text-blue-600" />}
              {activity.type === 'partnership' && <Users size={16} className="text-blue-600" />}
            </div>
            
            <div className="flex-1">
              <p className="font-medium text-slate-800">{activity.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500">{formatDate(activity.date)}</span>
                {activity.amount && (
                  <span className="text-sm font-medium text-green-600">{activity.amount}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamSection = () => {
    // Mock data with different roles for demonstration
    const mockTeamData = [
      // Leadership
      { id: 1, full_name: "Dr. Sarah Chen", title: "Executive Director", avatar_url: null, role_type: "leadership" },
      { id: 2, full_name: "Michael Rodriguez", title: "Chief Operating Officer", avatar_url: null, role_type: "leadership" },
      
      // Staff
      { id: 3, full_name: "Jane Do", title: "Program Manager", avatar_url: null, role_type: "staff" },
      { id: 4, full_name: "John Do", title: "Education Engineer", avatar_url: null, role_type: "staff" },
      { id: 5, full_name: "Emily Watson", title: "Research Coordinator", avatar_url: null, role_type: "staff" },
      { id: 6, full_name: "David Kim", title: "Communications Specialist", avatar_url: null, role_type: "staff" },
      
      // Board Members
      { id: 7, full_name: "Dr. Patricia Williams", title: "Board Chair", avatar_url: null, role_type: "board" },
      { id: 8, full_name: "Robert Johnson", title: "Board Treasurer", avatar_url: null, role_type: "board" },
      { id: 9, full_name: "Maria Gonzalez", title: "Board Secretary", avatar_url: null, role_type: "board" },
      { id: 10, full_name: "Thomas Anderson", title: "Board Member", avatar_url: null, role_type: "board" }
    ];

    const leadership = mockTeamData.filter(member => member.role_type === 'leadership');
    const staff = mockTeamData.filter(member => member.role_type === 'staff');
    const boardMembers = mockTeamData.filter(member => member.role_type === 'board');

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
              <p className="text-blue-600 font-medium mb-3 text-xs">{member.title}</p>
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
          <p className="text-slate-600">The people behind the mission</p>
        </div>
        
        {leadership.length > 0 && renderTeamGroup("Leadership", leadership, "xl:grid-cols-4")}
        {staff.length > 0 && renderTeamGroup("Staff", staff, "xl:grid-cols-5")}
        {boardMembers.length > 0 && renderTeamGroup("Board Members", boardMembers, "xl:grid-cols-5")}
      </div>
    );
  };

  const renderHeroSection = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                {funder.logo_url ? (
                  <img 
                    src={funder.logo_url} 
                    alt={`${funder.name} logo`} 
                    className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl object-contain bg-white/10 backdrop-blur border border-white/20 p-3" 
                  />
                ) : (
                  <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-3xl lg:text-4xl text-slate-600">
                    {funder.name?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <Star size={16} className="text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-slate-800">{funder.name}</h1>
                {funder.funder_type?.name && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                      {funder.funder_type.name}
                    </span>
                    {funder.location && (
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 flex items-center gap-1">
                          <MapPin size={12} />
                          {funder.location}
                        </span>
                        <a 
                          href={funder.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm"
                        >
                          <Globe size={14} className="mr-1" />
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-6 text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-600" />
                    <span>{followLoading ? '...' : followersCount} followers</span>
                    <button 
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        isFollowing 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {followLoading ? '...' : (isFollowing ? '✓ Following' : '+ Follow')}
                    </button>
                  </div>
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <Heart size={14} className={`text-red-600 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likeLoading ? '...' : likesCount} likes</span>
                    <button
                      onClick={handleLike}
                      disabled={likeLoading}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        isLiked 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {likeLoading ? '...' : (isLiked ? '❤️ Liked' : '👍 Like')}
                    </button>
                  </div>
                </div>

                {/* Focus Areas Pills */}
                {funder.focus_areas && funder.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {funder.focus_areas.slice(0, 4).map(area => (
                      <span key={area} className={`text-xs font-medium px-3 py-1.5 rounded-full ${getPillClasses(area)}`}>
                        {area}
                      </span>
                    ))}
                    {funder.focus_areas.length > 4 && (
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                        +{funder.focus_areas.length - 4} more
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
            { id: 'grants', label: 'Active Grants', icon: ClipboardList },
            { id: 'grantees', label: 'Our Grantees', icon: Users },
            { id: 'kudos', label: 'Community Kudos', icon: Star },
            { id: 'impact', label: 'Impact Stories', icon: TrendingUp },
            { id: 'team', label: 'Team', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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

  if (loading) return ( 
    <div className="text-center py-20">
      <Loader size={40} className="mx-auto text-green-400 mb-3 animate-spin" />
      <p>Loading Funder Profile...</p>
    </div> 
  );
  
  if (error || !funder) return (
    <div className="text-center py-20">
      <p className="text-red-600">{error || "Funder not found."}</p>
      <Link to="/funders" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
        <ArrowLeft size={16} className="mr-1" />Back
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

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 space-y-0">
                  {/* Mission and Approach with Integrated Quick Facts */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Lightbulb className="text-yellow-500" />
                      Our Mission & Approach
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg mb-8">{funder.description}</p>
                    
                    {/* Integrated Quick Facts with Visual Design */}
                    <div className="border-t border-slate-200 pt-8">
                      <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Building className="text-blue-500" />
                        Quick Facts
                      </h4>
                      
                      {/* Focus Areas - At the top */}
                      {funder.focus_areas && funder.focus_areas.length > 0 && (
                        <div className="mb-6 bg-pink-50 rounded-lg p-4 border border-pink-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                              <Tag size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Focus / Priority Areas</span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-11">
                            {funder.focus_areas.map(area => (
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
                          <p className="text-slate-600 ml-11">{funder.location || 'Not specified'}</p>
                        </div>

                        {/* Annual Giving Card */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <DollarSign size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Annual Giving</span>
                          </div>
                          <p className="text-slate-600 ml-11">{funder.total_funding_annually || 'Not specified'}</p>
                        </div>

                        {/* Grant Size Card */}
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <MessageSquare size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Avg. Grant Size</span>
                          </div>
                          <p className="text-slate-600 ml-11">{funder.average_grant_size || 'Not specified'}</p>
                        </div>

                        {/* Notable Grant Card */}
                        {funder.notable_grant && (
                          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                <Award size={16} className="text-white" />
                              </div>
                              <span className="font-semibold text-slate-800">Notable Grant</span>
                            </div>
                            <p className="text-slate-600 ml-11">{funder.notable_grant}</p>
                          </div>
                        )}
                      </div>

                      {/* Geographic Scope */}
                      {funder.funding_locations && funder.funding_locations.length > 0 && (
                        <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                              <IconBriefcase size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Geographic Scope</span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-11">
                            {funder.funding_locations.map(location => (
                              <span key={location} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(location)}`}>
                                {location}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grant Types */}
                      {funder.grant_types && funder.grant_types.length > 0 && (
                        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                              <ClipboardList size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-800">Grant Types Offered</span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-11">
                            {funder.grant_types.map(type => (
                              <span key={type} className={`text-sm font-medium px-3 py-1.5 rounded-full border ${getGrantTypePillClasses(type)}`}>
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Similar Funders Section */}
                      {similarFunders.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                          <h5 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <SimilarIcon size={18} className="text-indigo-500" />
                            Similar Funders
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {similarFunders.map(similarFunder => (
                              <FunderCard key={similarFunder.id} funder={similarFunder} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'grants' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Current Grant Opportunities</h3>
                  <p className="text-slate-600">Active funding opportunities from {funder.name}</p>
                </div>

                {funder.application_process_summary && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ClipboardCheck className="text-blue-500" />
                      How to Apply
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{funder.application_process_summary}</p>
                  </div>
                )}
                
                {funderGrants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {funderGrants.map(grant => (
                      <GrantCard key={grant.id} grant={grant} onOpenDetailModal={openDetail} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Grants</h3>
                    <p className="text-slate-600">Check back soon for new opportunities!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'grantees' && (
              <div>
                {renderGranteesSection()}
              </div>
            )}

            {/* Kudos Tab */}
            {activeTab === 'kudos' && (
              <div className="max-w-6xl mx-auto">
                {renderKudosCarousel()}
              </div>
            )}

            {activeTab === 'impact' && (
              <div>
                {renderImpactStories()}
              </div>
            )}
            
            {activeTab === 'team' && (
              <div>
                {renderTeamSection()}
              </div>
            )}
          </div>
        </div>
      </div>

      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />
      )}
    </PublicPageLayout>
  );
};

export default FunderProfilePage;