import { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebaseClient';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { 
  Camera, 
  User, 
  Search, 
  Plus, 
  X, 
  BookOpen, 
  History, 
  Trash2, 
  Info, 
  Zap, 
  RotateCcw,
  Sparkles,
  MoreVertical,
  LogOut,
  Sliders,
  Save,
  Download,
  Table, 
  FileText, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

import coffeelikeLogo from './assets/coffeelike_logo.png';
import packageJson from '../package.json';

// 다국어 번역 사전 리소스 정의
const TRANSLATIONS = {
  ko: {
    appTitle: "GRINDMASTER",
    loginSubTitle: "원두 분쇄도 비교 보정기",
    loginBtn: "Google 계정으로 로그인",
    connecting: "연결 중...",
    errorOccurred: "에러가 발생했습니다: ",
    confirmLeave: "페이지를 벗어나시겠습니까?\n작업 중인 내용은 저장되지 않을 수 있습니다.",
    
    // Header & Navigation
    logout: "로그아웃",
    preset: "프리셋",
    scan: "촬영",
    history: "기록",
    help: "도움말",

    // Home
    installApp: "PWA 앱 설치",
    iosInstallHint: "iOS 기기에서는 브라우저 하단의 '공유' 버튼을 누른 후\n'홈 화면에 추가'를 선택하여 앱을 설치할 수 있습니다.",
    searchPlaceholder: "프리셋 검색...",
    activeMaster: "현재 활성 마스터",
    baseDate: "기준 설정일: ",
    recalibrateBtn: "기준 굵기 재촬영 보정",
    savedPresets: "저장된 프리셋",
    createDefaultBtn: "기본 프리셋 만들기",
    listCount: "개 목록",
    noPresets: "검색된 프리셋이 없습니다.",
    presetDeleteConfirm: "정말로 이 프리셋을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",

    // Camera
    cameraSimulator: "가상 분석 시뮬레이터",
    cameraSimDesc: "에뮬레이터/브라우저 테스트 모드입니다. 하단의 촬영 버튼을 탭하면 가상의 원두 픽셀 매커니즘이 구동됩니다.",
    beanPlacement: "원두 배치 여부",
    beanPlaced: "원두 배치됨",
    beanNone: "원두 없음 (카드만)",
    scanReady: "정밀 분석 준비 중...",
    scanning: "정밀 분석 중...",
    simScanning: "가상 환경 분석 중...",
    cardError: "⚠️ 기준 카드가 감지되지 않았습니다. 신용카드 크기의 카드를 화면에 포함시켜 주세요.",
    beanError: "⚠️ 분쇄 원두가 충분히 감지되지 않았습니다. 중앙 가이드 안에 원두를 골고루 펴주세요.",
    compareGuide: "마스터 카드 및 원두를 프레임 안에 맞추세요.",
    registerBaselineGuide: (name) => `'${name}' 새로운 마스터 기준 굵기 촬영`,
    recalibrateBaselineGuide: (name) => `'${name}' 마스터 기준 굵기 재촬영 보정`,
    coffeeSampleArea: "☕ 원두 샘플 영역",
    coffeeSampleGuide: "가운데 주황색 가이드 안에만\n원두를 골고루 펼쳐주세요",
    creditCardArea: "💳 신용카드 배치 영역",
    creditCardGuide: "하단 파란색 가이드 안에 카드를 맞춰주세요",

    // Results
    analysisComplete: "기준 굵기 분석 완료",
    analysisCompleteRegister: (name) => `'${name}' 등록`,
    analysisCompleteRecalibrate: (name) => `'${name}' 보정`,
    capturedCoffeeSample: "촬영된 원두 샘플",
    analyzedAvgDiameter: "분석된 입자 평균 굵기",
    resultAdvice: (measured) => `분석된 입자 평균 굵기는 ${measured}μm 입니다. 이 굵기를 현재 프리셋의 마스터 기준 굵기로 등록하고 활성화하시겠습니까?`,
    saveMasterBtn: "마스터 굵기로 확정 및 저장",
    retakeBtn: "다시 촬영",
    cvSimulation: "시뮬레이션",
    cvThreshOtsu: "CV2.THRESH_OTSU",
    todayAvgGrind: (measured) => `오늘의 평균 분쇄도는 ${measured}μm 입니다`,
    basedOnPreset: (name) => `'${name}' 기준`,
    perfectGrind: "퍼펙트! 현재 굵기가 기준과 일치합니다.",
    coarseGrind: "원두가 너무 굵습니다. 분쇄도를 더 조여주세요.",
    fineGrind: "원두가 너무 얇습니다. 분쇄도를 더 풀어주세요.",
    particleDist: "입도 분포도 (Particle Size Distribution)",
    unitCountRatio: "단위: μm / 개수 비율",
    particleNone: "분포 데이터가 아직 축적되지 않았습니다.",
    maxParticle: "최대 입자 (가장 굵음)",
    minParticle: "최소 입자 (가장 얇음)",
    maxParticleArea: "최대 입자 넓이",
    minParticleArea: "최소 입자 넓이",
    cleanGrinderTip: "가장 큰 입자와 작은 입자의 크기 차이(편차)가 너무 크다면, 그라인더 칼날(버)을 청소하거나 교체할 시기일 수 있습니다!",
    retakeBtnResult: "재촬영 및 분석",
    saveAndGoHistory: "저장 후 기록으로",

    // 300μm Fine Filter
    filter300Title: "300μm 이하 미분 제외 필터",
    filter300Desc: "300μm 이하 초미분을 계산에서 제외하고 메인 입자 데이터만 재산출합니다.",
    excludedCountNotice: (count) => `(300μm 이하 ${count}개 입자 제외됨)`,
    filterOn: "필터 적용 중 (>300μm)",
    filterOff: "전체 입자 측정 (0μm~)",

    // 200μm Fine Warning
    fineWarningTitle: "200μm 이하 초미분 과다 경고",
    fineWarningNotice: (ratio) => `200μm 이하의 미분이 전체 원두 양의 ${ratio}%를 차지하여 기준치(10%)를 초과합니다. 미분은 추출 시 물길을 막고 떫은 맛과 잡미를 만드는 원인이 될 수 있습니다.`,
    fineMassRatioLabel: "200μm 이하 미분 함량 (질량 기준): ",
    fineMassRatioBadge: (ratio) => `200μm 이하 미분: ${ratio}%`,

    // Raw Data Modal & Exports
    viewRawData: "로우 데이터 보기",
    rawDataModalTitle: "입자 측정 로우 데이터 (Raw Data)",
    rawDataModalDesc: "감지된 개별 입자들의 굵기 및 입도 분류 정보 (작은 순서 정렬)",
    exportTxtBtn: "텍스트 (.txt) 파일 저장",
    exportCsvBtn: "엑셀 (.csv) 파일 저장",
    particleNo: "No.",
    particleSizeUm: "크기 (μm)",
    particleSizeMm: "크기 (mm)",
    particleClass: "입도 분류",
    fineLabel: "미분 (<400μm)",
    normalLabel: "표준 (400~1200μm)",
    coarseLabel: "조분 (>1200μm)",
    totalParticleCount: "총 입자 수",
    avgParticleSize: "평균 크기",
    minParticleSize: "최소 크기",
    maxParticleSize: "최대 크기",
    closeModal: "닫기",
    noRawData: "로우 데이터가 존재하지 않습니다.",

    // History
    scanHistoryTitle: "촬영 분석 기록",
    scanHistoryDesc: "과거에 저장된 분쇄도 비교/보정 로그 목록입니다",
    detailHistoryBack: "← 목록으로 돌아가기",
    detailHistoryTitle: "과거 분석 기록 상세",
    measuredAvgGrind: "당시 평균 분쇄도: ",
    targetBaseValue: "목표 기준값: ",
    diffFromBase: "기준 대비 편차",
    calibrationAdvice: "캘리브레이션 조언",
    saveAsPresetBtn: "이 기록으로 새 프리셋 등록",
    saveHistoryPresetTitle: "이 기록으로 새 프리셋 추가",
    saveHistoryPresetBtn: "등록하기",
    deleteLogConfirm: "이 기록을 영구적으로 삭제하시겠습니까?",
    deleteLogBtn: "이 기록 삭제",
    backToListBtn: "목록으로 돌아가기",
    noHistory: "저장된 촬영 기록이 없습니다.",
    noHistoryDesc: "원두 촬영 분석 후 결과 페이지에서 '저장 후 기록으로'를 클릭해 스캔 기록을 저장해 보세요!",

    // Help
    helpTitle: "마스터 가이드 & 캘리브레이션",
    helpDesc: "정밀도 보정 및 신뢰할 수 있는 데이터 산출을 위한 지침서",
    helpSection1Title: "1. 측정용 기준물 선정",
    helpSection1Desc: "거리 오차를 수학적으로 보정하기 위해 신용카드 규격(85.60mm × 53.98mm)의 절대 기준물이 필요합니다. 촬영 시 원두 샘플과 카드가 동일선상 평면에 나란히 배치되어야 합니다.",
    helpSection2Title: "2. 아루코(ArUco) 비전 보정",
    helpSection2Desc: "카메라가 약간 삐딱하거나 평행하지 않더라도, 카드 중심의 고대비 사각형 픽셀 마커의 모서리를 역산하여 정면에서 촬영한 것처럼 원근 보정(Perspective Transform)하는 수학적 보정이 내장되어 있습니다.",
    helpSection3Title: "3. 빛 반사 차단 (Glare Defend)",
    helpSection3Desc: "유광 플라스틱 카드는 불빛이 직접 닿을 시 반사가 생겨 비전 엔진이 픽셀 경계선을 놓칠 수 있습니다. 가급적 무광 카드를 사용하거나, 직사광선을 피해 촬영해 주세요.",
    helpSection4Title: "4. 입도 정밀 보정 팁",
    helpSection4Desc: "스캐너 렌즈의 먼지를 닦아 주시고, 분석할 원두 입자가 겹치지 않게 고루 펴주시면 더욱 정밀한 측정값을 얻을 수 있습니다.",
    versionInfoName: "앱 이름: GRINDMASTER PWA",
    versionInfoVal: `Version: v${packageJson.version} (Release)`,

    // Modals & Popups
    addPresetTitle: "새 프리셋 추가",
    editPresetTitle: "프리셋 수정",
    presetCategory: "추출 방식",
    presetName: "프리셋 이름",
    presetNamePlaceholder: "예: 예가체프 V60",
    presetAddBtn: "카메라로 기준 굵기 촬영 및 등록",
    presetSaveBtn: "저장",
    deletePresetConfirmTitle: "프리셋 삭제 확인",
    deletePresetConfirmText: (name) => `정말로 '${name}' 프리셋을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    cancel: "취소",
    delete: "삭제",
    deleteConfirmAlert: "이 기록을 정말 삭제하시겠습니까?",

    // Categories
    espresso: "에스프레소",
    pourOver: "푸어 오버",
    frenchPress: "프렌치 프레스",
    coldBrew: "콜드 침출",
    mokaPot: "모카포트",
  },
  en: {
    appTitle: "GRINDMASTER",
    loginSubTitle: "Coffee Grind Size Analyzer",
    loginBtn: "Sign in with Google",
    connecting: "Connecting...",
    errorOccurred: "An error occurred: ",
    confirmLeave: "Are you sure you want to leave this page?\nYour changes may not be saved.",

    // Header & Navigation
    logout: "Log Out",
    preset: "Presets",
    scan: "Scan",
    history: "History",
    help: "Guide",

    // Home
    installApp: "Install App (PWA)",
    iosInstallHint: "On iOS, tap the 'Share' button at the bottom of the browser and select 'Add to Home Screen' to install the app.",
    searchPlaceholder: "Search presets...",
    activeMaster: "Active Master",
    baseDate: "Established on: ",
    recalibrateBtn: "Recalibrate Reference",
    savedPresets: "Saved Presets",
    createDefaultBtn: "Create Default Presets",
    listCount: "items",
    noPresets: "No presets found.",
    presetDeleteConfirm: "Are you sure you want to delete this preset?\nThis action cannot be undone.",

    // Camera
    cameraSimulator: "Virtual Analysis Simulator",
    cameraSimDesc: "This is an emulator/browser test mode. Tap the shutter button below to trigger the virtual coffee pixel mechanism.",
    beanPlacement: "Bean Placement Status",
    beanPlaced: "Beans Placed",
    beanNone: "No Beans (Card Only)",
    scanReady: "Preparing analysis...",
    scanning: "Analyzing particles...",
    simScanning: "Simulating scan...",
    cardError: "⚠️ Reference card not detected. Please ensure a standard credit card is in the frame.",
    beanError: "⚠️ Insufficient coffee grounds detected. Spread the beans evenly inside the target guide.",
    compareGuide: "Align the reference card and beans inside the frame.",
    registerBaselineGuide: (name) => `Capture reference grind for '${name}'`,
    recalibrateBaselineGuide: (name) => `Recalibrate reference grind for '${name}'`,
    coffeeSampleArea: "☕ Coffee Sample Area",
    coffeeSampleGuide: "Spread coffee grounds evenly\ninside this orange guide area",
    creditCardArea: "💳 Credit Card Area",
    creditCardGuide: "Align your credit card within this blue guide",

    // Results
    analysisComplete: "Reference Analysis Complete",
    analysisCompleteRegister: (name) => `Register '${name}'`,
    analysisCompleteRecalibrate: (name) => `Calibrate '${name}'`,
    capturedCoffeeSample: "Captured Sample",
    analyzedAvgDiameter: "Analyzed Average Size",
    resultAdvice: (measured) => `The analyzed average size is ${measured}μm. Would you like to save and activate this as the master reference grind size for this preset?`,
    saveMasterBtn: "Save & Set as Master",
    retakeBtn: "Retake Photo",
    cvSimulation: "Simulation",
    cvThreshOtsu: "CV2.THRESH_OTSU",
    todayAvgGrind: (measured) => `Today's average grind is ${measured}μm`,
    basedOnPreset: (name) => `Based on '${name}'`,
    perfectGrind: "Perfect! Current grind size matches the reference.",
    coarseGrind: "Grind is too coarse. Adjust grinder finer.",
    fineGrind: "Grind is too fine. Adjust grinder coarser.",
    particleDist: "Particle Size Distribution",
    unitCountRatio: "Unit: μm / Quantity Ratio",
    particleNone: "No distribution data available.",
    maxParticle: "Largest Particle (Coarsest)",
    minParticle: "Smallest Particle (Finest)",
    maxParticleArea: "Max Particle Area",
    minParticleArea: "Min Particle Area",
    cleanGrinderTip: "If the difference (deviation) between the largest and smallest particles is too wide, it might be time to clean or replace the grinder burrs!",
    retakeBtnResult: "Retake & Analyze",
    saveAndGoHistory: "Save & View History",

    // 300μm Fine Filter
    filter300Title: "Exclude ≤300μm Fine Filter",
    filter300Desc: "Excludes fine particles ≤300μm and recalculates main particle metrics.",
    excludedCountNotice: (count) => `(${count} particles ≤300μm excluded)`,
    filterOn: "Filter Active (>300μm)",
    filterOff: "All Particles (0μm~)",

    // 200μm Fine Warning
    fineWarningTitle: "Excessive Fines (≤200μm) Warning",
    fineWarningNotice: (ratio) => `Fine particles (≤200μm) account for ${ratio}% of total coffee mass, exceeding the 10% limit. Excessive fines can clog extraction channels and cause astringency and off-flavors.`,
    fineMassRatioLabel: "≤200μm Fine Ratio (Mass): ",
    fineMassRatioBadge: (ratio) => `≤200μm Fines: ${ratio}%`,

    // Raw Data Modal & Exports
    viewRawData: "View Raw Data",
    rawDataModalTitle: "Particle Measurement Raw Data",
    rawDataModalDesc: "Detailed size and category for detected particles (Sorted from smallest)",
    exportTxtBtn: "Export Text (.txt)",
    exportCsvBtn: "Export Excel (.csv)",
    particleNo: "No.",
    particleSizeUm: "Size (μm)",
    particleSizeMm: "Size (mm)",
    particleClass: "Classification",
    fineLabel: "Fine (<400μm)",
    normalLabel: "Standard (400~1200μm)",
    coarseLabel: "Coarse (>1200μm)",
    totalParticleCount: "Total Particles",
    avgParticleSize: "Avg Size",
    minParticleSize: "Min Size",
    maxParticleSize: "Max Size",
    closeModal: "Close",
    noRawData: "No raw particle data available.",

    // History
    scanHistoryTitle: "Scan Analysis History",
    scanHistoryDesc: "Logs of past coffee grind size comparisons and calibrations",
    detailHistoryBack: "← Back to list",
    detailHistoryTitle: "Past Analysis Record Detail",
    measuredAvgGrind: "Measured Average Grind: ",
    targetBaseValue: "Target Reference Value: ",
    diffFromBase: "Deviation from Reference",
    calibrationAdvice: "Calibration Advice",
    saveAsPresetBtn: "Save as New Preset",
    saveHistoryPresetTitle: "Add Preset from History",
    saveHistoryPresetBtn: "Save",
    deleteLogConfirm: "Are you sure you want to delete this record permanently?",
    deleteLogBtn: "Delete This Record",
    backToListBtn: "Back to List",
    noHistory: "No scan history records found.",
    noHistoryDesc: "After scanning your coffee, click 'Save & View History' on the results page to save the log!",

    // Help
    helpTitle: "Master Guide & Calibration",
    helpDesc: "Instructions for precision calibration and reliable data generation",
    helpSection1Title: "1. Selecting a Reference Object",
    helpSection1Desc: "To mathematically compensate for distance errors, a standard credit card (85.60mm × 53.98mm) is required as an absolute reference. The card and coffee sample must be placed flat on the same plane.",
    helpSection2Title: "2. ArUco Vision Calibration",
    helpSection2Desc: "Even if the camera is slightly tilted or not parallel, the built-in vision engine calculates the corners of the high-contrast card border to perform a Perspective Transform, correcting it as if shot directly from the front.",
    helpSection3Title: "3. Defending Against Glare",
    helpSection3Desc: "Glossy cards can reflect light, making it difficult for the vision engine to detect the edges. Use a matte card if possible, or avoid direct bright lights.",
    helpSection4Title: "4. Fine Calibration Tips",
    helpSection4Desc: "Clean the camera lens and spread the coffee particles thinly without overlap to get more precise measurements.",
    versionInfoName: "App: GRINDMASTER PWA",
    versionInfoVal: `Version: v${packageJson.version} (Release)`,

    // Modals
    addPresetTitle: "Add New Preset",
    editPresetTitle: "Edit Preset",
    presetCategory: "Brewing Method",
    presetName: "Preset Name",
    presetNamePlaceholder: "e.g., Yirgacheffe V60",
    presetAddBtn: "Capture & Register Reference",
    presetSaveBtn: "Save",
    deletePresetConfirmTitle: "Confirm Preset Deletion",
    deletePresetConfirmText: (name) => `Are you sure you want to delete the preset '${name}'?\nThis action cannot be undone.`,
    cancel: "Cancel",
    delete: "Delete",
    deleteConfirmAlert: "Are you sure you want to delete this record?",

    // Categories
    espresso: "Espresso",
    pourOver: "Pour Over",
    frenchPress: "French Press",
    coldBrew: "Cold Brew",
    mokaPot: "Moka Pot",
  }
};

const categoryMap = {
  '에스프레소': { ko: '에스프레소', en: 'Espresso' },
  '푸어 오버': { ko: '푸어 오버', en: 'Pour Over' },
  '프렌치 프레스': { ko: '프렌치 프레스', en: 'French Press' },
  '콜드 침출': { ko: '콜드 침출', en: 'Cold Brew' },
  '모카포트': { ko: '모카포트', en: 'Moka Pot' }
};

const getCategoryLabel = (cat, lang) => {
  return categoryMap[cat]?.[lang] || cat;
};

// 초기 데모 프리셋 데이터
// const INITIAL_PRESETS = [
//   { id: '1', category: '에스프레소', name: '데일리 에스프레소', value: 245, date: '2026년 05월 24일' },
//   { id: '2', category: '푸어 오버', name: 'V60 모닝 브루', value: 680, date: '2026년 05월 20일' },
//   { id: '3', category: '콜드 침출', name: '콜드 브루', value: 1120, date: '2026년 05월 12일' }
// ];

// 입자 분포를 시각화하는 커스텀 컴포넌트
const ParticleDistributionChart = ({ diameters, language, onViewRawData }) => {
  if (!diameters || diameters.length === 0) {
    return (
      <div className="plate p-4 text-center text-xs text-[#8e9192]">
        {TRANSLATIONS[language].particleNone}
      </div>
    );
  }

  // 0~1800μm 범위를 150μm 크기의 12개 세그먼트로 나눕니다.
  const step = 150;
  const bucketCount = 12;
  const buckets = Array(bucketCount).fill(0);
  
  diameters.forEach(d => {
    const idx = Math.min(Math.floor(d / step), bucketCount - 1);
    if (idx >= 0) buckets[idx]++;
  });

  const maxCount = Math.max(...buckets, 1);

  return (
    <div className="plate p-5 space-y-4 border-[#444748]">
      <div className="flex justify-between items-center gap-2">
        <h4 className="text-xs uppercase font-bold text-[#eabda0] tracking-wider">{TRANSLATIONS[language].particleDist}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8e9192] hidden sm:inline">{TRANSLATIONS[language].unitCountRatio}</span>
          {onViewRawData && (
            <button
              onClick={onViewRawData}
              className="px-2.5 py-1 bg-[#eabda0]/15 hover:bg-[#eabda0]/25 text-[#eabda0] border border-[#eabda0]/40 rounded text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title={TRANSLATIONS[language].viewRawData}
            >
              <Table size={13} />
              <span>{TRANSLATIONS[language].viewRawData}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 분포도 그래프 바 구조 */}
      <div className="h-32 flex items-end gap-1.5 pt-4 border-b border-[#444748]/50">
        {buckets.map((count, i) => {
          const pct = (count / maxCount) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* 툴팁 표시 */}
              <div className="absolute -top-6 bg-[#1f2020] border border-[#eabda0]/50 text-[#eabda0] px-1.5 py-0.5 text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-numeric-data">
                {count}{language === 'ko' ? '개' : ' pcs'} ({((count / diameters.length) * 100).toFixed(0)}%)
              </div>
              
              {/* 실질적 세로 막대 */}
              <div 
                style={{ height: `${Math.max(pct, 4)}%` }} 
                className={`w-full transition-all duration-500 rounded-t-sm ${
                  pct > 75 
                    ? 'bg-gradient-to-t from-[#c49a7a] to-[#eabda0]' 
                    : pct > 30 
                      ? 'bg-[#c49a7a]/70' 
                      : 'bg-[#444748]/40'
                }`}
              />
            </div>
          );
        })}
      </div>
      
      {/* 가로 눈금 축 */}
      <div className="flex justify-between text-[8px] text-[#8e9192] px-0.5">
        <span>0μm</span>
        <span>600μm</span>
        <span>1200μm</span>
        <span>1800μm+</span>
      </div>

      {/* 로우 데이터 보기 하단 버튼 */}
      {onViewRawData && (
        <div className="pt-2 border-t border-[#444748]/40">
          <button
            onClick={onViewRawData}
            className="w-full py-2.5 bg-[#1f2020] hover:bg-[#28292a] text-[#eabda0] border border-[#eabda0]/40 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
          >
            <Table size={15} />
            <span>{TRANSLATIONS[language].viewRawData} ({diameters.length}{language === 'ko' ? '개 입자 데이터' : ' particle data'})</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Raw Data 텍스트 내보내기 헬퍼 함수
const handleExportTxt = (diameters, metadata, language) => {
  if (!diameters || diameters.length === 0) return;
  
  const sorted = [...diameters].sort((a, b) => a - b);
  const total = sorted.length;
  const avg = (sorted.reduce((a, b) => a + b, 0) / total).toFixed(1);
  const min = sorted[0].toFixed(1);
  const max = sorted[sorted.length - 1].toFixed(1);
  const dateStr = metadata?.date || new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US');
  const titleStr = metadata?.title || (language === 'ko' ? '원두 입자 측정 결과' : 'Coffee Grind Particle Measurement');

  let content = `==================================================\n`;
  content += `[GRINDMASTER] ${language === 'ko' ? '입자 측정 로우 데이터 Report' : 'Particle Raw Data Report'}\n`;
  content += `==================================================\n`;
  content += `${language === 'ko' ? '프리셋/기록명' : 'Preset/Record'}: ${titleStr}\n`;
  content += `${language === 'ko' ? '측정 일시' : 'Timestamp'}: ${dateStr}\n`;
  content += `${language === 'ko' ? '총 감지 입자 수' : 'Total Particles'}: ${total} ${language === 'ko' ? '개' : 'pcs'}\n`;
  content += `${language === 'ko' ? '평균 입자 굵기' : 'Average Diameter'}: ${avg} μm (${(avg / 1000).toFixed(3)} mm)\n`;
  content += `${language === 'ko' ? '최소 입자 굵기' : 'Min Diameter'}: ${min} μm\n`;
  content += `${language === 'ko' ? '최대 입자 굵기' : 'Max Diameter'}: ${max} μm\n`;
  content += `==================================================\n\n`;

  content += `[${TRANSLATIONS[language].particleNo.padEnd(6)}] ` +
             `[${TRANSLATIONS[language].particleSizeUm.padEnd(14)}] ` +
             `[${TRANSLATIONS[language].particleSizeMm.padEnd(14)}] ` +
             `[${TRANSLATIONS[language].particleClass}]\n`;
  content += `--------------------------------------------------\n`;

  sorted.forEach((d, idx) => {
    const no = (idx + 1).toString().padEnd(6);
    const um = `${d.toFixed(1)} μm`.padEnd(14);
    const mm = `${(d / 1000).toFixed(3)} mm`.padEnd(14);
    let cls = TRANSLATIONS[language].normalLabel;
    if (d < 400) cls = TRANSLATIONS[language].fineLabel;
    else if (d > 1200) cls = TRANSLATIONS[language].coarseLabel;

    content += `${no} ${um} ${mm} ${cls}\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grindmaster_rawdata_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Raw Data 엑셀 (CSV) 내보내기 헬퍼 함수
const handleExportCsv = (diameters, metadata, language) => {
  if (!diameters || diameters.length === 0) return;
  
  const sorted = [...diameters].sort((a, b) => a - b);
  const headers = [
    TRANSLATIONS[language].particleNo,
    TRANSLATIONS[language].particleSizeUm,
    TRANSLATIONS[language].particleSizeMm,
    TRANSLATIONS[language].particleClass
  ];

  let csvRows = [];
  csvRows.push(headers.join(','));

  sorted.forEach((d, idx) => {
    let cls = TRANSLATIONS[language].normalLabel;
    if (d < 400) cls = TRANSLATIONS[language].fineLabel;
    else if (d > 1200) cls = TRANSLATIONS[language].coarseLabel;

    const row = [
      idx + 1,
      d.toFixed(1),
      (d / 1000).toFixed(3),
      `"${cls}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grindmaster_rawdata_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Raw Data 모달 컴포넌트
const RawDataModal = ({ isOpen, onClose, data, language }) => {
  if (!isOpen || !data) return null;

  const diameters = data.diameters ? [...data.diameters].sort((a, b) => a - b) : [];
  const total = diameters.length;
  const avg = total > 0 ? (diameters.reduce((a, b) => a + b, 0) / total).toFixed(1) : 0;
  const min = total > 0 ? diameters[0].toFixed(1) : 0;
  const max = total > 0 ? diameters[total - 1].toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="plate w-full max-w-lg bg-[#131313] border-[#444748] shadow-2xl rounded-xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-[#444748] flex justify-between items-center bg-[#1a1b1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#eabda0]/10 border border-[#eabda0]/30 flex items-center justify-center text-[#eabda0]">
              <Table size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {TRANSLATIONS[language].rawDataModalTitle}
              </h3>
              <p className="text-[11px] text-[#8e9192] mt-0.5">
                {data.title ? `${data.title} • ` : ''}{TRANSLATIONS[language].rawDataModalDesc}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#8e9192] hover:text-white hover:bg-[#28292a] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Summary Badges */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#1f2020] p-2 rounded border border-[#444748]/60">
              <span className="text-[9px] uppercase text-[#8e9192] font-semibold block">{TRANSLATIONS[language].totalParticleCount}</span>
              <span className="text-sm font-bold text-white font-numeric-data">{total}{language === 'ko' ? '개' : ' pcs'}</span>
            </div>
            <div className="bg-[#1f2020] p-2 rounded border border-[#444748]/60">
              <span className="text-[9px] uppercase text-[#8e9192] font-semibold block">{TRANSLATIONS[language].avgParticleSize}</span>
              <span className="text-sm font-bold text-[#eabda0] font-numeric-data">{avg}μm</span>
            </div>
            <div className="bg-[#1f2020] p-2 rounded border border-[#444748]/60">
              <span className="text-[9px] uppercase text-[#8e9192] font-semibold block">{TRANSLATIONS[language].minParticleSize}</span>
              <span className="text-sm font-bold text-blue-400 font-numeric-data">{min}μm</span>
            </div>
            <div className="bg-[#1f2020] p-2 rounded border border-[#444748]/60">
              <span className="text-[9px] uppercase text-[#8e9192] font-semibold block">{TRANSLATIONS[language].maxParticleSize}</span>
              <span className="text-sm font-bold text-red-400 font-numeric-data">{max}μm</span>
            </div>
          </div>

          {/* 200μm 이하 미분 질량 비율 배너 */}
          {(() => {
            let totalVol = 0;
            let fine200Vol = 0;
            let fine200Cnt = 0;
            diameters.forEach(d => {
              const v = Math.pow(d, 3);
              totalVol += v;
              if (d <= 200) {
                fine200Vol += v;
                fine200Cnt++;
              }
            });
            const fineRawRatio = totalVol > 0 ? (fine200Vol / totalVol) * 100 : 0;
            let finePercentStr;
            if (fine200Cnt === 0 || fineRawRatio === 0) {
              finePercentStr = "0";
            } else if (fineRawRatio < 0.01) {
              finePercentStr = "<0.01";
            } else if (fineRawRatio < 0.1) {
              finePercentStr = fineRawRatio.toFixed(2);
            } else {
              finePercentStr = fineRawRatio.toFixed(1);
            }
            const isWarning = fineRawRatio > 10;
            return (
              <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                isWarning 
                  ? 'bg-red-500/15 border-red-500/60 text-red-200' 
                  : 'bg-[#1f2020] border-[#444748] text-[#c4c7c7]'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className={isWarning ? 'text-red-400 animate-pulse' : 'text-[#eabda0]'} />
                  <span>{TRANSLATIONS[language].fineMassRatioLabel}</span>
                </div>
                <span className={`font-bold font-numeric-data px-2 py-0.5 rounded ${
                  isWarning ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-[#28292a] text-green-400'
                }`}>
                  {finePercentStr}% {isWarning ? '(10% 초과 과다)' : '(양호)'}
                </span>
              </div>
            );
          })()}

          {/* Export Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExportTxt(diameters, data, language)}
              className="flex-1 py-2.5 px-3 bg-[#1f2020] hover:bg-[#2a2b2c] border border-[#444748] hover:border-[#eabda0]/50 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <FileText size={15} className="text-[#eabda0]" />
              <span>{TRANSLATIONS[language].exportTxtBtn}</span>
            </button>
            <button
              onClick={() => handleExportCsv(diameters, data, language)}
              className="flex-1 py-2.5 px-3 bg-[#1f2020] hover:bg-[#2a2b2c] border border-[#444748] hover:border-green-500/50 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <FileSpreadsheet size={15} className="text-green-400" />
              <span>{TRANSLATIONS[language].exportCsvBtn}</span>
            </button>
          </div>

          {/* Data Table */}
          {diameters.length > 0 ? (
            <div className="border border-[#444748] rounded-lg max-h-[300px] overflow-y-auto bg-[#0e0e0e] shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#1f2020] text-[#eabda0] text-[10px] uppercase font-bold border-b border-[#444748] z-10 shadow">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-14 border-r border-[#444748]/40">{TRANSLATIONS[language].particleNo}</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#444748]/40">{TRANSLATIONS[language].particleSizeUm}</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#444748]/40">{TRANSLATIONS[language].particleSizeMm}</th>
                    <th className="py-2.5 px-3 text-center">{TRANSLATIONS[language].particleClass}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#28292a] font-numeric-data">
                  {diameters.map((d, idx) => {
                    let badgeColor = "bg-green-500/10 text-green-400 border-green-500/30";
                    let label = TRANSLATIONS[language].normalLabel;

                    if (d < 400) {
                      badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/30";
                      label = TRANSLATIONS[language].fineLabel;
                    } else if (d > 1200) {
                      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                      label = TRANSLATIONS[language].coarseLabel;
                    }

                    return (
                      <tr key={idx} className="hover:bg-[#1a1b1c] transition-colors">
                        <td className="py-2 px-3 text-center text-[#8e9192] text-[11px] border-r border-[#28292a]">{idx + 1}</td>
                        <td className="py-2 px-3 text-right text-white font-bold border-r border-[#28292a]">{d.toFixed(1)} μm</td>
                        <td className="py-2 px-3 text-right text-[#c4c7c7] border-r border-[#28292a]">{(d / 1000).toFixed(3)} mm</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-semibold border rounded-full ${badgeColor}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8e9192] border border-dashed border-[#444748] rounded-lg">
              {TRANSLATIONS[language].noRawData}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#444748] bg-[#1a1b1c] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#28292a] hover:bg-[#333436] text-white text-xs font-bold rounded-lg transition-colors active:scale-95"
          >
            {TRANSLATIONS[language].closeModal}
          </button>
        </div>

      </div>
    </div>
  );
};

// 300μm 이하 미분 제외 필터링 및 동적 지표 계산 헬퍼 함수
const getFilteredMetrics = (rawDiameters, baselineValue, filterActive, language) => {
  if (!rawDiameters || rawDiameters.length === 0) return null;
  
  const sortedRaw = [...rawDiameters].sort((a, b) => a - b);
  const activeDiameters = filterActive 
    ? sortedRaw.filter(d => d > 300) 
    : sortedRaw;
  
  const count = activeDiameters.length;
  const totalRawCount = sortedRaw.length;
  const excludedCount = totalRawCount - count;
  const avgDiameter = count > 0 
    ? activeDiameters.reduce((a, b) => a + b, 0) / count 
    : 0;
  
  const diff = baselineValue ? avgDiameter - baselineValue : 0;
  const diffPercent = baselineValue && baselineValue > 0 
    ? parseFloat(((diff / baselineValue) * 100).toFixed(1)) 
    : 0;

  // 200μm 이하 미분 질량/부피(d^3) 비율 계산 (raw 입자 기준)
  let totalVolume = 0;
  let fine200Volume = 0;
  let fine200Count = 0;
  sortedRaw.forEach(d => {
    const vol = Math.pow(d, 3);
    totalVolume += vol;
    if (d <= 200) {
      fine200Volume += vol;
      fine200Count++;
    }
  });

  const fine200RawRatio = totalVolume > 0 ? (fine200Volume / totalVolume) * 100 : 0;
  let fine200MassPercent;
  if (fine200Count === 0 || fine200RawRatio === 0) {
    fine200MassPercent = "0";
  } else if (fine200RawRatio < 0.01) {
    fine200MassPercent = "<0.01";
  } else if (fine200RawRatio < 0.1) {
    fine200MassPercent = fine200RawRatio.toFixed(2);
  } else {
    fine200MassPercent = fine200RawRatio.toFixed(1);
  }

  const isHighFineWarning = fine200RawRatio > 10;
  
  let advice = TRANSLATIONS[language]?.perfectGrind || '퍼펙트! 현재 굵기가 기준과 일치합니다.';
  if (diffPercent > 5) advice = TRANSLATIONS[language]?.coarseGrind || '원두가 너무 굵습니다. 분쇄도를 더 조여주세요.';
  else if (diffPercent < -5) advice = TRANSLATIONS[language]?.fineGrind || '원두가 너무 얇습니다. 분쇄도를 더 풀어주세요.';

  return {
    diameters: activeDiameters,
    rawDiameters: sortedRaw,
    count,
    totalRawCount,
    excludedCount,
    avgDiameter,
    diff,
    diffPercent,
    advice,
    fine200MassPercent,
    isHighFineWarning
  };
};

// 200μm 이하 미분 과다 붉은색 경고 카드 컴포넌트
const FineWarningCard = ({ fine200MassPercent, isHighFineWarning, language }) => {
  if (fine200MassPercent === undefined || fine200MassPercent === null) return null;
  
  return (
    <div className={`plate p-4 rounded-xl space-y-2 transition-all my-3 ${
      isHighFineWarning 
        ? 'bg-red-500/15 border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' 
        : 'bg-[#18191a] border border-[#444748]'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className={isHighFineWarning ? 'text-red-500 shrink-0' : 'text-[#eabda0] shrink-0'} />
          <h4 className={`text-xs font-extrabold tracking-wider ${
            isHighFineWarning ? 'text-red-400' : 'text-[#eabda0]'
          }`}>
            {TRANSLATIONS[language].fineWarningTitle}
          </h4>
        </div>
        <span className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border whitespace-nowrap ${
          isHighFineWarning 
            ? 'bg-red-500/25 text-red-300 border-red-500/60' 
            : 'bg-[#28292a] text-green-400 border border-green-500/30'
        }`}>
          {TRANSLATIONS[language].fineMassRatioBadge(fine200MassPercent)}
        </span>
      </div>
      
      {isHighFineWarning ? (
        <p className="text-xs text-red-200 font-semibold leading-relaxed border-t border-red-500/30 pt-2">
          {TRANSLATIONS[language].fineWarningNotice(fine200MassPercent)}
        </p>
      ) : (
        <p className="text-[11px] text-[#8e9192] leading-tight pt-1">
          {TRANSLATIONS[language].fineMassRatioLabel}<strong className="text-green-400 font-numeric-data">{fine200MassPercent}%</strong> {language === 'ko' ? '(기준치 10% 이하로 양호합니다)' : '(Within 10% safety limit)'}
        </p>
      )}
    </div>
  );
};

// 300μm 이하 미분 제외 토글 스위치 컴포넌트
const FineFilterToggle = ({ isActive, onToggle, language, excludedCount = 0 }) => {
  return (
    <div className="plate p-3.5 bg-[#18191a] border-[#444748] rounded-xl flex items-center justify-between shadow-sm my-2">
      <div className="flex items-center gap-3 pr-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isActive 
            ? 'bg-[#eabda0]/20 border border-[#eabda0]/50 text-[#eabda0] shadow-[0_0_10px_rgba(234,189,160,0.2)]' 
            : 'bg-[#28292a] border border-[#444748] text-[#8e9192]'
        }`}>
          <Sliders size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white">
              {TRANSLATIONS[language].filter300Title}
            </h4>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full transition-colors ${
              isActive 
                ? 'bg-[#eabda0]/20 text-[#eabda0] border border-[#eabda0]/40' 
                : 'bg-[#28292a] text-[#8e9192] border border-[#444748]'
            }`}>
              {isActive ? TRANSLATIONS[language].filterOn : TRANSLATIONS[language].filterOff}
            </span>
          </div>
          <p className="text-[11px] text-[#8e9192] mt-0.5 leading-snug">
            {TRANSLATIONS[language].filter300Desc}
            {isActive && excludedCount > 0 && (
              <span className="text-[#eabda0] font-semibold block sm:inline sm:ml-1">
                {TRANSLATIONS[language].excludedCountNotice(excludedCount)}
              </span>
            )}
          </p>
        </div>
      </div>
      
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isActive ? 'bg-[#eabda0]' : 'bg-[#333436]'
        }`}
        role="switch"
        aria-checked={isActive}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#131313] shadow-lg ring-0 transition duration-200 ease-in-out ${
            isActive ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default function App() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('grindmaster_lang') || 'ko';
  });

  const toggleLanguage = () => {
    const nextLang = language === 'ko' ? 'en' : 'ko';
    setLanguage(nextLang);
    localStorage.setItem('grindmaster_lang', nextLang);
  };

  const [session, setSession] = useState(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginMessage, setLoginMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDesc = params.get('error_description') || params.get('error');
    if (errorDesc) {
      return decodeURIComponent(errorDesc).replace(/\+/g, ' ');
    }
    if (window.location.hash && window.location.hash.includes('error_description')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        return decodeURIComponent(hashError).replace(/\+/g, ' ');
      }
    }
    return '';
  });

  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'camera', 'history', 'help', 'results'
  const [presets, setPresets] = useState([]);
  // const [loadingPresets, setLoadingPresets] = useState(false);
  const setLoadingPresets = () => {};
  const [historyRecords, setHistoryRecords] = useState([]);
  // const [loadingHistory, setLoadingHistory] = useState(false);
  const setLoadingHistory = () => {};
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', category: '에스프레소' });
  const [showSaveHistoryAsPresetModal, setShowSaveHistoryAsPresetModal] = useState(false);
  const [historyPresetForm, setHistoryPresetForm] = useState({ name: '', category: '에스프레소' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState({ id: '', name: '', category: '' });
  const [presetToDelete, setPresetToDelete] = useState(null);
  const [selectedMasterPreset, setSelectedMasterPreset] = useState(null);
  const [cameraMode, setCameraMode] = useState('compare'); // 'compare', 'register_baseline', 'recalibrate_baseline'
  const [pendingPreset, setPendingPreset] = useState(null); // { name, category, id }
  const [simulatorHasCoffee, setSimulatorHasCoffee] = useState(true); // 시뮬레이터 테스트용 원두 배치 상태
  const [scanError, setScanError] = useState(null); // 원두 미감지 등 촬영 에러 메시지
  
  // Raw Data Modal State
  const [showRawDataModal, setShowRawDataModal] = useState(false);
  const [rawDataPayload, setRawDataPayload] = useState(null);

  // 300μm Fine Filter State
  const [excludeUnder300, setExcludeUnder300] = useState(false);

  const handleOpenRawData = (diameters, title, date, measuredAvg) => {
    setRawDataPayload({
      diameters: diameters || [],
      title: title || '',
      date: date || '',
      measuredAvg: measuredAvg || 0
    });
    setShowRawDataModal(true);
  };
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS] = useState(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    return isIosDevice && !isStandalone;
  });
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);

  // Auth Effect
  useEffect(() => {
    // URL에 에러가 있으면 잡아내서 화면에 표시하고 URL을 정리합니다.
    const params = new URLSearchParams(window.location.search);
    const errorDesc = params.get('error_description') || params.get('error');
    if (errorDesc) {
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (window.location.hash && window.location.hash.includes('error_description')) {
      // Hash 형태의 에러 파싱
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoadingLogin(false);
      if (user) {
        setSession({
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: {
              full_name: user.displayName,
              avatar_url: user.photoURL
            }
          }
        });
      } else {
        setSession(null);
        setPresets([]);
        setHistoryRecords([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 뒤로가기 방지 (popstate 이벤트 처리)
  useEffect(() => {
    // 앱 진입 시 히스토리에 현재 상태를 푸시하여 popstate 이벤트를 잡을 수 있도록 함
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      const confirmLeave = window.confirm(TRANSLATIONS[language].confirmLeave);
      if (confirmLeave) {
        // 사용자가 확인을 누르면 뒤로 가기를 허용 (한 단계 더 뒤로 이동)
        window.history.back();
      } else {
        // 사용자가 취소를 누르면 다시 현재 상태를 푸시하여 페이지에 머무름
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [language]);



  async function fetchPresets() {
    setLoadingPresets(true);
    try {
      const q = query(
        collection(db, 'grindmaster_presets'),
        where('user_id', '==', session.user.id)
      );
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        let presetData = doc.data();
        if (presetData.value < 10) presetData.value = presetData.value * 1000;
        data.push({ id: doc.id, ...presetData });
      });
      
      // 클라이언트 측에서 정렬 (인덱스 에러 방지)
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (data.length === 0) {
        const initFlag = localStorage.getItem(`initialized_${session.user.id}`);
        if (!initFlag) {
          localStorage.setItem(`initialized_${session.user.id}`, 'true');
          
          const defaultPresets = [
            { user_id: session.user.id, category: '에스프레소', name: '데일리 에스프레소', value: 245, created_at: new Date().toISOString() },
            { user_id: session.user.id, category: '푸어 오버', name: 'V60 모닝 브루', value: 680, created_at: new Date().toISOString() },
            { user_id: session.user.id, category: '콜드 침출', name: '콜드 브루', value: 1120, created_at: new Date().toISOString() }
          ];
          
          const batch = writeBatch(db);
          const insertedRefs = [];
          defaultPresets.forEach(preset => {
            const newDocRef = doc(collection(db, 'grindmaster_presets'));
            batch.set(newDocRef, preset);
            insertedRefs.push({ ref: newDocRef, data: preset });
          });
          await batch.commit();
          
          const insertedData = insertedRefs.map(item => ({
            id: item.ref.id,
            ...item.data
          }));
          
          const sortedData = insertedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setPresets(sortedData);
          setSelectedMasterPreset(sortedData[0]);
        } else {
          setPresets([]);
        }
      } else {
        setPresets(data);
        if (data.length > 0) {
          setSelectedMasterPreset(data[0]);
        }
        localStorage.setItem(`initialized_${session.user.id}`, 'true');
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
    setLoadingPresets(false);
  };

  const handleCreateDefaultPresets = async () => {
    if (!session?.user) return;
    setLoadingPresets(true);
    try {
      const defaultPresets = [
        { user_id: session.user.id, category: '에스프레소', name: '데일리 에스프레소', value: 245, created_at: new Date().toISOString() },
        { user_id: session.user.id, category: '푸어 오버', name: 'V60 모닝 브루', value: 680, created_at: new Date().toISOString() },
        { user_id: session.user.id, category: '콜드 침출', name: '콜드 브루', value: 1120, created_at: new Date().toISOString() }
      ];
      
      const batch = writeBatch(db);
      const insertedRefs = [];
      defaultPresets.forEach(preset => {
        const newDocRef = doc(collection(db, 'grindmaster_presets'));
        batch.set(newDocRef, preset);
        insertedRefs.push({ ref: newDocRef, data: preset });
      });
      await batch.commit();
      
      const insertedData = insertedRefs.map(item => ({
        id: item.ref.id,
        ...item.data
      }));
      
      const sortedData = insertedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPresets(sortedData);
      setSelectedMasterPreset(sortedData[0]);
      localStorage.setItem(`initialized_${session.user.id}`, 'true');
    } catch (error) {
      console.error('Error creating default presets:', error);
    }
    setLoadingPresets(false);
  }

  async function fetchHistory() {
    if (!session?.user) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'grindmaster_history'),
        where('user_id', '==', session.user.id)
      );
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        let historyData = doc.data();
        if (historyData.preset_value < 10) historyData.preset_value = historyData.preset_value * 1000;
        if (historyData.measured_value < 10) historyData.measured_value = historyData.measured_value * 1000;
        data.push({ id: doc.id, ...historyData });
      });
      // 클라이언트 측 시간 역순 정렬
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistoryRecords(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    setLoadingHistory(false);
  }

  // Fetch presets and history when session changes
  useEffect(() => {
    if (session?.user) {
      Promise.resolve().then(() => {
        fetchPresets();
        fetchHistory();
      });
    }
  }, [session]);

  const handleSaveHistoryAndGoToHistoryTab = async () => {
    if (!session?.user || !analysisResult) return;
    setLoadingHistory(true);
    try {
      const historyItem = {
        user_id: session.user.id,
        preset_id: selectedMasterPreset ? selectedMasterPreset.id : 'default',
        preset_name: selectedMasterPreset ? selectedMasterPreset.name : '에스프레소용',
        preset_value: selectedMasterPreset ? selectedMasterPreset.value : 0.8,
        measured_value: analysisResult.measured,
        diff_percent: analysisResult.diffPercent !== undefined ? analysisResult.diffPercent : 0,
        advice: analysisResult.advice || '',
        created_at: new Date().toISOString(),
        opencv_data: {
          count: analysisResult.opencv ? (analysisResult.opencv.count || 0) : 0,
          avgAreaPixels: analysisResult.opencv ? (analysisResult.opencv.avgAreaPixels || 0) : 0,
          actualAvgDiameterMm: analysisResult.opencv ? (analysisResult.opencv.actualAvgDiameterMm || 0) : 0,
          maxArea: analysisResult.opencv ? (analysisResult.opencv.maxArea || 0) : 0,
          minArea: analysisResult.opencv ? (analysisResult.opencv.minArea || 0) : 0,
          topImage: analysisResult.opencv ? (analysisResult.opencv.topImage || null) : null,
          diameters: analysisResult.opencv ? (analysisResult.opencv.diameters || []) : []
        }
      };
      
      const docRef = await addDoc(collection(db, 'grindmaster_history'), historyItem);
      const savedData = { id: docRef.id, ...historyItem };
      
      setHistoryRecords(prev => [savedData, ...prev]);
      setCurrentTab('history');
      setSelectedHistoryItem(null);
    } catch (error) {
      console.error('Error saving history record:', error);
    }
    setLoadingHistory(false);
  };

  const deleteHistory = async (id) => {
    try {
      await deleteDoc(doc(db, 'grindmaster_history', id));
      const filtered = historyRecords.filter(h => h.id !== id);
      setHistoryRecords(filtered);
      if (selectedHistoryItem && selectedHistoryItem.id === id) {
        setSelectedHistoryItem(null);
      }
    } catch (error) {
      console.error('Error deleting history record:', error);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingLogin(true);
    setLoginMessage('');
    
    // 포커스 해제로 인한 aria-hidden 충돌 방지
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setLoginMessage(TRANSLATIONS[language].errorOccurred + error.message);
      setLoadingLogin(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  


  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstallPrompt(true);
      return;
    }
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
    }
  };
  
  // 카메라 및 분석 상태
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [scanProgress, setScanProgress] = useState(false);
  const [scanProgressMessage, setScanProgressMessage] = useState('');
  // const [capturedImage, setCapturedImage] = useState(null);
  // const [measuredValue, setMeasuredValue] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSimulator, setIsSimulator] = useState(false);

  // 로컬스토리지 보존 제거됨 - Firebase 사용

  // 카메라 스트림 시작
  const startCamera = async () => {
    setIsSimulator(false);
    setScanError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access denied or error:", err);
      // PC 등 카메라가 없는 환경을 위해 시뮬레이터 모드로 전환
      setIsSimulator(true);
      setCameraActive(true);
    }
  };

  // 카메라 종료 함수
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // 사진 촬영 및 분석 (프론트엔드 OpenCV 적용)
  
  // OpenCV 기반 단일 프레임 분석 헬퍼
  const analyzeSingleFrame = (videoObj) => {
    return new Promise((resolve) => {
      let canvas = document.createElement('canvas');
      canvas.width = videoObj.videoWidth || 1280;
      canvas.height = videoObj.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoObj, 0, 0, canvas.width, canvas.height);
      
      let cardDetected = false;
      let coffeeDetected = false;
      let validAreas = [];
      let opencvData;
      let pixelsPerMm = null;
      let topImage;
      
      if (!window.cv) {
        resolve({ success: false, error: 'OpenCV not loaded' });
        return;
      }
      
      const cv = window.cv;
      let src = cv.imread(canvas);
      const width = src.cols;
      const height = src.rows;
      const isPortrait = width < height;
      
      let cardRect, coffeeRect;
      
      // ROI 최적화: 가장자리 노이즈 제외하고 정중앙 1/3 부분만 타겟팅 (형님 아이디어)
      if (isPortrait) {
        coffeeRect = new cv.Rect(Math.floor(width * 0.33), Math.floor(height * 0.15), Math.floor(width * 0.34), Math.floor(height * 0.25));
        cardRect = new cv.Rect(0, Math.floor(height * 0.55), width, Math.floor(height * 0.40));
      } else {
        coffeeRect = new cv.Rect(Math.floor(width * 0.15), Math.floor(height * 0.33), Math.floor(width * 0.25), Math.floor(height * 0.34));
        cardRect = new cv.Rect(Math.floor(width * 0.55), 0, Math.floor(width * 0.40), height);
      }
      
      let cardROI = src.roi(cardRect);
      let coffeeROI = src.roi(coffeeRect);
      
      // 1. 카드 검증
      let grayCard = new cv.Mat();
      cv.cvtColor(cardROI, grayCard, cv.COLOR_RGBA2GRAY, 0);
      let threshCard = new cv.Mat();
      // 오츠 알고리즘 적용 (조명/색상에 강건한 자동 임계값)
      cv.threshold(grayCard, threshCard, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      
      let cardContours = new cv.MatVector();
      let cardHierarchy = new cv.Mat();
      // 모든 윤곽선을 찾아서, 밝은 배경 안의 어두운 카드도 잡아냄
      cv.findContours(threshCard, cardContours, cardHierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
      
      let bestArea = 0;
      let roiArea = cardROI.cols * cardROI.rows;
      
      for (let i = 0; i < cardContours.size(); ++i) {
        let cnt = cardContours.get(i);
        let area = cv.contourArea(cnt);
        
        // 카드 면적은 10000 이상이면서 가이드 영역 넓이의 95% 미만이어야 함 (전체 테두리 오인 방지)
        if (area > 10000 && area < roiArea * 0.95) {
          let approx = new cv.Mat();
          let peri = cv.arcLength(cnt, true);
          cv.approxPolyDP(cnt, approx, 0.04 * peri, true);
          
          if (approx.rows >= 4 && approx.rows <= 6) {
            if (area > bestArea) {
              bestArea = area;
              cardDetected = true;
              let rect = cv.boundingRect(cnt);
              let maxSide = Math.max(rect.width, rect.height);
              pixelsPerMm = maxSide / 85.6; // 85.6mm 기준
            }
          }
          approx.delete();
        }
      }
      grayCard.delete(); threshCard.delete(); cardContours.delete(); cardHierarchy.delete();

      // 2. 원두 입자 분석
      let gray = new cv.Mat();
      cv.cvtColor(coffeeROI, gray, cv.COLOR_RGBA2GRAY, 0);
      let blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
      let thresholded = new cv.Mat();
      cv.adaptiveThreshold(blurred, thresholded, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 45, 4);

      let maxDiameterLimitMm = 8.0;
      let minPx = 10;
      let maxPx = 5000;
      if (pixelsPerMm && pixelsPerMm > 0) {
        minPx = 0.00785 * pixelsPerMm * pixelsPerMm;
        maxPx = (Math.PI / 4) * maxDiameterLimitMm * maxDiameterLimitMm * pixelsPerMm * pixelsPerMm;
      }
      
      let darkMask = new cv.Mat();
      cv.threshold(blurred, darkMask, 100, 255, cv.THRESH_BINARY_INV);
      cv.bitwise_and(thresholded, darkMask, thresholded);
      darkMask.delete();
      
      let M = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
      cv.morphologyEx(thresholded, thresholded, cv.MORPH_OPEN, M);
      M.delete();
      
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(thresholded, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);
        if (area > minPx && area < maxPx) {
          let rect = cv.boundingRect(cnt);
          const margin = 5;
          const touchesBorder = (rect.x <= margin) || 
                                (rect.y <= margin) || 
                                (rect.x + rect.width >= coffeeROI.cols - margin) || 
                                (rect.y + rect.height >= coffeeROI.rows - margin);
          if (touchesBorder) continue;

          validAreas.push(area);
          cv.drawContours(coffeeROI, contours, i, new cv.Scalar(0, 255, 0, 255), 2, 8, hierarchy, 0);
        }
      }
      
      // 노이즈 방지로 구역이 1/3로 줄었기 때문에 통과 기준 개수도 줄임 (40 -> 10)
      if (validAreas.length >= 10) {
        coffeeDetected = true;
      }
      
      cv.rectangle(src, new cv.Point(cardRect.x, cardRect.y), new cv.Point(cardRect.x + cardRect.width, cardRect.y + cardRect.height), new cv.Scalar(0, 191, 255, 255), 4);
      cv.rectangle(src, new cv.Point(coffeeRect.x, coffeeRect.y), new cv.Point(coffeeRect.x + coffeeRect.width, coffeeRect.y + coffeeRect.height), new cv.Scalar(255, 165, 0, 255), 4);
      cv.imshow(canvas, coffeeROI);
      
      const smallCanvas = document.createElement('canvas');
      const maxDim = 320;
      let sw = coffeeROI.cols;
      let sh = coffeeROI.rows;
      if (sw > maxDim || sh > maxDim) {
        if (sw > sh) {
          sh = Math.round((sh * maxDim) / sw);
          sw = maxDim;
        } else {
          sw = Math.round((sw * maxDim) / sh);
          sh = maxDim;
        }
      }
      smallCanvas.width = sw;
      smallCanvas.height = sh;
      
      let smallMat = new cv.Mat();
      let dsize = new cv.Size(sw, sh);
      cv.resize(coffeeROI, smallMat, dsize, 0, 0, cv.INTER_AREA);
      cv.imshow(smallCanvas, smallMat);
      topImage = smallCanvas.toDataURL('image/jpeg', 0.7);
      smallMat.delete();
      
      const count = validAreas.length;
      let avgAreaPixels = 0;
      let maxArea = 0;
      let minArea = 0;
      let actualAvgDiameterMm = 0;
      let diametersUm = [];
      
      if (count > 0) {
        validAreas.sort((a, b) => a - b);
        minArea = validAreas[0];
        maxArea = validAreas[count - 1];
        avgAreaPixels = validAreas.reduce((a, b) => a + b, 0) / count;
        
        if (pixelsPerMm && pixelsPerMm > 0) {
           let diameters = [];
           for (let i = 0; i < validAreas.length; i++) {
             const area = validAreas[i];
             const areaMm2 = area / (pixelsPerMm * pixelsPerMm);
             const diameterMm = 2 * Math.sqrt(areaMm2 / Math.PI);
             diameters.push(diameterMm);
             diametersUm.push(diameterMm * 1000);
           }
           diameters.sort((a, b) => a - b);
           if (diameters.length > 0) {
             actualAvgDiameterMm = diameters.reduce((a, b) => a + b, 0) / diameters.length;
           } else {
             actualAvgDiameterMm = 0;
           }
        }
      }
      
      actualAvgDiameterMm = actualAvgDiameterMm * 1000; // mm to μm conversion
      opencvData = { count, avgAreaPixels, actualAvgDiameterMm, maxArea, minArea, topImage, diameters: diametersUm };
      
      cardROI.delete(); coffeeROI.delete();
      src.delete(); gray.delete(); blurred.delete(); thresholded.delete();
      contours.delete(); hierarchy.delete();
      
      resolve({ success: true, data: opencvData, cardDetected, coffeeDetected, count });
    });
  };

  // 사진 촬영 및 분석 (연속 3회 다중 분석)
  const capturePhoto = async () => {
    setScanError(null);
    setScanProgress(true);
    setScanProgressMessage('정밀 분석 준비 중...');
    
    let isCardDetected = false;
    let isCoffeeDetected = false;
    let finalMeasured = 0;
    let lastOpencvData = null;
    
    if (videoRef.current && !isSimulator) {
      try {
        let validMeasurements = [];
        let totalCount = 0;
        
        // 3회 반복 캡처
        for (let i = 1; i <= 3; i++) {
          setScanProgressMessage(`정밀 분석 중... (${i}/3)`);
          // 프레임 안정화를 위해 약간 대기
          await new Promise(r => setTimeout(r, 400));
          
          const result = await analyzeSingleFrame(videoRef.current);
          if (result.success) {
            if (result.cardDetected) isCardDetected = true;
            if (result.coffeeDetected) isCoffeeDetected = true;
            
            if (result.data.actualAvgDiameterMm > 0) {
              validMeasurements.push(result.data.actualAvgDiameterMm);
              totalCount += result.count;
              lastOpencvData = result.data;
            }
          }
        }
        
        // 최종 산술 평균 도출 (형님 아이디어 적용)
        if (validMeasurements.length > 0) {
          finalMeasured = validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length;
          // UI 표시용 opencvData 데이터 병합 보정
          if (lastOpencvData) {
            lastOpencvData.actualAvgDiameterMm = finalMeasured;
            lastOpencvData.count = Math.floor(totalCount / validMeasurements.length); // 평균 입자 수
          }
        }
      } catch (err) {
        console.error("OpenCV 처리 오류:", err);
      }
    } else if (isSimulator) {
      // 시뮬레이터 모드 처리
      setScanProgressMessage('가상 환경 분석 중...');
      await new Promise(r => setTimeout(r, 1000));
      
      isCardDetected = true;
      isCoffeeDetected = simulatorHasCoffee;
      
      if (isCoffeeDetected) {
        const baseDiameter = (selectedMasterPreset?.value || 800) / 1000; // temp in mm for sim calculation
        const variance = baseDiameter * 0.05;
        finalMeasured = (baseDiameter + (Math.random() * variance * 2 - variance)) * 1000; // μm for simulator
        
        const simCanvas = document.createElement('canvas');
        simCanvas.width = 320;
        simCanvas.height = 180;
        const ctx = simCanvas.getContext('2d');
        ctx.fillStyle = '#0e0e0e';
        ctx.fillRect(0, 0, 320, 180);
        ctx.strokeStyle = 'rgba(42, 42, 42, 0.4)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 320; x += 15) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 180); ctx.stroke(); }
        for (let y = 0; y < 180; y += 15) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(320, y); ctx.stroke(); }
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 45; i++) {
          ctx.beginPath();
          ctx.ellipse(Math.random() * 280 + 20, Math.random() * 140 + 20, Math.random() * 4 + 3, Math.random() * 4 + 3, Math.random() * Math.PI, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.strokeStyle = '#00bfff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 300, 160);
        
        const simCount = Math.floor(Math.random() * 50) + 120;
        const simDiameters = [];
        for (let i = 0; i < simCount; i++) {
          // finalMeasured 근처로 가우스 비스무리한 난수 생성
          const d = finalMeasured + (Math.random() * 300 - 150);
          simDiameters.push(parseFloat(d.toFixed(1)));
        }
        simDiameters.sort((a, b) => a - b);
        
        lastOpencvData = {
          count: simCount,
          avgAreaPixels: 350,
          actualAvgDiameterMm: finalMeasured,
          maxArea: 800,
          minArea: 80,
          topImage: simCanvas.toDataURL('image/jpeg', 0.7),
          diameters: simDiameters
        };
      }
    }
    
    setScanProgressMessage('');
    setScanProgress(false);

    if (!isCardDetected) {
      setScanError("⚠️ 기준 카드가 감지되지 않았습니다. 신용카드 크기의 카드를 화면에 포함시켜 주세요.");
      return;
    }
    
    if (!isCoffeeDetected || finalMeasured === 0) {
      setScanError("⚠️ 분쇄 원두가 충분히 감지되지 않았습니다. 중앙 가이드 안에 원두를 골고루 펴주세요.");
      return;
    }
    
    if (typeof stopCamera === 'function') stopCamera();
    
    if (cameraMode === 'register_baseline' || cameraMode === 'recalibrate_baseline') {
      setAnalysisResult({ measured: parseFloat(finalMeasured.toFixed(0)), opencv: lastOpencvData });
      setCurrentTab('results');
    } else {
      let baseline = selectedMasterPreset?.value || 800; // baseline is now in μm
      const diff = parseFloat((finalMeasured - baseline).toFixed(0));
      const diffPercent = parseFloat(((diff / baseline) * 100).toFixed(1));
      let recommendation = '퍼펙트! 현재 굵기가 기준과 일치합니다.';
      if (diffPercent > 5) recommendation = '원두가 너무 굵습니다. 분쇄도를 더 조여주세요.';
      else if (diffPercent < -5) recommendation = '원두가 너무 얇습니다. 분쇄도를 더 풀어주세요.';
      setAnalysisResult({ 
        measured: parseFloat(finalMeasured.toFixed(0)), 
        diff, 
        diffPercent, 
        advice: recommendation,
        recommendation, 
        opencv: lastOpencvData 
      });
      setCurrentTab('results');
    }
  };
  const handleStartRegisterBaseline = () => {
    if (!newPreset.name.trim()) {
      alert(language === 'ko' ? '프리셋 이름을 입력해주세요.' : 'Please enter a preset name.');
      return;
    }
    setPendingPreset({ ...newPreset, id: 'new' });
    setCameraMode('register_baseline');
    setShowAddModal(false);
    setCurrentTab('camera');
    startCamera();
  };

  const handleStartRecalibrate = (preset) => {
    setPendingPreset(preset);
    setCameraMode('recalibrate_baseline');
    setCurrentTab('camera');
    startCamera();
  };

  // 촬영 완료 후 기준값 확정 및 저장
  const handleConfirmSaveBaseline = () => {
    if (!pendingPreset) return;
    
    const saveToDB = async () => {
      try {
        if (cameraMode === 'register_baseline') {
          const presetItem = {
            user_id: session.user.id,
            category: pendingPreset.category,
            name: pendingPreset.name,
            value: analysisResult.measured,
            created_at: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'grindmaster_presets'), presetItem);
          const savedData = { id: docRef.id, ...presetItem };
          setPresets([savedData, ...presets]);
          setSelectedMasterPreset(savedData);
        } else if (cameraMode === 'recalibrate_baseline') {
          const docRef = doc(db, 'grindmaster_presets', pendingPreset.id);
          await updateDoc(docRef, { value: analysisResult.measured });
          const updatedPresets = presets.map(p => p.id === pendingPreset.id ? { ...p, value: analysisResult.measured } : p);
          setPresets(updatedPresets);
          const updatedPreset = updatedPresets.find(p => p.id === pendingPreset.id);
          if (updatedPreset) {
            setSelectedMasterPreset(updatedPreset);
          }
        }
      } catch (error) {
        console.error('Error saving baseline:', error);
      }
      
      setPendingPreset(null);
      setCameraMode('compare');
      setCurrentTab('home');
    };
    
    saveToDB();
  };

  // 프리셋 삭제
  const deletePreset = async (id) => {
    try {
      await deleteDoc(doc(db, 'grindmaster_presets', id));
      const filtered = presets.filter(p => p.id !== id);
      setPresets(filtered);
      if (selectedMasterPreset && selectedMasterPreset.id === id) {
        setSelectedMasterPreset(filtered[0] || null);
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
    }
  };

  // 프리셋 필터링
  const filteredPresets = presets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-[#131313] text-[#e4e2e1] flex flex-col items-center justify-center font-sans p-6">
        <div className="w-full max-w-sm space-y-8 bg-[#1b1c1c] p-8 border border-[#444748] shadow-2xl relative">
          {/* 언어 선택 토글 버튼 */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleLanguage}
              className="px-2 py-0.5 text-[10px] font-bold border border-[#444748] hover:border-white hover:text-white text-[#c4c7c7] transition-all bg-[#0e0e0e]"
            >
              {language === 'ko' ? 'English' : '한국어'}
            </button>
          </div>

          <div className="text-center space-y-3 pt-4">
            <div className="flex justify-center items-center gap-2.5">
              <img src={coffeelikeLogo} alt="CoffeeLike Logo" className="w-10 h-10 object-contain rounded-full border border-[#444748]" />
              <h1 className="text-2xl font-bold tracking-tighter text-white">GRINDMASTER</h1>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-white">원두 분쇄도 비교 보정기</p>
              <p className="text-xs text-[#c4c7c7] font-medium">Coffee Grind Size Analyzer</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loadingLogin}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm flex flex-col items-center justify-center disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-xs font-bold">
                  {loadingLogin 
                    ? '연결 중... / Connecting...' 
                    : 'Google 계정으로 로그인 / Sign in with Google'}
                </span>
              </div>
            </button>
            {loginMessage && (
              <p className="text-xs text-center mt-4 text-[#eabda0] font-medium">{loginMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  const activeResultMetrics = analysisResult?.opencv?.diameters 
    ? getFilteredMetrics(
        analysisResult.opencv.diameters, 
        selectedMasterPreset?.value || pendingPreset?.value || 800, 
        excludeUnder300, 
        language
      ) 
    : null;

  const currentMeasured = activeResultMetrics ? activeResultMetrics.avgDiameter : (analysisResult?.measured || 0);
  const currentCount = activeResultMetrics ? activeResultMetrics.count : (analysisResult?.opencv?.count || 0);
  const currentDiffPercent = activeResultMetrics ? activeResultMetrics.diffPercent : (analysisResult?.diffPercent || 0);
  const currentAdvice = activeResultMetrics ? activeResultMetrics.advice : (analysisResult?.advice || '');
  const currentDiameters = activeResultMetrics ? activeResultMetrics.diameters : (analysisResult?.opencv?.diameters || []);

  const activeHistoryMetrics = selectedHistoryItem?.opencv_data?.diameters 
    ? getFilteredMetrics(
        selectedHistoryItem.opencv_data.diameters, 
        selectedHistoryItem.preset_value || 800, 
        excludeUnder300, 
        language
      ) 
    : null;

  const histMeasured = activeHistoryMetrics ? activeHistoryMetrics.avgDiameter : (selectedHistoryItem?.measured_value || 0);
  const histCount = activeHistoryMetrics ? activeHistoryMetrics.count : (selectedHistoryItem?.opencv_data?.count || 0);
  const histDiffPercent = activeHistoryMetrics ? activeHistoryMetrics.diffPercent : (selectedHistoryItem?.diff_percent || 0);
  const histAdvice = activeHistoryMetrics ? activeHistoryMetrics.advice : (
    selectedHistoryItem ? (
      selectedHistoryItem.diff_percent > 5 
        ? TRANSLATIONS[language].coarseGrind 
        : selectedHistoryItem.diff_percent < -5 
          ? TRANSLATIONS[language].fineGrind 
          : TRANSLATIONS[language].perfectGrind
    ) : ''
  );
  const histDiameters = activeHistoryMetrics ? activeHistoryMetrics.diameters : (selectedHistoryItem?.opencv_data?.diameters || []);

  return (
    <div className="min-h-screen bg-[#131313] text-[#e4e2e1] flex flex-col font-sans select-none pb-24">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-[#131313] border-b border-[#444748] backdrop-blur-md bg-opacity-95">
        <button 
          onClick={() => setCurrentTab('help')}
          className="flex items-center justify-center w-10 h-10 hover:bg-[#2a2a2a] transition-colors rounded-full active:scale-95 duration-100"
        >
          <Info size={20} className="text-[#c8c6c5]" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src={coffeelikeLogo} alt="CoffeeLike Logo" className="w-6 h-6 object-contain rounded-full" />
            <h1 className="font-bold tracking-tighter text-lg text-white">GRINDMASTER</h1>
          </div>
          <button
            onClick={toggleLanguage}
            className="px-1.5 py-0.5 text-[9px] font-extrabold border border-[#444748] hover:border-white hover:text-white text-[#c4c7c7] transition-all bg-[#0e0e0e] rounded-sm active:scale-95 duration-75"
          >
            {language === 'ko' ? 'EN' : 'KO'}
          </button>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center w-10 h-10 hover:bg-[#2a2a2a] transition-colors rounded-full active:scale-95 duration-100"
        >
          <Plus size={20} className="text-[#c8c6c5]" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 pt-20 px-6 max-w-xl mx-auto w-full">
        
        {/* TAB 1: HOME (Presets List) */}
        {currentTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            {/* User Dashboard Profile */}
            {session?.user && (
              <div className="flex items-center justify-between bg-[#1b1c1c] border border-[#444748] p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  {session.user.user_metadata?.avatar_url ? (
                    <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-12 h-12 rounded-full border border-[#444748]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2a2a2a] border border-[#444748] flex items-center justify-center">
                      <User size={24} className="text-[#8e9192]" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-white tracking-tight">{session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'}</h2>
                    <p className="text-[11px] text-[#c4c7c7] font-medium">{session.user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex flex-col items-center justify-center p-2 text-[#8e9192] hover:text-[#eabda0] transition-colors active:scale-95"
                >
                  <LogOut size={20} />
                  <span className="text-[10px] mt-1 font-bold">{TRANSLATIONS[language].logout}</span>
                </button>
              </div>
            )}

            {/* Install PWA Button */}
            {(deferredPrompt || isIOS) && (
              <button 
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1b1c1c] hover:bg-[#2a2a2a] text-[#eabda0] font-bold transition-colors text-sm border border-[#eabda0]/50"
              >
                <Download size={18} />
                {TRANSLATIONS[language].installApp}
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-[#8e9192]" size={18} />
              <input 
                type="text"
                placeholder={TRANSLATIONS[language].searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors py-3 pl-12 pr-4 text-on-surface placeholder-[#c4c7c7] outline-none text-sm rounded-none"
              />
            </div>

            {/* Master Preset Spotlight */}
            {selectedMasterPreset && (
              <div className="plate p-5 space-y-3 border-white">
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-xs text-[#eabda0] tracking-wider uppercase font-bold flex items-center gap-1">
                    <Sparkles size={12} /> {TRANSLATIONS[language].activeMaster}
                  </span>
                  <span className="text-xs text-[#c4c7c7]">{getCategoryLabel(selectedMasterPreset.category, language)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-[#444748] pb-4">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">{selectedMasterPreset.name}</h3>
                    <p className="text-xs text-[#c4c7c7] mt-1">{TRANSLATIONS[language].baseDate}{formatDate(selectedMasterPreset.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-numeric-data text-4xl text-white block">{selectedMasterPreset.value.toFixed(0)}</span>
                    <span className="text-xs text-[#c4c7c7]">μm</span>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStartRecalibrate(selectedMasterPreset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444748] hover:border-white text-xs font-semibold text-white transition-colors"
                  >
                    <Camera size={12} />
                    {TRANSLATIONS[language].recalibrateBtn}
                  </button>
                </div>
              </div>
            )}

            {/* Saved Presets Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h2 className="text-lg font-bold text-white">{TRANSLATIONS[language].savedPresets}</h2>
                <div className="flex items-center gap-2">
                  {presets.length === 0 && (
                    <button 
                      onClick={handleCreateDefaultPresets}
                      className="text-xs text-[#eabda0] border border-[#eabda0] hover:bg-[#eabda0] hover:text-black transition-colors px-2 py-0.5 font-bold"
                    >
                      {TRANSLATIONS[language].createDefaultBtn}
                    </button>
                  )}
                  <span className="text-xs text-[#c4c7c7] uppercase bg-[#1f2020] px-2 py-0.5 border border-[#444748]">
                    {filteredPresets.length} {TRANSLATIONS[language].listCount}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {filteredPresets.map(preset => (
                  <div 
                    key={preset.id}
                    onClick={() => setSelectedMasterPreset(preset)}
                    className={`bg-[#1b1c1c] border p-4 transition-all cursor-pointer flex justify-between items-center group ${
                      selectedMasterPreset?.id === preset.id ? 'border-white bg-[#1f2020]' : 'border-[#444748] hover:border-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] uppercase font-bold bg-[#353535] text-[#e4e2e1] px-2 py-0.5">
                        {getCategoryLabel(preset.category, language)}
                      </span>
                      <h4 className="font-bold text-white text-base">{preset.name}</h4>
                      <p className="text-xs text-[#c4c7c7]">{formatDate(preset.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-numeric-data text-xl text-white block">{preset.value.toFixed(0)}</span>
                        <span className="text-[10px] text-[#c4c7c7]">μm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPreset({ id: preset.id, name: preset.name, category: preset.category });
                            setShowEditModal(true);
                          }}
                          className="text-[#8e9192] hover:text-white p-1 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPresetToDelete({ id: preset.id, name: preset.name });
                          }}
                          className="text-[#8e9192] hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPresets.length === 0 && (
                  <p className="text-center text-sm text-[#c4c7c7] py-8">{TRANSLATIONS[language].noPresets}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAMERA (Scanner Screen) */}
        {currentTab === 'camera' && (
          <div className="relative h-[calc(100vh-12rem)] w-full bg-black overflow-hidden flex flex-col items-center justify-between border border-[#444748]">
            {/* Camera Preview */}
            <div className="absolute inset-0 z-0 bg-neutral-900 flex items-center justify-center">
              {isSimulator ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                    <Zap size={32} className="text-[#eabda0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{TRANSLATIONS[language].cameraSimulator}</h3>
                    <p className="text-xs text-[#c4c7c7] mt-1 max-w-xs mx-auto font-medium">
                      {TRANSLATIONS[language].cameraSimDesc}
                    </p>
                  </div>
                  {/* 시뮬레이터 상태 제어 스위치 추가 */}
                  <div className="z-30 pointer-events-auto bg-[#1b1c1c] border border-[#444748] px-3 py-1.5 flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#c4c7c7]">{TRANSLATIONS[language].beanPlacement}:</span>
                    <button 
                      onClick={() => setSimulatorHasCoffee(!simulatorHasCoffee)}
                      className={`text-xs px-2.5 py-1 font-bold transition-all ${
                        simulatorHasCoffee ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {simulatorHasCoffee ? TRANSLATIONS[language].beanPlaced : TRANSLATIONS[language].beanNone}
                    </button>
                  </div>
                </div>
              ) : (
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Scan Beam Effect */}
            {cameraActive && (
              <div className="scanner-line absolute left-0 right-0 z-20 pointer-events-none" />
            )}

            {/* Viewport UI Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#131313]/90 via-transparent to-[#131313]/90" />

            {/* Overlay Guides */}
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-between p-6">
              {/* Instruction banner */}
              <div className="w-full text-center space-y-2">
                <span className="inline-block bg-[#2a2a2a]/95 text-white border border-[#444748] px-4 py-2 text-xs font-semibold rounded-none">
                  {cameraMode === 'register_baseline' 
                    ? TRANSLATIONS[language].registerBaselineGuide(pendingPreset?.name)
                    : cameraMode === 'recalibrate_baseline'
                      ? TRANSLATIONS[language].recalibrateBaselineGuide(pendingPreset?.name)
                      : selectedMasterPreset 
                        ? TRANSLATIONS[language].basedOnPreset(selectedMasterPreset.name) 
                        : TRANSLATIONS[language].compareGuide}
                </span>

                {scanError && (
                  <div className="bg-red-950/90 border border-red-500 text-red-200 text-xs px-4 py-2 text-center max-w-xs mx-auto">
                    {scanError}
                  </div>
                )}
              </div>

              {/* ROI Target Boxes */}
              <div className="flex flex-col gap-6 items-center justify-center my-auto pointer-events-none w-full px-6">
                {/* Coffee Target Area */}
                <div className="w-1/3 aspect-video min-w-[200px] border-2 border-dashed border-[#ffa500]/80 rounded-lg flex flex-col items-center justify-center bg-black/10 shadow-[0_0_15px_rgba(255,165,0,0.3)]">
                  <span className="text-[10px] text-[#ffa500] font-bold tracking-widest uppercase flex items-center gap-1 drop-shadow-md">{TRANSLATIONS[language].coffeeSampleArea}</span>
                  <span className="text-[9px] text-white font-bold mt-1 text-center px-2 drop-shadow-md whitespace-pre-line leading-relaxed">{TRANSLATIONS[language].coffeeSampleGuide}</span>
                </div>

                {/* Card Target Area */}
                <div 
                  className="w-64 border-2 border-dashed border-[#00bfff]/60 rounded-lg flex flex-col items-center justify-center bg-black/45 backdrop-blur-xs"
                  style={{ aspectRatio: '85.6/53.98' }}
                >
                  <span className="text-[10px] text-[#00bfff] font-bold tracking-widest uppercase flex items-center gap-1">{TRANSLATIONS[language].creditCardArea}</span>
                  <span className="text-[9px] text-[#c4c7c7] mt-1 text-center font-medium">{TRANSLATIONS[language].creditCardGuide}</span>
                </div>
              </div>

              {/* Trigger Button */}
              <div className="w-full relative flex justify-center pb-4 pointer-events-auto">
                {scanProgress && scanProgressMessage && (
                  <div className="absolute -top-10 w-full text-center pointer-events-none">
                    <span className="bg-black/80 text-[#00ff00] px-3 py-1 font-bold text-xs rounded-full border border-[#00ff00]/50 animate-pulse">{scanProgressMessage}</span>
                  </div>
                )}
                <button 
                  onClick={capturePhoto}
                  disabled={scanProgress}
                  className="w-16 h-16 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    {scanProgress ? (
                      <div className="w-6 h-6 border-4 border-[#131313] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={24} className="text-black" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESULTS (Analysis Results) */}
        {currentTab === 'results' && analysisResult && (
          <div className="space-y-6 animate-fadeIn">
              {cameraMode === 'register_baseline' || cameraMode === 'recalibrate_baseline' ? (
                // 기준 분쇄도 등록/갱신 모드 결과 화면
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <span className="inline-block bg-[#eabda0]/10 border border-[#eabda0]/30 text-[#eabda0] text-[10px] uppercase font-bold px-3 py-1">
                      {TRANSLATIONS[language].analysisComplete}
                    </span>
                    <h2 className="text-xl font-bold text-white font-medium">
                      {cameraMode === 'register_baseline' ? TRANSLATIONS[language].analysisCompleteRegister(pendingPreset?.name) : TRANSLATIONS[language].analysisCompleteRecalibrate(pendingPreset?.name)}
                    </h2>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    {/* 촬영된 원두 이미지 시각화 */}
                    <div className="plate w-64 h-64 overflow-hidden relative active-border border-2">
                      {analysisResult?.opencv?.topImage ? (
                        <img src={analysisResult.opencv.topImage} alt="OpenCV Top" className="w-full h-full object-contain bg-[#0e0e0e]" />
                      ) : (
                        <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                          <div className="w-full h-full opacity-75 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:7px_7px] contrast-125" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-[#444748]">
                        <span className="text-[10px] font-bold text-white uppercase">{TRANSLATIONS[language].capturedCoffeeSample} ({currentCount}{language === 'ko' ? '개' : ' pcs'})</span>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-xs text-[#c4c7c7] font-semibold uppercase block">{TRANSLATIONS[language].analyzedAvgDiameter}</span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-numeric-data text-5xl text-white block">{currentMeasured.toFixed(0)}</span>
                        <span className="text-sm text-[#c4c7c7]">μm</span>
                      </div>
                    </div>
                  </div>

                  <div className="plate p-5 space-y-2">
                    <h4 className="text-xs uppercase font-bold text-[#c4c7c7] tracking-wider flex items-center gap-1.5">
                      <Info size={14} className="text-[#eabda0]" /> {language === 'ko' ? '안내' : 'Info'}
                    </h4>
                    <p className="text-sm text-[#e4e2e1] leading-relaxed whitespace-pre-line">
                      {TRANSLATIONS[language].resultAdvice(currentMeasured.toFixed(0))}
                    </p>
                  </div>

                  {/* 200μm 이하 미분 과다 붉은색 경고 카드 */}
                  {activeResultMetrics && (
                    <FineWarningCard 
                      fine200MassPercent={activeResultMetrics.fine200MassPercent}
                      isHighFineWarning={activeResultMetrics.isHighFineWarning}
                      language={language}
                    />
                  )}

                  {/* 300μm 미분 제외 필터 스위치 */}
                  {analysisResult?.opencv?.diameters && (
                    <FineFilterToggle 
                      isActive={excludeUnder300} 
                      onToggle={() => setExcludeUnder300(!excludeUnder300)} 
                      language={language} 
                      excludedCount={activeResultMetrics?.excludedCount || 0} 
                    />
                  )}

                  {/* 입도 분포도 그래프 추가 */}
                  {currentDiameters.length > 0 && (
                    <ParticleDistributionChart 
                      diameters={currentDiameters} 
                      language={language} 
                      onViewRawData={() => handleOpenRawData(
                        currentDiameters, 
                        pendingPreset?.name || (cameraMode === 'register_baseline' ? '새 마스터 기준' : '마스터 보정'), 
                        new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US'), 
                        currentMeasured
                      )} 
                    />
                  )}

                  {/* Bottom: 극과 극 클로즈업 (나무) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">{TRANSLATIONS[language].maxParticle}</span>
                      <div className="plate aspect-square overflow-hidden border-2 border-red-500/50 relative">
                        {analysisResult?.opencv?.maxImage ? (
                          <img src={analysisResult.opencv.maxImage} alt="OpenCV Max" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                              <div className="w-full h-full opacity-80 bg-[radial-gradient(#2a2a2a_3px,transparent_3px)] [background-size:24px_24px] contrast-150 scale-150" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-24 h-20 border-2 border-red-500 rounded-[45%] bg-[#1a1a1a]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                            </div>
                          </>
                        )}
                        <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-red-500/50">
                          <span className="text-[10px] font-bold text-red-400 uppercase">MAX AREA {analysisResult?.opencv && `(${analysisResult.opencv.maxArea}px)`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">{TRANSLATIONS[language].minParticle}</span>
                      <div className="plate aspect-square overflow-hidden border-2 border-blue-500/50 relative">
                        {analysisResult?.opencv?.minImage ? (
                          <img src={analysisResult.opencv.minImage} alt="OpenCV Min" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                              <div className="w-full h-full opacity-60 bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] [background-size:6px_6px] contrast-150 scale-50" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-blue-500 rounded-[50%] bg-[#1a1a1a]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                            </div>
                          </>
                        )}
                        <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-blue-500/50">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">MIN AREA {analysisResult?.opencv && `(${analysisResult.opencv.minArea}px)`}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Marketing Tip */}
                  <div className="plate p-4 bg-[#eabda0]/10 border border-[#eabda0]/30 mt-2">
                    <p className="text-sm text-[#eabda0] font-bold flex items-start gap-2 leading-relaxed">
                      <span className="text-lg">💡</span>
                      <span>{TRANSLATIONS[language].cleanGrinderTip}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button 
                      onClick={handleConfirmSaveBaseline}
                      className="flex-1 py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm"
                    >
                      {TRANSLATIONS[language].saveMasterBtn}
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentTab('camera');
                        startCamera();
                      }}
                      className="flex-1 py-3 border border-[#444748] hover:border-white font-bold active:scale-95 transition-transform text-sm text-white"
                    >
                      {TRANSLATIONS[language].retakeBtn}
                    </button>
                  </div>
                </div>
              ) : (
                // 기존 비교 모드 -> OpenCV 시뮬레이션 모드
                <div className="space-y-6">
                  {/* Top: 전체 분석 샷 (숲) */}
                  <div className="space-y-2">
                    <div className="plate w-full h-48 overflow-hidden active-border border-2 relative">
                      {analysisResult?.opencv?.topImage ? (
                        <img src={analysisResult.opencv.topImage} alt="OpenCV Top" className="w-full h-full object-contain bg-[#0e0e0e]" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                            <div className="w-full h-full opacity-60 bg-[radial-gradient(#2a2a2a_2px,transparent_2px)] [background-size:12px_12px] contrast-150" />
                          </div>
                          <div className="absolute inset-4 border border-[#00ff00]/20 flex flex-wrap gap-3 p-3 overflow-hidden opacity-80">
                             <div className="w-5 h-6 border border-[#00ff00] rounded-[40%]"></div>
                             <div className="w-6 h-4 border border-[#00ff00] rounded-[50%] mt-2"></div>
                             <div className="w-7 h-5 border border-[#00ff00] rounded-[45%] ml-4"></div>
                             <div className="w-4 h-4 border border-[#00ff00] rounded-[30%]"></div>
                             <div className="w-5 h-7 border border-[#00ff00] rounded-[40%] mt-1"></div>
                             <div className="w-3 h-3 border border-[#00ff00] rounded-[50%]"></div>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-[#444748]">
                        <span className="text-[10px] font-bold text-[#00ff00] uppercase">CV2.THRESH_OTSU ({currentCount}{language === 'ko' ? '개' : ' pcs'})</span>
                      </div>
                    </div>
                    <div className="text-center mt-4 mb-2">
                      <p className="text-lg font-bold text-white">
                        {TRANSLATIONS[language].todayAvgGrind(currentMeasured.toFixed(0))}
                      </p>
                      <p className="text-xs text-[#c4c7c7] mt-1">({selectedMasterPreset ? TRANSLATIONS[language].basedOnPreset(selectedMasterPreset.name) : (language === 'ko' ? '에스프레소용' : 'For Espresso')})</p>
                    </div>
                  </div>

                  {/* 차이 분석 및 조언 */}
                  <div className="plate p-5 space-y-3">
                    <div className="flex justify-between items-center border-b border-[#444748] pb-2">
                      <span className="text-xs uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].diffFromBase}</span>
                      <span className={`text-sm font-bold ${
                        currentDiffPercent > 10 || currentDiffPercent < -10 ? 'text-[#eabda0]' : 'text-green-400'
                      }`}>
                        {currentDiffPercent > 0 ? `+${currentDiffPercent}` : currentDiffPercent}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#8e9192] uppercase font-bold">{TRANSLATIONS[language].calibrationAdvice}</span>
                      <p className="text-sm text-white font-medium">
                        {currentAdvice}
                      </p>
                    </div>
                  </div>

                  {/* 200μm 이하 미분 과다 붉은색 경고 카드 */}
                  {activeResultMetrics && (
                    <FineWarningCard 
                      fine200MassPercent={activeResultMetrics.fine200MassPercent}
                      isHighFineWarning={activeResultMetrics.isHighFineWarning}
                      language={language}
                    />
                  )}

                  {/* 300μm 미분 제외 필터 스위치 */}
                  {analysisResult?.opencv?.diameters && (
                    <FineFilterToggle 
                      isActive={excludeUnder300} 
                      onToggle={() => setExcludeUnder300(!excludeUnder300)} 
                      language={language} 
                      excludedCount={activeResultMetrics?.excludedCount || 0} 
                    />
                  )}

                  {/* 입도 분포도 그래프 추가 */}
                  {currentDiameters.length > 0 && (
                    <ParticleDistributionChart 
                      diameters={currentDiameters} 
                      language={language} 
                      onViewRawData={() => handleOpenRawData(
                        currentDiameters, 
                        selectedMasterPreset?.name || (language === 'ko' ? '에스프레소용' : 'For Espresso'), 
                        new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US'), 
                        currentMeasured
                      )} 
                    />
                  )}

                  {/* Bottom: 극과 극 클로즈업 (나무) */}
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">{TRANSLATIONS[language].maxParticle}</span>
                    <div className="plate aspect-square overflow-hidden border-2 border-red-500/50 relative">
                      {analysisResult?.opencv?.maxImage ? (
                        <img src={analysisResult.opencv.maxImage} alt="OpenCV Max" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                            <div className="w-full h-full opacity-80 bg-[radial-gradient(#2a2a2a_3px,transparent_3px)] [background-size:24px_24px] contrast-150 scale-150" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-20 border-2 border-red-500 rounded-[45%] bg-[#1a1a1a]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-red-500/50">
                        <span className="text-[10px] font-bold text-red-400 uppercase">MAX AREA {analysisResult?.opencv && `(${analysisResult.opencv.maxArea}px)`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">{TRANSLATIONS[language].minParticle}</span>
                    <div className="plate aspect-square overflow-hidden border-2 border-blue-500/50 relative">
                      {analysisResult?.opencv?.minImage ? (
                        <img src={analysisResult.opencv.minImage} alt="OpenCV Min" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                            <div className="w-full h-full opacity-60 bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] [background-size:6px_6px] contrast-150 scale-50" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-500 rounded-[50%] bg-[#1a1a1a]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-blue-500/50">
                        <span className="text-[10px] font-bold text-blue-400 uppercase">MIN AREA {analysisResult?.opencv && `(${analysisResult.opencv.minArea}px)`}</span>
                      </div>
                    </div>
                  </div>
                </div>

                                {/* Marketing Tip */}
                <div className="plate p-4 bg-[#eabda0]/10 border border-[#eabda0]/30 mt-2">
                  <p className="text-sm text-[#eabda0] font-bold flex items-start gap-2 leading-relaxed">
                    <span className="text-lg">💡</span>
                    <span>{TRANSLATIONS[language].cleanGrinderTip}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setCurrentTab('camera');
                      startCamera();
                    }}
                    className="flex-1 py-3 bg-white text-black font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw size={16} /> {TRANSLATIONS[language].retakeBtnResult}
                  </button>
                  <button 
                    onClick={handleSaveHistoryAndGoToHistoryTab}
                    className="flex-1 py-3 border border-[#c49a7a] hover:bg-[#eabda0] hover:text-black font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm text-[#eabda0]"
                  >
                    {TRANSLATIONS[language].saveAndGoHistory}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORY (Scan History) */}
        {currentTab === 'history' && (
          <div className="space-y-6 animate-fadeIn pb-8">
            {selectedHistoryItem ? (
              // 상세 분석 기록 조회 화면
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-[#444748] pb-3">
                    <button 
                      onClick={() => setSelectedHistoryItem(null)}
                      className="flex items-center gap-1 text-xs text-[#c4c7c7] hover:text-white transition-colors"
                    >
                      <span>{TRANSLATIONS[language].detailHistoryBack}</span>
                    </button>
                    <span className="text-xs text-[#c4c7c7]">{formatDate(selectedHistoryItem.created_at)}</span>
                  </div>

                  <div className="text-center space-y-2">
                    <span className="inline-block bg-[#eabda0]/10 border border-[#eabda0]/30 text-[#eabda0] text-[10px] uppercase font-bold px-3 py-1">
                      {TRANSLATIONS[language].detailHistoryTitle}
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      {selectedHistoryItem.preset_name}
                    </h2>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    {/* 촬영된 원두 이미지 시각화 */}
                    <div className="plate w-full h-48 overflow-hidden active-border border-2 relative">
                      {selectedHistoryItem.opencv_data?.topImage ? (
                        <img src={selectedHistoryItem.opencv_data.topImage} alt="Scanned Coffee" className="w-full h-full object-contain bg-[#0e0e0e]" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                            <div className="w-full h-full opacity-60 bg-[radial-gradient(#2a2a2a_2px,transparent_2px)] [background-size:12px_12px] contrast-150" />
                          </div>
                          <div className="absolute inset-4 border border-[#00ff00]/20 flex flex-wrap gap-3 p-3 overflow-hidden opacity-80">
                             <div className="w-5 h-6 border border-[#00ff00] rounded-[40%]"></div>
                             <div className="w-6 h-4 border border-[#00ff00] rounded-[50%] mt-2"></div>
                             <div className="w-7 h-5 border border-[#00ff00] rounded-[45%] ml-4"></div>
                             <div className="w-4 h-4 border border-[#00ff00] rounded-[30%]"></div>
                             <div className="w-5 h-7 border border-[#00ff00] rounded-[40%] mt-1"></div>
                             <div className="w-3 h-3 border border-[#00ff00] rounded-[50%]"></div>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-[#444748]">
                        <span className="text-[10px] font-bold text-[#00ff00] uppercase">
                          {language === 'ko' ? '입자 수:' : 'Particle count:'} {histCount}{language === 'ko' ? '개' : ' pcs'}
                        </span>
                      </div>
                    </div>

                    <div className="text-center mt-4 mb-2">
                      <p className="text-lg font-bold text-white">
                        {TRANSLATIONS[language].measuredAvgGrind}<span className="text-[#eabda0] font-numeric-data">{histMeasured.toFixed(0)}μm</span>
                      </p>
                      <p className="text-xs text-[#c4c7c7] mt-1">({TRANSLATIONS[language].targetBaseValue}{selectedHistoryItem.preset_value.toFixed(0)}μm)</p>
                    </div>
                  </div>

                  {/* 차이 분석 및 조언 */}
                  <div className="plate p-5 space-y-3">
                    <div className="flex justify-between items-center border-b border-[#444748] pb-2">
                      <span className="text-xs uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].diffFromBase}</span>
                      <span className={`text-sm font-bold ${
                        histDiffPercent > 10 || histDiffPercent < -10 ? 'text-[#eabda0]' : 'text-green-400'
                      }`}>
                        {histDiffPercent > 0 ? `+${histDiffPercent}` : histDiffPercent}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#8e9192] uppercase font-bold">{TRANSLATIONS[language].calibrationAdvice}</span>
                      <p className="text-sm text-white font-medium">
                        {histAdvice}
                      </p>
                    </div>
                  </div>

                  {/* 200μm 이하 미분 과다 붉은색 경고 카드 */}
                  {activeHistoryMetrics && (
                    <FineWarningCard 
                      fine200MassPercent={activeHistoryMetrics.fine200MassPercent}
                      isHighFineWarning={activeHistoryMetrics.isHighFineWarning}
                      language={language}
                    />
                  )}

                  {/* 300μm 미분 제외 필터 스위치 */}
                  {selectedHistoryItem.opencv_data?.diameters && (
                    <FineFilterToggle 
                      isActive={excludeUnder300} 
                      onToggle={() => setExcludeUnder300(!excludeUnder300)} 
                      language={language} 
                      excludedCount={activeHistoryMetrics?.excludedCount || 0} 
                    />
                  )}

                  {/* 입도 분포도 그래프 추가 */}
                  {histDiameters.length > 0 && (
                    <ParticleDistributionChart 
                      diameters={histDiameters} 
                      language={language} 
                      onViewRawData={() => handleOpenRawData(
                        histDiameters, 
                        selectedHistoryItem.preset_name, 
                        formatDate(selectedHistoryItem.created_at), 
                        histMeasured
                      )} 
                    />
                  )}

                {/* 극과 극 크롭 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">{TRANSLATIONS[language].maxParticleArea}</span>
                    <div className="plate p-3 text-center border-red-500/50">
                      <span className="font-numeric-data text-lg text-white block">{selectedHistoryItem.opencv_data?.maxArea || 0}</span>
                      <span className="text-[10px] text-[#c4c7c7]">px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">{TRANSLATIONS[language].minParticleArea}</span>
                    <div className="plate p-3 text-center border-blue-500/50">
                      <span className="font-numeric-data text-lg text-white block">{selectedHistoryItem.opencv_data?.minArea || 0}</span>
                      <span className="text-[10px] text-[#c4c7c7]">px</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => {
                      setHistoryPresetForm({ name: '', category: '에스프레소' });
                      setShowSaveHistoryAsPresetModal(true);
                    }}
                    className="w-full py-3 bg-[#eabda0] text-black font-bold active:scale-95 transition-transform text-sm"
                  >
                    {TRANSLATIONS[language].saveAsPresetBtn}
                  </button>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedHistoryItem(null)}
                      className="flex-1 py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm"
                    >
                      {TRANSLATIONS[language].backToListBtn}
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(TRANSLATIONS[language].deleteLogConfirm)) {
                          deleteHistory(selectedHistoryItem.id);
                        }
                      }}
                      className="flex-1 py-3 border border-red-500 hover:bg-red-500 hover:text-white font-bold active:scale-95 transition-transform text-sm text-red-500"
                    >
                      {TRANSLATIONS[language].deleteLogBtn}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 기록 목록 화면
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">{TRANSLATIONS[language].scanHistoryTitle}</h2>
                  <p className="text-xs text-[#c4c7c7] font-medium">{TRANSLATIONS[language].scanHistoryDesc}</p>
                </div>

                <div className="space-y-3">
                  {historyRecords.map(record => {
                    const isFineOrCoarse = record.diff_percent > 10 || record.diff_percent < -10;
                    return (
                      <div 
                        key={record.id}
                        onClick={() => setSelectedHistoryItem(record)}
                        className="bg-[#1b1c1c] border border-[#444748] hover:border-white p-4 transition-all cursor-pointer flex justify-between items-center group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block text-[10px] uppercase font-bold bg-[#353535] text-[#e4e2e1] px-2 py-0.5">
                              {record.preset_name}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 ${
                              isFineOrCoarse ? 'bg-[#eabda0]/10 text-[#eabda0]' : 'bg-green-500/10 text-green-400'
                            }`}>
                              {record.diff_percent > 0 ? `+${record.diff_percent}%` : `${record.diff_percent}%`}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base">
                            {language === 'ko' ? '측정값:' : 'Grind:'} {record.measured_value.toFixed(0)}μm
                          </h4>
                          <p className="text-xs text-[#c4c7c7]">{formatDate(record.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#8e9192] group-hover:text-white transition-colors text-xs">{language === 'ko' ? '상세 보기 →' : 'View Details →'}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(TRANSLATIONS[language].deleteConfirmAlert)) {
                                deleteHistory(record.id);
                              }
                            }}
                            className="text-[#8e9192] hover:text-red-400 p-2 transition-colors active:scale-90"
                            title={language === 'ko' ? '기록 삭제' : 'Delete Record'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {historyRecords.length === 0 && (
                    <div className="plate p-8 text-center space-y-2">
                      <p className="text-sm text-[#c4c7c7]">{TRANSLATIONS[language].noHistory}</p>
                      <p className="text-xs text-[#8e9192] font-medium">{TRANSLATIONS[language].noHistoryDesc}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HELP (Documentation & Guide) */}
        {currentTab === 'help' && (
          <div className="space-y-6 animate-fadeIn pb-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">{TRANSLATIONS[language].helpTitle}</h2>
              <p className="text-xs text-[#c4c7c7] font-medium">{TRANSLATIONS[language].helpDesc}</p>
            </div>

            <div className="space-y-4">
              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].helpSection1Title}</h3>
                <p className="text-xs text-[#c4c7c7] leading-relaxed font-medium">
                  {TRANSLATIONS[language].helpSection1Desc}
                </p>
              </div>

              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].helpSection2Title}</h3>
                <p className="text-xs text-[#c4c7c7] leading-relaxed font-medium">
                  {TRANSLATIONS[language].helpSection2Desc}
                </p>
              </div>

              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].helpSection3Title}</h3>
                <p className="text-xs text-[#c4c7c7] leading-relaxed font-medium">
                  {TRANSLATIONS[language].helpSection3Desc}
                </p>
              </div>

              <div className="plate p-5 space-y-3">
                {language === 'ko' ? (
                  <>
                    <h3 className="font-bold text-white text-base">4. 기본 분쇄도 설정 기준</h3>
                    <div className="text-xs text-[#c4c7c7] space-y-4 leading-relaxed font-medium">
                      <p>
                        GRINDMASTER가 제공하는 기본 분쇄도(μm) 수치는 스페셜티 커피 협회(SCA) 가이드라인과 정밀 커피 시프터 제조사들의 권장 데이터를 바탕으로 산출된 표준 평균값입니다.
                      </p>
                      <ul className="list-disc pl-4 space-y-2 text-[#eabda0]">
                        <li>
                          <span className="font-bold text-white">에스프레소 (약 245μm)</span>: 짧은 시간에 강한 압력으로 추출하기 위해 밀가루와 고운 소금 사이의 아주 고운 굵기(200~400 마이크론)가 필요하며, 쫀쫀한 크레마를 위해 245 마이크론을 기본값으로 설정했습니다.
                        </li>
                        <li>
                          <span className="font-bold text-white">푸어 오버 / V60 (약 680μm)</span>: 자연스러운 물 투과를 위해 백설탕 정도의 굵기(400~800 마이크론)가 적당하며, 밸런스 좋은 추출을 위해 680 마이크론을 기준점으로 잡았습니다.
                        </li>
                        <li>
                          <span className="font-bold text-white">콜드 침출 (약 1120μm)</span>: 장시간 침출 시 텁텁함을 줄이기 위해 굵은소금 정도의 굵기(900~1500 마이크론)가 적합하며, 깔끔한 맛을 위해 1120 마이크론으로 세팅했습니다.
                        </li>
                      </ul>
                      <p className="pt-2 border-t border-[#444748] mt-2">
                        <span className="text-white font-bold">💡 완벽한 나만의 기준점 찾기</span><br/>
                        제공된 기본값은 참고용 평균값입니다. 사용하는 그라인더의 버(Burr) 마모도나 원두 배전도, 습도에 따라 실제 추출은 달라질 수 있으므로, 가장 맛있는 커피를 내리셨을 때의 원두를 직접 촬영하여 고객님만의 마스터 기준점으로 보정(Recalibrate)하여 사용하시는 것을 권장합니다.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-white text-base">4. Standard Grind Size Guidelines</h3>
                    <div className="text-xs text-[#c4c7c7] space-y-4 leading-relaxed font-medium">
                      <p>
                        The default grind size (μm) figures provided by GRINDMASTER are standard average values calculated based on Specialty Coffee Association (SCA) guidelines and recommended data from precision coffee shifter manufacturers.
                      </p>
                      <ul className="list-disc pl-4 space-y-2 text-[#eabda0]">
                        <li>
                          <span className="font-bold text-white">Espresso (approx. 245μm)</span>: A very fine grind size (200~400 microns) between flour and fine salt is required for extraction under strong pressure in a short time. 245 microns is set as the default for rich crema.
                        </li>
                        <li>
                          <span className="font-bold text-white">Pour Over / V60 (approx. 680μm)</span>: A grind size of white sugar (400~800 microns) is appropriate for natural water penetration. 680 microns is set as the reference point for a well-balanced extraction.
                        </li>
                        <li>
                          <span className="font-bold text-white">Cold Brew (approx. 1120μm)</span>: A coarse salt grind size (900~1500 microns) is suitable to reduce bitterness during long brewing. 1120 microns is configured for a clean taste.
                        </li>
                      </ul>
                      <p className="pt-2 border-t border-[#444748] mt-2">
                        <span className="text-white font-bold">💡 Finding Your Perfect Reference</span><br/>
                        The provided default values are reference averages. Actual extraction can vary depending on the burr wear of your grinder, coffee roast level, and humidity. It is recommended to capture the coffee when it tastes best and recalibrate it to your own master reference point.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* CoffeeLike Business Info Footer */}
              <div className="plate p-5 space-y-4 border-t-2 border-[#eabda0] mt-8 bg-[#1b1c1c] text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">COFFEELIKE by {language === 'ko' ? '폴인투게더' : 'Fallin Together'}</h4>
                  <p className="text-[#c4c7c7] leading-relaxed font-medium">
                    {language === 'ko' 
                      ? '경기도 화성시 만세구 향남읍 상신하길로 135번길 5-22 102호' 
                      : 'Room 102, 5-22, Sangsinhagil-ro 135beon-gil, Hyangnam-eup, Hwaseong-si, Gyeonggi-do, Republic of Korea'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#444748]">
                  <a 
                    href="tel:010-3227-5282" 
                    className="flex items-center gap-2 text-[#e4e2e1] hover:text-[#eabda0] transition-colors py-1"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    <span>TEL: 010-3227-5282</span>
                  </a>
                  <a 
                    href="mailto:hatnim72@gmail.com" 
                    className="flex items-center gap-2 text-[#e4e2e1] hover:text-[#eabda0] transition-colors py-1"
                  >
                    <span className="material-symbols-outlined text-base">mail</span>
                    <span>Email: hatnim72@gmail.com</span>
                  </a>
                  <a 
                    href="https://www.instagram.com/coffeelike5282/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-[#e4e2e1] hover:text-[#eabda0] transition-colors py-1"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    <span>Instagram (@coffeelike5282)</span>
                  </a>
                  <a 
                    href="https://naver.me/Fuz5nzqg" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-[#e4e2e1] hover:text-[#eabda0] transition-colors py-1"
                  >
                    <span className="material-symbols-outlined text-base">map</span>
                    <span>{language === 'ko' ? '네이버 플레이스 (Naver Place)' : 'Naver Place'}</span>
                  </a>
                </div>
                
                {/* 서비스 버전 정보 표시 */}
                <div className="pt-3 border-t border-[#444748] flex justify-between items-center text-[10px] text-[#8e9192]">
                  <span>{TRANSLATIONS[language].versionInfoName}</span>
                  <span className="font-numeric-data">{TRANSLATIONS[language].versionInfoVal}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Navigation Drawer */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-[#131313] px-6 pb-safe h-16 border-t border-[#444748] backdrop-blur-md bg-opacity-95">
        <button 
          onClick={() => {
            if (typeof stopCamera === 'function') stopCamera();
            setCameraMode('compare');
            setPendingPreset(null);
            setCurrentTab('home');
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'home' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <Sliders size={20} />
          <span className="text-[10px] mt-1">{TRANSLATIONS[language].preset}</span>
        </button>

        <button 
          onClick={() => {
            setCameraMode('compare');
            setPendingPreset(null);
            setCurrentTab('camera');
            startCamera();
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'camera' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <Camera size={20} />
          <span className="text-[10px] mt-1">{TRANSLATIONS[language].scan}</span>
        </button>

        <button 
          onClick={() => {
            if (typeof stopCamera === 'function') stopCamera();
            setCameraMode('compare');
            setPendingPreset(null);
            setCurrentTab('history');
            setSelectedHistoryItem(null);
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'history' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <History size={20} />
          <span className="text-[10px] mt-1">{TRANSLATIONS[language].history}</span>
        </button>

        <button 
          onClick={() => {
            if (typeof stopCamera === 'function') stopCamera();
            setCameraMode('compare');
            setPendingPreset(null);
            setCurrentTab('help');
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'help' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] mt-1">{TRANSLATIONS[language].help}</span>
        </button>
      </nav>

      {/* Edit Preset Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].editPresetTitle}</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].presetCategory}</label>
                <select 
                  value={editingPreset.category}
                  onChange={(e) => setEditingPreset({...editingPreset, category: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                >
                  <option value="에스프레소">{getCategoryLabel('에스프레소', language)}</option>
                  <option value="푸어 오버">{getCategoryLabel('푸어 오버', language)}</option>
                  <option value="프렌치 프레스">{getCategoryLabel('프렌치 프레스', language)}</option>
                  <option value="콜드 침출">{getCategoryLabel('콜드 침출', language)}</option>
                  <option value="모카포트">{getCategoryLabel('모카포트', language)}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].presetName}</label>
                <input 
                  type="text"
                  placeholder={TRANSLATIONS[language].presetNamePlaceholder}
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset({...editingPreset, name: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                />
              </div>
            </div>

            <button 
              onClick={async () => {
                try {
                  const docRef = doc(db, 'grindmaster_presets', editingPreset.id);
                  await updateDoc(docRef, { name: editingPreset.name, category: editingPreset.category });
                  const updatedPresets = presets.map(p => p.id === editingPreset.id ? { ...p, name: editingPreset.name, category: editingPreset.category } : p);
                  setPresets(updatedPresets);
                  if (selectedMasterPreset?.id === editingPreset.id) {
                    const updatedSelected = updatedPresets.find(p => p.id === editingPreset.id);
                    if (updatedSelected) {
                      setSelectedMasterPreset(updatedSelected);
                    }
                  }
                  setShowEditModal(false);
                } catch (error) {
                  console.error('Error updating preset:', error);
                }
              }}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm flex items-center justify-center"
            >
              {TRANSLATIONS[language].presetSaveBtn}
            </button>
          </div>
        </div>
      )}

      {/* Add Preset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].addPresetTitle}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].presetCategory}</label>
                <select 
                  value={newPreset.category}
                  onChange={(e) => setNewPreset({...newPreset, category: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                >
                  <option value="에스프레소">{getCategoryLabel('에스프레소', language)}</option>
                  <option value="푸어 오버">{getCategoryLabel('푸어 오버', language)}</option>
                  <option value="프렌치 프레스">{getCategoryLabel('프렌치 프레스', language)}</option>
                  <option value="콜드 침출">{getCategoryLabel('콜드 침출', language)}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].presetName}</label>
                <input 
                  type="text"
                  placeholder={TRANSLATIONS[language].presetNamePlaceholder}
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                />
              </div>
            </div>

            <button 
              onClick={handleStartRegisterBaseline}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              {TRANSLATIONS[language].presetAddBtn}
            </button>
          </div>
        </div>
      )}

      {/* Save History as Preset Modal */}
      {showSaveHistoryAsPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].saveHistoryPresetTitle}</h3>
              <button 
                onClick={() => setShowSaveHistoryAsPresetModal(false)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].presetCategory}</label>
                <select 
                  value={historyPresetForm.category}
                  onChange={(e) => setHistoryPresetForm({...historyPresetForm, category: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                >
                  <option value="에스프레소">{getCategoryLabel('에스프레소', language)}</option>
                  <option value="푸어 오버">{getCategoryLabel('푸어 오버', language)}</option>
                  <option value="프렌치 프레스">{getCategoryLabel('프렌치 프레스', language)}</option>
                  <option value="콜드 침출">{getCategoryLabel('콜드 침출', language)}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">{TRANSLATIONS[language].presetName}</label>
                <input 
                  type="text"
                  placeholder={TRANSLATIONS[language].presetNamePlaceholder}
                  value={historyPresetForm.name}
                  onChange={(e) => setHistoryPresetForm({...historyPresetForm, name: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                />
              </div>
            </div>

            <button 
              onClick={async () => {
                if (!historyPresetForm.name.trim()) return;
                try {
                  const newPresetData = {
                    user_id: session.user.id,
                    name: historyPresetForm.name.trim(),
                    category: historyPresetForm.category,
                    value: selectedHistoryItem.measured_value,
                    created_at: new Date().toISOString()
                  };
                  const docRef = await addDoc(collection(db, 'grindmaster_presets'), newPresetData);
                  const savedPreset = { id: docRef.id, ...newPresetData };
                  setPresets(prev => {
                    const updated = [savedPreset, ...prev];
                    return updated.sort((a, b) => {
                      if (a.is_default === b.is_default) {
                        return new Date(b.created_at) - new Date(a.created_at);
                      }
                      return a.is_default ? -1 : 1;
                    });
                  });
                  setShowSaveHistoryAsPresetModal(false);
                } catch (error) {
                  console.error('Error adding preset from history:', error);
                }
              }}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {TRANSLATIONS[language].saveHistoryPresetBtn}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].deletePresetConfirmTitle}</h3>
              <button 
                onClick={() => setPresetToDelete(null)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[#e4e2e1] leading-relaxed whitespace-pre-line">
                {TRANSLATIONS[language].deletePresetConfirmText(presetToDelete.name)}
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setPresetToDelete(null)}
                className="flex-1 py-3 border border-[#444748] hover:border-white font-bold active:scale-95 transition-transform text-sm text-white"
              >
                {TRANSLATIONS[language].cancel}
              </button>
              <button 
                onClick={() => {
                  deletePreset(presetToDelete.id);
                  setPresetToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold active:scale-95 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> {TRANSLATIONS[language].delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Prompt Modal */}
      {showIOSInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn" onClick={() => setShowIOSInstallPrompt(false)}>
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">{TRANSLATIONS[language].installApp}</h3>
              <button 
                onClick={() => setShowIOSInstallPrompt(false)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-[#e4e2e1] leading-relaxed whitespace-pre-line text-center py-4">
                {TRANSLATIONS[language].iosInstallHint}
              </p>
            </div>
            <div className="flex pt-2">
              <button 
                onClick={() => setShowIOSInstallPrompt(false)}
                className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-colors text-sm"
              >
                {language === 'ko' ? '확인' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Modal */}
      <RawDataModal
        isOpen={showRawDataModal}
        onClose={() => setShowRawDataModal(false)}
        data={rawDataPayload}
        language={language}
      />
    </div>
  );
}
