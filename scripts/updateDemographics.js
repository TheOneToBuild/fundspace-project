const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

const BAY_AREA_COUNTIES = {
    'alameda': { 
        name: 'Alameda County', 
        fips: '001',
        cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Alameda', 'San Leandro', 'Livermore', 'Pleasanton', 'Union City', 'Dublin', 'Newark', 'Albany', 'Emeryville', 'Piedmont']
    },
    'contra-costa': { 
        name: 'Contra Costa County', 
        fips: '013',
        cities: ['Concord', 'Richmond', 'Antioch', 'Walnut Creek', 'Pittsburg', 'San Ramon', 'Brentwood', 'Oakley', 'Martinez', 'Pleasant Hill', 'Danville', 'El Cerrito', 'Hercules', 'Pinole', 'Clayton', 'Orinda', 'Lafayette', 'Moraga', 'San Pablo']
    },
    'marin': { 
        name: 'Marin County', 
        fips: '041',
        cities: ['San Rafael', 'Novato', 'Mill Valley', 'Sausalito', 'Tiburon', 'Corte Madera', 'Larkspur', 'San Anselmo', 'Fairfax', 'Ross', 'Belvedere']
    },
    'napa': { 
        name: 'Napa County', 
        fips: '055',
        cities: ['Napa', 'American Canyon', 'St. Helena', 'Calistoga', 'Yountville']
    },
    'san-francisco': { 
        name: 'San Francisco County', 
        fips: '075',
        cities: ['San Francisco']
    },
    'san-mateo': { 
        name: 'San Mateo County', 
        fips: '081',
        cities: ['Redwood City', 'Daly City', 'San Mateo', 'Menlo Park', 'Burlingame', 'Foster City', 'San Bruno', 'Pacifica', 'Millbrae', 'San Carlos', 'Belmont', 'Half Moon Bay', 'Hillsborough', 'Atherton', 'Portola Valley', 'Woodside', 'Colma', 'Brisbane', 'East Palo Alto']
    },
    'santa-clara': { 
        name: 'Santa Clara County', 
        fips: '085',
        cities: ['San Jose', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara', 'Cupertino', 'Milpitas', 'Los Altos', 'Campbell', 'Saratoga', 'Los Gatos', 'Morgan Hill', 'Gilroy', 'Los Altos Hills', 'Monte Sereno']
    },
    'solano': { 
        name: 'Solano County', 
        fips: '095',
        cities: ['Vallejo', 'Fairfield', 'Vacaville', 'Suisun City', 'Benicia', 'Dixon', 'Rio Vista']
    },
    'sonoma': { 
        name: 'Sonoma County', 
        fips: '097',
        cities: ['Santa Rosa', 'Petaluma', 'Rohnert Park', 'Windsor', 'Healdsburg', 'Sebastopol', 'Cotati', 'Cloverdale', 'Sonoma']
    }
};

const CENSUS_VARS = {
    totalPop: 'B01003_001E', medianIncome: 'B19013_001E', povertyBelow: 'B17001_002E', povertyTotal: 'B17001_001E',
    raceTotal: 'B03002_001E', raceWhite: 'B03002_003E', raceBlack: 'B03002_004E', raceAsian: 'B03002_006E',
    raceNative: 'B03002_005E', racePacific: 'B03002_007E', raceOther: 'B03002_008E', raceTwoPlus: 'B03002_009E',
    raceHispanic: 'B03002_012E', ageTotal: 'B01001_001E',
    ageUnder18Male: 'B01001_003E,B01001_004E,B01001_005E,B01001_006E', age18to34Male: 'B01001_007E,B01001_008E,B01001_009E,B01001_010E',
    age35to54Male: 'B01001_011E,B01001_012E,B01001_013E,B01001_014E', age55to64Male: 'B01001_015E,B01001_016E',
    age65plusMale: 'B01001_017E,B01001_018E,B01001_019E,B01001_020E,B01001_021E,B01001_022E,B01001_023E,B01001_024E,B01001_025E',
    ageUnder18Female: 'B01001_027E,B01001_028E,B01001_029E,B01001_030E', age18to34Female: 'B01001_031E,B01001_032E,B01001_033E,B01001_034E',
    age35to54Female: 'B01001_035E,B01001_036E,B01001_037E,B01001_038E', age55to64Female: 'B01001_039E,B01001_040E',
    age65plusFemale: 'B01001_041E,B01001_042E,B01001_043E,B01001_044E,B01001_045E,B01001_046E,B01001_047E,B01001_048E,B01001_049E',
    educTotal: 'B15003_001E', educLessThanHS: 'B15003_002E,B15003_003E,B15003_004E,B15003_005E,B15003_006E,B15003_007E,B15003_008E,B15003_009E,B15003_010E,B15003_011E,B15003_012E,B15003_013E,B15003_014E,B15003_015E,B15003_016E',
    educHSDiploma: 'B15003_017E,B15003_018E', educSomeCollege: 'B15003_019E,B15003_020E,B15003_021E',
    educBachelors: 'B15003_022E', educGraduate: 'B15003_023E,B15003_024E,B15003_025E'
};

const BENCHMARKS = {
    california: {
        race: { white: 36.5, asian: 15.7, hispanic: 39.4, black: 5.8, other: 2.6 },
        age: { under18: 22.5, age18to34: 25.1, age35to54: 26.8, age55to64: 13.4, age65plus: 12.2 },
        educ: { lessThanHS: 15.4, hsGraduate: 20.1, someCollege: 29.4, bachelors: 22.5, graduate: 12.6 }
    },
    usAverage: {
        race: { white: 58.9, asian: 6.1, hispanic: 18.7, black: 12.4, other: 3.9 },
        age: { under18: 22.2, age18to34: 23.2, age35to54: 25.8, age55to64: 14.2, age65plus: 14.6 },
        educ: { lessThanHS: 11.8, hsGraduate: 27.9, someCollege: 28.8, bachelors: 20.3, graduate: 11.2 }
    }
};

const EXPORT_NAME_MAP = {
    'alameda': 'alamedaCounty', 'contra-costa': 'contraCostaCounty', 'marin': 'marinCounty',
    'napa': 'napaCounty', 'san-francisco': 'sanFranciscoCounty', 'san-mateo': 'sanMateoCounty',
    'santa-clara': 'santaClaraCounty', 'solano': 'solanoCounty', 'sonoma': 'sonomaCounty'
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

function processCityData(data, cityName, placeFips) {
    const [name, ...values] = data;
    const valueMap = {};
    const censusKeys = Object.keys(CENSUS_VARS);
    const censusValues = Object.values(CENSUS_VARS);

    values.forEach((val, i) => {
        const key = censusKeys[i];
        if (censusValues[i].includes(',')) {
            const parts = censusValues[i].split(',');
            if (valueMap[key] === undefined) valueMap[key] = 0;
            valueMap[key] += parseInt(val) || 0;
        } else {
            valueMap[key] = parseInt(val) || 0;
        }
    });

    const totalPop = valueMap.totalPop;
    if (totalPop === 0) return null;

    const raceTotal = valueMap.raceTotal || totalPop;
    const raceEthnicity = {
        'White': { local: ((valueMap.raceWhite / raceTotal) * 100).toFixed(1), california: BENCHMARKS.california.race.white.toString(), usAverage: BENCHMARKS.usAverage.race.white.toString() },
        'Asian': { local: ((valueMap.raceAsian / raceTotal) * 100).toFixed(1), california: BENCHMARKS.california.race.asian.toString(), usAverage: BENCHMARKS.usAverage.race.asian.toString() },
        'Hispanic/Latino': { local: ((valueMap.raceHispanic / raceTotal) * 100).toFixed(1), california: BENCHMARKS.california.race.hispanic.toString(), usAverage: BENCHMARKS.usAverage.race.hispanic.toString() },
        'Black/African American': { local: ((valueMap.raceBlack / raceTotal) * 100).toFixed(1), california: BENCHMARKS.california.race.black.toString(), usAverage: BENCHMARKS.usAverage.race.black.toString() },
        'Other/Mixed': { local: (((valueMap.raceNative + valueMap.racePacific + valueMap.raceOther + valueMap.raceTwoPlus) / raceTotal) * 100).toFixed(1), california: BENCHMARKS.california.race.other.toString(), usAverage: BENCHMARKS.usAverage.race.other.toString() }
    };

    const ageTotal = valueMap.ageTotal || totalPop;
    const ageGroups = {
        'Under 18': { local: (((valueMap.ageUnder18Male + valueMap.ageUnder18Female) / ageTotal) * 100).toFixed(1), california: BENCHMARKS.california.age.under18.toString(), usAverage: BENCHMARKS.usAverage.age.under18.toString() },
        '18-34': { local: (((valueMap.age18to34Male + valueMap.age18to34Female) / ageTotal) * 100).toFixed(1), california: BENCHMARKS.california.age.age18to34.toString(), usAverage: BENCHMARKS.usAverage.age.age18to34.toString() },
        '35-54': { local: (((valueMap.age35to54Male + valueMap.age35to54Female) / ageTotal) * 100).toFixed(1), california: BENCHMARKS.california.age.age35to54.toString(), usAverage: BENCHMARKS.usAverage.age.age35to54.toString() },
        '55-64': { local: (((valueMap.age55to64Male + valueMap.age55to64Female) / ageTotal) * 100).toFixed(1), california: BENCHMARKS.california.age.age55to64.toString(), usAverage: BENCHMARKS.usAverage.age.age55to64.toString() },
        '65+': { local: (((valueMap.age65plusMale + valueMap.age65plusFemale) / ageTotal) * 100).toFixed(1), california: BENCHMARKS.california.age.age65plus.toString(), usAverage: BENCHMARKS.usAverage.age.age65plus.toString() }
    };

    const educTotal = valueMap.educTotal || totalPop;
    const educationLevels = {
        'Less than High School': { local: ((valueMap.educLessThanHS / educTotal) * 100).toFixed(1), california: BENCHMARKS.california.educ.lessThanHS.toString(), usAverage: BENCHMARKS.usAverage.educ.lessThanHS.toString() },
        'High School Graduate': { local: ((valueMap.educHSDiploma / educTotal) * 100).toFixed(1), california: BENCHMARKS.california.educ.hsGraduate.toString(), usAverage: BENCHMARKS.usAverage.educ.hsGraduate.toString() },
        'Some College': { local: ((valueMap.educSomeCollege / educTotal) * 100).toFixed(1), california: BENCHMARKS.california.educ.someCollege.toString(), usAverage: BENCHMARKS.usAverage.educ.someCollege.toString() },
        'Bachelor\'s Degree': { local: ((valueMap.educBachelors / educTotal) * 100).toFixed(1), california: BENCHMARKS.california.educ.bachelors.toString(), usAverage: BENCHMARKS.usAverage.educ.bachelors.toString() },
        'Graduate Degree': { local: ((valueMap.educGraduate / educTotal) * 100).toFixed(1), california: BENCHMARKS.california.educ.graduate.toString(), usAverage: BENCHMARKS.usAverage.educ.graduate.toString() }
    };

    return {
        population: totalPop.toLocaleString(),
        medianIncome: valueMap.medianIncome > 0 ? `$${valueMap.medianIncome.toLocaleString()}` : 'N/A',
        povertyRate: valueMap.povertyTotal > 0 ? `${((valueMap.povertyBelow / valueMap.povertyTotal) * 100).toFixed(1)}%` : '0.0%',
        diversityIndex: calculateDiversityIndex(raceEthnicity),
        challenges: ['Housing costs', 'Community development'],
        raceEthnicity,
        ageGroups,
        educationLevels,
        dataSource: 'US Census ACS 2022',
        lastUpdated: new Date().toISOString().split('T')[0]
    };
}

function calculateDiversityIndex(raceData) {
    const percentages = Object.values(raceData).map(d => parseFloat(d.local));
    const maxPercentage = Math.max(...percentages);
    
    if (maxPercentage > 60) return 'Low';
    if (maxPercentage > 45) return 'Moderate'; 
    if (maxPercentage > 35) return 'High';
    return 'Very High';
}

async function updateCountyFile(countyKey, countyInfo) {
    console.log(`\n🔄 Processing ${countyInfo.name}...`);
    
    const cityData = {};
    const allVariables = Object.values(CENSUS_VARS).join(',');
    const allPlaceFips = countyInfo.cities.map(c => `place:${c}`).join('&for=place:');
    
    try {
        const data = await fetchCensusData(allVariables, `place:*&in=county:${countyInfo.fips}`);
        
        if (data) {
            data.slice(1).forEach(row => {
                const placeName = row[0].replace(/ city, california| town, california/i, '');
                const city = countyInfo.cities.find(c => c.toLowerCase() === placeName.toLowerCase());
                if (city) {
                    const processed = processCityData(row, city, row[2]);
                    if (processed) {
                        cityData[city] = processed;
                    }
                }
            });
        }
    } catch (error) {
        console.error(`  ❌ Error processing ${countyInfo.name}:`, error.message);
    }
    
    console.log(`\n✅ Successfully processed ${Object.keys(cityData).length}/${countyInfo.cities.length} cities for ${countyInfo.name}`);
    await generateCountyFile(countyKey, cityData);
}

async function generateCountyFile(countyKey, cityData) {
    const fileName = `${countyKey.replace(/-/g, '')}County.js`;
    const exportName = EXPORT_NAME_MAP[countyKey];
    
    const fileContent = `
export const ${exportName} = ${JSON.stringify(cityData, null, 4)};
`;
    
    const outputPath = path.resolve(__dirname, `../src/components/discover/data/demographics/${fileName}`);
    
    try {
        fs.writeFileSync(outputPath, fileContent);
        console.log(`📁 Generated ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${outputPath}:`, error);
    }
}

async function main() {
    console.log('🚀 Starting Bay Area demographics collection...\n');
    
    if (!CENSUS_API_KEY) {
        console.error('❌ CENSUS_API_KEY not found in environment variables');
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    for (const [countyKey, countyInfo] of Object.entries(BAY_AREA_COUNTIES)) {
        try {
            await updateCountyFile(countyKey, countyInfo);
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.error(`❌ Failed to process ${countyInfo.name}:`, error);
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n🎉 Demographics collection complete!`);
    console.log(`⏱️  Total time: ${duration} minutes`);
    console.log(`📊 Updated demographic files for all 9 Bay Area counties`);
}

if (require.main === module) {
    main().catch(console.error);
}