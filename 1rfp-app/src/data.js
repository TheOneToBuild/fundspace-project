// src/data.js

// Import images used in mock data
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

const spotlightImage1 = 'https://images.unsplash.com/photo-1556636530-6b7482d80e3d?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const spotlightImage2 = 'https://images.unsplash.com/photo-1582012107792-238ced5bf028?q=80&w=2676&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const spotlightImage3 = 'https://images.unsplash.com/photo-1708721224715-caf94b675b72?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export const mockGrants = [
  {
    id: '1',
    title: 'Community Health Initiative Grant',
    foundationName: 'Golden State Health Foundation',
    description:
      'Supporting projects that improve community health outcomes for underserved populations in the Bay Area. This grant aims to fund innovative solutions that address health disparities and promote wellness through comprehensive community-based programs. We are actively seeking proposals that demonstrate a clear understanding of the target population\'s unique health needs, a well-defined intervention strategy, and a sustainable plan for long-term impact and scalability across various Bay Area communities.',
    eligibility:
      'Registered 501(c)(3) nonprofits operating within Alameda, San Francisco, or San Mateo counties, with at least five years of demonstrated experience in public health initiatives.\nFocus must be on preventative care, health education, or direct health service delivery for low-income or marginalized groups.\nApplicants must provide audited financial statements for the past three fiscal years.\nProposals should include a detailed budget, a robust evaluation plan with measurable outcomes, and letters of support from community partners. Organizations with prior successful grant management experience are preferred.',
    dueDate: '2025-08-15',
    fundingAmount: 'Up to $50,000',
    location: 'San Francisco, Alameda, San Mateo',
    category: 'Health',
    url: 'https://example.com/grant1-details',
    keywords: ['health', 'community health', 'underserved populations', 'health disparities', 'wellness', 'preventative care', 'health education', 'bay area', 'public health', 'nonprofit funding'],
    dateAdded: '2025-05-28', // Example: 4 days ago from 2025-06-01 (NEW)
    grantType: 'Project Grant', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '2',
    title: 'Youth STEM Education Fund',
    foundationName: 'Tech Futures Foundation',
    description:
      'Grants for innovative programs that provide high-quality STEM education and transformative opportunities for K-12 students, especially those from low-income backgrounds and underrepresented minority groups. The core mission is to inspire the next generation of diverse innovators and technologists by providing equitable access to cutting-edge STEM learning experiences, hands-on projects, mentorship from industry leaders, and comprehensive resources for future academic and career pathways.',
    eligibility:
      'Accredited nonprofits and public schools within Santa Clara and Contra Costa counties.\nApplicants must possess a proven track record of at least three years in successful STEM education program delivery.\nPrograms are required to serve a majority (60% or more) of students from households at or below 200% of the federal poverty level.\nStrong preference will be given to proposals demonstrating collaborative partnerships with local tech companies, universities, or STEM professionals to enhance curriculum and provide real-world exposure.',
    dueDate: '2025-09-01',
    fundingAmount: '$25,000 - $75,000',
    location: 'Santa Clara, Contra Costa',
    category: 'Education',
    url: 'https://example.com/grant2-details',
    keywords: ['youth', 'STEM education', 'technology', 'low-income youth', 'k-12 education', 'innovation', 'coding', 'robotics', 'science', 'math', 'tech access', 'mentorship', 'career pathways'],
    dateAdded: '2025-05-10', // Example: 22 days ago (NOT NEW)
    grantType: 'Program Support', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '3',
    title: 'Bay Area Environmental Conservation Grant',
    foundationName: 'Green Future Collective',
    description: 'Funding for impactful projects focused on local habitat restoration, native biodiversity protection, and strengthening climate resilience across the diverse ecosystems of the nine Bay Area counties. We actively support initiatives that engage community volunteers in meaningful environmental work and promote widespread environmental stewardship through educational outreach and actionable programs for all ages.',
    eligibility: 'Registered 501(c)(3) organizations with a primary mission explicitly focused on environmental conservation and ecological restoration. Projects must be physically located within one of the nine specified Bay Area counties and demonstrate a clear, measurable positive impact on local ecosystems. A significant component of active community engagement, volunteer participation, or public environmental education is a mandatory requirement for all proposals. Previous successful land management or conservation project experience is a plus.',
    dueDate: '2025-10-20',
    fundingAmount: '$15,000 - $60,000',
    location: 'All Bay Area Counties',
    category: 'Environment',
    url: 'https://example.com/grant3-details',
    keywords: ['environment', 'conservation', 'bay area', 'biodiversity', 'climate resilience', 'habitat restoration', 'ecosystem', 'sustainability', 'environmental education', 'volunteer programs'],
    dateAdded: '2025-05-30', // Example: 2 days ago (NEW)
    grantType: 'Project Grant', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '4',
    title: 'Arts & Culture Access Program',
    foundationName: 'Creative Spark Foundation',
    description: 'Supporting dynamic organizations and innovative projects that significantly increase access to diverse arts and cultural experiences for underserved communities, including low-income individuals, seniors, people with disabilities, and historically marginalized groups. Our grants aim to break down barriers to participation and foster a vibrant, inclusive arts landscape where everyone can engage with and contribute to creative expression.',
    eligibility: 'Accredited nonprofit arts organizations or community groups with a fiscal sponsor operating programs in Alameda or Contra Costa counties. Programs must primarily serve residents of Oakland or Richmond and demonstrate a clear commitment to cultural equity. Preference will be given to proposals for participatory arts programs, arts education initiatives, or projects involving collaborative community art creation. Evidence of community need and strong local partnerships is required.',
    dueDate: '2025-11-05',
    fundingAmount: '$5,000 - $25,000',
    location: 'Oakland, Richmond',
    category: 'Arts & Culture',
    url: 'https://example.com/grant4-details',
    keywords: ['arts', 'culture', 'access', 'underserved communities', 'community programs', 'oakland', 'richmond', 'cultural equity', 'arts education', 'participatory arts', 'diversity in arts'],
    dateAdded: '2025-04-15', // Example: >1 month ago (NOT NEW)
    grantType: 'Program Support', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '5',
    title: 'Sustainable Agriculture Grants',
    foundationName: 'Green Valley Agricultural Trust',
    description:
      'Supporting small farms and innovative agricultural projects in Napa and Sonoma counties that implement sustainable and organic farming practices. This initiative actively seeks to strengthen local food systems, promote environmentally sound and regenerative agriculture, and enhance regional food security through community-based solutions and ecological farming methods. We are interested in projects that demonstrate measurable environmental benefits and community engagement.',
    eligibility:
      'Open to small farms (annual revenue under $500,000), agricultural nonprofits, and farmer cooperatives directly operating in Napa or Sonoma counties.\nApplicants must be currently practicing or transitioning to certified organic, biodynamic, or advanced sustainable methods (e.g., regenerative agriculture, permaculture, agroforestry).\nProjects enhancing soil health, water conservation, biodiversity, or climate adaptation within agricultural systems are highly prioritized. Proposals should outline clear environmental goals and community benefits.',
    dueDate: '2026-02-01',
    fundingAmount: '$10,000 - $40,000',
    location: 'Napa, Sonoma',
    category: 'Environment',
    url: '#',
    keywords: ['agriculture', 'sustainable farming', 'organic farming', 'food systems', 'environment', 'napa', 'sonoma', 'regenerative agriculture', 'permaculture', 'food security', 'local food'],
    dateAdded: '2025-05-20', // Example: 12 days ago (NEW)
    grantType: 'Project Grant', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '6',
    title: 'General Operating Support Fund',
    foundationName: 'Community Resilience Foundation',
    description: 'Providing flexible, unrestricted general operating support to established nonprofits serving critical needs and fostering community resilience across the entire Bay Area region. This fund recognizes the importance of core operational stability for organizations to effectively deliver their missions and respond to evolving community challenges.',
    eligibility: 'Registered 501(c)(3) organizations with an annual operating budget of $500,000 or more, and demonstrating at least 5 consecutive years of successful program delivery and sound financial management. Applicants must show a broad impact across multiple Bay Area communities or a deep impact within a specific, high-need region. Preference given to organizations with diversified funding streams and strong community ties. This grant is intended to support the overall health and capacity of the organization.',
    dueDate: '2025-12-10',
    fundingAmount: '$75,000 - $150,000',
    location: 'All Bay Area Counties',
    category: 'Social Services',
    url: '#',
    keywords: ['general operating', 'capacity building', 'flexible funding', 'community resilience', 'nonprofit sustainability', 'bay area social services', 'core support', 'organizational development'],
    dateAdded: '2025-05-29',
    grantType: 'General Operating', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '7',
    title: 'Digital Inclusion Grant',
    foundationName: 'Connect Bay Area Fund',
    description: 'Supports projects that actively bridge the digital divide by providing equitable internet access, essential computing devices, and comprehensive digital literacy training to underserved communities, including low-income families, seniors, and individuals with disabilities. We aim to empower residents with the tools and skills necessary to fully participate in the digital economy and society.',
    eligibility: 'Nonprofit organizations and community-based groups with a proven track record in digital inclusion or technology access programs in Alameda and Santa Clara counties. Projects must demonstrate a clear plan for distributing devices and delivering digital literacy training. Collaborative proposals involving local libraries, community centers, or schools are highly encouraged. Proposals must include a plan for long-term sustainability and impact measurement.',
    dueDate: '2025-09-20',
    fundingAmount: '$20,000 - $80,000',
    location: 'Alameda, Santa Clara',
    category: 'Technology',
    url: '#',
    keywords: ['digital divide', 'internet access', 'tech literacy', 'community access', 'digital equity', 'technology education', 'broadband access', 'device distribution', 'digital skills'],
    dateAdded: '2025-05-18',
    grantType: 'Program Support', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '8',
    title: 'Rolling Grant for Local Food Banks',
    foundationName: 'Harvest Helpers Alliance',
    description: 'Providing ongoing, flexible support for local food banks and pantries to address immediate food insecurity needs and enhance their operational capacity. This rolling grant ensures a continuous supply of resources to frontline organizations working to alleviate hunger in communities across the Bay Area. We prioritize adaptability to urgent needs and efficient distribution models.',
    eligibility: 'Registered food banks or nonprofit organizations with established, ongoing food distribution programs and a clear demonstration of community need. Applicants must submit a simplified application outlining operational capacity and impact. Funding is disbursed on a rolling basis, so organizations can apply at any time based on their critical needs. Priority given to organizations serving a high volume of clients or specific vulnerable populations.',
    dueDate: 'Rolling',
    fundingAmount: 'Varies, up to $20,000',
    location: 'All Bay Area Counties',
    category: 'Social Services',
    url: '#',
    keywords: ['food security', 'food bank', 'emergency relief', 'community support', 'hunger relief', 'social services', 'rolling grants', 'food distribution', 'nutritional access'],
    dateAdded: '2025-04-01',
    grantType: 'Program Support', // NEW FIELD
    status: 'Rolling', // NEW FIELD
  },
  {
    id: '9',
    title: 'Future Leaders Scholarship Program',
    foundationName: 'Next Generation Foundation',
    description: 'Grants to organizations providing scholarships and comprehensive mentorship to high school students pursuing higher education, particularly focusing on first-generation college students and those from underrepresented backgrounds. This program aims to bridge educational equity gaps by offering not just financial aid, but also critical academic, social, and emotional support to ensure students thrive in their post-secondary journeys. We seek partners with robust success metrics in college matriculation and retention, and a commitment to long-term student development.', // Expanded description
    eligibility: 'Educational nonprofits with a demonstrated track record in college readiness and success programs for at least 5 years. Applicants must outline clear criteria for student selection, provide evidence of robust mentorship structures, and submit a detailed plan for integrated student support services from high school through college graduation. Preference given to organizations serving students in underserved Bay Area districts. Minimum of 75% of scholarship recipients must be first-generation college students or from households below 200% of the federal poverty level. Audited financials for the last 3 years and letters of recommendation from current program participants are required.', // Expanded eligibility
    dueDate: '2025-08-01',
    fundingAmount: '$10,000 - $30,000',
    location: 'San Francisco, Oakland',
    category: 'Education',
    url: '#',
    keywords: ['scholarship', 'youth education', 'college readiness', 'mentorship', 'higher education', 'educational equity', 'first-generation students', 'student success', 'academic support', 'bay area education', 'youth development', 'career pathways'], // More keywords
    dateAdded: '2025-05-27',
    grantType: 'Capacity Building', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '10',
    title: 'Small Arts Project Grant',
    foundationName: 'Local Creatives Fund',
    description: 'Supporting small, innovative arts projects that deeply engage local communities and promote diverse artistic expression across various mediums. This grant is designed for grassroots initiatives and emerging artists who aim to make a significant cultural impact at a neighborhood level, fostering creativity and dialogue among residents. We encourage projects that are experimental, inclusive, and demonstrate clear community benefit.',
    eligibility: 'Open to individual artists or small arts collectives (up to 5 members) with a fiscal sponsor. Projects must have a clear public benefit and take place within Berkeley or Oakland. Proposals should include a detailed project plan, budget, and a portfolio of previous work. Demonstrated community engagement experience is highly valued. Fiscal sponsorship letter and EIN required.',
    dueDate: '2025-10-01',
    fundingAmount: 'Up to $5,000',
    location: 'Berkeley, Oakland',
    category: 'Arts & Culture',
    url: '#',
    keywords: ['local art', 'community art', 'artist support', 'cultural projects', 'public art', 'arts education', 'creative expression', 'grassroots initiatives', 'oakland arts', 'berkeley arts'],
    dateAdded: '2025-05-22',
    grantType: 'Project Grant', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '11',
    title: 'Urban Garden Development Grant',
    foundationName: 'City Green Spaces',
    description: 'Funding for the creation or significant expansion of urban community gardens and green spaces that promote local food access, biodiversity, and community cohesion in dense urban neighborhoods. We support projects that transform underutilized spaces into vibrant community assets, fostering environmental stewardship and healthy living.',
    eligibility: 'Open to community groups, schools, or nonprofit organizations with secure land access (lease or ownership) and a comprehensive community engagement and maintenance plan. Projects must be located in San Jose or East Palo Alto. Proposals should detail how the garden will contribute to food security, environmental education, or neighborhood beautification. Volunteer involvement and long-term sustainability plans are key criteria.',
    dueDate: '2025-11-15',
    fundingAmount: '$7,000 - $18,000',
    location: 'San Jose, East Palo Alto',
    category: 'Environment',
    url: '#',
    keywords: ['urban gardening', 'food access', 'green spaces', 'community building', 'urban agriculture', 'environmental stewardship', 'biodiversity', 'healthy living', 'san jose', 'east palo alto'],
    dateAdded: '2025-05-19',
    grantType: 'Project Grant', // NEW FIELD
    status: 'Open', // NEW FIELD
  },
  {
    id: '12',
    title: 'Disaster Relief Fund',
    foundationName: 'Bay Area Emergency Response',
    description: 'Provides immediate and flexible funding to organizations actively assisting with disaster relief and long-term recovery efforts following natural disasters or large-scale emergencies in the Bay Area. Our goal is to support rapid response and sustained community rebuilding efforts in affected regions. This fund is activated as needed during declared emergencies.',
    eligibility: 'Open to established nonprofits and community organizations with a demonstrated track record in disaster response, emergency services, or long-term recovery. Organizations must be actively involved in providing direct aid (shelter, food, medical, emotional support) or critical infrastructure rebuilding in a declared disaster zone within the Bay Area. Rapid application process for emergency disbursements. Priority given to organizations with existing infrastructure and local knowledge.',
    dueDate: 'Ongoing',
    fundingAmount: 'Emergency funds, typically $10,000-$50,000',
    location: 'All Bay Area Counties',
    category: 'Social Services',
    url: '#',
    keywords: ['disaster relief', 'emergency response', 'community support', 'crisis aid', 'recovery efforts', 'natural disasters', 'bay area emergency', 'social services', 'humanitarian aid'],
    dateAdded: '2025-03-01',
    grantType: 'Emergency Grant', // NEW FIELD
    status: 'Rolling', // NEW FIELD
  },
];

