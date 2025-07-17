import React from 'react';

export default function FunderProfileImpact({ stories, funder }) {
    if (!stories || stories.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Real Impact Stories</h3>
                <p>Impact stories for {funder.name} are coming soon.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Real Impact Stories</h3>
                <p className="text-slate-600">See how {funder.name} is making a difference in the Bay Area</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {stories.map(story => (
                    <div key={story.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="aspect-video relative overflow-hidden">
                            <img
                                src={story.image}
                                alt={story.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {story.amount}
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="text-xl font-bold text-slate-800 mb-2">{story.title}</h4>
                            <p className="text-blue-600 font-medium mb-3">{story.nonprofit}</p>
                            <p className="text-slate-600 mb-4">{story.impact}</p>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Funded in 2023</span>
                                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                    Read Full Story →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}