const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. fetchPresets 마이그레이션 로직 추가
const oldFetchPresetsLoop = `      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });`;
const newFetchPresetsLoop = `      querySnapshot.forEach((doc) => {
        let presetData = doc.data();
        if (presetData.value < 10) presetData.value = presetData.value * 1000;
        data.push({ id: doc.id, ...presetData });
      });`;
code = code.replace(oldFetchPresetsLoop, newFetchPresetsLoop);

// 2. fetchHistory 마이그레이션 로직 추가
const oldFetchHistoryLoop = `      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });`;
const newFetchHistoryLoop = `      querySnapshot.forEach((doc) => {
        let historyData = doc.data();
        if (historyData.preset_value < 10) historyData.preset_value = historyData.preset_value * 1000;
        if (historyData.measured_value < 10) historyData.measured_value = historyData.measured_value * 1000;
        data.push({ id: doc.id, ...historyData });
      });`;
code = code.replace(oldFetchHistoryLoop, newFetchHistoryLoop);

// 3. 누락된 defaultPresets 값 치환 (글로벌 정규식 사용)
code = code.replace(/value: 0\.245/g, "value: 245");
code = code.replace(/value: 0\.680/g, "value: 680");
code = code.replace(/value: 1\.120/g, "value: 1120");

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx legacy unit migration completed.');
