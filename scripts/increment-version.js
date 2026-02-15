const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../app.version.json');
const versionData = require(versionFilePath);

// Logic:
// 1. Increment Patch version (x.y.Z -> x.y.Z+1)
// 2. Reset IOS Build number to 1
// 3. Android versionCode MUST always increase, so we keep incrementing it

const currentVersion = versionData.version;
const versionParts = currentVersion.split('.').map(Number);

// Increment patch
versionParts[2] += 1;
const newVersion = versionParts.join('.');

console.log(`Bumping Version: ${currentVersion} -> ${newVersion}`);

// Reset iOS Build Number for new version
const oldIosBuild = versionData.ios.buildNumber;
versionData.ios.buildNumber = "1";
console.log(`Resetting iOS Build Number: ${oldIosBuild} -> 1`);

// Android versionCode must always increase
const oldAndroidCode = versionData.android.versionCode;
versionData.android.versionCode += 1;
console.log(`Incrementing Android Version Code: ${oldAndroidCode} -> ${versionData.android.versionCode}`);

// Update version string
versionData.version = newVersion;

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');
console.log('Updated app.version.json');
console.log(`\nNew Release Ready: ${newVersion} (Build 1)`);

// --- Update Native Files ---
const { execSync } = require('child_process');

// 1. Update iOS Info.plist
const infoPlistPath = path.join(__dirname, '../ios/FerihaDancePlatform/Info.plist');
if (fs.existsSync(infoPlistPath)) {
    console.log(`Updating Info.plist at ${infoPlistPath}...`);
    try {
        execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${versionData.ios.buildNumber}" "${infoPlistPath}"`);
        execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${versionData.version}" "${infoPlistPath}"`);
        console.log('  Updated Info.plist successfully.');
    } catch (error) {
        console.error('  Error updating Info.plist:', error.message);
    }
}

// 2. Update Android build.gradle
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
if (fs.existsSync(buildGradlePath)) {
    console.log(`Updating build.gradle at ${buildGradlePath}...`);
    let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');

    gradleContent = gradleContent.replace(
        /versionCode\s+\d+/,
        `versionCode ${versionData.android.versionCode}`
    );

    gradleContent = gradleContent.replace(
        /versionName\s+"[^"]+"/,
        `versionName "${versionData.version}"`
    );

    fs.writeFileSync(buildGradlePath, gradleContent);
    console.log('  Updated build.gradle successfully.');
}
