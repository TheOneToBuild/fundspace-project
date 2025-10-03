import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Briefcase, 
    GraduationCap, 
    Heart, 
    Edit3, 
    Trash2, 
    MapPin,
    Calendar,
    Building2,
    Award
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
const MemberProfileExperience = ({ member, experiences, loading, currentUserId, isCurrentUser, refreshData }) => {
    const navigate = useNavigate();
    
    // experiences and loading state are now managed by the parent component
    const [activeTab, setActiveTab] = useState('work');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    
    const [organizationSuggestions, setOrganizationSuggestions] = useState([]);
    const [filteredOrganizations, setFilteredOrganizations] = useState([]);
    const [showOrganizationSuggestions, setShowOrganizationSuggestions] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    
    const [titleSuggestions, setTitleSuggestions] = useState([]);
    const [filteredTitles, setFilteredTitles] = useState([]);
    const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
    
    const [formData, setFormData] = useState({
        type: 'work',
        title: '',
        organization_name: '',
        organization_id: null,
        location: '',
        description: '',
        start_date: '',
        end_date: '',
        is_current: false,
        employment_type: 'full_time',
        degree: '',
        field_of_study: '',
        grade: '',
        skills: [],
        achievements: []
    });

    const handleOrganizationClick = async (organization) => {
        if (!organization?.id) return;
        
        try {
            const { data: orgData, error } = await supabase
                .from('organizations')
                .select('slug')
                .eq('id', organization.id)
                .single();
            
            if (!error && orgData?.slug) {
                navigate(`/organizations/${orgData.slug}`);
            } else {
                console.warn('Organization slug not found, using ID fallback');
                navigate(`/organizations/${organization.id}`);
            }
        } catch (error) {
            console.error('Error navigating to organization:', error);
        }
    };

    useEffect(() => {
        if (showAddForm && !editingExperience) {
            setFormData(prev => ({ ...prev, type: activeTab }));
        }
    }, [activeTab, showAddForm, editingExperience]);

    useEffect(() => {
        const fetchLocationSuggestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_experiences')
                    .select('location')
                    .not('location', 'is', null)
                    .neq('location', '');

                if (error) throw error;
                
                const uniqueLocations = [...new Set(data.map(item => item.location))].sort();
                setLocationSuggestions(uniqueLocations);
            } catch (error) {
                console.error('Error fetching location suggestions:', error);
            }
        };

        fetchLocationSuggestions();
    }, []);

    useEffect(() => {
        const fetchOrganizationSuggestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('id, name, image_url, type')
                    .order('name');

                if (error) throw error;
                setOrganizationSuggestions(data || []);
            } catch (error) {
                console.error('Error fetching organization suggestions:', error);
            }
        };

        fetchOrganizationSuggestions();
    }, []);

    useEffect(() => {
        const fetchTitleSuggestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_experiences')
                    .select('title')
                    .not('title', 'is', null)
                    .neq('title', '');

                if (error) throw error;
                
                const uniqueTitles = [...new Set(data.map(item => item.title))].sort();
                setTitleSuggestions(uniqueTitles);
            } catch (error) {
                console.error('Error fetching title suggestions:', error);
            }
        };

        fetchTitleSuggestions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isCurrentUser) return;

        setSaveLoading(true);
        try {
            const baseData = {
                type: activeTab,
                title: formData.title,
                organization_name: formData.organization_name,
                organization_id: formData.organization_id,
                location: formData.location,
                description: formData.description,
                start_date: formData.start_date || null,
                end_date: formData.is_current ? null : formData.end_date || null,
                is_current: formData.is_current,
                employment_type: formData.employment_type,
                degree: formData.degree,
                field_of_study: formData.field_of_study,
                grade: formData.grade,
                skills: Array.isArray(formData.skills) ? formData.skills : [],
                achievements: Array.isArray(formData.achievements) ? formData.achievements : [],
                is_visible: true
            };

            if (editingExperience) {
                const { error } = await supabase
                    .from('user_experiences')
                    .update(baseData)
                    .eq('id', editingExperience.id);
                if (error) throw error;
            } else {
                const insertData = {
                    ...baseData,
                    user_id: currentUserId
                };
                
                const { error } = await supabase
                    .from('user_experiences')
                    .insert([insertData]);
                if (error) throw error;
            }

            setShowAddForm(false);
            setEditingExperience(null);
            resetForm();
            if (refreshData) refreshData();
        } catch (error) {
            console.error('Error saving experience:', error);
            alert('Error saving experience. Please try again.');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (experienceId) => {
        if (!isCurrentUser) return;
        
        const experienceToDelete = experiences.find(exp => exp.id === experienceId);
        if (experienceToDelete) {
            setDeleteConfirm(experienceToDelete);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const { error } = await supabase
                .from('user_experiences')
                .delete()
                .eq('id', deleteConfirm.id);
            if (error) throw error;
            if (refreshData) refreshData();
        } catch (error) {
            console.error('Error deleting experience:', error);
            alert('Error deleting experience. Please try again.');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const resetForm = () => {
        setFormData({
            type: activeTab,
            title: '',
            organization_name: '',
            organization_id: null,
            location: '',
            description: '',
            start_date: '',
            end_date: '',
            is_current: false,
            employment_type: 'full_time',
            degree: '',
            field_of_study: '',
            grade: '',
            skills: [],
            achievements: []
        });
        setSelectedOrganization(null);
        setShowLocationSuggestions(false);
        setShowOrganizationSuggestions(false);
        setShowTitleSuggestions(false);
        setFilteredLocations([]);
        setFilteredOrganizations([]);
        setFilteredTitles([]);
    };

    const startEdit = (experience) => {
        setEditingExperience(experience);
        
        setFormData({
            type: experience.type,
            title: experience.title || '',
            organization_name: experience.organization_name || '',
            organization_id: experience.organization_id || null,
            location: experience.location || '',
            description: experience.description || '',
            start_date: experience.start_date || '',
            end_date: experience.end_date || '',
            is_current: experience.is_current || false,
            employment_type: experience.employment_type || 'full_time',
            degree: experience.degree || '',
            field_of_study: experience.field_of_study || '',
            grade: experience.grade || '',
            skills: experience.skills || [],
            achievements: experience.achievements || []
        });
        
        if (experience.organization) {
            setSelectedOrganization(experience.organization);
        }
        
        setActiveTab(experience.type);
        setShowAddForm(true);
        setShowLocationSuggestions(false);
        setShowOrganizationSuggestions(false);
        setShowTitleSuggestions(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    const handleLocationChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, location: value }));
        
        if (value.length > 0) {
            const filtered = locationSuggestions.filter(location => 
                location.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setFilteredLocations(filtered);
            setShowLocationSuggestions(filtered.length > 0);
        } else {
            setShowLocationSuggestions(false);
        }
    };

    const selectLocation = (location) => {
        setFormData(prev => ({ ...prev, location }));
        setShowLocationSuggestions(false);
    };

    const handleOrganizationChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ 
            ...prev, 
            organization_name: value,
            organization_id: null
        }));
        setSelectedOrganization(null);
        
        if (value.length > 0) {
            const filtered = organizationSuggestions.filter(org => 
                org.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setFilteredOrganizations(filtered);
            setShowOrganizationSuggestions(filtered.length > 0);
        } else {
            setShowOrganizationSuggestions(false);
        }
    };

    const selectOrganization = (organization) => {
        setFormData(prev => ({ 
            ...prev, 
            organization_name: organization.name,
            organization_id: organization.id
        }));
        setSelectedOrganization(organization);
        setShowOrganizationSuggestions(false);
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, title: value }));
        
        if (value.length > 0) {
            const filtered = titleSuggestions.filter(title => 
                title.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setFilteredTitles(filtered);
            setShowTitleSuggestions(filtered.length > 0);
        } else {
            setShowTitleSuggestions(false);
        }
    };

    const selectTitle = (title) => {
        setFormData(prev => ({ ...prev, title }));
        setShowTitleSuggestions(false);
    };

    const getTabExperiences = (type) => {
        return experiences.filter(exp => exp.type === type);
    };

    const getTabIcon = (type) => {
        switch (type) {
            case 'work': return Briefcase;
            case 'education': return GraduationCap;
            case 'volunteer': return Heart;
            default: return Briefcase;
        }
    };

    const getEmploymentTypeDisplay = (type) => {
        const types = {
            'full_time': 'Full-time',
            'part_time': 'Part-time',
            'contract': 'Contract',
            'internship': 'Internship',
            'freelance': 'Freelance',
            'volunteer': 'Volunteer'
        };
        return types[type] || type;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="animate-pulse space-y-6">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                    {[
                        { key: 'work', label: 'Work Experience', icon: Briefcase },
                        { key: 'education', label: 'Education', icon: GraduationCap },
                        { key: 'volunteer', label: 'Volunteer', icon: Heart }
                    ].map((tab) => {
                        const TabIcon = tab.icon;
                        const count = getTabExperiences(tab.key).length;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                <TabIcon className="w-4 h-4" />
                                {tab.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {isCurrentUser && (
                    <button
                        onClick={() => {
                            resetForm();
                            setFormData(prev => ({ ...prev, type: activeTab }));
                            setEditingExperience(null);
                            setShowAddForm(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add {activeTab === 'work' ? 'Experience' : activeTab === 'education' ? 'Education' : 'Volunteer Work'}
                    </button>
                )}
            </div>

            {showAddForm && isCurrentUser && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {editingExperience ? 'Edit' : 'Add'} {activeTab === 'work' ? 'Work Experience' : activeTab === 'education' ? 'Education' : 'Volunteer Experience'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {activeTab === 'education' ? 'Degree/Program' : 'Position Title'} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    onFocus={() => {
                                        if (formData.title.length > 0 && filteredTitles.length > 0) {
                                            setShowTitleSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setShowTitleSuggestions(false), 150);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                
                                {showTitleSuggestions && filteredTitles.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filteredTitles.map((title, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => selectTitle(title)}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                                    <span className="text-slate-700">{title}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {activeTab === 'education' ? 'School/Institution' : 'Company/Organization'} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.organization_name}
                                    onChange={handleOrganizationChange}
                                    onFocus={() => {
                                        if (formData.organization_name.length > 0 && filteredOrganizations.length > 0) {
                                            setShowOrganizationSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setShowOrganizationSuggestions(false), 150);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                
                                {showOrganizationSuggestions && filteredOrganizations.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filteredOrganizations.map((org) => (
                                            <button
                                                key={org.id}
                                                type="button"
                                                onClick={() => selectOrganization(org)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {org.image_url ? (
                                                            <img 
                                                                src={org.image_url} 
                                                                alt={org.name}
                                                                className="w-8 h-8 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-900 font-medium">{org.name}</div>
                                                        <div className="text-xs text-slate-500 capitalize">{org.type}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {activeTab === 'education' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Field of Study</label>
                                    <input
                                        type="text"
                                        value={formData.field_of_study}
                                        onChange={(e) => setFormData(prev => ({ ...prev, field_of_study: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Grade/GPA</label>
                                    <input
                                        type="text"
                                        value={formData.grade}
                                        onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'work' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                                <select
                                    value={formData.employment_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="full_time">Full-time</option>
                                    <option value="part_time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                    <option value="freelance">Freelance</option>
                                </select>
                            </div>
                        )}

                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={handleLocationChange}
                                onFocus={() => {
                                    if (formData.location.length > 0 && filteredLocations.length > 0) {
                                        setShowLocationSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowLocationSuggestions(false), 150);
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            
                            {showLocationSuggestions && filteredLocations.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredLocations.map((location, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => selectLocation(location)}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-700">{location}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    disabled={formData.is_current}
                                    value={formData.is_current ? '' : formData.end_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                                />
                                <label className="flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_current}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            is_current: e.target.checked,
                                            end_date: e.target.checked ? '' : prev.end_date
                                        }))}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-slate-600">
                                        Currently {activeTab === 'education' ? 'studying here' : activeTab === 'work' ? 'working here' : 'volunteering here'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saveLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {saveLoading ? 'Saving...' : editingExperience ? 'Update' : 'Add'} Experience
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingExperience(null);
                                    resetForm();
                                }}
                                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {getTabExperiences(activeTab).map((experience) => {
                    const Icon = getTabIcon(experience.type);
                    return (
                        <div key={experience.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    {experience.organization?.image_url && experience.organization?.id ? (
                                        <button
                                            onClick={() => handleOrganizationClick(experience.organization)}
                                            className="w-12 h-12 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 transition-all duration-200 group"
                                        >
                                            <img 
                                                src={experience.organization.image_url} 
                                                alt={experience.organization_name}
                                                className="w-12 h-12 object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        </button>
                                    ) : (
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-blue-600" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {experience.title}
                                                {experience.field_of_study && (
                                                    <span className="text-slate-600"> in {experience.field_of_study}</span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-600 mt-1">
                                                <Building2 className="w-4 h-4" />
                                                {experience.organization?.id ? (
                                                    <button
                                                        onClick={() => handleOrganizationClick(experience.organization)}
                                                        className="font-medium hover:text-blue-600 hover:underline transition-colors"
                                                    >
                                                        {experience.organization_name}
                                                    </button>
                                                ) : (
                                                    <span className="font-medium">{experience.organization_name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {formatDate(experience.start_date)} - {
                                                            experience.is_current 
                                                                ? 'Present' 
                                                                : experience.end_date 
                                                                    ? formatDate(experience.end_date)
                                                                    : 'Present'
                                                        }
                                                    </span>
                                                </div>
                                                {experience.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{experience.location}</span>
                                                    </div>
                                                )}
                                                {experience.employment_type && activeTab === 'work' && (
                                                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                                                        {getEmploymentTypeDisplay(experience.employment_type)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isCurrentUser && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => startEdit(experience)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(experience.id)}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {experience.description && (
                                        <p className="text-slate-700 mt-3 leading-relaxed">
                                            {experience.description}
                                        </p>
                                    )}
                                    
                                    {experience.grade && activeTab === 'education' && (
                                        <div className="mt-3">
                                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded">
                                                <Award className="w-3 h-3" />
                                                {experience.grade}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {getTabExperiences(activeTab).length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            {React.createElement(getTabIcon(activeTab), {
                                className: "w-8 h-8 text-slate-400"
                            })}
                        </div>
                        <h4 className="text-lg font-medium text-slate-600 mb-2">
                            No {activeTab === 'work' ? 'work experience' : activeTab === 'education' ? 'education' : 'volunteer experience'} yet
                        </h4>
                        <p className="text-slate-500">
                            {isCurrentUser 
                                ? `Add your ${activeTab === 'work' ? 'professional experience' : activeTab === 'education' ? 'educational background' : 'volunteer work'} to showcase your background.`
                                : `${member?.full_name?.split(' ')[0]} hasn't added any ${activeTab === 'work' ? 'work experience' : activeTab === 'education' ? 'education' : 'volunteer experience'} yet.`
                            }
                        </p>
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Delete Experience</h3>
                                <p className="text-sm text-slate-600">This action cannot be undone</p>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-slate-700 mb-3">
                                Are you sure you want to delete this {deleteConfirm.type} experience?
                            </p>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-medium text-slate-900">{deleteConfirm.title}</h4>
                                <p className="text-sm text-slate-600">{deleteConfirm.organization_name}</p>
                                {deleteConfirm.start_date && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formatDate(deleteConfirm.start_date)} - {
                                            deleteConfirm.is_current 
                                                ? 'Present' 
                                                : deleteConfirm.end_date 
                                                    ? formatDate(deleteConfirm.end_date)
                                                    : 'Present'
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Delete Experience
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberProfileExperience;