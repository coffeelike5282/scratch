const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// fetchPresets 의 forEach 교체
const presetRegex = /querySnapshot\.forEach\(\(doc\) => \{\s*data\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\);\s*\}\);/g;
let matchCount = 0;
code = code.replace(presetRegex, (match, offset, string) => {
  matchCount++;
  if (matchCount === 1) {
    // 1st match: fetchPresets
    return `querySnapshot.forEach((doc) => {
        let presetData = doc.data();
        if (presetData.value < 10) presetData.value = presetData.value * 1000;
        data.push({ id: doc.id, ...presetData });
      });`;
  } else if (matchCount === 2) {
    // 2nd match: fetchHistory
    return `querySnapshot.forEach((doc) => {
        let historyData = doc.data();
        if (historyData.preset_value < 10) historyData.preset_value = historyData.preset_value * 1000;
        if (historyData.measured_value < 10) historyData.measured_value = historyData.measured_value * 1000;
        data.push({ id: doc.id, ...historyData });
      });`;
  }
  return match;
});

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx legacy unit migration completed via Regex.', matchCount);
