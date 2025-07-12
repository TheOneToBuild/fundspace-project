// src/utils/urlDetection.js
// Utility functions for detecting and handling URLs in text

export const urlDetectionUtils = {
    // Regular expression to detect URLs in text
    urlRegex: /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?)/gi,
    
    // More permissive regex that catches URLs without protocol
    relaxedUrlRegex: /(?:(?:https?:\/\/)?(?:[-\w.])+\.(?:[a-zA-Z]{2,})(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?)/gi,

    // Extract URLs from text
    extractUrls: (text) => {
        if (!text) return [];
        
        const matches = text.match(urlDetectionUtils.urlRegex) || [];
        return [...new Set(matches)]; // Remove duplicates
    },

    // Extract URLs with more relaxed matching (including those without http/https)
    extractUrlsRelaxed: (text) => {
        if (!text) return [];
        
        const matches = text.match(urlDetectionUtils.relaxedUrlRegex) || [];
        return [...new Set(matches.map(url => {
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return 'https://' + url;
            }
            return url;
        }))];
    },

    // Check if text contains URLs
    containsUrls: (text) => {
        if (!text) return false;
        return urlDetectionUtils.urlRegex.test(text);
    },

    // Validate if a string is a valid URL
    isValidUrl: (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Get the first URL found in text
    getFirstUrl: (text) => {
        const urls = urlDetectionUtils.extractUrls(text);
        return urls.length > 0 ? urls[0] : null;
    },

    // Replace URLs in text with clickable links (for display purposes)
    linkifyText: (text) => {
        if (!text) return text;
        
        return text.replace(urlDetectionUtils.urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">${url}</a>`;
        });
    },

    // Clean URL for display (remove protocol, www, trailing slash)
    cleanUrlForDisplay: (url) => {
        try {
            const urlObj = new URL(url);
            let display = urlObj.hostname + urlObj.pathname;
            
            // Remove www.
            if (display.startsWith('www.')) {
                display = display.substring(4);
            }
            
            // Remove trailing slash
            if (display.endsWith('/')) {
                display = display.substring(0, display.length - 1);
            }
            
            return display;
        } catch (_) {
            return url;
        }
    },

    // Suggest URLs for link preview based on text content
    suggestUrlsForPreview: (text, maxSuggestions = 3) => {
        const urls = urlDetectionUtils.extractUrlsRelaxed(text);
        
        // Filter out common patterns that probably shouldn't be link previews
        const filtered = urls.filter(url => {
            try {
                const urlObj = new URL(url);
                
                // Skip very short domains
                if (urlObj.hostname.length < 4) return false;
                
                // Skip localhost and IP addresses
                if (urlObj.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname)) {
                    return false;
                }
                
                // Skip file extensions that are clearly not web pages
                const badExtensions = ['.pdf', '.doc', '.docx', '.zip', '.mp3', '.mp4', '.jpg', '.jpeg', '.png', '.gif'];
                if (badExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))) {
                    return false;
                }
                
                return true;
            } catch (_) {
                return false;
            }
        });
        
        return filtered.slice(0, maxSuggestions);
    },

    // Format URL for consistent storage
    normalizeUrl: (url) => {
        try {
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            const urlObj = new URL(url);
            
            // Always use https if no specific protocol preference
            if (urlObj.protocol === 'http:' && !url.startsWith('http://')) {
                urlObj.protocol = 'https:';
            }
            
            return urlObj.toString();
        } catch (_) {
            return url;
        }
    }
};

export default urlDetectionUtils;