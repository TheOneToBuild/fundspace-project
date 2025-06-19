// src/data.jsx
import React from 'react';

import prospectingImage from './assets/San Francisco.png';
import fasterAppImage from './assets/nonprofit2.jpg';
import toolkitImage from './assets/nonprofit1.jpg';
import impactImage from './assets/nonprofit3.jpg';
import nonprofitsImage from './assets/San Jose.jpg';
import SFImage from './assets/San Francisco 1.jpg';
import SJImage from './assets/San Jose 1.png';
import nonprofitImage4 from './assets/nonprofit4.jpg';
import nonprofitImage5 from './assets/nonprofit5.jpg';
import nonprofitImage6 from './assets/nonprofit6.jpg';
import nonprofitImage7 from './assets/nonprofit7.jpg';
import nonprofitImage8 from './assets/nonprofit8.jpg';
import nonprofitImage9 from './assets/nonprofit9.jpg';
import nonprofitImage10 from './assets/nonprofit10.jpg';
import nonprofitImage11 from './assets/nonprofit11.jpg';

// The "export" keyword here makes this variable available to other files.
export const heroImpactCardsData = [
{
id: 'discover-time',
title: 'Discover in Minutes, Not Weeks',
description: 'Find relevant grants 90% faster.',
imageUrls: [prospectingImage, SFImage, SJImage],
imageAlt: 'Team collaborating on a project',
},
{
id: 'bay-area-nonprofits',
title: 'Built for the Bay Area',
description: 'The most comprehensive local database.',
imageUrls: [nonprofitsImage, nonprofitImage5, nonprofitImage6],
imageAlt: 'San Francisco cityscape',
},
{
id: 'faster-applications',
title: 'Faster Applications',
description: 'Streamlined insights for quicker proposals.',
imageUrls: [fasterAppImage, nonprofitImage7, nonprofitImage8],
imageAlt: 'Person writing at a desk',
},
{
id: 'tool-consolidation',
title: 'One Platform, Total Clarity',
description: 'Replace multiple tools with one.',
  imageUrls: [toolkitImage, nonprofitImage9, nonprofitImage10],
imageAlt: 'Organized desk with laptop',
},
{
id: 'impact-stories',
title: 'Real Impact, Real Stories',
description: 'See how we help nonprofits thrive.',
imageUrls: [impactImage, nonprofitImage4, nonprofitImage11],
imageAlt: 'Nonprofit team working together',
},
];