export const heroImpactCardsData = [
  {
    id: 'discover-time',
    type: 'imageCard',
    icon: null, // Icon will be passed as a prop from lucide-react
    title: 'Save 75% Prospecting Time',
    description: 'Find relevant grants faster.',
    imageUrls: [prospectingImage, SFImage, SJImage],
    imageAlt: 'Efficient grant searching'
  },
  {
    id: 'bay-area-nonprofits',
    type: 'imageCard',
    icon: null, // Icon will be passed as a prop
    title: '25,000+ Bay Area Nonprofits',
    description: 'A vibrant community we help you navigate.',
    imageUrls: [nonprofitsImage, nonprofitImage5, nonprofitImage6],
    imageAlt: 'Bay Area nonprofit community'
  },
  {
    id: 'faster-applications',
    type: 'imageCard',
    icon: null, // Icon will be passed as a prop
    title: 'Streamlined Applications',
    description: 'Key info, organized.',
    imageUrls: [fasterAppImage, nonprofitImage7, nonprofitImage8],
    imageAlt: 'Streamlined application process'
  },
  {
    id: 'tool-consolidation',
    type: 'imageCard',
    icon: null, // Icon will be passed as a prop
    title: 'Simplify Your Toolkit',
    description: 'One intelligent platform.',
    imageUrls: [toolkitImage, nonprofitImage9, nonprofitImage10],
    imageAlt: 'Tool consolidation'
  },
  {
    id: 'community-impact',
    type: 'imageCard',
    icon: null, // Icon will be passed as a prop
    title: 'Maximize Your Impact',
    description: 'Focus on your mission.',
    imageUrls: [impactImage, nonprofitImage4, nonprofitImage11],
    imageAlt: 'Community impact'
  }
];

