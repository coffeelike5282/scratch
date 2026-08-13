const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const appJsxPath = path.join(__dirname, 'src', 'App.jsx');

// 1. package.json 버전 올리기 (Patch version bump)
const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonRaw);
const currentVersion = packageJson.version; // e.g. "0.0.0"

const parts = currentVersion.split('.').map(Number);
parts[2] += 1; // patch 버전 1 증가
const newVersion = parts.join('.');
packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log(`[Version Bump] package.json: ${currentVersion} -> ${newVersion}`);

// 2. App.jsx 내부의 Version 텍스트 업데이트
let appJsx = fs.readFileSync(appJsxPath, 'utf8');
const versionRegex = /Version:\s*v\d+\.\d+\.\d+(?:\s*\([^)]*\))?/g;

if (versionRegex.test(appJsx)) {
  appJsx = appJsx.replace(versionRegex, `Version: v${newVersion} (Release)`);
  fs.writeFileSync(appJsxPath, appJsx, 'utf8');
  console.log(`[Version Bump] src/App.jsx updated with Version: v${newVersion} (Release)`);
} else {
  console.warn(`[Warning] Could not find Version: vX.X.X pattern in src/App.jsx`);
}
