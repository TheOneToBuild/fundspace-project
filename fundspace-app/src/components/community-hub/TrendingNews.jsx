// src/components/community-hub/TrendingNews.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import NewsCard from './NewsCard';
import { rssNewsService as newsService } from '../../services/rssNewsService.js';

const diversifyNewsSources = (newsArray) => {
  if (!Array.isArray(newsArray)) return [];
  
  // First pass: get articles with max 2 per source
  const firstPass = newsArray.reduce((acc, item) => {
      const key = item.url || item.title;
      const source = item.source_name || item.source || 'Unknown';
      
      if (acc.seen.has(key)) return acc;
      
      const sourceCount = acc.sourceCounts.get(source) || 0;
      if (sourceCount < 2) {  // Allow up to 2 per source
          acc.seen.add(key);
          acc.sourceCounts.set(source, sourceCount + 1);
          acc.items.push(item);
      }
      
      return acc;
  }, { seen: new Set(), items: [], sourceCounts: new Map() });
  
  // If we have less than 6 articles, add more from any source to reach up to 9
  if (firstPass.items.length < 6) {
      newsArray.forEach(item => {
          const key = item.url || item.title;
          if (!firstPass.seen.has(key) && firstPass.items.length < 9) {
              firstPass.seen.add(key);
              firstPass.items.push(item);
          }
      });
  }
  
  return firstPass.items.slice(0, 9);
};

const TrendingNews = ({ channelType }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let newsData;
        if (channelType === 'hello-world') {
          newsData = await newsService.getGlobalBreakingNews();
        } else if (channelType === 'hello-community') {
          newsData = await newsService.getNonprofitNews();
        } else {
          newsData = await newsService.getGlobalBreakingNews();
        }
        
        const uniqueNews = diversifyNewsSources(newsData);
        setNews(uniqueNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (channelType) {
      fetchNews();
    }
  }, [channelType]);

  const scrollNews = (direction) => {
    const container = document.getElementById('community-hub-news-scroll');
    if (container) {
      const scrollAmount = 280;
      container.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (loading || !news.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Trending Bay Area News</h2>
        <div className="flex space-x-2">
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div 
        id="community-hub-news-scroll" 
        className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        {news.map(item => (
          <div key={item.url || item.id} className="flex-shrink-0 w-72">
            <NewsCard 
              title={item.title}
              category={item.category}
              timeAgo={item.timeAgo}
              image={item.image}
              url={item.url}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

TrendingNews.propTypes = { channelType: PropTypes.string };

export default TrendingNews;