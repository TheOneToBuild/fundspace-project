// src/components/DashboardHomePage.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import PostCard from './PostCard.jsx';
import CreatePost from './CreatePost.jsx'; // Import the multi-image CreatePost component

const NewsCard = ({ title, summary, category, timeAgo, image }) => (
  <div className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
    <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
      <img src={image} alt={title} className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium text-slate-700">
        {category}
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2">{title}</h3>
      <p className="text-slate-600 text-xs line-clamp-3 mb-3">{summary}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          {timeAgo}
        </div>
        <div className="flex items-center">
          <TrendingUp size={12} className="mr-1" />
          Trending
        </div>
      </div>
    </div>
  </div>
);

export default function DashboardHomePage() {
  const { profile, posts, handleNewPost, handleDeletePost } = useOutletContext();

  const trendingNews = [
    {
      id: 1,
      title: "Historic Texas Flooding Claims Over 100 Lives",
      summary: "Devastating flash floods in central Texas have resulted in over 100 deaths with rescue efforts ongoing. Communities band together for recovery.",
      category: "Breaking News",
      timeAgo: "2 hours ago",
      image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=200&fit=crop"
    },
    {
      id: 2,
      title: "Trump Signs Sweeping Tax Legislation", 
      summary: "President Trump signed controversial tax and spending bill into law on July 4th, including $1 trillion in Medicaid cuts over a decade.",
      category: "Politics",
      timeAgo: "3 days ago",
      image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=200&fit=crop"
    },
    {
      id: 3,
      title: "Elon Musk Forms New Political Party",
      summary: "Tesla CEO announces 'America Party' following disagreement with Trump's debt-increasing tax legislation. Tesla shares plummet on the news.",
      category: "Technology",
      timeAgo: "3 days ago",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop"
    },
    {
      id: 4,
      title: "European Heatwave Sparks Deadly Wildfires",
      summary: "Intense heatwave across southwestern Europe causes fatalities and public health alarms. Catalonia reports farmworker deaths from wildfires.",
      category: "World",
      timeAgo: "1 week ago",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
    },
    {
      id: 5,
      title: "Climate Reports Discontinued by Administration",
      summary: "Trump administration stops publication of federal climate crisis reports, drawing criticism from scientists calling it 'criminal.'",
      category: "Environment",
      timeAgo: "3 days ago",
      image: "https://images.unsplash.com/photo-1569163139394-de44cb6296ec?w=400&h=200&fit=crop"
    },
    {
      id: 6,
      title: "YouTube Shorts Trends Dominate Social Media",
      summary: "Mini vlogs, food challenges, DIY projects, and dance content continue to drive engagement on the platform with 1.5B users.",
      category: "Tech & Culture",
      timeAgo: "1 week ago",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=200&fit=crop"
    }
  ];

  const scrollNews = (direction) => {
    const container = document.getElementById('news-scroll');
    const scrollAmount = 320; // Card width + gap
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  // Loading state can be inferred from whether posts exist
  const loading = !posts;

  return (
    <div className="space-y-6">
      {/* Trending News Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Trending News</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => scrollNews('left')}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => scrollNews('right')}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div 
          id="news-scroll"
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {trendingNews.map(news => (
            <NewsCard key={news.id} {...news} />
          ))}
        </div>
      </div>

      {/* Use the standalone CreatePost component with multi-image support */}
      <CreatePost profile={profile} onNewPost={handleNewPost} />

      {/* Posts Feed */}
      {loading && <p className="text-center text-slate-500">Loading feed...</p>}
      
      {!loading && posts.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <h3 className="text-xl font-semibold">Your Feed is Empty</h3>
          <p className="text-slate-500 mt-2">
            Create your first post or follow other members to see their updates here.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard key={`post-${post.id}`} post={post} onDelete={handleDeletePost} />
          ))}
        </div>
      )}
    </div>
  );
}