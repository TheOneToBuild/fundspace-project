import { alamedaCounty } from './alamedaCounty.js';
import { contraCostaCounty } from './contracostaCounty.js';
import { marinCounty } from './marinCounty.js';
import { napaCounty } from './napaCounty.js';
import { sanFranciscoCounty } from './sanfranciscoCounty.js';
import { sanMateoCounty } from './sanmateoCounty.js';
import { santaClaraCounty } from './santaclaraCounty.js';
import { solanoCounty } from './solanoCounty.js';
import { sonomaCounty } from './sonomaCounty.js';

function parseNumber(str) {
    if (typeof str !== 'string' && typeof str !== 'number') return 0;
    return parseFloat(String(str).replace(/[$,%]/g, '')) || 0;
}

function parsePopulation(popStr) {
    if (!popStr) return 0;
    return parseInt(String(popStr).replace(/,/g, ''), 10) || 0;
}

function processCityData(cityData) {
    if (!cityData || typeof cityData !== 'object') return cityData;
    
    let educationAttainment = 0;
    if (cityData.educationLevels) {
        const bachelors = parseNumber(cityData.educationLevels["Bachelor's Degree"]?.local);
        const graduate = parseNumber(cityData.educationLevels["Graduate Degree"]?.local);
        educationAttainment = bachelors + graduate;
    }

    return {
        ...cityData,
        educationAttainment: `${educationAttainment.toFixed(1)}%`
    };
}

function processCountyData(countyData) {
    if (!countyData) return {};
    const processedCities = {};
    for (const cityName in countyData) {
        processedCities[cityName] = processCityData(countyData[cityName]);
    }
    return processedCities;
}

function calculateCountyAggregate(countyData) {
    const cities = Object.values(countyData);
    if (cities.length === 0) return null;
    
    let totalPopulation = 0;
    let weightedIncome = 0;
    let weightedPoverty = 0;
    let weightedEducationAttainment = 0;
    
    cities.forEach(city => {
        const pop = parsePopulation(city.population);
        if (!isNaN(pop) && pop > 0) {
            totalPopulation += pop;
            weightedIncome += parseNumber(city.medianIncome) * pop;
            weightedPoverty += parseNumber(city.povertyRate) * pop;
            weightedEducationAttainment += parseNumber(city.educationAttainment) * pop;
        }
    });
    
    if (totalPopulation === 0) return null;

    const largestCity = cities.reduce((max, city) => 
        (parsePopulation(city.population) > parsePopulation(max.population) ? city : max), cities[0]
    );

    return {
        ...largestCity,
        population: totalPopulation.toLocaleString(),
        medianIncome: `$${Math.round(weightedIncome / totalPopulation).toLocaleString()}`,
        povertyRate: `${(weightedPoverty / totalPopulation).toFixed(1)}%`,
        educationAttainment: `${(weightedEducationAttainment / totalPopulation).toFixed(1)}%` 
    };
}

function calculateBayAreaAggregate(countyAggregates) {
    let totalPopulation = 0;
    let weightedIncome = 0;
    let weightedPoverty = 0;
    let weightedEducationAttainment = 0;

    const breakdowns = {
        raceEthnicity: {}, ageGroups: {}, educationLevels: {}, 
        povertyByAge: {}, povertyByHousehold: {} 
    };

    countyAggregates.forEach(county => {
        if (!county || !county.population) return;
        const pop = parsePopulation(county.population);
        totalPopulation += pop;
        
        weightedIncome += parseNumber(county.medianIncome) * pop;
        weightedPoverty += parseNumber(county.povertyRate) * pop;
        weightedEducationAttainment += parseNumber(county.educationAttainment) * pop;
        
        for (const category in breakdowns) {
            if (county[category]) {
                for (const [key, value] of Object.entries(county[category])) {
                    if (value && value.local) {
                        const numericValue = parseNumber(value.local);
                        breakdowns[category][key] = (breakdowns[category][key] || 0) + (numericValue * pop);
                    }
                }
            }
        }
    });

    const finalBreakdowns = {};
    const firstValidCounty = countyAggregates.find(c => c);
    for (const category in breakdowns) {
        finalBreakdowns[category] = {};
        for (const key in breakdowns[category]) {
            const template = firstValidCounty?.[category]?.[key];
            if (template) {
                const isCurrency = String(template.local).includes('$');
                const isPercentageBreakdown = ['raceEthnicity', 'ageGroups', 'educationLevels', 'povertyByAge', 'povertyByHousehold'].includes(category);
                let finalValue;

                if (isCurrency) {
                    finalValue = `$${Math.round(breakdowns[category][key] / totalPopulation).toLocaleString()}`;
                } else {
                    finalValue = (breakdowns[category][key] / totalPopulation).toFixed(1);
                    if (isPercentageBreakdown) finalValue += '%';
                }
                finalBreakdowns[category][key] = { ...template, local: finalValue };
            }
        }
    }
    
    return {
        population: `${(totalPopulation / 1000000).toFixed(1)}M`,
        medianIncome: `$${Math.round(weightedIncome / totalPopulation).toLocaleString()}`,
        povertyRate: `${(weightedPoverty / totalPopulation).toFixed(1)}%`,
        educationAttainment: `${(weightedEducationAttainment / totalPopulation).toFixed(1)}%`,
        ...finalBreakdowns
    };
}

const processedAlamedaCounty = processCountyData(alamedaCounty);
const processedContraCostaCounty = processCountyData(contraCostaCounty);
const processedMarinCounty = processCountyData(marinCounty);
const processedNapaCounty = processCountyData(napaCounty);
const processedSanFranciscoCounty = processCountyData(sanFranciscoCounty);
const processedSanMateoCounty = processCountyData(sanMateoCounty);
const processedSantaClaraCounty = processCountyData(santaClaraCounty);
const processedSolanoCounty = processCountyData(solanoCounty);
const processedSonomaCounty = processCountyData(sonomaCounty);

const allCountyAggregates = [
    calculateCountyAggregate(processedAlamedaCounty),
    calculateCountyAggregate(processedContraCostaCounty),
    calculateCountyAggregate(processedMarinCounty),
    calculateCountyAggregate(processedNapaCounty),
    calculateCountyAggregate(processedSanFranciscoCounty),
    calculateCountyAggregate(processedSanMateoCounty),
    calculateCountyAggregate(processedSantaClaraCounty),
    calculateCountyAggregate(processedSolanoCounty),
    calculateCountyAggregate(processedSonomaCounty)
];

const bayAreaAggregate = calculateBayAreaAggregate(allCountyAggregates.filter(Boolean));

export const DEMOGRAPHICS_DATA = {
    'bay-area': bayAreaAggregate,
    'alameda': allCountyAggregates[0],
    'contra-costa': allCountyAggregates[1],
    'marin': allCountyAggregates[2],
    'napa': allCountyAggregates[3],
    'san-francisco': allCountyAggregates[4],
    'san-mateo': allCountyAggregates[5],
    'santa-clara': allCountyAggregates[6],
    'solano': allCountyAggregates[7],
    'sonoma': allCountyAggregates[8],
    ...processedAlamedaCounty, 
    ...processedContraCostaCounty, 
    ...processedMarinCounty, 
    ...processedNapaCounty, 
    ...processedSanFranciscoCounty, 
    ...processedSanMateoCounty, 
    ...processedSantaClaraCounty, 
    ...processedSolanoCounty, 
    ...processedSonomaCounty
};