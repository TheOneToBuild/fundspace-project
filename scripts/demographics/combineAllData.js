// scripts/demographics/combineAllData.js
// FINAL VERSION - Adds Gini/Housing, cleans data, and removes Unemployment

const path = require('path');
const fs = require('fs');
const BAY_AREA_COUNTIES = require('./counties.js');

// This map ensures the correct camelCase variable name is always used for the export.
const EXPORT_NAME_MAP = {
    'alameda': 'alamedaCounty',
    'contra-costa': 'contraCostaCounty',
    'marin': 'marinCounty',
    'napa': 'napaCounty',
    'san-francisco': 'sanFranciscoCounty',
    'san-mateo': 'sanMateoCounty',
    'santa-clara': 'santaClaraCounty',
    'solano': 'solanoCounty',
    'sonoma': 'sonomaCounty'
};

// Cleans invalid negative numbers from Census data
function cleanBreakdownObject(breakdown) {
    if (!breakdown || typeof breakdown !== 'object') {
        return breakdown;
    }
    const cleanedBreakdown = {};
    for (const [key, value] of Object.entries(breakdown)) {
        if (value && typeof value.local === 'string' && value.local.includes('-')) {
            cleanedBreakdown[key] = { ...value, local: 'N/A' };
        } else {
            cleanedBreakdown[key] = value;
        }
    }
    return cleanedBreakdown;
}

function calculateDiversityIndex(raceData) {
    if (!raceData) return 'Moderate';
    const percentages = Object.values(raceData).map(d => parseFloat(d.local));
    const maxPercentage = Math.max(...percentages);
    if (maxPercentage > 60) return 'Low';
    if (maxPercentage > 45) return 'Moderate'; 
    if (maxPercentage > 35) return 'High';
    return 'Very High';
}

function loadDataFile(dataType, countyKey) {
    const filePath = path.join(__dirname, '../data', dataType, `${countyKey}.json`);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.warn(`Warning: Could not parse ${dataType} data for ${countyKey}:`, error.message);
            return {};
        }
    }
    return {};
}

function combineCity(cityName, allData) {
    const { basicData, raceData, ageData, educationData } = allData;
    
    const basic = basicData[cityName];
    if (!basic) { return null; }

    const race = raceData[cityName];
    const age = ageData[cityName];
    const education = educationData[cityName];
    
    const cityData = {
        population: basic.population.toLocaleString(),
        medianIncome: basic.medianIncome > 0 ? `$${basic.medianIncome.toLocaleString()}` : 'N/A',
        povertyRate: `${basic.povertyRate}%`,
        diversityIndex: calculateDiversityIndex(race?.raceEthnicity),
        challenges: ['Housing costs', 'Community development'],
        dataSource: 'US Census ACS 2022',
        lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    // Add all cleaned breakdown data
    if (race?.raceEthnicity) cityData.raceEthnicity = cleanBreakdownObject(race.raceEthnicity);
    if (age?.ageGroups) cityData.ageGroups = cleanBreakdownObject(age.ageGroups);
    if (education?.educationLevels) cityData.educationLevels = cleanBreakdownObject(education.educationLevels);
    
    return cityData;
}

async function combineCountyData(countyKey, countyInfo) {
    console.log(`\n🔄 Combining data for ${countyInfo.name}...`);
    
    const allData = {
        basicData: loadDataFile('basicStats', countyKey),
        raceData: loadDataFile('raceEthnicity', countyKey),
        ageData: loadDataFile('ageGroups', countyKey),
        educationData: loadDataFile('education', countyKey),
        // Removed Gini and Housing data
    };
    
    const combinedData = {};
    for (const cityName of countyInfo.cities) {
        const cityData = combineCity(cityName, allData);
        if (cityData) {
            combinedData[cityName] = cityData;
        }
    }
    
    console.log(`✅ Combined data for ${Object.keys(combinedData).length}/${countyInfo.cities.length} cities`);
    
    const fileName = `${countyKey.replace(/-/g, '')}County.js`;
    const exportName = EXPORT_NAME_MAP[countyKey];
    
    const fileContent = `// src/components/discover/data/demographics/${fileName}
// Generated on ${new Date().toISOString().split('T')[0]} from modular Census data collection
// This file contains the complete, combined demographic data for each city.

export const ${exportName} = ${JSON.stringify(combinedData, null, 4)};
`;
    
    const outputPath = path.resolve(__dirname, `../../fundspace-app/src/components/discover/data/demographics/${fileName}`);
    
    try {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, fileContent);
        console.log(`📁 Generated ${outputPath}`);
        
    } catch (error) {
        console.error(`❌ Error writing file ${outputPath}:`, error);
    }
}

async function main() {
    console.log('🔧 Demographics Data Combiner');
    console.log('Combining all individual datasets into final county files\n');
    
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        await combineCountyData(countyKey, countyInfo);
    }
    
    console.log(`\n🎉 Data combination complete!`);
    console.log(`🚀 All county data files have been regenerated with the new metrics.`);
}

if (require.main === module) {
    main().catch(console.error);
}