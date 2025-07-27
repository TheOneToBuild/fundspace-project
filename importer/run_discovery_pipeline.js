// run_discovery_pipeline.js
// Master orchestrator for the complete grant discovery pipeline

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
    MAX_CONCURRENT_SCRIPTS: 2,
    RETRY_ATTEMPTS: 2,
    SCRIPT_TIMEOUT: 300000, // 5 minutes per script
    PIPELINE_MODES: {
        FULL: 'full',           // Discovery + Import
        DISCOVERY_ONLY: 'discovery',
        IMPORT_ONLY: 'import'
    }
};

class PipelineOrchestrator {
    constructor(mode = CONFIG.PIPELINE_MODES.FULL) {
        this.mode = mode;
        this.results = {
            discovery: { status: 'pending', grants: 0, duration: 0 },
            import: { status: 'pending', grants: 0, duration: 0 }
        };
        this.startTime = Date.now();
    }

    async runScript(scriptPath, args = [], timeout = CONFIG.SCRIPT_TIMEOUT) {
        return new Promise((resolve, reject) => {
            console.log(`\n🚀 Starting: ${path.basename(scriptPath)} ${args.join(' ')}`);
            const startTime = Date.now();
            
            const child = spawn('node', [scriptPath, ...args], {
                stdio: 'pipe',
                cwd: path.dirname(scriptPath)
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                const text = data.toString();
                process.stdout.write(text);
                output += text;
            });

            child.stderr.on('data', (data) => {
                const text = data.toString();
                process.stderr.write(text);
                errorOutput += text;
            });

            const timeoutHandle = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Script timeout after ${timeout}ms`));
            }, timeout);

            child.on('close', (code) => {
                clearTimeout(timeoutHandle);
                const duration = Date.now() - startTime;
                
                if (code === 0) {
                    console.log(`✅ Completed: ${path.basename(scriptPath)} (${Math.round(duration/1000)}s)`);
                    resolve({ code, output, duration, success: true });
                } else {
                    console.log(`❌ Failed: ${path.basename(scriptPath)} (exit code: ${code})`);
                    reject(new Error(`Script failed with exit code ${code}\nError: ${errorOutput}`));
                }
            });

            child.on('error', (error) => {
                clearTimeout(timeoutHandle);
                reject(error);
            });
        });
    }

    async runDiscoveryPhase() {
        console.log('\n' + '='.repeat(60));
        console.log('📡 PHASE 1: GRANT DISCOVERY');
        console.log('='.repeat(60));
        
        try {
            const discoveryScript = path.join(__dirname, 'discover_grant_urls.js');
            const result = await this.runScript(discoveryScript);
            
            // Parse output for grants discovered
            const grantMatches = result.output.match(/Successfully saved (\d+) grants/);
            const grantsFound = grantMatches ? parseInt(grantMatches[1]) : 0;
            
            this.results.discovery = {
                status: 'success',
                grants: grantsFound,
                duration: result.duration
            };
            
            console.log(`📊 Discovery Results: ${grantsFound} new grant opportunities found`);
            return true;
            
        } catch (error) {
            console.error('❗ Discovery phase failed:', error.message);
            this.results.discovery = {
                status: 'failed',
                grants: 0,
                duration: 0,
                error: error.message
            };
            return false;
        }
    }

    async runImportPhase() {
        console.log('\n' + '='.repeat(60));
        console.log('📥 PHASE 2: GRANT IMPORT & PROCESSING');
        console.log('='.repeat(60));
        
        try {
            const importScript = path.join(__dirname, 'import_grants.js');
            const result = await this.runScript(importScript, [], 600000); // 10 minute timeout
            
            // Parse output for grants processed
            const grantMatches = result.output.match(/Total grants found: (\d+)/);
            const grantsProcessed = grantMatches ? parseInt(grantMatches[1]) : 0;
            
            this.results.import = {
                status: 'success',
                grants: grantsProcessed,
                duration: result.duration
            };
            
            console.log(`📊 Import Results: ${grantsProcessed} grants processed and saved`);
            return true;
            
        } catch (error) {
            console.error('❗ Import phase failed:', error.message);
            this.results.import = {
                status: 'failed',
                grants: 0,
                duration: 0,
                error: error.message
            };
            return false;
        }
    }

    async runSeedingPhase() {
        console.log('\n' + '='.repeat(60));
        console.log('🌱 PHASE 3: DATABASE SEEDING');
        console.log('='.repeat(60));
        
        try {
            // Run funders seeding first
            console.log('\n--- Seeding Funders ---');
            const funderScript = path.join(__dirname, 'seed_funders.js');
            const funderResult = await this.runScript(funderScript);
            
            // Run nonprofits seeding
            console.log('\n--- Seeding Nonprofits ---');
            const nonprofitScript = path.join(__dirname, 'seed_nonprofits.js');
            const nonprofitResult = await this.runScript(nonprofitScript, ['--batch-size', '8']);
            
            // Parse results
            const funderMatches = funderResult.output.match(/Inserted (\d+) new unique funders/);
            const nonprofitMatches = nonprofitResult.output.match(/Inserted: (\d+)/);
            
            const fundersSeeded = funderMatches ? parseInt(funderMatches[1]) : 0;
            const nonprofitsSeeded = nonprofitMatches ? parseInt(nonprofitMatches[1]) : 0;
            const totalSeeded = fundersSeeded + nonprofitsSeeded;
            
            this.results.seeding = {
                status: 'success',
                records: totalSeeded,
                funders: fundersSeeded,
                nonprofits: nonprofitsSeeded,
                duration: funderResult.duration + nonprofitResult.duration
            };
            
            console.log(`📊 Seeding Results: ${fundersSeeded} funders + ${nonprofitsSeeded} nonprofits = ${totalSeeded} total records`);
            return true;
            
        } catch (error) {
            console.error('❗ Seeding phase failed:', error.message);
            this.results.seeding = {
                status: 'failed',
                records: 0,
                duration: 0,
                error: error.message
            };
            return false;
        }
    }

    async runMainImporter() {
        console.log('\n' + '='.repeat(60));
        console.log('⚙️ PHASE 4: MAIN IMPORTER (COMPREHENSIVE PROCESSING)');
        console.log('='.repeat(60));
        
        try {
            const importerScript = path.join(__dirname, 'importer.js');
            const result = await this.runScript(importerScript, [], 900000); // 15 minute timeout
            
            // Parse comprehensive results
            const grantMatches = result.output.match(/Grants saved \(new\): (\d+)/);
            const updatedMatches = result.output.match(/Grants updated: (\d+)/);
            const orgMatches = result.output.match(/Organizations created: (\d+)/);
            
            const grantsNew = grantMatches ? parseInt(grantMatches[1]) : 0;
            const grantsUpdated = updatedMatches ? parseInt(grantsUpdated[1]) : 0;
            const orgsCreated = orgMatches ? parseInt(orgMatches[1]) : 0;
            
            this.results.mainImporter = {
                status: 'success',
                grantsNew,
                grantsUpdated,
                orgsCreated,
                duration: result.duration
            };
            
            console.log(`📊 Main Importer Results: ${grantsNew} new grants, ${grantsUpdated} updated, ${orgsCreated} organizations`);
            return true;
            
        } catch (error) {
            console.error('❗ Main importer phase failed:', error.message);
            this.results.mainImporter = {
                status: 'failed',
                grantsNew: 0,
                grantsUpdated: 0,
                orgsCreated: 0,
                duration: 0,
                error: error.message
            };
            return false;
        }
    }

    async runPipeline() {
        console.log('🎯 STARTING AUTOMATED GRANT DISCOVERY PIPELINE');
        console.log(`Mode: ${this.mode.toUpperCase()}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        
        let overallSuccess = true;
        const phases = [];
        
        try {
            switch (this.mode) {
                case CONFIG.PIPELINE_MODES.FULL:
                    phases.push(
                        { name: 'Discovery', fn: () => this.runDiscoveryPhase() },
                        { name: 'Import', fn: () => this.runImportPhase() }
                    );
                    break;
                    
                case CONFIG.PIPELINE_MODES.DISCOVERY_ONLY:
                    phases.push({ name: 'Discovery', fn: () => this.runDiscoveryPhase() });
                    break;
                    
                case CONFIG.PIPELINE_MODES.IMPORT_ONLY:
                    phases.push({ name: 'Import', fn: () => this.runImportPhase() });
                    break;
                    
                default:
                    throw new Error(`Invalid pipeline mode: ${this.mode}`);
            }
            
            // Execute phases sequentially
            for (const phase of phases) {
                console.log(`\n🔄 Executing ${phase.name} phase...`);
                const success = await phase.fn();
                if (!success) {
                    overallSuccess = false;
                    console.log(`⚠️ ${phase.name} phase failed, but continuing pipeline...`);
                }
                
                // Small delay between phases
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error('❗ Pipeline execution failed:', error);
            overallSuccess = false;
        }
        
        this.generateFinalReport(overallSuccess);
        return overallSuccess;
    }

    generateFinalReport(success) {
        const totalDuration = Date.now() - this.startTime;
        
        console.log('\n' + '='.repeat(80));
        console.log('📋 PIPELINE EXECUTION REPORT');
        console.log('='.repeat(80));
        
        console.log(`🕒 Total Execution Time: ${Math.round(totalDuration / 1000)} seconds`);
        console.log(`📊 Overall Status: ${success ? '✅ SUCCESS' : '❌ PARTIAL FAILURE'}`);
        
        console.log('\n📈 Phase Results:');
        
        if (this.results.discovery.status !== 'pending') {
            const status = this.results.discovery.status === 'success' ? '✅' : '❌';
            console.log(`   ${status} Discovery: ${this.results.discovery.grants} opportunities found (${Math.round(this.results.discovery.duration/1000)}s)`);
        }
        
        if (this.results.import.status !== 'pending') {
            const status = this.results.import.status === 'success' ? '✅' : '❌';
            console.log(`   ${status} Import: ${this.results.import.grants} grants processed (${Math.round(this.results.import.duration/1000)}s)`);
        }
        
        // Calculate totals
        const totalGrants = (this.results.discovery.grants || 0) + 
                           (this.results.import.grants || 0);
        
        console.log('\n🎯 Summary Metrics:');
        console.log(`   • Total Grant Opportunities Discovered: ${this.results.discovery.grants || 0}`);
        console.log(`   • Total Grants Processed & Saved: ${this.results.import.grants || 0}`);
        console.log(`   • Processing Rate: ${Math.round(totalGrants / (totalDuration / 60000))} grants/minute`);
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        if (this.results.discovery.grants > 50) {
            console.log('   • High discovery rate - consider increasing processing frequency');
        }
        if (this.results.import.status === 'failed') {
            console.log('   • Import issues detected - check token limits and content processing');
        }
        if (totalDuration > 600000) { // > 10 minutes
            console.log('   • Long execution time - consider running discovery and import separately');
        }
        if (this.results.discovery.grants > 0 && this.results.import.grants === 0) {
            console.log('   • Discovery found opportunities but import failed - check import_grants.js logs');
        }
        
        console.log('\n📝 Ad-Hoc Operations Available:');
        console.log('   • Run seed_organizations.js to add more funders/nonprofits');
        console.log('   • Run importer.js to process manual URLs from urls.txt');
        
        console.log('\n' + '='.repeat(80));
        
        // Save report to file
        this.saveReportToFile();
    }

    saveReportToFile() {
        const reportData = {
            timestamp: new Date().toISOString(),
            mode: this.mode,
            duration: Date.now() - this.startTime,
            results: this.results
        };
        
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const filename = `pipeline_report_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
        const filepath = path.join(reportsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
        console.log(`📄 Detailed report saved to: ${filepath}`);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    let mode = CONFIG.PIPELINE_MODES.FULL;
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--mode':
            case '-m':
                mode = args[++i];
                break;
            case '--discovery':
            case '-d':
                mode = CONFIG.PIPELINE_MODES.DISCOVERY_ONLY;
                break;
            case '--import':
            case '-i':
                mode = CONFIG.PIPELINE_MODES.IMPORT_ONLY;
                break;
            case '--help':
            case '-h':
                console.log(`
Grant Discovery Pipeline Orchestrator

Usage: node run_discovery_pipeline.js [options]

Options:
  -d, --discovery      Run discovery phase only
  -i, --import         Run import phase only  
  -h, --help           Show this help message

Pipeline Modes:
  full                 Discovery + Import (default)
  discovery           Find new grant opportunities only
  import              Process discovered opportunities only

Examples:
  node run_discovery_pipeline.js                    # Run full pipeline (discovery + import)
  node run_discovery_pipeline.js --discovery        # Discovery only
  node run_discovery_pipeline.js --import           # Import only

Ad-Hoc Operations (run separately):
  node seed_organizations.js --type funder          # Add more funders
  node seed_organizations.js --type nonprofit       # Add nonprofits  
  node importer.js                                  # Process manual URLs from urls.txt
                `);
                process.exit(0);
        }
    }
    
    // Validate mode
    if (!Object.values(CONFIG.PIPELINE_MODES).includes(mode)) {
        console.error(`❗ Invalid mode: ${mode}`);
        console.error(`Valid modes: ${Object.values(CONFIG.PIPELINE_MODES).join(', ')}`);
        process.exit(1);
    }
    
    const orchestrator = new PipelineOrchestrator(mode);
    const success = await orchestrator.runPipeline();
    
    process.exit(success ? 0 : 1);
}

// Schedule capabilities
class ScheduledPipelineRunner {
    constructor() {
        this.intervals = new Map();
    }
    
    scheduleDaily(hour = 2) { // Default 2 AM
        console.log(`📅 Scheduling daily pipeline runs at ${hour}:00`);
        
        const runAtTime = () => {
            const now = new Date();
            const scheduled = new Date();
            scheduled.setHours(hour, 0, 0, 0);
            
            if (scheduled <= now) {
                scheduled.setDate(scheduled.getDate() + 1);
            }
            
            const timeUntilRun = scheduled.getTime() - now.getTime();
            
            setTimeout(async () => {
                console.log(`🔔 Starting scheduled pipeline run...`);
                const orchestrator = new PipelineOrchestrator(CONFIG.PIPELINE_MODES.FULL);
                await orchestrator.runPipeline();
                
                // Schedule next run
                runAtTime();
            }, timeUntilRun);
            
            console.log(`⏰ Next pipeline run scheduled for: ${scheduled.toISOString()}`);
        };
        
        runAtTime();
    }
    
    scheduleInterval(intervalHours = 6) {
        console.log(`📅 Scheduling pipeline runs every ${intervalHours} hours`);
        
        const intervalMs = intervalHours * 60 * 60 * 1000;
        const interval = setInterval(async () => {
            console.log(`🔔 Starting scheduled pipeline run...`);
            const orchestrator = new PipelineOrchestrator(CONFIG.PIPELINE_MODES.FULL);
            await orchestrator.runPipeline();
        }, intervalMs);
        
        this.intervals.set('main', interval);
        
        // Run immediately, then on schedule
        setTimeout(async () => {
            const orchestrator = new PipelineOrchestrator(CONFIG.PIPELINE_MODES.FULL);
            await orchestrator.runPipeline();
        }, 5000);
    }
    
    stop() {
        this.intervals.forEach((interval, key) => {
            clearInterval(interval);
            console.log(`⏹️ Stopped scheduled pipeline: ${key}`);
        });
        this.intervals.clear();
    }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('❗ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Pipeline interrupted by user');
    process.exit(0);
});

// Export for use as module
module.exports = {
    PipelineOrchestrator,
    ScheduledPipelineRunner,
    CONFIG
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❗ Pipeline failed:', error);
        process.exit(1);
    });
}