export const spotlightNonprofitsData = [
  {
    id: 'bac',
    name: "Bay Area Coders",
    tagline: "Empowering the next generation of tech innovators through accessible coding education.",
    imageUrl: spotlightImage1,
    imageAlt: "Students collaborating on coding projects at Bay Area Coders",
    description: "Bay Area Coders is a non-profit organization dedicated to providing free, high-quality coding education to underserved youth (ages 12-18) across the San Francisco Bay Area. Our programs focus on web development, data science, and mobile app creation, taught by volunteer industry professionals.",
    impactStory: "Last year, Bay Area Coders helped over 500 students develop foundational coding skills. 85% of our graduates reported increased confidence in STEM subjects, and 30% went on to pursue technology-related further education or internships.",
    websiteUrl: "#",
    themeColor: "red",
    focusAreas: ["Youth Education", "STEM", "Tech Skills"],
    waysToHelp: [
      { text: "Volunteer as a Mentor", url: "#" },
      { text: "Donate to Our Scholarship Fund", url: "#" },
      { text: "Partner with Us", url: "#" }
    ]
  },
  {
    id: 'ghi',
    name: "Green Hills Initiative",
    tagline: "Protecting and restoring our local natural habitats for a sustainable future.",
    imageUrl: spotlightImage2,
    imageAlt: "Volunteers planting trees at a Green Hills Initiative event",
    description: "Green Hills Initiative works to conserve vital ecosystems in the region through habitat restoration projects, community cleanups, and educational workshops. We believe in hands-on action to combat climate change and preserve biodiversity.",
    impactStory: "Over the past year, GHI volunteers dedicated 10,000+ hours, restored 50 acres of wetland habitat, and removed over 5 tons of invasive species, significantly improving local water quality and wildlife corridors.",
    websiteUrl: "#",
    themeColor: "red",
    focusAreas: ["Environment", "Conservation", "Volunteering"],
    waysToHelp: [
      { text: "Join a Cleanup Event", url: "#" },
      { text: "Support Our Nursery", url: "#" }
    ]
  },
  {
    id: 'arsf',
    name: "ArtReach SF",
    tagline: "Bringing the transformative power of art to every community in San Francisco.",
    imageUrl: spotlightImage3,
    imageAlt: "Children participating in an outdoor ArtReach SF painting workshop",
    description: "ArtReach SF provides free art supplies, workshops, and public art installations in underserved neighborhoods. We aim to foster creativity, self-expression, and community engagement through accessible artistic experiences for all ages.",
    impactStory: "ArtReach SF's mobile art studio visited 20 different neighborhoods last quarter, engaging over 1,200 participants in creative activities. Their latest mural project revitalized a community park, becoming a local landmark.",
    websiteUrl: "#",
    themeColor: "red",
    focusAreas: ["Arts & Culture", "Community", "Youth Programs"],
    waysToHelp: []
  }
];

