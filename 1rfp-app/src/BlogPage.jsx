// src/BlogPage.jsx
import React from 'react';
import { Megaphone, ArrowRight } from './components/Icons.jsx';

const mockBlogPosts = [
  {
    id: 1,
    category: 'Grant Writing',
    title: '5 Common Mistakes in Grant Proposals (And How to Avoid Them)',
    excerpt: 'Securing funding is competitive. We break down the most common pitfalls we see in grant applications, from mismatched objectives to unclear budgets, to help you put your best foot forward.',
    author: 'Elena Rodriguez',
    date: 'June 5, 2025',
    imageUrl: 'https://placehold.co/800x600/f3e8ff/5b21b6?text=Mistakes+to+Avoid&font=inter',
    isFeatured: true,
  },
  {
    id: 2,
    category: 'Funder Relations',
    title: 'Beyond the Check: Building Authentic Relationships with Funders',
    excerpt: 'A successful partnership with a foundation goes far beyond the initial grant. Learn key strategies for effective communication, reporting, and stewardship that build trust and lead to long-term support.',
    author: 'David Chen',
    date: 'May 28, 2025',
    imageUrl: 'https://placehold.co/600x400/e6fffa/2c7a7b?text=Relationships&font=inter',
  },
  {
    id: 3,
    category: 'Community News',
    title: 'A Look Inside the Bay Area\'s Environmental Justice Movement',
    excerpt: 'We spotlight three innovative nonprofits that are leading the charge for environmental equity in our communities, proving that grassroots efforts can drive monumental change.',
    author: '1RFP Staff',
    date: 'May 21, 2025',
    imageUrl: 'https://placehold.co/600x400/f0fff4/38a169?text=Community+News&font=inter',
  },
  {
    id: 4,
    category: 'Platform Updates',
    title: 'New Feature: Smarter Filtering Comes to 1RFP',
    excerpt: 'Our latest platform update introduces even more powerful filtering options, including grant status and type, to help you zero in on the perfect funding opportunity faster than ever.',
    author: '1RFP Staff',
    date: 'May 15, 2025',
    imageUrl: 'https://placehold.co/600x400/ebf8ff/3182ce?text=Platform+Updates&font=inter',
  }
];

const BlogPostCard = ({ post, isFeatured = false }) => {
  if (isFeatured) {
    return (
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden grid md:grid-cols-2">
        <div className="p-8 md:p-10 flex flex-col">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-blue-600" />
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Featured Post</p>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mt-4">{post.title}</h2>
          <p className="mt-4 text-slate-600 leading-relaxed flex-grow">{post.excerpt}</p>
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700">{post.author}</p>
            <p className="text-sm text-slate-500">{post.date}</p>
          </div>
          <a href="#" className="mt-6 font-semibold text-blue-600 inline-flex items-center group">
            Read Full Article
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <img src={post.imageUrl} alt={post.title} className="w-full h-64 md:h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col group">
      <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
      <div className="p-6 flex-grow flex flex-col">
        <p className="text-sm font-semibold text-blue-600">{post.category}</p>
        <h3 className="text-xl font-bold text-slate-800 mt-2 flex-grow">{post.title}</h3>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">{post.author}</p>
          <p className="text-sm text-slate-500">{post.date}</p>
        </div>
        <a href="#" className="mt-4 font-semibold text-blue-600 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          Read More <ArrowRight className="h-4 w-4 ml-1" />
        </a>
      </div>
    </div>
  );
};

const BlogPage = () => {
  const featuredPost = mockBlogPosts.find(p => p.isFeatured);
  const otherPosts = mockBlogPosts.filter(p => !p.isFeatured);

  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* --- Header --- */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            The 1RFP Briefing
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Insights, strategies, and news for the Bay Area's nonprofit community.
          </p>
        </div>

        {/* --- Featured Post --- */}
        {featuredPost && (
          <div className="mb-16">
            <BlogPostCard post={featuredPost} isFeatured={true} />
          </div>
        )}

        {/* --- Recent Posts Grid --- */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPosts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;