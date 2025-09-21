// scripts/demographics/collectEducation.js
// Collects education level data (Table B15003)

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const BAY_AREA_COUNTIES = require('./counties.js');

// Education variables (Table B15003 - Educational Attainment for Population 25+)
const EDUCATION_VARS = {
    total: 'B15003_001E',                    // Total population 25+
    noSchool: 'B15003_002E',                 // No schooling completed
    nursery: 'B15003_003E',                  // Nursery school
    kindergarten: 'B15003_004E',             // Kindergarten
    grade1: 'B15003_005E',                   // 1st grade
    grade2: 'B15003_006E',                   // 2nd grade
    grade3: 'B15003_007E',                   // 3rd grade
    grade4: 'B15003_008E',                   // 4th grade
    grade5: 'B15003_009E',                   // 5th grade
    grade6: 'B15003_010E',                   // 6th grade
    grade7: 'B15003_011E',                   // 7th grade
    grade8: 'B15003_012E',                   // 8th grade
    grade9: 'B15003_013E',                   // 9th grade
    grade10: 'B15003_014E',                  // 10th grade
    grade11: 'B15003_015E',                  // 11th grade
    grade12: 'B15003_016E',                  // 12th grade, no diploma
    hsGraduate: 'B15003_017E',              // High school graduate
    ged: 'B15003_018E',                     // GED or alternative credential
    someCollege1: 'B15003_019E',            // Some college, less than 1 year
    someCollege: 'B15003_020E',             // Some college, 1+ years, no degree
    associates: 'B15003_021E',              // Associate's degree
    bachelors: 'B15003_022E',               // Bachelor's degree
    masters: 'B15003_023E',                 // Master's degree
    professional: 'B15003_024E',            // Professional degree
    doctorate: 'B15003_025E'                // Doctorate degree
};