export const mockFunders = [
  {
    id: 'f1',
    name: 'Bay Area Community Trust',
    description: 'A major philanthropic organization supporting a wide range of initiatives across the nine Bay Area counties, with a focus on education, social equity, and environmental sustainability. They offer both general operating support and project-specific grants.',
    location: 'San Francisco, CA',
    totalFundingAnnually: 'Over $100M',
    grantTypes: ['General Operating', 'Project Grants', 'Capacity Building'],
    averageGrantSize: '$50,000 - $500,000',
    contactEmail: 'grants@bacommunitytrust.org',
    website: '#',
    focusAreas: ['Education', 'Social Equity', 'Environment', 'Arts & Culture'],
    grantsOffered: 120, // Example number of grants offered annually
    lastUpdated: '2025-05-15',
  },
  {
    id: 'f2',
    name: 'Silicon Valley Innovation Fund',
    description: 'Dedicated to fostering technological innovation and entrepreneurship, particularly in underserved communities within Santa Clara and San Mateo counties. They primarily fund STEM education, workforce development, and tech-for-good initiatives.',
    location: 'San Jose, CA',
    totalFundingAnnually: '$50M - $75M',
    grantTypes: ['Seed Funding', 'Program Support', 'Technology Adoption'],
    averageGrantSize: '$25,000 - $250,000',
    contactEmail: 'info@svinnovationfund.org',
    website: '#',
    focusAreas: ['STEM', 'Workforce Development', 'Technology', 'Community Impact'],
    grantsOffered: 85,
    lastUpdated: '2025-04-28',
  },
  {
    id: 'f3',
    name: 'Coastal Preservation Foundation',
    description: 'Supports conservation efforts along the California coast, with specific grants for habitat restoration, marine research, and environmental education programs in coastal Bay Area counties like Marin, San Mateo, and Santa Cruz.',
    location: 'Oakland, CA',
    totalFundingAnnually: 'Up to $30M',
    grantTypes: ['Research Grants', 'Conservation Projects', 'Educational Programs'],
    averageGrantSize: '$10,000 - $150,000',
    contactEmail: 'grants@coastalpf.org',
    website: '#',
    focusAreas: ['Environment', 'Conservation', 'Marine Biology', 'Education'],
    grantsOffered: 45,
    lastUpdated: '2025-05-01',
  },
  {
    id: 'f4',
    name: 'East Bay Arts & Culture Council',
    description: 'Promotes artistic and cultural vibrancy in Alameda and Contra Costa counties through grants to individual artists, arts organizations, and community cultural programs. Focuses on accessibility and diverse cultural expression.',
    location: 'Oakland, CA',
    totalFundingAnnually: '$15M - $25M',
    grantTypes: ['Project Grants', 'Operating Support (Arts)', 'Artist Fellowships'],
    averageGrantSize: '$5,000 - $75,000',
    contactEmail: 'grants@ebacc.org',
    website: '#',
    focusAreas: ['Arts & Culture', 'Community Engagement', 'Youth Programs'],
    grantsOffered: 60,
    lastUpdated: '2025-03-20',
  },
  {
    id: 'f5',
    name: 'Northern Bay Food Security Fund',
    description: 'Addresses food insecurity and promotes sustainable food systems in Napa and Sonoma counties. Grants support food banks, community gardens, nutrition education, and local agricultural initiatives.',
    location: 'Santa Rosa, CA',
    totalFundingAnnually: 'Up to $10M',
    grantTypes: ['Program Support', 'Capacity Building', 'Emergency Relief'],
    averageGrantSize: '$10,000 - $100,000',
    contactEmail: 'grants@nbfsf.org',
    website: '#',
    focusAreas: ['Food Security', 'Agriculture', 'Community Health'],
    grantsOffered: 30,
    lastUpdated: '2025-05-25',
  },
];

