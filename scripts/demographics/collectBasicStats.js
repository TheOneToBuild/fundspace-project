// scripts/demographics/collectBasicStats.js
// Collects basic demographic data: population, median income, poverty rate

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

// Your existing Bay Area structure
const BAY_AREA_COUNTIES = {
    'alameda': { 
        name: 'Alameda County', 
        cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Alameda', 'San Leandro', 'Livermore', 'Pleasanton', 'Union City', 'Dublin', 'Newark', 'Albany', 'Emeryville', 'Piedmont']
    },
    'contra-costa': { 
        name: 'Contra Costa County', 
        cities: ['Concord', 'Richmond', 'Antioch', 'Walnut Creek', 'Pittsburg', 'San Ramon', 'Brentwood', 'Oakley', 'Martinez', 'Pleasant Hill', 'Danville', 'El Cerrito', 'Hercules', 'Pinole', 'Clayton', 'Orinda', 'Lafayette', 'Moraga', 'San Pablo']
    },
    'marin': { 
        name: 'Marin County', 
        cities: ['San Rafael', 'Novato', 'Mill Valley', 'Sausalito', 'Tiburon', 'Corte Madera', 'Larkspur', 'San Anselmo', 'Fairfax', 'Ross', 'Belvedere']
    },
    'napa': { 
        name: 'Napa County', 
        cities: ['Napa', 'American Canyon', 'St. Helena', 'Calistoga', 'Yountville']
    },
    'san-francisco': { 
        name: 'San Francisco County', 
        cities: ['San Francisco']
    },
    'san-mateo': { 
        name: 'San Mateo County', 
        cities: ['Redwood City', 'Daly City', 'San Mateo', 'Menlo Park', 'Burlingame', 'Foster City', 'San Bruno', 'Pacifica', 'Millbrae', 'San Carlos', 'Belmont', 'Half Moon Bay', 'Hillsborough', 'Atherton', 'Portola Valley', 'Woodside', 'Colma', 'Brisbane', 'East Palo Alto']
    },
    'santa-clara': { 
        name: 'Santa Clara County', 
        cities: ['San Jose', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara', 'Cupertino', 'Milpitas', 'Los Altos', 'Campbell', 'Saratoga', 'Los Gatos', 'Morgan Hill', 'Gilroy', 'Los Altos Hills', 'Monte Sereno']
    },
    'solano': { 
        name: 'Solano County', 
        cities: ['Vallejo', 'Fairfield', 'Vacaville', 'Suisun City', 'Benicia', 'Dixon', 'Rio Vista']
    },
    'sonoma': { 
        name: 'Sonoma County', 
        cities: ['Santa Rosa', 'Petaluma', 'Rohnert Park', 'Windsor', 'Healdsburg', 'Sebastopol', 'Cotati', 'Cloverdale', 'Sonoma']
    }
};

// Basic demographic variables
const BASIC_VARS = {
    totalPop: 'B01003_001E',           // Total population
    medianIncome: 'B19013_001E',       // Median household income
    povertyBelow: 'B17001_002E',       // Income below poverty level
    povertyTotal: 'B17001_001E',       // Total for poverty calculation
    medianAge: 'B01002_001E'           // Median age
};

// Helper function to make HTTPS requests
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

async function fetchBasicData(placeFips) {
    const variableString = Object.values(BASIC_VARS).join(',');
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variableString}&for=place:${placeFips}&in=state:06&key=${CENSUS_API_KEY}`;
    
    try {
        const data = await makeRequest(url);
        return data;
    } catch (error) {
        console.error('Error fetching basic data:', error.message);
        return null;
    }
}

async function getCityBasicData(cityName) {
    console.log(`  📊 Collecting basic stats for ${cityName}...`);
    
    try {
        // Get all places in California to find our city
        const placesUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:06&key=${CENSUS_API_KEY}`;
        const placesData = await makeRequest(placesUrl);
        
        // Find matching city
        const cityRow = placesData.find(row => {
            if (!row[0]) return false;
            const placeName = row[0].toLowerCase();
            const searchName = cityName.toLowerCase();
            
            return placeName.includes(`${searchName} city, california`) || 
                   placeName.includes(`${searchName} town, california`) ||
                   placeName === `${searchName}, california` ||
                   (placeName.startsWith(searchName) && placeName.includes('california'));
        });
        
        if (!cityRow) {
            console.log(`    ❌ City ${cityName} not found`);
            return null;
        }
        
        const placeFips = cityRow[2];
        console.log(`    ✅ Found ${cityName} (FIPS: ${placeFips})`);
        
        // Get basic demographic data
        const data = await fetchBasicData(placeFips);
        
        if (!data || data.length < 2) {
            console.log(`    ❌ No basic data found for ${cityName}`);
            return null;
        }
        
        const dataRow = data[1];
        const totalPop = parseInt(dataRow[1]) || 0;
        const medianIncome = parseInt(dataRow[2]) || 0;
        const povertyBelow = parseInt(dataRow[3]) || 0;
        const povertyTotal = parseInt(dataRow[4]) || 0;
        const medianAge = parseFloat(dataRow[5]) || 0;
        
        if (totalPop === 0) {
            console.log(`    ⚠️ ${cityName} has no population data`);
            return null;
        }
        
        const povertyRate = povertyTotal > 0 ? ((povertyBelow / povertyTotal) * 100).toFixed(1) : '0.0';
        
        console.log(`    ✅ ${cityName}: Pop=${totalPop.toLocaleString()}, Income=$${medianIncome.toLocaleString()}, Poverty=${povertyRate}%`);
        
        return {
            cityName,
            placeFips,
            population: totalPop,
            medianIncome: medianIncome,
            povertyRate: parseFloat(povertyRate),
            medianAge: medianAge,
            dataSource: 'US Census ACS 2022',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
    } catch (error) {
        console.error(`    ❌ Error getting basic data for ${cityName}:`, error.message);
        return null;
    }
}

async function collectCountyBasicData(countyKey, countyInfo) {
    console.log(`\n🔄 Collecting basic stats for ${countyInfo.name}...`);
    
    const basicData = {};
    let processedCount = 0;
    
    for (const cityName of countyInfo.cities) {
        try {
            processedCount++;
            console.log(`\n(${processedCount}/${countyInfo.cities.length}) Processing ${cityName}...`);
            
            const data = await getCityBasicData(cityName);
            if (data) {
                basicData[cityName] = data;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error processing ${cityName}:`, error.message);
        }
    }
    
    console.log(`\n✅ Collected basic data for ${Object.keys(basicData).length}/${countyInfo.cities.length} cities`);
    
    // Save to file
    const outputDir = path.join(__dirname, '../data/basicStats');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `${countyKey}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(basicData, null, 2));
    console.log(`💾 Saved to ${outputFile}`);
    
    return basicData;
}

async function main() {
    console.log('📊 Basic Demographics Collector');
    console.log('Collecting: Population, Median Income, Poverty Rate, Median Age\n');
    
    if (!CENSUS_API_KEY) {
        console.error('❌ CENSUS_API_KEY not found');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    // Process each county
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        try {
            await collectCountyBasicData(countyKey, countyInfo);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to process ${countyInfo.name}:`, error);
        }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n🎉 Basic demographics collection complete! (${duration} minutes)`);
    console.log('📁 Data saved to scripts/data/basicStats/');
}

if (require.main === module) {
    main().catch(console.error);
}