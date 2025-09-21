import { useState, useEffect } from 'react';

export function useAnimatedCounter(end, duration = 2000, start = 0) {
    const [count, setCount] = useState(start);
    
    useEffect(() => {
        if (end === null || end === undefined) return;
        
        let startTime;
        let animationId;
        
        let endValue;
        if (typeof end === 'string') {
            endValue = parseFloat(end.replace(/[^0-9.]/g, ''));
        } else {
            endValue = end;
        }
        
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = start + (endValue - start) * easeOutQuart;
            
            setCount(currentValue);
            
            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            }
        };
        
        animationId = requestAnimationFrame(animate);
        
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [end, duration, start]);
    
    return count;
}

export function formatNumber(num, originalString) {
    if (!originalString) return Math.round(num).toLocaleString();
    
    if (originalString.includes('M')) {
        return num.toFixed(1) + 'M';
    }
    if (originalString.includes('K')) {
        return Math.round(num) + 'K';
    }
    if (originalString.includes('%')) {
        return num.toFixed(1) + '%';
    }
    if (originalString.includes('$')) {
        if (originalString.includes('K')) {
            return '$' + Math.round(num) + 'K';
        } else if (originalString.includes('M')) {
            return '$' + num.toFixed(1) + 'M';
        }
        return '$' + Math.round(num).toLocaleString();
    }
    return Math.round(num).toLocaleString();
}