// scripts/demographics/collectPovertyBreakdowns.js
// Collects poverty breakdown data by Age and Household Type

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const BAY_AREA_COUNTIES = require('./counties.js');

// 💡 TODO: Find the correct Census variables for these tables.
// These are educated guesses. You will need to verify them.
const POVERTY_VARS = {
    // Poverty by Age (Example from Table B17020)
    totalByAge: 'B17020_001E',
    under18BelowPoverty: 'B17020_002E',
    age18to64BelowPoverty: 'B17020_008E',
    age65plusBelowPoverty: 'B17020_014E',

    // Poverty by Household Type (Example from Table B17012)
    totalHouseholds: 'B17012_001E',
    singleParentBelowPoverty: 'B17012_009E', // Married couple is B17012_002E, so single parent is likely different
    twoParentBelowPoverty: 'B17012_002E',    // This might be for "Married-couple family"
    singleAdultBelowPoverty: 'B17012_014E'  // Nonfamily households
};

// Benchmarks for comparison
const BENCHMARKS = {
    age: {
        children: { ca: '14.8%', us: '16.2%' },
        working: { ca: '10.4%', us: '10.9%' },
        seniors: { ca: '11.6%', us: '9.5%' }
    },
    household: {
        singleParent: { ca: '26.4%', us: '28.7%' },
        twoParent: { ca: '8.9%', us: '7.8%' },
        singleAdult: { ca: '15.2%', us: '16.1%' }
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

async function fetchPovertyData(placeFips) {
    const variableString = Object.values(POVERTY_VARS).join(',');
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variableString}&for=place:${placeFips}&in=state:06&key=${CENSUS_API_KEY}`;
    
    try {
        const data = await makeRequest(url);
        return data;
    } catch (error) {
        console.error('Error fetching poverty data:', error.message);
        return null;
    }
}

async function getCityPovertyData(cityName, placeFips) {
    console.log(`  📊 Collecting poverty breakdowns for ${cityName}...`);
    
    try {
        const data = await fetchPovertyData(placeFips);
        
        if (!data || data.length < 2) {
            console.log(`    ❌ No poverty data found for ${cityName}`);
            return null;
        }
        
        const dataRow = data[1];
        const totalByAge = parseInt(dataRow[1]) || 0;
        const under18BelowPoverty = parseInt(dataRow[2]) || 0;
        const age18to64BelowPoverty = parseInt(dataRow[3]) || 0;
        const age65plusBelowPoverty = parseInt(dataRow[4]) || 0;
        
        const totalHouseholds = parseInt(dataRow[5]) || 0;
        const singleParentBelowPoverty = parseInt(dataRow[6]) || 0;
        const twoParentBelowPoverty = parseInt(dataRow[7]) || 0;
        const singleAdultBelowPoverty = parseInt(dataRow[8]) || 0;

        const povertyByAge = {
            'Children (Under 18)': {
                local: totalByAge > 0 ? `${((under18BelowPoverty / totalByAge) * 100).toFixed(1)}%` : '0.0%',
                california: BENCHMARKS.age.children.ca,
                usAverage: BENCHMARKS.age.children.us
            },
            'Working Age (18-64)': {
                local: totalByAge > 0 ? `${((age18to64BelowPoverty / totalByAge) * 100).toFixed(1)}%` : '0.0%',
                california: BENCHMARKS.age.working.ca,
                usAverage: BENCHMARKS.age.working.us
            },
            'Seniors (65+)': {
                local: totalByAge > 0 ? `${((age65plusBelowPoverty / totalByAge) * 100).toFixed(1)}%` : '0.0%',
                california: BENCHMARKS.age.seniors.ca,
                usAverage: BENCHMARKS.age.seniors.us
            }
        };

        const povertyByHousehold = {
            'Single Parent': {
                local: totalHouseholds > 0 ? `${((singleParentBelowPoverty / totalHouseholds) * 100).toFixed(1)}%` : '0.0%',
                california: BENCHMARKS.household.singleParent.ca,
                usAverage: BENCHMARKS.household.singleParent.us
            },
            'Two Parent': {
                local: totalHouseholds > 0 ? `${((twoParentBelowPoverty / totalHouseholds) * 100).toFixed(1)}%` : '0.0%',
                california: BENCHMARKS.household.twoParent.ca,
                usAverage: BENCHMARKS.household.twoParent.us
            },
            'Single Adult': {
                local: totalHouseholds > 0 ? `${((singleAdultBelowPoverty / totalHouseholds) * 100).toFixed(1)}%` : '0.0%',
                california: BENCHMARKS.household.singleAdult.ca,
                usAverage: BENCHMARKS.household.singleAdult.us
            }
        };
        
        console.log(`    ✅ ${cityName}: Poverty by age/household collected.`);
        
        return {
            cityName,
            placeFips,
            povertyByAge,
            povertyByHousehold
        };
        
    } catch (error) {
        console.error(`    ❌ Error getting poverty data for ${cityName}:`, error.message);
        return null;
    }
}

async function collectCountyPovertyData(countyKey, countyInfo) {
    console.log(`\n🔄 Collecting poverty breakdowns for ${countyInfo.name}...`);
    
    const basicDataFile = path.join(__dirname, '../data/basicStats', `${countyKey}.json`);
    if (!fs.existsSync(basicDataFile)) {
        console.error(`❌ Basic data not found for ${countyKey}. Run collectBasicStats.js first.`);
        return {};
    }
    
    const basicData = JSON.parse(fs.readFileSync(basicDataFile, 'utf8'));
    const povertyData = {};
    let processedCount = 0;
    
    for (const [cityName, basicInfo] of Object.entries(basicData)) {
        try {
            processedCount++;
            console.log(`\n(${processedCount}/${Object.keys(basicData).length}) Processing ${cityName}...`);
            
            const data = await getCityPovertyData(cityName, basicInfo.placeFips);
            if (data) {
                povertyData[cityName] = data;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error processing ${cityName}:`, error.message);
        }
    }
    
    console.log(`\n✅ Collected poverty data for ${Object.keys(povertyData).length}/${Object.keys(basicData).length} cities`);
    
    const outputDir = path.join(__dirname, '../data/povertyBreakdowns');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `${countyKey}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(povertyData, null, 2));
    console.log(`💾 Saved to ${outputFile}`);
    
    return povertyData;
}

async function main() {
    console.log('📉 Poverty Breakdowns Data Collector');
    
    if (!CENSUS_API_KEY) {
        console.error('❌ CENSUS_API_KEY not found');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        try {
            await collectCountyPovertyData(countyKey, countyInfo);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to process ${countyInfo.name}:`, error);
        }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n🎉 Poverty breakdowns collection complete! (${duration} minutes)`);
    console.log('📁 Data saved to scripts/data/povertyBreakdowns/');
}

if (require.main === module) {
    main().catch(console.error);
}