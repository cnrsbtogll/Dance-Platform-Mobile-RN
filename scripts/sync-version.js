#!/usr/bin/env node
/**
 * sync-version.js
 * Syncs app.config.js `version` → native files (build.gradle, Info.plist)
 * Run: node scripts/sync-version.js
 * EAS hook: add to eas.json as prebuildCommand
 */

const fs = require('fs');
const path = require('path');

// Read version from app.config.js
const appConfig = require('../app.config.js');
const version = appConfig.expo.version;

if (!version) {
    console.error('❌ No version found in app.config.js');
    process.exit(1);
}

console.log(`🔄 Syncing version: ${version}`);

// ── Android: build.gradle ──────────────────────────────────────────
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
const prevAndroid = buildGradle.match(/versionName\s+"([^"]+)"/)?.[1];
buildGradle = buildGradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
fs.writeFileSync(buildGradlePath, buildGradle);
console.log(`  ✅ Android build.gradle: ${prevAndroid} → ${version}`);

// ── iOS: Info.plist ───────────────────────────────────────────────
const infoPlistPath = path.join(__dirname, '../ios/FerihaDancePlatform/Info.plist');
let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
const prevIos = infoPlist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
infoPlist = infoPlist.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${version}$2`
);
fs.writeFileSync(infoPlistPath, infoPlist);
console.log(`  ✅ iOS Info.plist: ${prevIos} → ${version}`);

console.log('✅ Version sync complete!');
