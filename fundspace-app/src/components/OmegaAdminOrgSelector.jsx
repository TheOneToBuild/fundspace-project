// src/components/OmegaAdminOrgSelector.jsx - REDESIGNED: Modern dashboard aesthetic
import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Crown,
    AlertTriangle, 
    ArrowLeft,
    Search,
    Filter,
    Building2,
    Users,
    Edit,
    Settings,
    Heart,
    Sparkles,
    GraduationCap,
    Stethoscope,
    Church,
    Globe,
    MapPin,
    TrendingUp,
    Plus,
    Grid3X3,
    List,
    SortAsc,
    MoreVertical,
    Eye,
    UserPlus,
    Activity
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

const ITEMS_PER_PAGE = 12;

export default function OmegaAdminOrgSelector() {
    const { profile } = useOutletContext();
    const [searchParams] = useSearchParams();
    const typeFilter = searchParams.get('type') || 'all';
    
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [memberCounts, setMemberCounts] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('name');
    const [stats, setStats] = useState({
        total: 0,
        nonprofit: 0,
        foundation: 0,
        education: 0,
        healthcare: 0,
        government: 0,
        religious: 0,
        forprofit: 0,
        international: 0,
        totalMembers: 0
    });

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchOrganizations();
        }
    }, [isOmegaAdmin]);

    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, searchQuery]);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            setError('');

            const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select('*')
                .order('name');

            if (orgsError) throw orgsError;

            setOrganizations(organizations || []);
            
            const orgsByType = (organizations || []).reduce((acc, org) => {
                const type = org.type || 'other';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            setStats({
                total: organizations?.length || 0,
                nonprofit: orgsByType.nonprofit || 0,
                foundation: orgsByType.foundation || orgsByType.funder || 0,
                education: orgsByType.education || 0,
                healthcare: orgsByType.healthcare || 0,
                government: orgsByType.government || 0,
                religious: orgsByType.religious || 0,
                forprofit: orgsByType.forprofit || 0,
                international: orgsByType.international || 0,
                totalMembers: 0
            });

            if (organizations && organizations.length > 0) {
                await fetchMemberCounts(organizations);
            }

        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError('Failed to load organizations: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberCounts = async (orgs) => {
        try {
            const counts = {};
            let totalMembers = 0;
            
            await Promise.all(orgs.map(async (org) => {
                const { count, error } = await supabase
                    .from('organization_memberships')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .eq('organization_type', org.type);
                
                if (!error) {
                    const memberCount = count || 0;
                    counts[org.type + '-' + org.id] = memberCount;
                    totalMembers += memberCount;
                }
            }));
            
            setMemberCounts(counts);
            setStats(prev => ({ ...prev, totalMembers }));
        } catch (err) {
            console.error('Error fetching member counts:', err);
        }
    };

    const filteredAndSortedOrganizations = React.useMemo(() => {
        let filtered = [...organizations];

        if (searchQuery) {
            filtered = filtered.filter(org =>
                org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.location?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (typeFilter !== 'all') {
            const filterType = typeFilter === 'foundation' ? ['foundation', 'funder'] : [typeFilter];
            filtered = filtered.filter(org => filterType.includes(org.type));
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name?.localeCompare(b.name) || 0;
                case 'members':
                    const aMembers = memberCounts[a.type + '-' + a.id] || 0;
                    const bMembers = memberCounts[b.type + '-' + b.id] || 0;
                    return bMembers - aMembers;
                case 'type':
                    return a.type?.localeCompare(b.type) || 0;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [organizations, searchQuery, typeFilter, sortBy, memberCounts]);

    const totalPages = Math.ceil(filteredAndSortedOrganizations.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedOrganizations = filteredAndSortedOrganizations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getOrgTypeInfo = (type) => {
        const typeMap = {
            nonprofit: { label: 'Nonprofit', icon: Heart, color: '#ef4444', bgColor: '#fef2f2', textColor: '#b91c1c' },
            foundation: { label: 'Foundation', icon: Sparkles, color: '#8b5cf6', bgColor: '#f3f4f6', textColor: '#7c3aed' },
            funder: { label: 'Foundation', icon: Sparkles, color: '#8b5cf6', bgColor: '#f3f4f6', textColor: '#7c3aed' },
            education: { label: 'Education', icon: GraduationCap, color: '#3b82f6', bgColor: '#eff6ff', textColor: '#2563eb' },
            healthcare: { label: 'Healthcare', icon: Stethoscope, color: '#10b981', bgColor: '#ecfdf5', textColor: '#059669' },
            government: { label: 'Government', icon: Building2, color: '#6366f1', bgColor: '#eef2ff', textColor: '#4f46e5' },
            religious: { label: 'Religious', icon: Church, color: '#f59e0b', bgColor: '#fffbeb', textColor: '#d97706' },
            forprofit: { label: 'For-Profit', icon: Building2, color: '#22c55e', bgColor: '#f0fdf4', textColor: '#16a34a' },
            international: { label: 'International', icon: Globe, color: '#06b6d4', bgColor: '#ecfeff', textColor: '#0891b2' }
        };
        return typeMap[type] || { label: 'Organization', icon: Building2, color: '#6b7280', bgColor: '#f9fafb', textColor: '#374151' };
    };

    if (!isOmegaAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center max-w-md">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
                    <p className="text-gray-600 mb-8">
                        This dashboard is only accessible to Omega Admins.
                    </p>
                    <Link 
                        to="/profile"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Return to Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-transparent">
            <div className="w-full mx-auto p-6 space-y-8">
                {/* Banner matches OmegaAdminDashboard/OmegaAdminUsers */}
                <div className="relative rounded-2xl overflow-hidden mb-8" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1652113961036-8dda8f52029b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative px-8 py-12 lg:px-12 lg:py-16">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-4">
                                    <h1 className="text-4xl lg:text-5xl font-bold text-white">Organization Hub</h1>
                                </div>
                                <p className="text-xl text-white/90 mb-2">Manage and oversee your platform community</p>
                            </div>
                            <Link 
                                to="/profile/omega-admin"
                                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full"></div>
                    <div className="absolute bottom-8 right-24 w-12 h-12 bg-white/10 rounded-full"></div>
                    <div className="absolute top-1/2 right-8 w-6 h-6 bg-white/15 rounded-full"></div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats Grid - Responsive and proportionate */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <Link 
                        to="/profile/omega-admin/organizations"
                        className={'bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ' + (typeFilter === 'all' ? 'ring-2 ring-blue-500' : '')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {loading ? '...' : stats.total.toLocaleString()}
                        </div>
                        <p className="text-base font-medium text-gray-600">Total Organizations</p>
                    </Link>

                    <Link 
                        to="/profile/omega-admin/organizations?type=nonprofit"
                        className={'bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ' + (typeFilter === 'nonprofit' ? 'ring-2 ring-red-500' : '')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                                <Heart className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">NPO</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {loading ? '...' : stats.nonprofit.toLocaleString()}
                        </div>
                        <p className="text-base font-medium text-gray-600">Nonprofits</p>
                    </Link>

                    <Link 
                        to="/profile/omega-admin/organizations?type=foundation"
                        className={'bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ' + (typeFilter === 'foundation' ? 'ring-2 ring-purple-500' : '')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">FND</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {loading ? '...' : stats.foundation.toLocaleString()}
                        </div>
                        <p className="text-base font-medium text-gray-600">Foundations</p>
                    </Link>

                    <Link 
                        to="/profile/omega-admin/organizations?type=education"
                        className={'bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ' + (typeFilter === 'education' ? 'ring-2 ring-blue-500' : '')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">EDU</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {loading ? '...' : stats.education.toLocaleString()}
                        </div>
                        <p className="text-base font-medium text-gray-600">Education</p>
                    </Link>

                    {/* Removed Total Members stat card */}
                </div>

                {/* Extended Stats - Responsive and proportionate */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {[
                        { key: 'healthcare', label: 'Healthcare', icon: Stethoscope, color: '#10b981', bgColor: '#ecfdf5', code: 'HTH' },
                        { key: 'government', label: 'Government', icon: Building2, color: '#6366f1', bgColor: '#eef2ff', code: 'GOV' },
                        { key: 'religious', label: 'Religious', icon: Church, color: '#f59e0b', bgColor: '#fffbeb', code: 'REL' },
                        { key: 'international', label: 'International', icon: Globe, color: '#06b6d4', bgColor: '#ecfeff', code: 'INT' }
                    ].map(({ key, label, icon: Icon, color, bgColor, code }) => (
                        <Link 
                            key={key}
                            to={'/profile/omega-admin/organizations?type=' + key}
                            className={'bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ' + (typeFilter === key ? 'ring-2' : '')}
                            style={typeFilter === key ? { ringColor: color } : {}}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <div className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color, backgroundColor: bgColor }}>
                                    {code}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {loading ? '..' : stats[key].toLocaleString()}
                            </div>
                            <p className="text-base font-medium text-gray-600">{label}</p>
                        </Link>
                    ))}
                </div>

                {/* Search and Controls */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search organizations by name, tagline, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="members">Sort by Members</option>
                                <option value="type">Sort by Type</option>
                            </select>
                            <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={'p-3 rounded-xl transition-colors font-medium ' + (viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900')}
                                >
                                    <Grid3X3 size={18} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={'p-3 rounded-xl transition-colors font-medium ' + (viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900')}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {searchQuery && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Found <span className="font-bold">{filteredAndSortedOrganizations.length}</span> organization{filteredAndSortedOrganizations.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"
                            </div>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                </div>

                {/* Organizations Display */}
                <div className="bg-transparent rounded-3xl shadow-sm">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Organizations 
                                <span className="ml-3 text-lg font-normal text-gray-500">
                                    ({filteredAndSortedOrganizations.length} {typeFilter !== 'all' ? getOrgTypeInfo(typeFilter).label.toLowerCase() + 's' : 'total'})
                                </span>
                            </h2>
                            {totalPages > 1 && (
                                <div className="text-sm text-gray-500 font-medium">
                                    Page {currentPage} of {totalPages}
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-gray-500 font-medium">Loading organizations...</p>
                        </div>
                    ) : paginatedOrganizations.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Building2 className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">No organizations found</h3>
                            <p className="text-gray-600">
                                {searchQuery ? 'Try adjusting your search terms' : 'No organizations match the current filter'}
                            </p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8' : 'divide-y divide-gray-100'}>
                            {paginatedOrganizations.map((org) => {
                                const typeInfo = getOrgTypeInfo(org.type);
                                const IconComponent = typeInfo.icon;
                                const memberCount = memberCounts[org.type + '-' + org.id] || 0;

                                if (viewMode === 'list') {
                                    return (
                                        <div key={org.type + '-' + org.id} className="p-8 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-6">
                                                    {org.image_url ? (
                                                        <img 
                                                            src={org.image_url} 
                                                            alt={org.name}
                                                            className="w-16 h-16 rounded-2xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: typeInfo.bgColor }}>
                                                            <IconComponent className="w-8 h-8" style={{ color: typeInfo.color }} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-4 mb-2">
                                                            <h3 className="text-xl font-bold text-gray-900 truncate">{org.name}</h3>
                                                            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ color: typeInfo.textColor, backgroundColor: typeInfo.bgColor }}>
                                                                {typeInfo.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                                                            {org.location && (
                                                                <span className="flex items-center">
                                                                    <MapPin size={16} className="mr-2" />
                                                                    {org.location}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center">
                                                                <Users size={16} className="mr-2" />
                                                                {memberCount} member{memberCount !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <Link
                                                        to={'/profile/omega-admin/organizations/edit/' + org.type + '/' + org.id}
                                                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-medium"
                                                    >
                                                        <Edit size={18} className="mr-2" />
                                                        Edit
                                                    </Link>
                                                    <Link
                                                        to={'/profile/omega-admin/organizations/members/' + org.type + '/' + org.id}
                                                        className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
                                                    >
                                                        <Users size={18} className="mr-2" />
                                                        Members
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // Grid view
                                return (
                                    <div key={org.type + '-' + org.id} className="bg-white rounded-3xl p-8 hover:shadow-md transition-all border border-gray-100">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center space-x-4">
                                                {org.image_url ? (
                                                    <img 
                                                        src={org.image_url} 
                                                        alt={org.name}
                                                        className="w-16 h-16 rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: typeInfo.bgColor }}>
                                                        <IconComponent className="w-8 h-8" style={{ color: typeInfo.color }} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{org.name}</h3>
                                                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ color: typeInfo.textColor, backgroundColor: typeInfo.bgColor }}>
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {org.tagline && (
                                            <p className="text-gray-600 mb-6 leading-relaxed">{org.tagline}</p>
                                        )}

                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-8">
                                            <div className="flex items-center space-x-6">
                                                {org.location && (
                                                    <span className="flex items-center">
                                                        <MapPin size={16} className="mr-2" />
                                                        {org.location}
                                                    </span>
                                                )}
                                                <span className="flex items-center">
                                                    <Users size={16} className="mr-2" />
                                                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Link
                                                to={'/profile/omega-admin/organizations/edit/' + org.type + '/' + org.id}
                                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                <Edit size={18} className="mr-2" />
                                                Edit Organization
                                            </Link>
                                            <Link
                                                to={'/profile/omega-admin/organizations/members/' + org.type + '/' + org.id}
                                                className="px-4 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium border border-gray-200"
                                            >
                                                <Users size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Modern Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-8 border-t border-gray-100 bg-white rounded-b-3xl">
                            <div className="text-sm text-gray-600">
                                Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedOrganizations.length)}</span> of <span className="font-bold">{filteredAndSortedOrganizations.length}</span> organizations
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium bg-white"
                                >
                                    Previous
                                </button>
                                
                                <div className="flex items-center space-x-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const page = index + 1;
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 2 && page <= currentPage + 2)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={'w-10 h-10 text-sm rounded-xl transition-colors font-medium ' + (page === currentPage ? 'bg-blue-600 text-white shadow-lg' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200')}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            page === currentPage - 3 ||
                                            page === currentPage + 3
                                        ) {
                                            return <span key={page} className="px-2 text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium bg-white"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}