import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import NewsCard from './NewsCard';

const prepareCarouselNews = (newsArray, minArticles = 10) => {
    if (!Array.isArray(newsArray)) return [];
    
    const seenUrls = new Set();
    const sources = new Set();
    let finalItems = [];

    // First pass: Get one unique article per source
    for (const item of newsArray) {
        const url = item.url || item.id;
        const source = item.category || 'Unknown';
        if (!seenUrls.has(url) && !sources.has(source)) {
            finalItems.push(item);
            seenUrls.add(url);
            sources.add(source);
        }
    }

    // Second pass: If we don't have enough, add more unique articles regardless of source
    if (finalItems.length < minArticles) {
        for (const item of newsArray) {
            if (finalItems.length >= minArticles) break;
            const url = item.url || item.id;
            if (!seenUrls.has(url)) {
                finalItems.push(item);
                seenUrls.add(url);
            }
        }
    }
    
    return finalItems;
};

const NewsCarousel = ({ news }) => {
    const scrollNews = (direction) => {
        const container = document.getElementById('dashboard-news-scroll');
        if (container) {
            const scrollAmount = 280;
            container.scrollBy({ 
                left: direction === 'left' ? -scrollAmount : scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };

    const diversifiedNews = prepareCarouselNews(news, 10);

    if (!diversifiedNews || diversifiedNews.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Trending Bay Area News</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => scrollNews('left')}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scrollNews('right')}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <div 
                id="dashboard-news-scroll" 
                className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 w-full"
                style={{ scrollBehavior: 'smooth' }}
            >
                {diversifiedNews.map(item => (
                    <div key={item.id} className="flex-shrink-0">
                        <NewsCard
                            title={item.title}
                            timeAgo={item.timeAgo}
                            image={item.image}
                            url={item.url}
                            category={item.category}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

NewsCarousel.propTypes = {
    news: PropTypes.array.isRequired
};

export default NewsCarousel;