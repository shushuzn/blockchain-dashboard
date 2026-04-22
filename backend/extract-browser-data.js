#!/usr/bin/env node

/**
 * Browser Data Extractor
 * 
 * This script helps users export their localStorage data from the browser
 * to files that can then be migrated to the database.
 * 
 * Instructions:
 * 1. Open your browser's developer tools (F12)
 * 2. Go to the Console tab
 * 3. Paste the content of browser-export.js
 * 4. Copy the generated JSON and save it to files in browser_data/
 * 
 * OR use the Node.js script with Chrome's LocalStorage files directly.
 */

const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.join(__dirname, '..')
const BROWSER_DATA_DIR = path.join(PROJECT_ROOT, 'browser_data')

function ensureBrowserDataDir() {
  if (!fs.existsSync(BROWSER_DATA_DIR)) {
    fs.mkdirSync(BROWSER_DATA_DIR, { recursive: true })
    console.log(`Created directory: ${BROWSER_DATA_DIR}`)
  }
}

function extractFromChromeLocalStorage() {
  const localStoragePath = path.join(
    process.env.LOCALAPPDATA || '',
    'Google\\Chrome\\User Data\\Default\\Local Storage'
  )
  
  console.log('Chrome LocalStorage path:', localStoragePath)
  console.log('Note: Chrome stores LocalStorage in LevelDB format, not plain JSON.')
  console.log('Use the browser console method instead for reliable extraction.')
}

function createBrowserExportScript() {
  const exportScript = `
// ============================================
// Blockchain Dashboard - Browser Data Export
// ============================================
// 
// Run this in your browser's developer console (F12 > Console)
// to export your localStorage data as JSON strings.
//

(function() {
  console.log('Starting data export...');
  
  const keys = ['mcm_history_v2', 'mcm_config_v3', 'mcm_alert_state_v2'];
  const results = {};
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      results[key] = value;
      console.log('Found:', key, 'size:', value.length, 'bytes');
    } else {
      console.log('Not found:', key);
    }
  });
  
  console.log('\\n==========================================');
  console.log('Export Results (JSON strings):');
  console.log('==========================================\\n');
  
  for (const [key, value] of Object.entries(results)) {
    console.log('// ----- ' + key + ' -----');
    console.log('localStorage.setItem(\\'' + key + '\\', ' + JSON.stringify(value) + ');');
    console.log('');
  }
  
  // Also create a combined export file
  const combinedExport = {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    data: results
  };
  
  console.log('Combined JSON export (save this):');
  console.log(JSON.stringify(combinedExport, null, 2));
  
  return results;
})();
`
  
  const exportFile = path.join(BROWSER_DATA_DIR, 'browser-export.js')
  fs.writeFileSync(exportFile, exportScript)
  console.log(`Browser export script created: ${exportFile}`)
}

function createImportScript() {
  const importScript = `
// ============================================
// Blockchain Dashboard - Browser Data Import
// ============================================
//
// Run this in your browser's developer console to import
// previously exported data.
//

(function() {
  const importData = PASTE_YOUR_EXPORT_JSON_HERE;
  
  if (!importData || !importData.data) {
    console.error('Invalid import data format');
    return;
  }
  
  console.log('Starting import...');
  console.log('Timestamp:', importData.timestamp);
  
  for (const [key, value] of Object.entries(importData.data)) {
    localStorage.setItem(key, value);
    console.log('Imported:', key);
  }
  
  console.log('\\nImport complete! Please refresh the page.');
})();
`
  
  const importFile = path.join(BROWSER_DATA_DIR, 'browser-import.js')
  fs.writeFileSync(importFile, importScript)
  console.log(`Browser import script created: ${importFile}`)
}

function createManualExport() {
  const manualGuide = `# Browser Data Export Guide

## Method 1: Using Browser Console (Recommended)

1. Open the Blockchain Dashboard in your browser
2. Open Developer Tools (F12 or Ctrl+Shift+I)
3. Go to the Console tab
4. Copy and paste the contents of \`browser-export.js\`
5. Press Enter to run
6. Copy the output and save it to the appropriate files in \`browser_data/\`

## Method 2: Manual Copy

1. Open Developer Tools (F12)
2. Go to Application tab
3. Expand "Local Storage" on the left sidebar
4. Click on your dashboard URL
5. Find and copy values for these keys:
   - \`mcm_history_v2\`
   - \`mcm_config_v3\`
   - \`mcm_alert_state_v2\`
6. Save each value to the corresponding file in \`browser_data/\`

## Export Files Format

After export, save files to \`browser_data/\` directory:

- \`localStorage_mcm_history_v2.json\` - The raw JSON string value
- \`localStorage_mcm_config_v3.json\` - The raw JSON string value

Then run migration:
\`\`\`bash
node backend/migrate-data.js
\`\`\`
`
  
  const guideFile = path.join(BROWSER_DATA_DIR, 'EXPORT_GUIDE.md')
  fs.writeFileSync(guideFile, manualGuide)
  console.log(`Export guide created: ${guideFile}`)
}

function main() {
  console.log('='.repeat(50))
  console.log('Browser Data Extractor Tool')
  console.log('='.repeat(50))
  console.log()
  
  ensureBrowserDataDir()
  createBrowserExportScript()
  createImportScript()
  createManualExport()
  
  console.log()
  console.log('Tools created in:', BROWSER_DATA_DIR)
  console.log()
  console.log('Next steps:')
  console.log('1. Open browser-export.js and follow instructions')
  console.log('2. Export your localStorage data')
  console.log('3. Save export files to browser_data/')
  console.log('4. Run: node migrate-data.js')
}

main()