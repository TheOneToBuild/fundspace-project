// src/components/mentions/MentionList.jsx - Updated for New Schema
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Avatar from '../Avatar';

const MentionList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Clean selectItem function - remove debug logs for production
    const selectItem = index => {
        const item = props.items[index];
        if (item) {
            console.log('🎯 MentionList: Selecting item:', item);
            
            // Pass all three attributes to Tiptap
            props.command({ 
                id: item.id, 
                label: item.name,
                type: item.type
            });
        }
    };

    const onKeyDown = ({ event }) => {
        if (event.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev + props.items.length - 1) % props.items.length);
            return true;
        }

        if (event.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % props.items.length);
            return true;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            selectItem(selectedIndex);
            return true;
        }

        return false;
    };

    useImperativeHandle(ref, () => ({ onKeyDown }));

    useEffect(() => setSelectedIndex(0), [props.items]);

    if (!props.items || !props.items.length) {
        return (
            <div className="mention-dropdown-empty" style={{ padding: '16px', textAlign: 'center', color: '#65676b' }}>
                No results
            </div>
        );
    }

    const getUserTypeLabel = (suggestion) => {
        if (suggestion.type === 'user') {
            if (suggestion.title && suggestion.organization_name) {
                return `${suggestion.title} at ${suggestion.organization_name}`;
            } else if (suggestion.title) {
                return suggestion.title;
            } else if (suggestion.organization_name) {
                return suggestion.organization_name;
            }
            return 'User';
        } else {
            // FIXED: Handle all organization types from the unified organizations table
            const getOrgTypeLabel = (role) => {
                const typeLabels = {
                    'nonprofit': 'Nonprofit',
                    'funder': 'Funder', 
                    'foundation': 'Foundation',
                    'education': 'Education',
                    'healthcare': 'Healthcare',
                    'government': 'Government',
                    'religious': 'Religious',
                    'forprofit': 'For-Profit'
                };
                return typeLabels[role] || 'Organization';
            };
            
            return getOrgTypeLabel(suggestion.role);
        }
    };

    return (
        <div className="mention-dropdown" style={{
            minWidth: '300px',
            maxWidth: '400px',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            fontSize: '14px'
        }}>
            {/* Header for the dropdown, showing query and result count */}
            <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid #e1e5e9',
                fontSize: '12px',
                color: '#65676b',
                backgroundColor: '#f8f9fa'
            }}>
                💬 {props.items.length} result{props.items.length !== 1 ? 's' : ''} for "{props.query}"
            </div>

            {/* Map through the items (suggestions) and render each one */}
            {props.items.map((item, index) => (
                <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => selectItem(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
                    style={{
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: index === selectedIndex ? '#e3f2fd' : 'transparent',
                        borderBottom: index < props.items.length - 1 ? '1px solid #f0f2f5' : 'none'
                    }}
                >
                    {/* Avatar component for user/organization */}
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e4e6ea',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', flexShrink: 0, overflow: 'hidden'
                    }}>
                        {item.avatar_url ? (
                            <Avatar src={item.avatar_url} fullName={item.name} size="md" />
                        ) : (
                            <span>{item.type === 'user' ? '👤' : '🏢'}</span>
                        )}
                    </div>
                    {/* Display name and descriptive label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontWeight: '600', color: '#1c1e21', marginBottom: '2px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            {item.name}
                        </div>
                        <div style={{
                            fontSize: '12px', color: '#65676b',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            {getUserTypeLabel(item)}
                        </div>
                    </div>
                    {/* Type indicator icon on the right */}
                    <div style={{ fontSize: '20px', opacity: 0.6 }}>
                        {item.type === 'user' ? '👤' : '🏢'}
                    </div>
                </div>
            ))}
            {/* Footer hint for navigation */}
            <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #e1e5e9',
                fontSize: '11px',
                color: '#8a8d91',
                backgroundColor: '#f8f9fa',
                textAlign: 'center'
            }}>
                ↑↓ to navigate • Enter to select • Esc to close
            </div>
        </div>
    );
});

export default MentionList;