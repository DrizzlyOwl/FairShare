const fs = require('fs');
const path = require('path');

/**
 * FairShare Build Bumper
 * Automatically increments version, updates GMT timestamp, and refreshes cache busters.
 */

const INDEX_PATH = path.join(__dirname, '../index.html');
const SW_PATH = path.join(__dirname, '../service-worker.js');

function bump() {
    console.log('🚀 Bumping FairShare build...');

    if (!fs.existsSync(INDEX_PATH)) {
        console.error('❌ Error: index.html not found at ' + INDEX_PATH);
        process.exit(1);
    }

    let indexContent = fs.readFileSync(INDEX_PATH, 'utf8');
    
    // 1. Extract and Increment Build Version
    // Pattern: Build: 1.1.60
    const buildRegex = /Build: (\d+)\.(\d+)\.(\d+)/;
    const buildMatch = indexContent.match(buildRegex);
    
    if (!buildMatch) {
        console.error('❌ Error: Could not find build version in index.html footer.');
        process.exit(1);
    }

    const major = buildMatch[1];
    const minor = buildMatch[2];
    const patch = parseInt(buildMatch[3]) + 1;
    const newVersion = `${major}.${minor}.${patch}`;
    
    // 2. Generate GMT Timestamp
    // Format: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').split('.')[0];
    const unixBuster = Math.floor(now.getTime() / 1000);

    console.log(`✅ New Version: v${newVersion}`);
    console.log(`✅ New Timestamp: ${timestamp} GMT`);
    console.log(`✅ Cache Buster: ${unixBuster}`);

    // 3. Update index.html
    // Update Build and Date
    indexContent = indexContent.replace(
        /Build: \d+\.\d+\.\d+ • \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
        `Build: ${newVersion} • ${timestamp}`
    );

    // Update Cache Busters (?v=12345)
    indexContent = indexContent.replace(/\?v=\d+/g, `?v=${unixBuster}`);

    fs.writeFileSync(INDEX_PATH, indexContent, 'utf8');
    console.log('📝 Updated index.html');

    // 4. Update service-worker.js
    if (fs.existsSync(SW_PATH)) {
        let swContent = fs.readFileSync(SW_PATH, 'utf8');
        swContent = swContent.replace(/\?v=\d+/g, `?v=${unixBuster}`);
        fs.writeFileSync(SW_PATH, swContent, 'utf8');
        console.log('📝 Updated service-worker.js');
    }

    console.log('✨ Build bump complete!');
}

bump();
