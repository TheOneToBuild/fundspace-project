import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import PropTypes from 'prop-types';

const NewsCard = ({ title, timeAgo, image, url, category }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <div
            className="w-64 h-80 bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer relative"
            onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
        >
            {image && !imageError ? (
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => setImageError(true)}
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
};

NewsCard.propTypes = {
    title: PropTypes.string.isRequired,
    timeAgo: PropTypes.string.isRequired,
    image: PropTypes.string,
    url: PropTypes.string,
    category: PropTypes.string
};

export default NewsCard;