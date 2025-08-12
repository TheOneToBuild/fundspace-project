// src/components/organization-profile/north-star/NorthStarPublicView.jsx
import React, { useState, useEffect } from 'react';
import { Heart, Target, Eye, Compass, TrendingUp, Calendar, Clock, MapPin, Users, Lightbulb, Camera, Upload, Edit3 } from 'lucide-react';

const NorthStarPublicView = ({ pageData, organization, canEdit, onEdit, isEditMode = false }) => {
  
  // Get blocks by template type
  const getBlockByType = (templateName) => {
    return pageData?.blocks?.find(block => 
      block.title === templateName || 
      block.title.toLowerCase().includes(templateName.toLowerCase())
    );
  };

  const visionBlock = getBlockByType('Vision');
  const missionBlock = getBlockByType('Mission');
  const approachBlock = getBlockByType('Approach');
  const valuesBlock = getBlockByType('Values');
  const strategicBlock = getBlockByType('Strategic');
  const longTermBlock = getBlockByType('Long-Term');
  const shortTermBlock = getBlockByType('Short-Term');
  const impactBlock = getBlockByType('Impact');
  const geographicBlock = getBlockByType('Geographic');
  const partnershipBlock = getBlockByType('Partnership');

  // Animated counter component
  const AnimatedCounter = ({ value, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Only animate if value contains numbers
    const hasNumbers = /\d/.test(value);
    
    useEffect(() => {
      if (!isVisible || !hasNumbers) return;
      
      const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
      if (numericValue === 0) return;
      
      let start = 0;
      const increment = numericValue / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [isVisible, value, duration, hasNumbers]);

    const handleVisibilityChange = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    };

    useEffect(() => {
      if (!hasNumbers) return;
      
      const observer = new IntersectionObserver(handleVisibilityChange);
      const element = document.getElementById(`counter-${value.replace(/[^a-zA-Z0-9]/g, '')}`);
      if (element) observer.observe(element);
      
      return () => observer.disconnect();
    }, [value, hasNumbers]);

    const formatValue = (num) => {
      const suffix = value.replace(/[\d,]/g, '');
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M${suffix}`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K${suffix}`;
      return `${num.toLocaleString()}${suffix}`;
    };

    // If no numbers or animation not started, show original value
    if (!hasNumbers || !isVisible) {
      return <span className="font-bold text-3xl text-slate-900">{value}</span>;
    }

    return (
      <span id={`counter-${value.replace(/[^a-zA-Z0-9]/g, '')}`} className="font-bold text-3xl text-slate-900">
        {formatValue(count)}
      </span>
    );
  };

  // Helper to render markdown-formatted text
  const renderMarkdownText = (text) => {
    if (!text) return '';
    
    // Simple markdown parsing for bold and italic
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** -> <strong>bold</strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *italic* -> <em>italic</em>
    
    return formatted;
  };

  // Helper to render content based on type
  const renderContent = (block) => {
    if (!block || !block.content) return null;
    
    switch (block.type) {
      case 'list':
        return (
          <ul className="space-y-4">
            {Array.isArray(block.content) ? block.content
              .filter(item => item && item.trim()) // Filter out empty lines for display
              .map((item, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150 group-hover:bg-blue-600"></div>
                <span 
                  className="text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors duration-300"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownText(item) }}
                />
              </li>
            )) : null}
          </ul>
        );
      
      case 'stats':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.isArray(block.content) ? block.content.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-all duration-300 cursor-default">
                <div className="mb-2">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-sm text-slate-600 font-medium group-hover:text-slate-800 transition-colors duration-300">{stat.label}</div>
              </div>
            )) : null}
          </div>
        );
      
      default:
        return (
          <div className="prose prose-slate max-w-none">
            <div 
              className="text-slate-700 leading-relaxed text-lg group-hover:text-slate-900 transition-colors duration-300"
              dangerouslySetInnerHTML={{ __html: renderMarkdownText(typeof block.content === 'string' ? block.content : '') }}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* FIXED: Edit Button - Only show if canEdit AND isEditMode is true (global edit mode) */}
      {canEdit && isEditMode && (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex justify-end items-center max-w-7xl mx-auto">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-md"
            >
              <Edit3 size={18} />
              Edit North Star
            </button>
          </div>
        </div>
      )}

      {pageData?.blocks && pageData.blocks.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative z-10">
          
          {/* Line 1: Mission, Vision, Approach - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mission */}
            {missionBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-purple-200">
                    <Target className="w-6 h-6 text-purple-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors duration-300">{missionBlock.title}</h2>
                </div>
                <div className="group">{renderContent(missionBlock)}</div>
              </div>
            )}

            {/* Vision */}
            {visionBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-200">
                    <Eye className="w-6 h-6 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{visionBlock.title}</h2>
                </div>
                <div className="group">{renderContent(visionBlock)}</div>
              </div>
            )}

            {/* Approach */}
            {approachBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200">
                    <Compass className="w-6 h-6 text-green-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-green-600 transition-colors duration-300">{approachBlock.title}</h2>
                </div>
                <div className="group">{renderContent(approachBlock)}</div>
              </div>
            )}
          </div>

          {/* Line 2: Core Values - Full width */}
          {valuesBlock && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-red-200">
                  <Heart className="w-6 h-6 text-red-600 transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-red-600 transition-colors duration-300">{valuesBlock.title}</h2>
              </div>
              <div className="group">{renderContent(valuesBlock)}</div>
            </div>
          )}

          {/* Line 3: Strategic Priorities - Full width */}
          {strategicBlock && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-200">
                  <Target className="w-6 h-6 text-orange-600 transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors duration-300">{strategicBlock.title}</h2>
              </div>
              <div className="group">{renderContent(strategicBlock)}</div>
            </div>
          )}

          {/* Line 4: Short-term and Long-term Goals - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Short-term Goals */}
            {shortTermBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-200">
                    <Clock className="w-6 h-6 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{shortTermBlock.title}</h2>
                </div>
                <div className="group">{renderContent(shortTermBlock)}</div>
              </div>
            )}

            {/* Long-term Goals */}
            {longTermBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200">
                    <Calendar className="w-6 h-6 text-green-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-green-600 transition-colors duration-300">{longTermBlock.title}</h2>
                </div>
                <div className="group">{renderContent(longTermBlock)}</div>
              </div>
            )}
          </div>

          {/* Line 5: Our Impact - Full width with enhanced animations */}
          {impactBlock && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-200">
                  <TrendingUp className="w-6 h-6 text-emerald-600 transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">{impactBlock.title}</h2>
              </div>
              <div className="group">{renderContent(impactBlock)}</div>
            </div>
          )}

          {/* Line 6: Geographic Focus and Community Partnerships - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Focus */}
            {geographicBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-teal-200">
                    <MapPin className="w-6 h-6 text-teal-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors duration-300">{geographicBlock.title}</h2>
                </div>
                <div className="group">{renderContent(geographicBlock)}</div>
              </div>
            )}

            {/* Community Partnerships */}
            {partnershipBlock && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-200">
                    <Users className="w-6 h-6 text-indigo-600 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">{partnershipBlock.title}</h2>
                </div>
                <div className="group">{renderContent(partnershipBlock)}</div>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Empty State for Visitors */
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Building Something Amazing
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {organization?.name} is crafting their story. Check back soon to discover their mission, impact, and vision for the future.
          </p>
          <div className="text-sm text-gray-500">
            This page is being thoughtfully designed to showcase their unique purpose and values.
          </div>
          
          {/* FIXED: Only show "Start Building" button if in global edit mode AND can edit */}
          {canEdit && isEditMode && (
            <div className="mt-8">
              <button
                onClick={onEdit}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl"
              >
                Start Building Your North Star
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Call to Action Footer */}
      {pageData?.blocks && pageData.blocks.length > 0 && (
        <div className="mt-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl mx-4 lg:mx-8 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-300 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center py-24 px-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-6">Ready to Get Involved?</h3>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed max-w-2xl mx-auto">
              Join us in making a difference. There are many ways to support our mission and become part of our community.
            </p>
            
            {/* Action buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="group bg-white text-slate-900 px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-xl hover:shadow-2xl">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700">
                  Learn More
                </span>
              </button>
              <button className="border-2 border-white/30 text-white px-10 py-4 rounded-2xl hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300 font-semibold text-lg">
                Contact Us
              </button>
            </div>
            
            {/* Additional contact info */}
            <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-8 text-blue-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="text-sm">Email: hello@{organization?.name?.toLowerCase().replace(/\s+/g, '')}.org</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-sm">Follow our impact and updates</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NorthStarPublicView;