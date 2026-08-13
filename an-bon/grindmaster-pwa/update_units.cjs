const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. OpenCV 분석 로직 변환 (actualAvgDiameterMm 계산 부분에 * 1000 추가)
// OpenCV에서 나오는 값 자체를 마이크로미터로 반환하도록 함.
code = code.replace(
  "opencvData = { count, avgAreaPixels, actualAvgDiameterMm, maxArea, minArea, topImage };",
  "actualAvgDiameterMm = actualAvgDiameterMm * 1000; // mm to μm conversion\n      opencvData = { count, avgAreaPixels, actualAvgDiameterMm, maxArea, minArea, topImage };"
);

// 시뮬레이터 로직 변환
code = code.replace(
  "finalMeasured = baseDiameter + (Math.random() * variance * 2 - variance);",
  "finalMeasured = (baseDiameter + (Math.random() * variance * 2 - variance)) * 1000; // μm for simulator"
);

// diff 평가 로직 변환 (mm 기준 0.05 였던 오차 허용범위를 50 μm 로 변경)
code = code.replace("if (diff > 0.05) recommendation = '원두가 너무 굵습니다. 분쇄도를 더 조여주세요.';\n      else if (diff < -0.05) recommendation = '원두가 너무 얇습니다. 분쇄도를 더 풀어주세요.';",
                    "if (diff > 50) recommendation = '원두가 너무 굵습니다. 분쇄도를 더 조여주세요.';\n      else if (diff < -50) recommendation = '원두가 너무 얇습니다. 분쇄도를 더 풀어주세요.';");

// 2. 초기 프리셋 값 단위 변환 (기본 생성 프리셋)
code = code.replace("value: 0.245", "value: 245");
code = code.replace("value: 0.680", "value: 680");
code = code.replace("value: 1.120", "value: 1120");

// 시뮬레이터 기본 baseDiameter 처리 보정 (프리셋이 μm이면 시뮬레이터도 맞게 처리해야함)
code = code.replace("const baseDiameter = selectedMasterPreset?.value || 0.8;", "const baseDiameter = (selectedMasterPreset?.value || 800) / 1000; // temp in mm for sim calculation");
code = code.replace("let baseline = selectedMasterPreset?.value || 0.8;", "let baseline = selectedMasterPreset?.value || 800; // baseline is now in μm");

// 3. UI 텍스트 치환 (mm -> μm)
// "mm"라는 문자열을 "μm"로 바꾸는 정규식. UI에 직접 노출된 부분들.
code = code.replace(/>mm<\/span>/g, ">μm</span>");
code = code.replace(/}mm<\/span>/g, "}μm</span>");
code = code.replace(/}mm<\/strong>/g, "}μm</strong>");
code = code.replace(/}mm/g, "}μm");

// toFixed(3) -> toFixed(0) (마이크로미터이므로 소수점 불필요)
code = code.replace(/\.toFixed\(3\)/g, ".toFixed(0)");

// 설명 부분 문자열 치환
code = code.replace("분쇄도(mm)", "분쇄도(μm)");
code = code.replace("0.245mm", "245μm");
code = code.replace("0.680mm", "680μm");
code = code.replace("1.120mm", "1120μm");

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx modified to use μm units.');