// Benchmarks for comparison
const BENCHMARKS = {
    california: {
        lessThanHS: 15.4,
        hsGraduate: 20.1,
        someCollege: 29.4,
        bachelors: 22.5,
        graduate: 12.6
    },
    usAverage: {
        lessThanHS: 11.8,
        hsGraduate: 27.9,
        someCollege: 28.8,
        bachelors: 20.3,
        graduate: 11.2
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

async function fetchEducationData(placeFips) {
    const variableString = Object.values(EDUCATION_VARS).join(',');
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variableString}&for=place:${placeFips}&in=state:06&key=${CENSUS_API_KEY}`;
    
    try {
        const data = await makeRequest(url);
        return data;
    } catch (error) {
        console.error('Error fetching education data:', error.message);
        return null;
    }
}

async function getCityEducationData(cityName, placeFips) {
    console.log(`  📊 Collecting education data for ${cityName}...`);
    
    try {
        const data = await fetchEducationData(placeFips);
        
        if (!data || data.length < 2) {
            console.log(`    ❌ No education data found for ${cityName}`);
            return null;
        }
        
        const dataRow = data[1];
        const total = parseInt(dataRow[1]) || 0;
        
        if (total === 0) {
            console.log(`    ⚠️ ${cityName} has no education data`);
            return null;
        }
        
        // Extract individual education levels
        const educ = {};
        Object.keys(EDUCATION_VARS).forEach((key, index) => {
            educ[key] = parseInt(dataRow[index + 2]) || 0;
        });
        
        // Group education levels
        const lessThanHS = educ.noSchool + educ.nursery + educ.kindergarten + 
                          educ.grade1 + educ.grade2 + educ.grade3 + educ.grade4 + 
                          educ.grade5 + educ.grade6 + educ.grade7 + educ.grade8 + 
                          educ.grade9 + educ.grade10 + educ.grade11 + educ.grade12;
        
        const hsGraduate = educ.hsGraduate + educ.ged;
        const someCollege = educ.someCollege1 + educ.someCollege + educ.associates;
        const bachelors = educ.bachelors;
        const graduate = educ.masters + educ.professional + educ.doctorate;
        
        // Create education breakdown with comparisons
        const educationLevels = {
            'Less than High School': {
                local: ((lessThanHS / total) * 100).toFixed(1),
                california: BENCHMARKS.california.lessThanHS.toString(),
                usAverage: BENCHMARKS.usAverage.lessThanHS.toString()
            },
            'High School Graduate': {
                local: ((hsGraduate / total) * 100).toFixed(1),
                california: BENCHMARKS.california.hsGraduate.toString(),
                usAverage: BENCHMARKS.usAverage.hsGraduate.toString()
            },
            'Some College': {
                local: ((someCollege / total) * 100).toFixed(1),
                california: BENCHMARKS.california.someCollege.toString(),
                usAverage: BENCHMARKS.usAverage.someCollege.toString()
            },
            'Bachelor\'s Degree': {
                local: ((bachelors / total) * 100).toFixed(1),
                california: BENCHMARKS.california.bachelors.toString(),
                usAverage: BENCHMARKS.usAverage.bachelors.toString()
            },
            'Graduate Degree': {
                local: ((graduate / total) * 100).toFixed(1),
                california: BENCHMARKS.california.graduate.toString(),
                usAverage: BENCHMARKS.usAverage.graduate.toString()
            }
        };
        
        console.log(`    ✅ ${cityName}: <HS=${lessThanHS}, HS=${hsGraduate}, Some=${someCollege}, BA=${bachelors}, Grad=${graduate}`);
        
        return {
            cityName,
            placeFips,
            totalPopulation25Plus: total,
            educationLevels,
            rawCounts: {
                lessThanHS,
                hsGraduate,
                someCollege,
                bachelors,
                graduate
            },
            dataSource: 'US Census ACS 2022 Table B15003',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
    } catch (error) {
        console.error(`    ❌ Error getting education data for ${cityName}:`, error.message);
        return null;
    }
}

async function collectCountyEducationData(countyKey, countyInfo) {
    console.log(`\n🔄 Collecting education data for ${countyInfo.name}...`);
    
    // Load basic data to get place FIPS codes
    const basicDataFile = path.join(__dirname, '../data/basicStats', `${countyKey}.json`);
    if (!fs.existsSync(basicDataFile)) {
        console.error(`❌ Basic data not found for ${countyKey}. Run collectBasicStats.js first.`);
        return {};
    }
    
    const basicData = JSON.parse(fs.readFileSync(basicDataFile, 'utf8'));
    const educationData = {};
    let processedCount = 0;
    
    for (const [cityName, basicInfo] of Object.entries(basicData)) {
        try {
            processedCount++;
            console.log(`\n(${processedCount}/${Object.keys(basicData).length}) Processing ${cityName}...`);
            
            const data = await getCityEducationData(cityName, basicInfo.placeFips);
            if (data) {
                educationData[cityName] = data;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error processing ${cityName}:`, error.message);
        }
    }
    
    console.log(`\n✅ Collected education data for ${Object.keys(educationData).length}/${Object.keys(basicData).length} cities`);
    
    // Save to file
    const outputDir = path.join(__dirname, '../data/education');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `${countyKey}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(educationData, null, 2));
    console.log(`💾 Saved to ${outputFile}`);
    
    return educationData;
}

async function main() {
    console.log('🎓 Education Data Collector');
    console.log('Collecting: Less than HS, HS Graduate, Some College, Bachelor\'s, Graduate Degree\n');
    
    if (!CENSUS_API_KEY) {
        console.error('❌ CENSUS_API_KEY not found');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Process each county
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        try {
            await collectCountyEducationData(countyKey, countyInfo);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to process ${countyInfo.name}:`, error);
        }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n🎉 Education data collection complete! (${duration} minutes)`);
    console.log('📁 Data saved to scripts/data/education/');
}

if (require.main === module) {
    main().catch(console.error);
}