// src/components/post/ImageMosaic.jsx
import React from 'react';
import { Maximize2 } from 'lucide-react';

export default function ImageMosaic({ images, onImageClick }) {
    if (!images || images.length === 0) return null;

    // Special layout for a single image
    if (images.length === 1) {
        return (
            <div 
                className="mb-4 rounded-lg overflow-hidden relative group cursor-pointer" 
                onClick={() => onImageClick(0)}
            >
                <div className="max-h-[500px] w-full flex justify-center items-center bg-slate-50">
                     <img
                        src={images[0]}
                        alt="Post image 1"
                        className="max-h-[500px] w-auto h-auto object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                </div>
            </div>
        );
    }

    // Existing layout logic for multiple images
    const getMosaicLayout = (count) => {
        const layouts = {
            2: [{ span: 'col-span-3 row-span-4', aspect: 'aspect-[3/4]' }, { span: 'col-span-3 row-span-4', aspect: 'aspect-[3/4]' }],
            3: [{ span: 'col-span-4 row-span-4', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }],
            4: [{ span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' }, { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' }, { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' }, { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' }],
            5: [{ span: 'col-span-3 row-span-3', aspect: 'aspect-square' }, { span: 'col-span-3 row-span-3', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }],
            6: [{ span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }, { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }]
        };
        return layouts[count] || [];
    };

    const mosaicLayout = getMosaicLayout(images.length);

    return (
        <div className="mb-4 rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 gap-2 auto-rows-fr">
                {images.slice(0, 6).map((imageUrl, index) => {
                    const layout = mosaicLayout[index] || { span: 'col-span-2 row-span-2', aspect: 'aspect-square' };
                    return (
                        <div
                            key={index}
                            className={`relative group cursor-pointer overflow-hidden rounded-lg ${layout.span}`}
                            onClick={() => onImageClick(index)}
                        >
                            <div className={`${layout.aspect} w-full`}>
                                <img
                                    src={imageUrl}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                            </div>
                            {index === 5 && images.length > 6 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        +{images.length - 6}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};