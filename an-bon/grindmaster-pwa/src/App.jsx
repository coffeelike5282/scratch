import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Settings, 
  User, 
  Search, 
  Plus, 
  X, 
  BookOpen, 
  ChevronRight, 
  History, 
  Trash2, 
  Info, 
  Zap, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

// 초기 데모 프리셋 데이터
const INITIAL_PRESETS = [
  { id: '1', category: '에스프레소', name: '데일리 에스프레소', value: 0.245, date: '2026년 05월 24일' },
  { id: '2', category: '푸어 오버', name: 'V60 모닝 브루', value: 0.680, date: '2026년 05월 20일' },
  { id: '3', category: '콜드 침출', name: '콜드 브루', value: 1.120, date: '2026년 05월 12일' }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'camera', 'history', 'help', 'results'
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('gm_presets');
    return saved ? JSON.parse(saved) : INITIAL_PRESETS;
  });
  
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', category: '에스프레소', value: '0.500' });
  const [selectedMasterPreset, setSelectedMasterPreset] = useState(() => {
    return presets[0] || null;
  });
  
  // 카메라 및 분석 상태
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [scanProgress, setScanProgress] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [measuredValue, setMeasuredValue] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSimulator, setIsSimulator] = useState(false);

  // 로컬스토리지 보존
  useEffect(() => {
    localStorage.setItem('gm_presets', JSON.stringify(presets));
  }, [presets]);

  // 카메라 스트림 시작
  const startCamera = async () => {
    setIsSimulator(false);
    setCapturedImage(null);
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
      console.warn("실제 카메라를 시작할 수 없어 가상 시뮬레이터로 대체합니다.");
      setIsSimulator(true);
      setCameraActive(true);
    }
  };

  // 카메라 스트림 중지
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  // 촬영 Trigger
  const capturePhoto = () => {
    setScanProgress(true);
    
    // 시뮬레이션된 컴퓨터 비전 분석 모사 (1.5초 대기 후 분석화면 전환)
    setTimeout(() => {
      setScanProgress(false);
      stopCamera();
      
      // 시뮬레이션용 임의의 측정값 생성 (타겟 대비 15%~30% 편차 발생 유도)
      const targetVal = selectedMasterPreset ? selectedMasterPreset.value : 0.8;
      // 0.8 기준일 때 보통 1.0mm 수준으로 굵게 감지되도록 모사
      const simulatedMeasured = parseFloat((targetVal * (1.15 + Math.random() * 0.15)).toFixed(3));
      
      setMeasuredValue(simulatedMeasured);
      
      // 편차율 산출
      const diffPercent = Math.round(((simulatedMeasured - targetVal) / targetVal) * 100);
      let advice = "";
      if (diffPercent > 10) {
        advice = "'가늘게(FINE)' 방향으로 1칸 조절하세요!";
      } else if (diffPercent < -10) {
        advice = "'굵게(COARSE)' 방향으로 1칸 조절하세요!";
      } else {
        advice = "분쇄도가 완벽합니다! 조절할 필요가 없습니다.";
      }

      setAnalysisResult({
        target: targetVal,
        measured: simulatedMeasured,
        diffPercent,
        advice
      });
      
      setCurrentTab('results');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    }, 1500);
  };

  // 프리셋 추가
  const addPreset = () => {
    if (!newPreset.name.trim()) return;
    const newId = Date.now().toString();
    const formattedDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const presetItem = {
      id: newId,
      category: newPreset.category,
      name: newPreset.name,
      value: parseFloat(parseFloat(newPreset.value).toFixed(3)),
      date: formattedDate
    };
    setPresets([presetItem, ...presets]);
    setSelectedMasterPreset(presetItem);
    setShowAddModal(false);
    setNewPreset({ name: '', category: '에스프레소', value: '0.500' });
  };

  // 프리셋 삭제
  const deletePreset = (id) => {
    const filtered = presets.filter(p => p.id !== id);
    setPresets(filtered);
    if (selectedMasterPreset && selectedMasterPreset.id === id) {
      setSelectedMasterPreset(filtered[0] || null);
    }
  };

  // 프리셋 필터링
  const filteredPresets = presets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="font-bold tracking-tighter text-lg text-white">GRINDMASTER</h1>
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
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-[#8e9192]" size={18} />
              <input 
                type="text"
                placeholder="프리셋 검색..."
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
                    <Sparkles size={12} /> 현재 활성 마스터
                  </span>
                  <span className="text-xs text-[#c4c7c7]">{selectedMasterPreset.category}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">{selectedMasterPreset.name}</h3>
                    <p className="text-xs text-[#c4c7c7] mt-1">기준 설정일: {selectedMasterPreset.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-numeric-data text-4xl text-white block">{selectedMasterPreset.value.toFixed(3)}</span>
                    <span className="text-xs text-[#c4c7c7]">mm</span>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Presets Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h2 className="text-lg font-bold text-white">저장된 프리셋</h2>
                <span className="text-xs text-[#c4c7c7] uppercase bg-[#1f2020] px-2 py-0.5 border border-[#444748]">
                  {filteredPresets.length}개 목록
                </span>
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
                        {preset.category}
                      </span>
                      <h4 className="font-bold text-white text-base">{preset.name}</h4>
                      <p className="text-xs text-[#c4c7c7]">{preset.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-numeric-data text-xl text-white block">{preset.value.toFixed(3)}</span>
                        <span className="text-[10px] text-[#c4c7c7]">mm</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                        }}
                        className="text-[#8e9192] hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredPresets.length === 0 && (
                  <p className="text-center text-sm text-[#c4c7c7] py-8">검색된 프리셋이 없습니다.</p>
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
                    <h3 className="text-lg font-bold text-white">가상 분석 시뮬레이터</h3>
                    <p className="text-xs text-[#c4c7c7] mt-1 max-w-xs mx-auto">
                      에뮬레이터/브라우저 테스트 모드입니다. 하단의 촬영 버튼을 탭하면 가상의 원두 픽셀 매커니즘이 구동됩니다.
                    </p>
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
              <div className="w-full text-center">
                <span className="inline-block bg-[#2a2a2a]/95 text-white border border-[#444748] px-4 py-2 text-xs font-semibold rounded-none">
                  {selectedMasterPreset ? `'${selectedMasterPreset.name}' 마스터 굵기 대조` : '마스터 카드 및 원두를 프레임 안에 맞추세요.'}
                </span>
              </div>

              {/* Dashed Target Align Box */}
              <div className="w-64 h-40 border-2 border-white/40 border-dashed rounded-lg flex flex-col items-center justify-center bg-black/35 backdrop-blur-sm pointer-events-none">
                <Camera size={28} className="text-white mb-2 animate-pulse" />
                <span className="text-[10px] text-white font-bold tracking-widest uppercase">마스터 카드 정렬 영역</span>
              </div>

              {/* Trigger Button */}
              <div className="w-full flex justify-center pb-4 pointer-events-auto">
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
            {/* Macro Comparison Plates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs text-[#c4c7c7] font-semibold uppercase block">현재 샘플</span>
                <div className="plate aspect-square overflow-hidden active-border border-2 relative">
                  <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                    {/* Simulated fine coffee texture */}
                    <div className="w-full h-full opacity-75 bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] [background-size:8px_8px] contrast-150" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-[#444748]">
                    <span className="text-[10px] font-bold text-white uppercase">샘플 A</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-data text-3xl text-white">{analysisResult.measured.toFixed(3)}</span>
                  <span className="text-xs text-[#c4c7c7]">mm</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-[#c4c7c7] font-semibold uppercase block">마스터 타겟</span>
                <div className="plate aspect-square overflow-hidden relative">
                  <div className="absolute inset-0 bg-[#0e0e0e] flex items-center justify-center">
                    <div className="w-full h-full opacity-50 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px]" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-[#131313]/90 px-2 py-0.5 border border-[#444748]">
                    <span className="text-[10px] font-bold text-white uppercase">타겟</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-data text-3xl text-[#c4c7c7]">{analysisResult.target.toFixed(3)}</span>
                  <span className="text-xs text-[#c4c7c7]">mm</span>
                </div>
              </div>
            </div>

            {/* Deviation Banner */}
            <div className={`p-4 border flex items-center gap-3 ${
              analysisResult.diffPercent > 10 ? 'bg-red-950/20 border-red-500/30 text-red-300' : 'bg-green-950/20 border-green-500/30 text-green-300'
            }`}>
              <Zap size={18} className="shrink-0" />
              <p className="font-semibold text-sm">
                {analysisResult.diffPercent > 0 ? `${analysisResult.diffPercent}% 더 굵게 갈림` : `${Math.abs(analysisResult.diffPercent)}% 더 가늘게 갈림`} 
                <span className="text-xs font-normal opacity-85 ml-1">(기준 타겟 대비)</span>
              </p>
            </div>

            {/* Distribution Graph */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#c4c7c7] uppercase">분쇄 분포 그래프</span>
              <div className="plate p-4 space-y-4">
                <div className="h-16 w-full flex items-end gap-[3px] border-b border-[#444748]">
                  <div className="flex-1 bg-[#353535] h-3"></div>
                  <div className="flex-1 bg-[#353535] h-5"></div>
                  <div className="flex-1 bg-[#c8c6c5] h-10 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-[#c4c7c7]">Target</span>
                  </div>
                  <div className="flex-1 bg-[#c8c6c5] h-14"></div>
                  <div className="flex-1 bg-[#c8c6c5] h-12"></div>
                  <div className="flex-1 bg-[#353535] h-7"></div>
                  <div className="flex-1 bg-white h-11 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-white font-bold">Sample</span>
                  </div>
                  <div className="flex-1 bg-[#353535] h-4"></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#c4c7c7] font-semibold">
                  <span>FINE (가늘게)</span>
                  <span className="text-[#eabda0]">적정 표준 범위</span>
                  <span>COARSE (굵게)</span>
                </div>
              </div>
            </div>

            {/* Dial Adjustment Recommendation */}
            <div className="plate p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-[#eabda0]" />
                <h4 className="text-xs uppercase font-bold text-[#c4c7c7] tracking-wider">권장 다이얼 조절값</h4>
              </div>
              <p className="text-lg font-bold text-white">{analysisResult.advice}</p>
              <p className="text-xs text-[#c4c7c7] leading-relaxed">
                현재 측정된 평균 면적 픽셀이 허용 오차를 넘었습니다. 그라인더 다이얼 눈금을 권장 방향으로 미세 교정하신 뒤 다시 테스트해보세요.
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
                <RotateCcw size={16} /> 재촬영 및 분석
              </button>
              <button 
                onClick={() => setCurrentTab('home')}
                className="flex-1 py-3 border border-[#444748] hover:border-white font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm text-white"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: HELP (Documentation & Guide) */}
        {currentTab === 'help' && (
          <div className="space-y-6 animate-fadeIn pb-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">마스터 가이드 & 캘리브레이션</h2>
              <p className="text-xs text-[#c4c7c7]">정밀도 보정 및 신뢰할 수 있는 데이터 산출을 위한 지침서</p>
            </div>

            <div className="space-y-4">
              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">1. 측정용 기준물 선정</h3>
                <p className="text-xs text-[#c4c7c7] leading-relaxed">
                  거리 오차를 수학적으로 보정하기 위해 **신용카드 규격(85.60mm × 53.98mm)**의 절대 기준물이 필요합니다. 
                  촬영 시 원두 샘플과 카드가 동일선상 평면에 나란히 배치되어야 합니다.
                </p>
              </div>

              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">2. 아루코(ArUco) 비전 보정</h3>
                <p className="text-xs text-[#c4c7c7] leading-relaxed">
                  카메라가 약간 삐딱하거나 평행하지 않더라도, 카드 중심의 고대비 사각형 픽셀 마커의 모서리를 역산하여 
                  **정면에서 촬영한 것처럼 원근 보정(Perspective Transform)**하는 수학적 보정이 내장되어 있습니다.
                </p>
              </div>

              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">3. 빛 반사 차단 (Glare Defend)</h3>
                <p className="text-xs text-[#c4c7c7] leading-relaxed">
                  유광 플라스틱 카드는 불빛이 직접 닿을 시 반사가 생겨 비전 엔진이 픽셀 경계선을 놓칠 수 있습니다. 
                  가급적 무광 카드를 사용하거나 직접적인 스포트라이트를 피하고 간접 조명 아래에서 정지된 사진을 촬영해 주십시오.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Navigation Drawer */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-[#131313] px-6 pb-safe h-16 border-t border-[#444748] backdrop-blur-md bg-opacity-95">
        <button 
          onClick={() => {
            stopCamera();
            setCurrentTab('home');
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'home' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <History size={20} />
          <span className="text-[10px] mt-1">프리셋</span>
        </button>

        <button 
          onClick={() => {
            setCurrentTab('camera');
            startCamera();
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'camera' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <Camera size={20} />
          <span className="text-[10px] mt-1">촬영</span>
        </button>

        <button 
          onClick={() => {
            stopCamera();
            setCurrentTab('help');
          }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all active:scale-95 duration-100 ${
            currentTab === 'help' ? 'text-white font-bold border-t-2 border-white' : 'text-[#8e9192] hover:text-white'
          }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] mt-1">도움말</span>
        </button>
      </nav>

      {/* Add Preset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">새 프리셋 추가</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">추출 방식</label>
                <select 
                  value={newPreset.category}
                  onChange={(e) => setNewPreset({...newPreset, category: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                >
                  <option value="에스프레소">에스프레소</option>
                  <option value="푸어 오버">푸어 오버</option>
                  <option value="프렌치 프레스">프렌치 프레스</option>
                  <option value="콜드 침출">콜드 침출</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">프리셋 이름</label>
                <input 
                  type="text"
                  placeholder="예: 예가체프 V60"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">기준 입자 굵기 (mm)</label>
                <input 
                  type="number"
                  step="0.001"
                  value={newPreset.value}
                  onChange={(e) => setNewPreset({...newPreset, value: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none font-numeric-data"
                />
              </div>
            </div>

            <button 
              onClick={addPreset}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm"
            >
              프리셋 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
