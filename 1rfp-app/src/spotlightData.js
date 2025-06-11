// src/spotlightData.js

export const communitySpotlightData = {
  id: 'spotlight-2025-06',
  month: 'June',
  year: 2025,
  communityName: 'Oakland',
  countyName: 'Alameda County',
  heroImage: 'https://placehold.co/1200x600/1a202c/FFFFFF?text=Oakland&font=inter',
  tagline: "A vibrant hub of culture, innovation, and resilient communities.",
  description: "Oakland stands as a testament to the Bay Area's rich diversity and history. From the bustling port to the serene redwood forests in the hills, the city is a microcosm of creativity and industry. While facing challenges in equity and housing, Oakland's spirit is defined by its strong neighborhood bonds, thriving arts scene, and a deep-rooted commitment to social justice, making it a focal point for impactful nonprofit work.",
  stats: [
    { label: 'Population', value: '433,823', icon: 'Users' },
    { label: 'Median Income', value: '$86,971', icon: 'DollarSign' },
    { label: 'Founded', value: '1852', icon: 'Calendar' }
  ],
  featuredNonprofits: [
    {
      id: 'np-spotlight-1',
      name: 'Oakland Arts Collective',
      imageUrl: 'https://placehold.co/600x400/805ad5/FFFFFF?text=Oakland+Arts+Collective&font=inter',
      tagline: 'Empowering youth through creative expression.',
      impactStory: "Last year, the Collective provided over 2,000 hours of free art instruction to Oakland youth, culminating in the 'Art for Oakland' mural project that revitalized three downtown public spaces.",
      website: '#',
      yearFounded: 2012,
      keyPrograms: ['After-School Arts', 'Summer Mural Camp', 'Digital Media Lab'],
      about: "Founded by local artists and educators, the Oakland Arts Collective provides a safe and inspiring space for young people to explore their creativity. Through hands-on workshops and mentorship, we help cultivate the next generation of Bay Area artists.",
      mission: "To empower Oakland youth by providing accessible, high-quality arts education and a platform for creative self-expression that fosters confidence and community engagement."
    },
    {
      id: 'np-spotlight-2',
      name: 'East Bay Food Pantry',
      imageUrl: 'https://placehold.co/600x400/dd6b20/FFFFFF?text=East+Bay+Food+Pantry&font=inter',
      tagline: 'Nourishing communities, one meal at a time.',
      impactStory: "By partnering with local farms, the Pantry rescued over 50 tons of fresh produce, providing healthy, nutritious meals to more than 500 families weekly across East Oakland.",
      website: '#',
      yearFounded: 1998,
      keyPrograms: ['Weekly Grocery Distribution', 'Nutrition Workshops', 'Community Garden'],
      about: "What began as a small neighborhood effort has grown into a cornerstone of the East Bay's food security network. We focus on providing nutritious food with dignity and respect to all who come through our doors.",
      mission: "To eliminate hunger and promote health in our community through reliable access to nutritious food, education, and compassionate support."
    },
    {
      id: 'np-spotlight-3',
      name: 'Lake Merritt Stewards',
      imageUrl: 'https://placehold.co/600x400/38a169/FFFFFF?text=Lake+Merritt+Stewards&font=inter',
      tagline: "Preserving Oakland's natural crown jewel.",
      impactStory: "Their weekly volunteer clean-ups removed over 5,000 pounds of trash from Lake Merritt's shores, significantly improving water quality and protecting the habitat of migratory birds.",
      website: '#',
      yearFounded: 2005,
      keyPrograms: ['Weekly Clean-ups', 'Water Quality Testing', 'Educational Tours'],
      about: "The Lake Merritt Stewards is a volunteer-led organization dedicated to the ecological health and public enjoyment of Lake Merritt. We believe that a healthy lake contributes to a healthy city.",
      mission: "To protect and improve the ecosystem of Lake Merritt and its surrounding parklands through hands-on stewardship, community education, and advocacy."
    }
  ],
  featuredFunders: [
    {
      id: 'funder-spotlight-1',
      name: 'The Alameda Opportunity Fund',
      logoUrl: 'https://placehold.co/100x100/EBF5FF/1E40AF?text=AOF&font=inter',
      philosophy: 'Dedicated to closing the equity gap in Alameda County by investing in education and workforce development initiatives that create clear pathways to success.',
      focusAreas: ['Youth Education', 'STEM', 'Job Training'],
      website: '#',
      grantmakingProcess: 'Accepts unsolicited proposals via online portal twice a year.',
      notableGrant: 'Recently awarded $75,000 to Oakland Codes to expand their free coding bootcamps to two new high schools.',
      // NEW FIELDS
      funderType: 'Community Foundation',
      geographicScope: 'Alameda & Contra Costa Counties',
      annualGiving: 'Approx. $12M',
      primaryContact: {
        name: 'Elena Garcia',
        title: 'Program Officer, Education'
      }
    },
    {
      id: 'funder-spotlight-2',
      name: 'Bay Area Green Futures',
      logoUrl: 'https://placehold.co/100x100/F0FFF4/22543D?text=BAG&font=inter',
      philosophy: "Believes that environmental health is community health. We fund grassroots projects focused on conservation, sustainability, and climate resilience in urban areas.",
      focusAreas: ['Urban Gardening', 'Conservation', 'Climate Justice'],
      website: '#',
      grantmakingProcess: 'By invitation only. LOIs are requested from partners identified by staff.',
      notableGrant: 'Provided a three-year, $150,000 general operating grant to the West Oakland Environmental Indicators Project.',
      // NEW FIELDS
      funderType: 'Private Foundation',
      geographicScope: 'All 9 Bay Area Counties',
      annualGiving: 'Approx. $25M',
      primaryContact: {
        name: 'David Chen',
        title: 'Program Officer, Environment'
      }
    },
    {
      id: 'funder-spotlight-3',
      name: 'East Bay Arts & Culture Council',
      logoUrl: 'https://placehold.co/100x100/FAF5FF/5B21B6?text=EBAC&font=inter',
      philosophy: "We champion the artists and organizations that make the East Bay a vibrant, culturally rich place to live, with a focus on supporting underserved communities.",
      focusAreas: ['Public Art', 'Arts Education', 'Cultural Programs'],
      website: '#',
      grantmakingProcess: 'Open application process with a rolling deadline for grants under $10,000.',
      notableGrant: 'Funded the "Voices of the Town" public mural series, supporting 15 local artists.',
      // NEW FIELDS
      funderType: 'Public Charity',
      geographicScope: 'Alameda & Contra Costa Counties',
      annualGiving: 'Approx. $5M',
      primaryContact: {
        name: 'Maria Flores',
        title: 'Grants Manager'
      }
    }
  ]
};