export const mockFunderSpotlightData = [
  {
    id: 'fs1',
    name: "The Bay Area Green Fund",
    tagline: "Investing in a sustainable future for the Bay Area through environmental grants.",
    imageUrl: 'https://images.unsplash.com/photo-1574768396117-64906f362edc?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: "Sustainable development project funded by The Bay Area Green Fund",
    description: "The Bay Area Green Fund is a leading philanthropic organization dedicated to supporting environmental sustainability and climate resilience initiatives across the nine Bay Area counties. We provide grants for habitat restoration, renewable energy adoption, sustainable agriculture, and environmental education.",
    impactStory: "Last year, we allocated $15 million across 40 projects, leading to the restoration of 200 acres of wetlands, reduction of 1,000 tons of carbon emissions, and the engagement of 5,000 community members in local conservation efforts.",
    websiteUrl: "#",
    themeColor: "green", // Using green theme
    focusAreas: ["Environment", "Conservation", "Climate Resilience", "Sustainable Agriculture", "Environmental Education"],
    waysToConnect: [
      { text: "View Our Grant Guidelines", url: "#" },
      { text: "Submit a Letter of Inquiry", url: "#" },
      { text: "Attend a Funder Briefing", url: "#" }
    ]
  },
  {
    id: 'fs2',
    name: "San Francisco Equity Collaborative",
    tagline: "Advancing social justice and equitable opportunities for all San Franciscans.",
    imageUrl: 'https://images.unsplash.com/photo-1549429780-69255a0f6880?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: "Community outreach event supported by SF Equity Collaborative",
    description: "The San Francisco Equity Collaborative is committed to dismantling systemic inequities and fostering inclusive communities. We fund initiatives in affordable housing, workforce development, criminal justice reform, and civic engagement within San Francisco.",
    impactStory: "Our grants supported 10,000 individuals with housing assistance and job training programs last year, contributing to a 10% decrease in chronic homelessness and a 15% increase in employment rates among program participants.",
    websiteUrl: "#",
    themeColor: "indigo", // Using indigo theme
    focusAreas: ["Social Equity", "Housing", "Workforce Development", "Justice Reform", "Civic Engagement"],
    waysToConnect: [
      { text: "Review Our Funding Priorities", url: "#" },
      { text: "Contact Our Program Officers", url: "#" }
    ]
  },
  {
    id: 'fs3',
    name: "Bay Area Youth Development Foundation",
    tagline: "Empowering young people to thrive through education, arts, and mentorship.",
    imageUrl: 'https://images.unsplash.com/photo-1522204523234-87295a73304b?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: "Youth participating in an educational program",
    description: "The Bay Area Youth Development Foundation invests in innovative programs that support the holistic development of youth across the region. We focus on initiatives that promote academic success, creative expression, leadership skills, and mental well-being.",
    impactStory: "Through our partnerships, over 1,500 youth participated in after-school programs, leading to an average 20% improvement in academic performance and significant gains in self-esteem and social-emotional skills.",
    websiteUrl: "#",
    themeColor: "cyan", // Using cyan theme
    focusAreas: ["Youth Development", "Education", "Arts & Culture", "Mental Health", "Mentorship"],
    waysToConnect: [
      { text: "Apply for a Grant", url: "#" },
      { text: "Partnership Inquiries", url: "#" }
    ]
  }
];

