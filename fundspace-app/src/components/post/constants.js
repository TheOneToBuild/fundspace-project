// src/components/post/constants.js
import { ThumbsUp, Heart, Lightbulb, PartyPopper } from 'lucide-react';

export const reactions = [
    { type: 'like', Icon: ThumbsUp, color: 'bg-blue-500', label: 'Like' },
    { type: 'love', Icon: Heart, color: 'bg-red-500', label: 'Love' },
    { type: 'celebrate', Icon: PartyPopper, color: 'bg-green-500', label: 'Celebrate' },
    { type: 'insightful', Icon: Lightbulb, color: 'bg-yellow-500', label: 'Insightful' },
];