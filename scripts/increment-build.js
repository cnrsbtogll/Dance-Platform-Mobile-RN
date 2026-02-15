const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../app.version.json');
const versionData = require(versionFilePath);

// Increment build numbers
const currentIosBuild = parseInt(versionData.ios.buildNumber, 10);
const currentAndroidCode = versionData.android.versionCode;

versionData.ios.buildNumber = (currentIosBuild + 1).toString();
versionData.android.versionCode = currentAndroidCode + 1;

console.log(`Bumping build numbers:`);
console.log(`  iOS: ${currentIosBuild} -> ${versionData.ios.buildNumber}`);
console.log(`  Android: ${currentAndroidCode} -> ${versionData.android.versionCode}`);

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');
console.log('Updated app.version.json');
