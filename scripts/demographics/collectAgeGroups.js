// scripts/demographics/collectAgeGroups.js
// Collects age distribution data (Table B01001)

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const BAY_AREA_COUNTIES = require('./counties.js');

// Age variables (Table B01001 - Sex by Age)
const AGE_VARS = {
    total: 'B01001_001E',
    // Male age groups
    maleUnder5: 'B01001_003E',
    male5to9: 'B01001_004E',
    male10to14: 'B01001_005E',
    male15to17: 'B01001_006E',
    male18to19: 'B01001_007E',
    male20to24: 'B01001_008E',
    male25to29: 'B01001_009E',
    male30to34: 'B01001_010E',
    male35to39: 'B01001_011E',
    male40to44: 'B01001_012E',
    male45to49: 'B01001_013E',
    male50to54: 'B01001_014E',
    male55to59: 'B01001_015E',
    male60to64: 'B01001_016E',
    male65to69: 'B01001_017E',
    male70to74: 'B01001_018E',
    male75to79: 'B01001_019E',
    male80to84: 'B01001_020E',
    male85plus: 'B01001_025E',
    
    // Female age groups
    femaleUnder5: 'B01001_027E',
    female5to9: 'B01001_028E',
    female10to14: 'B01001_029E',
    female15to17: 'B01001_030E',
    female18to19: 'B01001_031E',
    female20to24: 'B01001_032E',
    female25to29: 'B01001_033E',
    female30to34: 'B01001_034E',
    female35to39: 'B01001_035E',
    female40to44: 'B01001_036E',
    female45to49: 'B01001_037E',
    female50to54: 'B01001_038E',
    female55to59: 'B01001_039E',
    female60to64: 'B01001_040E',
    female65to69: 'B01001_041E',
    female70to74: 'B01001_042E',
    female75to79: 'B01001_043E',
    female80to84: 'B01001_044E',
    female85plus: 'B01001_049E'
};

