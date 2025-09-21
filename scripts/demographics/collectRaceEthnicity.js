// scripts/demographics/collectRaceEthnicity.js
// Collects race and ethnicity breakdown data (Table B03002)

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const BAY_AREA_COUNTIES = require('./counties.js');

// Race/Ethnicity variables (Table B03002)
const RACE_VARS = {
    total: 'B03002_001E',          // Total population
    white: 'B03002_003E',          // White alone, not Hispanic
    black: 'B03002_004E',          // Black or African American alone
    asian: 'B03002_006E',          // Asian alone
    nativeAmerican: 'B03002_005E', // American Indian and Alaska Native alone
    pacificIslander: 'B03002_007E', // Native Hawaiian and Other Pacific Islander alone
    other: 'B03002_008E',          // Some other race alone
    twoOrMore: 'B03002_009E',      // Two or more races
    hispanic: 'B03002_012E'        // Hispanic or Latino (of any race)
};

// California and US benchmarks for comparison
const BENCHMARKS = {
    california: {
        white: 36.5,
        asian: 15.7,
        hispanic: 39.4,
        black: 5.8,
        other: 2.6
    },
    usAverage: {
        white: 58.9,
        asian: 6.1,
        hispanic: 18.7,
        black: 12.4,
        other: 3.9
    }
};

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', reject);
    });
}

async function fetchRaceData(placeFips) {
    const variableString = Object.values(RACE_VARS).join(',');
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variableString}&for=place:${placeFips}&in=state:06&key=${CENSUS_API_KEY}`;
    
    try {
        const data = await makeRequest(url);
        return data;
    } catch (error) {
        console.error('Error fetching race data:', error.message);
        return null;
    }
}

async function getCityRaceData(cityName, placeFips) {
    console.log(`  📊 Collecting race/ethnicity data for ${cityName}...`);
    
    try {
        const data = await fetchRaceData(placeFips);
        
        if (!data || data.length < 2) {
            console.log(`    ❌ No race data found for ${cityName}`);
            return null;
        }
        
        const dataRow = data[1];
        const total = parseInt(dataRow[1]) || 0;
        const white = parseInt(dataRow[2]) || 0;
        const black = parseInt(dataRow[3]) || 0;
        const asian = parseInt(dataRow[4]) || 0;
        const nativeAmerican = parseInt(dataRow[5]) || 0;
        const pacificIslander = parseInt(dataRow[6]) || 0;
        const otherRace = parseInt(dataRow[7]) || 0;
        const twoOrMore = parseInt(dataRow[8]) || 0;
        const hispanic = parseInt(dataRow[9]) || 0;
        
        if (total === 0) {
            console.log(`    ⚠️ ${cityName} has no race/ethnicity data`);
            return null;
        }
        
        // Calculate "Other/Mixed" as combination of other categories
        const otherMixed = nativeAmerican + pacificIslander + otherRace + twoOrMore;
        
        // Calculate percentages and create breakdown
        const raceEthnicity = {
            'White': {
                local: ((white / total) * 100).toFixed(1),
                california: BENCHMARKS.california.white.toString(),
                usAverage: BENCHMARKS.usAverage.white.toString()
            },
            'Asian': {
                local: ((asian / total) * 100).toFixed(1),
                california: BENCHMARKS.california.asian.toString(),
                usAverage: BENCHMARKS.usAverage.asian.toString()
            },
            'Hispanic/Latino': {
                local: ((hispanic / total) * 100).toFixed(1),
                california: BENCHMARKS.california.hispanic.toString(),
                usAverage: BENCHMARKS.usAverage.hispanic.toString()
            },
            'Black/African American': {
                local: ((black / total) * 100).toFixed(1),
                california: BENCHMARKS.california.black.toString(),
                usAverage: BENCHMARKS.usAverage.black.toString()
            },
            'Other/Mixed': {
                local: ((otherMixed / total) * 100).toFixed(1),
                california: BENCHMARKS.california.other.toString(),
                usAverage: BENCHMARKS.usAverage.other.toString()
            }
        };
        
        console.log(`    ✅ ${cityName}: ${white}W, ${asian}A, ${hispanic}H, ${black}B, ${otherMixed}O (total: ${total})`);
        
        return {
            cityName,
            placeFips,
            totalPopulation: total,
            raceEthnicity,
            rawCounts: {
                white,
                asian,
                hispanic,
                black,
                nativeAmerican,
                pacificIslander,
                otherRace,
                twoOrMore,
                otherMixed
            },
            dataSource: 'US Census ACS 2022 Table B03002',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
    } catch (error) {
        console.error(`    ❌ Error getting race data for ${cityName}:`, error.message);
        return null;
    }
}

async function collectCountyRaceData(countyKey, countyInfo) {
    console.log(`\n🔄 Collecting race/ethnicity data for ${countyInfo.name}...`);
    
    // First, load basic data to get place FIPS codes
    const basicDataFile = path.join(__dirname, '../data/basicStats', `${countyKey}.json`);
    if (!fs.existsSync(basicDataFile)) {
        console.error(`❌ Basic data not found for ${countyKey}. Run collectBasicStats.js first.`);
        return {};
    }
    
    const basicData = JSON.parse(fs.readFileSync(basicDataFile, 'utf8'));
    const raceData = {};
    let processedCount = 0;
    
    for (const [cityName, basicInfo] of Object.entries(basicData)) {
        try {
            processedCount++;
            console.log(`\n(${processedCount}/${Object.keys(basicData).length}) Processing ${cityName}...`);
            
            const data = await getCityRaceData(cityName, basicInfo.placeFips);
            if (data) {
                raceData[cityName] = data;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error processing ${cityName}:`, error.message);
        }
    }
    
    console.log(`\n✅ Collected race data for ${Object.keys(raceData).length}/${Object.keys(basicData).length} cities`);
    
    // Save to file
    const outputDir = path.join(__dirname, '../data/raceEthnicity');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `${countyKey}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(raceData, null, 2));
    console.log(`💾 Saved to ${outputFile}`);
    
    return raceData;
}

async function main() {
    console.log('🌈 Race/Ethnicity Data Collector');
    console.log('Collecting: White, Asian, Hispanic/Latino, Black/African American, Other/Mixed\n');
    
    if (!CENSUS_API_KEY) {
        console.error('❌ CENSUS_API_KEY not found');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Process each county
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        try {
            await collectCountyRaceData(countyKey, countyInfo);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to process ${countyInfo.name}:`, error);
        }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n🎉 Race/ethnicity collection complete! (${duration} minutes)`);
    console.log('📁 Data saved to scripts/data/raceEthnicity/');
}

if (require.main === module) {
    main().catch(console.error);
}