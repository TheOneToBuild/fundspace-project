// src/components/HelloCommunityRoute.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import HelloCommunity from './HelloCommunity.jsx';

export default function HelloCommunityRoute() {
    // Get the context from ProfilePage
    const context = useOutletContext();
    
    return <HelloCommunity />;
}