// Benchmarks for comparison
const BENCHMARKS = {
    california: {
        under18: 22.5,
        age18to34: 25.1,
        age35to54: 26.8,
        age55to64: 13.4,
        age65plus: 12.2
    },
    usAverage: {
        under18: 22.2,
        age18to34: 23.2,
        age35to54: 25.8,
        age55to64: 14.2,
        age65plus: 14.6
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

async function fetchAgeData(placeFips) {
    const variableString = Object.values(AGE_VARS).join(',');
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variableString}&for=place:${placeFips}&in=state:06&key=${CENSUS_API_KEY}`;
    
    try {
        const data = await makeRequest(url);
        return data;
    } catch (error) {
        console.error('Error fetching age data:', error.message);
        return null;
    }
}

async function getCityAgeData(cityName, placeFips) {
    console.log(`  📊 Collecting age group data for ${cityName}...`);
    
    try {
        const data = await fetchAgeData(placeFips);
        
        if (!data || data.length < 2) {
            console.log(`    ❌ No age data found for ${cityName}`);
            return null;
        }
        
        const dataRow = data[1];
        const total = parseInt(dataRow[1]) || 0;
        
        if (total === 0) {
            console.log(`    ⚠️ ${cityName} has no age data`);
            return null;
        }
        
        // Extract and sum age groups
        const ages = {};
        Object.keys(AGE_VARS).forEach((key, index) => {
            ages[key] = parseInt(dataRow[index + 2]) || 0; // Skip NAME and total
        });
        
        // Calculate age group totals
        const under18 = ages.maleUnder5 + ages.male5to9 + ages.male10to14 + ages.male15to17 +
                       ages.femaleUnder5 + ages.female5to9 + ages.female10to14 + ages.female15to17;
        
        const age18to34 = ages.male18to19 + ages.male20to24 + ages.male25to29 + ages.male30to34 +
                         ages.female18to19 + ages.female20to24 + ages.female25to29 + ages.female30to34;
        
        const age35to54 = ages.male35to39 + ages.male40to44 + ages.male45to49 + ages.male50to54 +
                         ages.female35to39 + ages.female40to44 + ages.female45to49 + ages.female50to54;
        
        const age55to64 = ages.male55to59 + ages.male60to64 +
                         ages.female55to59 + ages.female60to64;
        
        const age65plus = ages.male65to69 + ages.male70to74 + ages.male75to79 + ages.male80to84 + ages.male85plus +
                         ages.female65to69 + ages.female70to74 + ages.female75to79 + ages.female80to84 + ages.female85plus;
        
        // Create age groups breakdown with comparisons
        const ageGroups = {
            'Under 18': {
                local: ((under18 / total) * 100).toFixed(1),
                california: BENCHMARKS.california.under18.toString(),
                usAverage: BENCHMARKS.usAverage.under18.toString()
            },
            '18-34': {
                local: ((age18to34 / total) * 100).toFixed(1),
                california: BENCHMARKS.california.age18to34.toString(),
                usAverage: BENCHMARKS.usAverage.age18to34.toString()
            },
            '35-54': {
                local: ((age35to54 / total) * 100).toFixed(1),
                california: BENCHMARKS.california.age35to54.toString(),
                usAverage: BENCHMARKS.usAverage.age35to54.toString()
            },
            '55-64': {
                local: ((age55to64 / total) * 100).toFixed(1),
                california: BENCHMARKS.california.age55to64.toString(),
                usAverage: BENCHMARKS.usAverage.age55to64.toString()
            },
            '65+': {
                local: ((age65plus / total) * 100).toFixed(1),
                california: BENCHMARKS.california.age65plus.toString(),
                usAverage: BENCHMARKS.usAverage.age65plus.toString()
            }
        };
        
        console.log(`    ✅ ${cityName}: <18=${under18}, 18-34=${age18to34}, 35-54=${age35to54}, 55-64=${age55to64}, 65+=${age65plus}`);
        
        return {
            cityName,
            placeFips,
            totalPopulation: total,
            ageGroups,
            rawCounts: {
                under18,
                age18to34,
                age35to54,
                age55to64,
                age65plus
            },
            dataSource: 'US Census ACS 2022 Table B01001',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
    } catch (error) {
        console.error(`    ❌ Error getting age data for ${cityName}:`, error.message);
        return null;
    }
}

async function collectCountyAgeData(countyKey, countyInfo) {
    console.log(`\n🔄 Collecting age group data for ${countyInfo.name}...`);
    
    // Load basic data to get place FIPS codes
    const basicDataFile = path.join(__dirname, '../data/basicStats', `${countyKey}.json`);
    if (!fs.existsSync(basicDataFile)) {
        console.error(`❌ Basic data not found for ${countyKey}. Run collectBasicStats.js first.`);
        return {};
    }
    
    const basicData = JSON.parse(fs.readFileSync(basicDataFile, 'utf8'));
    const ageData = {};
    let processedCount = 0;
    
    for (const [cityName, basicInfo] of Object.entries(basicData)) {
        try {
            processedCount++;
            console.log(`\n(${processedCount}/${Object.keys(basicData).length}) Processing ${cityName}...`);
            
            const data = await getCityAgeData(cityName, basicInfo.placeFips);
            if (data) {
                ageData[cityName] = data;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error processing ${cityName}:`, error.message);
        }
    }
    
    console.log(`\n✅ Collected age data for ${Object.keys(ageData).length}/${Object.keys(basicData).length} cities`);
    
    // Save to file
    const outputDir = path.join(__dirname, '../data/ageGroups');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `${countyKey}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(ageData, null, 2));
    console.log(`💾 Saved to ${outputFile}`);
    
    return ageData;
}

async function main() {
    console.log('👨‍👩‍👧‍👦 Age Groups Data Collector');
    console.log('Collecting: Under 18, 18-34, 35-54, 55-64, 65+\n');
    
    if (!CENSUS_API_KEY) {
        console.error('❌ CENSUS_API_KEY not found');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Process each county
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        try {
            await collectCountyAgeData(countyKey, countyInfo);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to process ${countyInfo.name}:`, error);
        }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n🎉 Age groups collection complete! (${duration} minutes)`);
    console.log('📁 Data saved to scripts/data/ageGroups/');
}

if (require.main === module) {
    main().catch(console.error);
}