export const mockNonprofits = [
  {
    id: 'np1',
    name: 'SF Community Arts Collective',
    tagline: 'Cultivating artistic expression and community engagement in San Francisco.',
    description: 'Provides free and low-cost art workshops, public art installations, and cultural events to underserved communities throughout San Francisco. Their mission is to make art accessible to everyone.',
    location: 'San Francisco, CA',
    focusAreas: ['Arts & Culture', 'Community Engagement', 'Youth Programs'],
    website: '#',
    budget: '$750,000 - $1.2M',
    staffCount: 10,
    yearFounded: 2008,
    impactMetric: 'Engaged 5,000+ individuals annually in art programs',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'People painting at an outdoor art event',
  },
  {
    id: 'np2',
    name: 'Bay Area Food Justice',
    tagline: 'Ensuring equitable access to healthy, sustainable food for all Bay Area residents.',
    description: 'Works to combat food insecurity and promote a just food system through community gardens, food distribution programs, and advocacy for equitable food policies in Alameda and Contra Costa counties.',
    location: 'Oakland, CA',
    focusAreas: ['Food Security', 'Community Health', 'Advocacy', 'Environment'],
    website: '#',
    budget: '$500,000 - $800,000',
    staffCount: 8,
    yearFounded: 2015,
    impactMetric: 'Distributed 1 million pounds of fresh produce last year',
    imageUrl: 'https://images.unsplash.com/photo-1542825624-a740702ac237?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'People working in a community garden',
  },
  {
    id: 'np3',
    name: 'Youth Empowerment Center Silicon Valley',
    tagline: 'Empowering at-risk youth with skills for success and positive futures.',
    description: 'Offers mentorship, academic support, and vocational training to vulnerable youth in Santa Clara County, focusing on personal development and pathways to higher education or skilled trades.',
    location: 'San Jose, CA',
    focusAreas: ['Youth Development', 'Education', 'Workforce Development', 'Mentorship'],
    website: '#',
    budget: '$1.5M - $2M',
    staffCount: 25,
    yearFounded: 1998,
    impactMetric: '90% program participants pursue higher education or employment',
    imageUrl: 'https://images.unsplash.com/photo-1606761245782-cd22199f7d0a?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'Group of young people collaborating on a project',
  },
  {
    id: 'np4',
    name: 'North Bay Wildlife Sanctuary',
    tagline: 'Protecting and rehabilitating native wildlife in Marin and Sonoma counties.',
    description: 'Operates a rescue and rehabilitation center for injured and orphaned wildlife, combined with public education programs to promote biodiversity and environmental stewardship.',
    location: 'Novato, CA',
    focusAreas: ['Animal Welfare', 'Environment', 'Education'],
    website: '#',
    budget: '$400,000 - $600,000',
    staffCount: 7,
    yearFounded: 2003,
    impactMetric: 'Rescued and rehabilitated over 800 animals last year',
    imageUrl: 'https://images.unsplash.com/photo-1563401569435-08103c804f5e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'A rescued bird being cared for',
  },
  {
    id: 'np5',
    name: 'Tech for Good SF',
    tagline: 'Bridging the digital divide through accessible technology and education.',
    description: 'Provides refurbished computers, internet access, and digital literacy training to low-income families and seniors in San Francisco and Oakland, empowering them with essential tech skills.',
    location: 'San Francisco, CA',
    focusAreas: ['Technology', 'Digital Inclusion', 'Education', 'Community Development'],
    website: '#',
    budget: '$600,000 - $900,000',
    staffCount: 12,
    yearFounded: 2011,
    impactMetric: 'Equipped 1,500+ households with devices and internet annually',
    imageUrl: 'https://images.unsplash.com/photo-1582213709088-348633c7f394?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'People learning computer skills',
  },
  {
    id: 'np6',
    name: 'Bay Area Housing Advocates',
    tagline: 'Advocating for and providing solutions to affordable housing in the Bay Area.',
    description: 'Works to increase the supply of affordable housing, provide rental assistance, and advocate for tenant rights across the Bay Area. They focus on vulnerable populations including homeless individuals and low-income families.',
    location: 'All Bay Area Counties',
    focusAreas: ['Housing', 'Advocacy', 'Social Services'],
    website: '#',
    budget: '$2M - $3.5M',
    staffCount: 18,
    yearFounded: 1995,
    impactMetric: 'Helped 1,000+ families secure stable housing last year',
    imageUrl: 'https://images.unsplash.com/photo-1506729584749-36171804ba79?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'Modern apartment buildings',
  },
  {
    id: 'np7',
    name: 'Civic Engagement Forum',
    tagline: 'Fostering informed and active citizenship in the Bay Area.',
    description: 'Promotes civic participation through voter registration drives, community dialogues, and educational programs on local policy issues. They aim to empower residents to shape their communities.',
    location: 'Oakland, CA',
    focusAreas: ['Civic Engagement', 'Community Development', 'Education'],
    website: '#',
    budget: '$300,000 - $500,000',
    staffCount: 5,
    yearFounded: 2018,
    impactMetric: 'Registered 3,000 new voters in the last election cycle',
    imageUrl: 'https://images.unsplash.com/photo-1620021617936-e82245b0a3d4?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'People gathered for a community meeting',
  },
  {
    id: 'np8',
    name: 'Senior Wellness Project',
    tagline: 'Promoting health and well-being for seniors in San Mateo County.',
    description: 'Offers health and fitness classes, social programs, and mental wellness support for seniors, helping them maintain an proactive and engaged lifestyle. They also provide access to nutritional resources and transportation assistance to ensure comprehensive well-being.',
    location: 'San Mateo, CA',
    focusAreas: ['Health', 'Social Services', 'Community Engagement', 'Mental Health', 'Nutrition'],
    website: '#',
    budget: '$450,000 - $700,000',
    staffCount: 9,
    yearFounded: 2001,
    impactMetric: 'Served 800+ seniors with daily programs',
    imageUrl: 'https://images.unsplash.com/photo-1549429780-69255a0f6880?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'Seniors participating in a group activity',
  },
  {
    id: 'np9',
    name: 'Environmental Justice League',
    tagline: 'Fighting for environmental equity in disadvantaged communities.',
    description: 'Advocates for policies that reduce pollution and improve environmental health outcomes in frontline communities disproportionately affected by environmental hazards in the Bay Area. They conduct community-led research, organize advocacy campaigns, and provide legal support to ensure fair environmental practices and safeguard public health in vulnerable neighborhoods.',
    location: 'Richmond, CA',
    focusAreas: ['Environment', 'Advocacy', 'Social Equity', 'Community Health', 'Public Health', 'Pollution Reduction'],
    website: '#',
    budget: '$350,000 - $550,000',
    staffCount: 6,
    yearFounded: 2017,
    impactMetric: 'Successfully campaigned for 3 new environmental protection policies',
    imageUrl: 'https://images.unsplash.com/photo-1533038590-e52ad58b9029?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageAlt: 'Protest signs advocating for environmental justice',
  },
  {
    id: 'np10',
    name: 'Safe Haven Youth Shelter',
    tagline: 'Providing immediate safety and support for homeless youth.',
    description: 'Offers emergency shelter, trauma-informed counseling, and comprehensive case management services to homeless and runaway youth in Alameda County. Their holistic approach helps young individuals transition from crisis to stable housing, educational attainment, and independent living, fostering resilience and self-sufficiency for a brighter future.',
    location: 'Oakland, CA',
    focusAreas: ['Youth Development', 'Social Services', 'Housing', 'Homelessness', 'Mental Health', 'Crisis Intervention'],
    website: '#',
    budget: '$1.8M - $2.5M',
    staffCount: 20,
    yearFounded: 1990,
    impactMetric: 'Provided 15,000 nights of safe shelter last year',
    imageUrl: 'https://images.unsplash.com/photo-1506729584749-36171804ba79?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Re-using an image for now
    imageAlt: 'Shelter for youth',
  },
];