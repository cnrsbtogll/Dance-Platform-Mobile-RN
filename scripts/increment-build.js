const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Save to app.version.json
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');
console.log('Updated app.version.json');

// --- Update Native Files ---

// 1. Update iOS Info.plist
const infoPlistPath = path.join(__dirname, '../ios/FerihaDancePlatform/Info.plist');
if (fs.existsSync(infoPlistPath)) {
    console.log(`Updating Info.plist at ${infoPlistPath}...`);
    // Use plutil to securely update plist
    try {
        // Update CFBundleVersion (Build Number)
        execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${versionData.ios.buildNumber}" "${infoPlistPath}"`);
        // Update CFBundleShortVersionString (Version Name) - ensuring it matches
        execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${versionData.version}" "${infoPlistPath}"`);
        console.log('  Updated Info.plist successfully.');
    } catch (error) {
        console.error('  Error updating Info.plist:', error.message);
    }
} else {
    console.warn('  Warning: Info.plist not found at expected path.');
}

// 2. Update Android build.gradle
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
if (fs.existsSync(buildGradlePath)) {
    console.log(`Updating build.gradle at ${buildGradlePath}...`);
    let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');

    // Replace versionCode
    gradleContent = gradleContent.replace(
        /versionCode\s+\d+/,
        `versionCode ${versionData.android.versionCode}`
    );

    // Replace versionName
    gradleContent = gradleContent.replace(
        /versionName\s+"[^"]+"/,
        `versionName "${versionData.version}"`
    );

    fs.writeFileSync(buildGradlePath, gradleContent);
    console.log('  Updated build.gradle successfully.');
} else {
    console.warn('  Warning: build.gradle not found at expected path.');
}

