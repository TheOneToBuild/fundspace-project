// src/components/AnimatedShape.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedShape = ({ className, initial, animate, imageUrl }) => {
    return (
        <motion.div 
            className={`absolute hidden md:block rounded-full overflow-hidden bg-slate-200 ${className}`} 
            initial={initial} 
            animate={animate} 
            transition={{
                duration: Math.random() * 8 + 8, 
                ease: 'easeInOut', 
                repeat: Infinity, 
                repeatType: 'reverse',
            }}
        >
            {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300"></div>
            )}
        </motion.div>
    );
};

export default AnimatedShape;