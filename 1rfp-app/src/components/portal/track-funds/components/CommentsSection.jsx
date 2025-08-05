// Enhanced CommentsSection.jsx with @mentions and real-time features
// src/components/portal/track-funds/components/CommentsSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Reply, Heart, AtSign, Paperclip, Smile } from '../../../Icons.jsx';

const CommentsSection = ({ 
  applicationId, 
  isVisible, 
  onClose, 
  newComment, 
  onCommentChange, 
  onCommentSubmit,
  teamMembers = []
}) => {
  const [replyTo, setReplyTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Enhanced comments with reactions and threading
  const getComments = () => {
    return [
      {
        id: 1,
        user: "Sarah Chen",
        userInitials: "SC",
        userAvatar: null,
        message: "Updated the budget section based on finance team feedback. @Mike can you review the revised numbers?",
        timestamp: "2 hours ago",
        isRead: true,
        reactions: [
          { emoji: "👍", count: 2, users: ["Mike Johnson", "Alex Rivera"] },
          { emoji: "✅", count: 1, users: ["You"] }
        ],
        replies: [
          {
            id: 11,
            user: "Mike Johnson",
            userInitials: "MJ",
            message: "Looks good! The numbers align with our quarterly projections.",
            timestamp: "1 hour ago",
            isRead: true
          }
        ]
      },
      {
        id: 2,
        user: "Mike Johnson", 
        userInitials: "MJ",
        userAvatar: null,
        message: "Great work on the narrative section! I added some additional metrics to strengthen our case. The new data shows a 40% improvement in community engagement.",
        timestamp: "1 day ago",
        isRead: true,
        reactions: [
          { emoji: "🎉", count: 3, users: ["Sarah Chen", "Alex Rivera", "You"] }
        ],
        replies: []
      },
      {
        id: 3,
        user: "Alex Rivera",
        userInitials: "AR",
        userAvatar: null,
        message: "@Sarah Can you review the timeline section? I think we need to adjust the delivery dates to be more realistic given our current capacity.",
        timestamp: "2 days ago",
        isRead: false,
        reactions: [
          { emoji: "🤔", count: 1, users: ["Sarah Chen"] }
        ],
        replies: [
          {
            id: 31,
            user: "Sarah Chen",
            userInitials: "SC",
            message: "Good point! I'll extend Phase 2 by two weeks to account for the additional research time.",
            timestamp: "2 days ago",
            isRead: true
          }
        ]
      }
    ];
  };

  const [comments, setComments] = useState(getComments());

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isVisible, comments]);

  // Handle @mentions
  const handleInputChange = (value) => {
    onCommentChange(value);
    
    // Check for @mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      const query = spaceIndex === -1 ? afterAt : afterAt.slice(0, spaceIndex);
      
      if (query.length > 0) {
        setMentionQuery(query.toLowerCase());
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member) => {
    const currentValue = newComment || '';
    const lastAtIndex = currentValue.lastIndexOf('@');
    const beforeAt = currentValue.slice(0, lastAtIndex);
    const afterAt = currentValue.slice(lastAtIndex + 1);
    const spaceIndex = afterAt.indexOf(' ');
    const afterMention = spaceIndex === -1 ? '' : afterAt.slice(spaceIndex);
    
    const newValue = `${beforeAt}@${member.name}${afterMention} `;
    onCommentChange(newValue);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(mentionQuery)
  );

  const addReaction = (commentId, emoji) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const existingReaction = comment.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.users.includes('You')) {
            // Remove reaction
            return {
              ...comment,
              reactions: comment.reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== 'You') }
                  : r
              ).filter(r => r.count > 0)
            };
          } else {
            // Add reaction
            return {
              ...comment,
              reactions: comment.reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count + 1, users: [...r.users, 'You'] }
                  : r
              )
            };
          }
        } else {
          // New reaction
          return {
            ...comment,
            reactions: [...comment.reactions, { emoji, count: 1, users: ['You'] }]
          };
        }
      }
      return comment;
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="mt-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 relative">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
            <MessageCircle size={16} />
            Team Discussion
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {comments.length} comments
            </span>
          </h4>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-white/50 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Comments List */}
        <div className="space-y-4 max-h-80 overflow-y-auto mb-4 pr-2">
          {comments.map(comment => (
            <div key={comment.id} className="space-y-3">
              {/* Main Comment */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{comment.userInitials}</span>
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-900">{comment.user}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{comment.timestamp}</span>
                      {!comment.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{comment.message}</p>
                  
                  {/* Reactions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {comment.reactions.map(reaction => (
                        <button
                          key={reaction.emoji}
                          onClick={() => addReaction(comment.id, reaction.emoji)}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            reaction.users.includes('You')
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                      <button
                        onClick={() => addReaction(comment.id, '👍')}
                        className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Reply size={12} />
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-8 space-y-2">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{reply.userInitials}</span>
                      </div>
                      <div className="flex-1 bg-white/70 rounded-lg p-2 border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs text-slate-900">{reply.user}</span>
                          <span className="text-xs text-slate-500">{reply.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-700">{reply.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {replyTo === comment.id && (
                <div className="ml-8">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">Y</span>
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            // Handle reply submission
                            setReplyTo(null);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button 
                        onClick={() => setReplyTo(null)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors shadow-sm"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
        
        {/* Enhanced Comment Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">Y</span>
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                placeholder="Add a comment... Use @ to mention team members"
                value={newComment || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none"
                rows="2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onCommentSubmit();
                  }
                }}
              />
              
              {/* @Mentions Dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                  {filteredMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => insertMention(member)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{member.initials}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Toolbar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                    <AtSign size={14} />
                  </button>
                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                    <Paperclip size={14} />
                  </button>
                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                    <Smile size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                  <button 
                    onClick={onCommentSubmit}
                    disabled={!newComment?.trim()}
                    className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;