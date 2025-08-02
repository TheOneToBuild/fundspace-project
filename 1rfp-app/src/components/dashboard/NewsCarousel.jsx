// src/components/dashboard/NewsCarousel.jsx
import React from 'react';
import { Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';

const NewsCard = ({ title, timeAgo, image, url, category }) => (
    <div
        className="flex-shrink-0 w-80 h-64 bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
        onClick={() => url && window.open(url, '_blank')}
    >
        {image ? (
            <img
                src={image}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Globe size={32} className="text-slate-400" />
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-2">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/30">
                    {category || 'News'}
                </span>
                <div className="flex items-center text-white/80 text-xs">
                    <span className="w-1 h-1 bg-white/60 rounded-full mr-1"></span>
                    <span>{timeAgo}</span>
                </div>
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white text-lg leading-tight line-clamp-3 group-hover:text-blue-200 transition-colors">
                {title}
            </h3>
        </div>
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-200"></div>
    </div>
);

NewsCard.propTypes = {
    title: PropTypes.string.isRequired,
    timeAgo: PropTypes.string.isRequired,
    image: PropTypes.string,
    url: PropTypes.string,
    category: PropTypes.string
};

const NewsCarousel = ({ news }) => {
    const scrollNews = (direction) => {
        const container = document.getElementById('dashboard-news-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
        }
    };

    if (!news || news.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Trending World News</h2>
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
            <div id="dashboard-news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                {news.map(item => (
                    <NewsCard
                        key={item.id}
                        title={item.title}
                        timeAgo={item.timeAgo}
                        image={item.image}
                        url={item.url}
                        category={item.category}
                    />
                ))}
            </div>
        </div>
    );
};

NewsCarousel.propTypes = {
    news: PropTypes.array.isRequired
};

export default NewsCarousel;