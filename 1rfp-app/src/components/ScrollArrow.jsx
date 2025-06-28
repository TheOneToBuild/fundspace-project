// src/components/ScrollArrow.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ScrollArrow = ({ className }) => (
    <motion.div 
        // This component now fades in and out without moving, acting as a gentle "pulse"
        className={`absolute z-30 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: 'easeInOut',
        }}
    >
        <svg 
            width="40" 
            height="80" // Made longer
            viewBox="0 0 40 80" 
            fill="none" 
            className="text-purple-400"
        >
            <path 
                d="M20 15L20 65M20 65L10 55M20 65L30 55" // Adjusted path for new size
                stroke="currentColor" 
                strokeWidth="4" // Made bigger/thicker
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    </motion.div>
);

export default ScrollArrow;