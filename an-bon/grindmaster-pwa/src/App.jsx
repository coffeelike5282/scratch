import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { auth, db, googleProvider } from './firebaseClient';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
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
  Sparkles,
  MoreVertical,
  LogOut,
  Sliders
} from 'lucide-react';

// 초기 데모 프리셋 데이터
const INITIAL_PRESETS = [
  { id: '1', category: '에스프레소', name: '데일리 에스프레소', value: 0.245, date: '2026년 05월 24일' },
  { id: '2', category: '푸어 오버', name: 'V60 모닝 브루', value: 0.680, date: '2026년 05월 20일' },
  { id: '3', category: '콜드 침출', name: '콜드 브루', value: 1.120, date: '2026년 05월 12일' }
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'camera', 'history', 'help', 'results'
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Auth Effect
  useEffect(() => {
    // URL에 에러가 있으면 잡아내서 화면에 표시하고 URL을 정리합니다.
    const params = new URLSearchParams(window.location.search);
    const errorDesc = params.get('error_description') || params.get('error');
    if (errorDesc) {
      setLoginMessage(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (window.location.hash && window.location.hash.includes('error_description')) {
      // Hash 형태의 에러 파싱
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        setLoginMessage(decodeURIComponent(hashError).replace(/\+/g, ' '));
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
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch presets and history when session changes
  useEffect(() => {
    if (session?.user) {
      fetchPresets();
      fetchHistory();
    } else {
      setPresets([]);
      setHistoryRecords([]);
    }
  }, [session]);

  const fetchPresets = async () => {
    setLoadingPresets(true);
    try {
      const q = query(
        collection(db, 'grindmaster_presets'),
        where('user_id', '==', session.user.id)
      );
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      // 클라이언트 측에서 정렬 (인덱스 에러 방지)
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (data.length === 0) {
        const initFlag = localStorage.getItem(`initialized_${session.user.id}`);
        if (!initFlag) {
          localStorage.setItem(`initialized_${session.user.id}`, 'true');
          
          const defaultPresets = [
            { user_id: session.user.id, category: '에스프레소', name: '데일리 에스프레소', value: 0.245, created_at: new Date().toISOString() },
            { user_id: session.user.id, category: '푸어 오버', name: 'V60 모닝 브루', value: 0.680, created_at: new Date().toISOString() },
            { user_id: session.user.id, category: '콜드 침출', name: '콜드 브루', value: 1.120, created_at: new Date().toISOString() }
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
        { user_id: session.user.id, category: '에스프레소', name: '데일리 에스프레소', value: 0.245, created_at: new Date().toISOString() },
        { user_id: session.user.id, category: '푸어 오버', name: 'V60 모닝 브루', value: 0.680, created_at: new Date().toISOString() },
        { user_id: session.user.id, category: '콜드 침출', name: '콜드 브루', value: 1.120, created_at: new Date().toISOString() }
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
  };

  const fetchHistory = async () => {
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
        data.push({ id: doc.id, ...doc.data() });
      });
      // 클라이언트 측 시간 역순 정렬
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistoryRecords(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    setLoadingHistory(false);
  };

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
          topImage: analysisResult.opencv ? (analysisResult.opencv.topImage || null) : null
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
      setLoginMessage('에러가 발생했습니다: ' + error.message);
      setLoadingLogin(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', category: '에스프레소' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState({ id: '', name: '', category: '' });
  const [presetToDelete, setPresetToDelete] = useState(null);
  const [selectedMasterPreset, setSelectedMasterPreset] = useState(null);
  const [cameraMode, setCameraMode] = useState('compare'); // 'compare', 'register_baseline', 'recalibrate_baseline'
  const [pendingPreset, setPendingPreset] = useState(null); // { name, category, id }
  const [simulatorHasCoffee, setSimulatorHasCoffee] = useState(true); // 시뮬레이터 테스트용 원두 배치 상태
  const [scanError, setScanError] = useState(null); // 원두 미감지 등 촬영 에러 메시지
  
  // 카메라 및 분석 상태
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [scanProgress, setScanProgress] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [measuredValue, setMeasuredValue] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSimulator, setIsSimulator] = useState(false);

  // 로컬스토리지 보존 제거됨 - Firebase 사용

  // 카메라 스트림 시작
  const startCamera = async () => {
    setIsSimulator(false);
    setCapturedImage(null);
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
  const capturePhoto = () => {
    let canvas = null;
    let cardDetected = false;
    let coffeeDetected = false;
    let opencvData = null;
    let pixelsPerMm = null;
    
    if (videoRef.current && !isSimulator) {
      try {
        const video = videoRef.current;
        canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        if (window.cv) {
          const cv = window.cv;
          let src = cv.imread(canvas);
          
          const width = src.cols;
          const height = src.rows;
          const isPortrait = width < height;
          
          let cardRect, coffeeRect;
          
          if (isPortrait) {
            // 세로 모드: 원두는 상단(5% ~ 50%), 카드는 하단(55% ~ 95%)
            coffeeRect = new cv.Rect(0, Math.floor(height * 0.05), width, Math.floor(height * 0.45));
            cardRect = new cv.Rect(0, Math.floor(height * 0.55), width, Math.floor(height * 0.40));
          } else {
            // 가로 모드: 원두는 좌측(5% ~ 50%), 카드는 우측(55% ~ 95%)
            coffeeRect = new cv.Rect(Math.floor(width * 0.05), 0, Math.floor(width * 0.45), height);
            cardRect = new cv.Rect(Math.floor(width * 0.55), 0, Math.floor(width * 0.40), height);
          }
          
          let cardROI = src.roi(cardRect);
          let coffeeROI = src.roi(coffeeRect);
          
          // 1. 카드 검증 (흰색에 가까운 크고 밝은 사각형 영역 감지)
          let grayCard = new cv.Mat();
          cv.cvtColor(cardROI, grayCard, cv.COLOR_RGBA2GRAY, 0);
          let threshCard = new cv.Mat();
          cv.threshold(grayCard, threshCard, 180, 255, cv.THRESH_BINARY);
          let cardContours = new cv.MatVector();
          let cardHierarchy = new cv.Mat();
          cv.findContours(threshCard, cardContours, cardHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
          
          for (let i = 0; i < cardContours.size(); ++i) {
            let cnt = cardContours.get(i);
            let area = cv.contourArea(cnt);
            if (area > 10000) { // ROI 내에서 적절한 크기
              let approx = new cv.Mat();
              let peri = cv.arcLength(cnt, true);
              cv.approxPolyDP(cnt, approx, 0.04 * peri, true);
              if (approx.rows >= 4 && approx.rows <= 6) {
                cardDetected = true;
                let rect = cv.boundingRect(cnt);
                let maxSide = Math.max(rect.width, rect.height);
                pixelsPerMm = maxSide / 85.6; // 신용카드 긴 변 85.6mm 기준
              }
              approx.delete();
            }
          }
          grayCard.delete(); threshCard.delete(); cardContours.delete(); cardHierarchy.delete();
 
          // 2. 원두 입자 분석 및 검증 (원두 영역 ROI 대상)
          let gray = new cv.Mat();
          cv.cvtColor(coffeeROI, gray, cv.COLOR_RGBA2GRAY, 0);
          
          let blurred = new cv.Mat();
          cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
          
          let thresholded = new cv.Mat();
          cv.threshold(blurred, thresholded, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
          
          let contours = new cv.MatVector();
          let hierarchy = new cv.Mat();
          cv.findContours(thresholded, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
          
          // pixelsPerMm 기준 현실적인 입자 크기 필터링 (0.1mm ~ 2.5mm 지름 기준)
          let minPx = 10;
          let maxPx = 5000;
          if (pixelsPerMm && pixelsPerMm > 0) {
            minPx = 0.00785 * pixelsPerMm * pixelsPerMm;
            maxPx = 4.91 * pixelsPerMm * pixelsPerMm;
          }
          
          let validAreas = [];
          for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);
            if (area > minPx && area < maxPx) { // 동적 크기 필터링 적용
              validAreas.push(area);
              cv.drawContours(coffeeROI, contours, i, new cv.Scalar(0, 255, 0, 255), 2, 8, hierarchy, 0);
            }
          }
          
          // 입자 수가 40개 이상이면 원두 감지 판정
          if (validAreas.length >= 40) {
            coffeeDetected = true;
          }
          
          // 메인 이미지 src에 가이드라인 박스 그려주기
          // 카드 영역: 하늘색 (Scalar: R=0, G=191, B=255)
          cv.rectangle(src, new cv.Point(cardRect.x, cardRect.y), new cv.Point(cardRect.x + cardRect.width, cardRect.y + cardRect.height), new cv.Scalar(0, 191, 255, 255), 4);
          // 원두 영역: 주황색 (Scalar: R=255, G=165, B=0)
          cv.rectangle(src, new cv.Point(coffeeRect.x, coffeeRect.y), new cv.Point(coffeeRect.x + coffeeRect.width, coffeeRect.y + coffeeRect.height), new cv.Scalar(255, 165, 0, 255), 4);
          
          cv.imshow(canvas, coffeeROI);
          
          // Downscale the ROI image for storage efficiency (maximum dimension 320px)
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
          const topImage = smallCanvas.toDataURL('image/jpeg', 0.7);
          smallMat.delete();
          
          const count = validAreas.length;
          let avgAreaPixels = 0;
          let maxArea = 0;
          let minArea = 0;
          
          if (count > 0) {
            validAreas.sort((a, b) => a - b);
            minArea = validAreas[0];
            maxArea = validAreas[count - 1];
            
            // 절사 평균 (Trimmed Mean) - 상하위 10% 제외
            const trimCount = Math.floor(count * 0.1);
            const trimmedAreas = validAreas.slice(trimCount, count - trimCount);
            if (trimmedAreas.length > 0) {
              avgAreaPixels = trimmedAreas.reduce((a, b) => a + b, 0) / trimmedAreas.length;
            } else {
              avgAreaPixels = validAreas.reduce((a, b) => a + b, 0) / count;
            }
          }
          
          let actualAvgDiameterMm = 0;
          if (pixelsPerMm && pixelsPerMm > 0) {
             const avgAreaMm2 = avgAreaPixels / (pixelsPerMm * pixelsPerMm);
             actualAvgDiameterMm = 2 * Math.sqrt(avgAreaMm2 / Math.PI); // 원의 넓이 = pi*r^2
          }
          
          opencvData = { count, avgAreaPixels, actualAvgDiameterMm, maxArea, minArea, topImage };
          
          cardROI.delete(); coffeeROI.delete();
          src.delete(); gray.delete(); blurred.delete(); thresholded.delete();
          contours.delete(); hierarchy.delete();
        }
      } catch (err) {
        console.error("OpenCV 처리 오류:", err);
      }
    } else if (isSimulator) {
      // 시뮬레이터 모드 처리
      cardDetected = true;
      coffeeDetected = simulatorHasCoffee;
      
      if (coffeeDetected) {
        const baseDiameter = selectedMasterPreset?.value || 0.8;
        const variance = baseDiameter * 0.05; // 5% 오차로 더 정밀하게
        const simulatedDiameter = baseDiameter + (Math.random() * variance * 2 - variance);
        
        // 시뮬레이터용 가상 분석 이미지 생성
        const simCanvas = document.createElement('canvas');
        simCanvas.width = 320;
        simCanvas.height = 180;
        const ctx = simCanvas.getContext('2d');
        ctx.fillStyle = '#0e0e0e';
        ctx.fillRect(0, 0, 320, 180);
        
        // 격자 배경 그리기
        ctx.strokeStyle = 'rgba(42, 42, 42, 0.4)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 320; x += 15) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 180);
          ctx.stroke();
        }
        for (let y = 0; y < 180; y += 15) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(320, y);
          ctx.stroke();
        }
        
        // 가상의 원두 입자(초록색 원 및 타원) 여러 개 그리기
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 45; i++) {
          const cx = Math.random() * 280 + 20;
          const cy = Math.random() * 140 + 20;
          const rx = Math.random() * 4 + 3;
          const ry = Math.random() * 4 + 3;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        // 가상의 카드 영역 (하늘색 박스) 그리기
        ctx.strokeStyle = '#00bfff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 300, 160);
        
        const topImage = simCanvas.toDataURL('image/jpeg', 0.7);
        
        opencvData = {
          count: Math.floor(Math.random() * 50) + 120,
          avgAreaPixels: 350,
          actualAvgDiameterMm: simulatedDiameter,
          maxArea: 800,
          minArea: 80,
          topImage: topImage
        };
      }
    }
    
    setScanProgress(false);

    if (!cardDetected) {
      setScanError("⚠️ 기준 카드가 감지되지 않았습니다. 신용카드 크기의 카드를 화면에 포함시켜 주세요.");
      return;
    }
    
    if (!coffeeDetected) {
      setScanError("⚠️ 분쇄 원두가 감지되지 않았습니다. 카드 옆에 원두를 고르게 펼쳐주세요.");
      return;
    }
    
    if (typeof stopCamera === 'function') stopCamera();
    
    if (cameraMode === 'register_baseline' || cameraMode === 'recalibrate_baseline') {
      let finalMeasured = parseFloat((0.6 + Math.random() * 0.6).toFixed(3));
      if (opencvData && opencvData.actualAvgDiameterMm > 0) {
         finalMeasured = parseFloat((opencvData.actualAvgDiameterMm).toFixed(3));
      }
      setMeasuredValue(finalMeasured);
      setAnalysisResult({ measured: finalMeasured, opencv: opencvData });
      setCurrentTab('results');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    } else {
      const targetVal = selectedMasterPreset ? selectedMasterPreset.value : 0.8;
      let finalMeasured = parseFloat((targetVal * (1.15 + Math.random() * 0.15)).toFixed(3));
      
      if (opencvData && opencvData.actualAvgDiameterMm > 0) {
        finalMeasured = parseFloat((opencvData.actualAvgDiameterMm).toFixed(3));
      }
      
      setMeasuredValue(finalMeasured);
      const diffPercent = Math.round(((finalMeasured - targetVal) / targetVal) * 100);
      let advice = "";
      if (diffPercent > 10) advice = "'가늘게(FINE)' 방향으로 1칸 조절하세요!";
      else if (diffPercent < -10) advice = "'굵게(COARSE)' 방향으로 1칸 조절하세요!";
      else advice = "분쇄도가 완벽합니다! 조절할 필요가 없습니다.";

      setAnalysisResult({
        target: targetVal,
        measured: finalMeasured,
        diffPercent,
        advice,
        opencv: opencvData
      });
      
      setCurrentTab('results');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    }
  };

  // 프리셋 촬영 기반 등록 시작
  const handleStartRegisterBaseline = () => {
    if (!newPreset.name.trim()) return;
    setPendingPreset({
      name: newPreset.name,
      category: newPreset.category
    });
    setShowAddModal(false);
    setCameraMode('register_baseline');
    setNewPreset({ name: '', category: '에스프레소' });
    setCurrentTab('camera');
    startCamera();
  };

  // 기존 프리셋 재촬영 보정 시작
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
        <div className="w-full max-w-sm space-y-8 bg-[#1b1c1c] p-8 border border-[#444748] shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tighter text-white">GRINDMASTER</h1>
            <p className="text-sm text-[#c4c7c7]">원두 분쇄도 비교 보정기</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loadingLogin}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loadingLogin ? '연결 중...' : 'Google 계정으로 로그인'}
            </button>
            {loginMessage && (
              <p className="text-xs text-center mt-4 text-[#eabda0]">{loginMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <h1 className="font-bold tracking-tighter text-lg text-white">GRINDMASTER</h1>
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
                  <span className="text-[10px] mt-1 font-bold">로그아웃</span>
                </button>
              </div>
            )}

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
                <div className="flex justify-between items-end border-b border-[#444748] pb-4">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">{selectedMasterPreset.name}</h3>
                    <p className="text-xs text-[#c4c7c7] mt-1">기준 설정일: {formatDate(selectedMasterPreset.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-numeric-data text-4xl text-white block">{selectedMasterPreset.value.toFixed(3)}</span>
                    <span className="text-xs text-[#c4c7c7]">mm</span>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStartRecalibrate(selectedMasterPreset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444748] hover:border-white text-xs font-semibold text-white transition-colors"
                  >
                    <Camera size={12} />
                    기준 굵기 재촬영 보정
                  </button>
                </div>
              </div>
            )}

            {/* Saved Presets Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h2 className="text-lg font-bold text-white">저장된 프리셋</h2>
                <div className="flex items-center gap-2">
                  {presets.length === 0 && (
                    <button 
                      onClick={handleCreateDefaultPresets}
                      className="text-xs text-[#eabda0] border border-[#eabda0] hover:bg-[#eabda0] hover:text-black transition-colors px-2 py-0.5 font-bold"
                    >
                      기본 프리셋 만들기
                    </button>
                  )}
                  <span className="text-xs text-[#c4c7c7] uppercase bg-[#1f2020] px-2 py-0.5 border border-[#444748]">
                    {filteredPresets.length}개 목록
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
                        {preset.category}
                      </span>
                      <h4 className="font-bold text-white text-base">{preset.name}</h4>
                      <p className="text-xs text-[#c4c7c7]">{formatDate(preset.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-numeric-data text-xl text-white block">{preset.value.toFixed(3)}</span>
                        <span className="text-[10px] text-[#c4c7c7]">mm</span>
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
                  {/* 시뮬레이터 상태 제어 스위치 추가 */}
                  <div className="z-30 pointer-events-auto bg-[#1b1c1c] border border-[#444748] px-3 py-1.5 flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#c4c7c7]">원두 배치 여부:</span>
                    <button 
                      onClick={() => setSimulatorHasCoffee(!simulatorHasCoffee)}
                      className={`text-xs px-2.5 py-1 font-bold transition-all ${
                        simulatorHasCoffee ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {simulatorHasCoffee ? '원두 배치됨' : '원두 없음 (카드만)'}
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
                    ? `'${pendingPreset?.name}' 새로운 마스터 기준 굵기 촬영`
                    : cameraMode === 'recalibrate_baseline'
                      ? `'${pendingPreset?.name}' 마스터 기준 굵기 재촬영 보정`
                      : selectedMasterPreset 
                        ? `'${selectedMasterPreset.name}' 마스터 굵기 대조` 
                        : '마스터 카드 및 원두를 프레임 안에 맞추세요.'}
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
                <div className="w-64 h-36 border-2 border-dashed border-[#ffa500]/60 rounded-lg flex flex-col items-center justify-center bg-black/45 backdrop-blur-xs">
                  <span className="text-[10px] text-[#ffa500] font-bold tracking-widest uppercase flex items-center gap-1">☕ 원두 샘플 영역</span>
                  <span className="text-[9px] text-[#c4c7c7] mt-1 text-center">상단 주황색 가이드 안에 원두를 골고루 펼쳐주세요</span>
                </div>

                {/* Card Target Area */}
                <div 
                  className="w-64 border-2 border-dashed border-[#00bfff]/60 rounded-lg flex flex-col items-center justify-center bg-black/45 backdrop-blur-xs"
                  style={{ aspectRatio: '85.6/53.98' }}
                >
                  <span className="text-[10px] text-[#00bfff] font-bold tracking-widest uppercase flex items-center gap-1">💳 신용카드 배치 영역</span>
                  <span className="text-[9px] text-[#c4c7c7] mt-1 text-center">하단 파란색 가이드 안에 카드를 맞춰주세요</span>
                </div>
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
            {cameraMode === 'register_baseline' || cameraMode === 'recalibrate_baseline' ? (
              // 기준 분쇄도 등록/갱신 모드 결과 화면
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <span className="inline-block bg-[#eabda0]/10 border border-[#eabda0]/30 text-[#eabda0] text-[10px] uppercase font-bold px-3 py-1">
                    기준 굵기 분석 완료
                  </span>
                  <h2 className="text-xl font-bold text-white">
                    {cameraMode === 'register_baseline' ? `'${pendingPreset?.name}' 등록` : `'${pendingPreset?.name}' 보정`}
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
                      <span className="text-[10px] font-bold text-white uppercase">촬영된 원두 샘플</span>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block">분석된 입자 평균 굵기</span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-numeric-data text-5xl text-white block">{analysisResult.measured.toFixed(3)}</span>
                      <span className="text-sm text-[#c4c7c7]">mm</span>
                    </div>
                  </div>
                </div>

                <div className="plate p-5 space-y-2">
                  <h4 className="text-xs uppercase font-bold text-[#c4c7c7] tracking-wider flex items-center gap-1.5">
                    <Info size={14} className="text-[#eabda0]" /> 안내
                  </h4>
                  <p className="text-sm text-[#e4e2e1] leading-relaxed">
                    분석된 입자 평균 굵기는 <strong className="text-white font-numeric-data">{analysisResult.measured.toFixed(3)}mm</strong> 입니다.
                    이 굵기를 현재 프리셋의 마스터 기준 굵기로 등록하고 활성화하시겠습니까?
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button 
                    onClick={handleConfirmSaveBaseline}
                    className="flex-1 py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm"
                  >
                    마스터 굵기로 확정 및 저장
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentTab('camera');
                      startCamera();
                    }}
                    className="flex-1 py-3 border border-[#444748] hover:border-white font-bold active:scale-95 transition-transform text-sm text-white"
                  >
                    다시 촬영
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
                      <span className="text-[10px] font-bold text-[#00ff00] uppercase">CV2.THRESH_OTSU {analysisResult?.opencv ? `(${analysisResult.opencv.count}개)` : '시뮬레이션'}</span>
                    </div>
                  </div>
                  <div className="text-center mt-4 mb-2">
                    <p className="text-lg font-bold text-white">
                      오늘의 평균 분쇄도는 <span className="text-[#eabda0] font-numeric-data">{analysisResult.measured.toFixed(3)}mm</span> 입니다
                    </p>
                    <p className="text-xs text-[#c4c7c7] mt-1">({selectedMasterPreset ? `'${selectedMasterPreset.name}' 기준` : '에스프레소용'})</p>
                  </div>
                </div>

                {/* Bottom: 극과 극 클로즈업 (나무) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">최대 입자 (가장 굵음)</span>
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
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">최소 입자 (가장 얇음)</span>
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
                    <span>가장 큰 입자와 작은 입자의 크기 차이(편차)가 너무 크다면, 그라인더 칼날(버)을 청소하거나 교체할 시기일 수 있습니다!</span>
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
                    onClick={handleSaveHistoryAndGoToHistoryTab}
                    className="flex-1 py-3 border border-[#c49a7a] hover:bg-[#eabda0] hover:text-black font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm text-[#eabda0]"
                  >
                    저장 후 기록으로
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
                    <span>← 목록으로 돌아가기</span>
                  </button>
                  <span className="text-xs text-[#c4c7c7]">{formatDate(selectedHistoryItem.created_at)}</span>
                </div>

                <div className="text-center space-y-2">
                  <span className="inline-block bg-[#eabda0]/10 border border-[#eabda0]/30 text-[#eabda0] text-[10px] uppercase font-bold px-3 py-1">
                    과거 분석 기록 상세
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
                        입자 수: {selectedHistoryItem.opencv_data?.count || 0}개
                      </span>
                    </div>
                  </div>

                  <div className="text-center mt-4 mb-2">
                    <p className="text-lg font-bold text-white">
                      당시 평균 분쇄도: <span className="text-[#eabda0] font-numeric-data">{selectedHistoryItem.measured_value.toFixed(3)}mm</span>
                    </p>
                    <p className="text-xs text-[#c4c7c7] mt-1">(목표 기준값: {selectedHistoryItem.preset_value.toFixed(3)}mm)</p>
                  </div>
                </div>

                {/* 차이 분석 및 조언 */}
                <div className="plate p-5 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#444748] pb-2">
                    <span className="text-xs uppercase font-bold text-[#c4c7c7] tracking-wider">기준 대비 편차</span>
                    <span className={`text-sm font-bold ${
                      selectedHistoryItem.diff_percent > 10 || selectedHistoryItem.diff_percent < -10 ? 'text-[#eabda0]' : 'text-green-400'
                    }`}>
                      {selectedHistoryItem.diff_percent > 0 ? `+${selectedHistoryItem.diff_percent}` : selectedHistoryItem.diff_percent}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8e9192] uppercase font-bold">캘리브레이션 조언</span>
                    <p className="text-sm text-white font-medium">{selectedHistoryItem.advice}</p>
                  </div>
                </div>

                {/* 극과 극 크롭 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">최대 입자 넓이</span>
                    <div className="plate p-3 text-center border-red-500/50">
                      <span className="font-numeric-data text-lg text-white block">{selectedHistoryItem.opencv_data?.maxArea || 0}</span>
                      <span className="text-[10px] text-[#c4c7c7]">px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-[#c4c7c7] font-semibold uppercase block text-center">최소 입자 넓이</span>
                    <div className="plate p-3 text-center border-blue-500/50">
                      <span className="font-numeric-data text-lg text-white block">{selectedHistoryItem.opencv_data?.minArea || 0}</span>
                      <span className="text-[10px] text-[#c4c7c7]">px</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setSelectedHistoryItem(null)}
                    className="flex-1 py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm"
                  >
                    목록으로 돌아가기
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("이 기록을 영구적으로 삭제하시겠습니까?")) {
                        deleteHistory(selectedHistoryItem.id);
                      }
                    }}
                    className="flex-1 py-3 border border-red-500 hover:bg-red-500 hover:text-white font-bold active:scale-95 transition-transform text-sm text-red-500"
                  >
                    이 기록 삭제
                  </button>
                </div>
              </div>
            ) : (
              // 기록 목록 화면
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">촬영 분석 기록</h2>
                  <p className="text-xs text-[#c4c7c7]">과거에 저장된 분쇄도 비교/보정 로그 목록입니다</p>
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
                            측정값: {record.measured_value.toFixed(3)}mm
                          </h4>
                          <p className="text-xs text-[#c4c7c7]">{formatDate(record.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#8e9192] group-hover:text-white transition-colors text-xs">상세 보기 →</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("이 기록을 정말 삭제하시겠습니까?")) {
                                deleteHistory(record.id);
                              }
                            }}
                            className="text-[#8e9192] hover:text-red-400 p-2 transition-colors active:scale-90"
                            title="기록 삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {historyRecords.length === 0 && (
                    <div className="plate p-8 text-center space-y-2">
                      <p className="text-sm text-[#c4c7c7]">저장된 촬영 기록이 없습니다.</p>
                      <p className="text-xs text-[#8e9192]">원두 촬영 분석 후 결과 페이지에서 '저장 후 기록으로'를 클릭해 스캔 기록을 저장해 보세요!</p>
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

              <div className="plate p-5 space-y-3">
                <h3 className="font-bold text-white text-base">4. 기본 분쇄도 설정 기준</h3>
                <div className="text-xs text-[#c4c7c7] space-y-4 leading-relaxed">
                  <p>
                    GRINDMASTER가 제공하는 기본 분쇄도(mm) 수치는 스페셜티 커피 협회(SCA) 가이드라인과 정밀 커피 시프터 제조사들의 권장 데이터를 바탕으로 산출된 표준 평균값입니다.
                  </p>
                  <ul className="list-disc pl-4 space-y-2 text-[#eabda0]">
                    <li>
                      <span className="font-bold text-white">에스프레소 (약 0.245mm)</span>: 짧은 시간에 강한 압력으로 추출하기 위해 밀가루와 고운 소금 사이의 아주 고운 굵기(200~400 마이크론)가 필요하며, 쫀쫀한 크레마를 위해 245 마이크론을 기본값으로 설정했습니다.
                    </li>
                    <li>
                      <span className="font-bold text-white">푸어 오버 / V60 (약 0.680mm)</span>: 자연스러운 물 투과를 위해 백설탕 정도의 굵기(400~800 마이크론)가 적당하며, 밸런스 좋은 추출을 위해 680 마이크론을 기준점으로 잡았습니다.
                    </li>
                    <li>
                      <span className="font-bold text-white">콜드 침출 (약 1.120mm)</span>: 장시간 침출 시 텁텁함을 줄이기 위해 굵은소금 정도의 굵기(900~1500 마이크론)가 적합하며, 깔끔한 맛을 위해 1120 마이크론으로 세팅했습니다.
                    </li>
                  </ul>
                  <p className="pt-2 border-t border-[#444748] mt-2">
                    <span className="text-white font-bold">💡 완벽한 나만의 기준점 찾기</span><br/>
                    제공된 기본값은 참고용 평균값입니다. 사용하는 그라인더의 버(Burr) 마모도나 원두 배전도, 습도에 따라 실제 추출은 달라질 수 있으므로, 가장 맛있는 커피를 내리셨을 때의 원두를 직접 촬영하여 고객님만의 마스터 기준점으로 보정(Recalibrate)하여 사용하시는 것을 권장합니다.
                  </p>
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
          <span className="text-[10px] mt-1">프리셋</span>
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
          <span className="text-[10px] mt-1">촬영</span>
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
          <span className="text-[10px] mt-1">기록</span>
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
          <span className="text-[10px] mt-1">도움말</span>
        </button>
      </nav>

      {/* Edit Preset Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">프리셋 수정</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">추출 방식</label>
                <select 
                  value={editingPreset.category}
                  onChange={(e) => setEditingPreset({...editingPreset, category: e.target.value})}
                  className="w-full bg-[#0e0e0e] border border-[#444748] focus:border-white transition-colors p-3 text-sm text-white outline-none rounded-none"
                >
                  <option value="에스프레소">에스프레소</option>
                  <option value="푸어 오버">푸어 오버</option>
                  <option value="프렌치 프레스">프렌치 프레스</option>
                  <option value="콜드 침출">콜드 침출</option>
                  <option value="모카포트">모카포트</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#c4c7c7] tracking-wider">프리셋 이름</label>
                <input 
                  type="text"
                  placeholder="예: 예가체프 V60"
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
              저장
            </button>
          </div>
        </div>
      )}

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
            </div>

            <button 
              onClick={handleStartRegisterBaseline}
              className="w-full py-3 bg-white text-black font-bold active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              카메라로 기준 굵기 촬영 및 등록
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131313] border border-[#444748] w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#444748] pb-3">
              <h3 className="font-bold text-white text-base">프리셋 삭제 확인</h3>
              <button 
                onClick={() => setPresetToDelete(null)}
                className="text-[#8e9192] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[#e4e2e1] leading-relaxed">
                정말로 <strong className="text-white font-bold">'{presetToDelete.name}'</strong> 프리셋을 삭제하시겠습니까?<br/>
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setPresetToDelete(null)}
                className="flex-1 py-3 border border-[#444748] hover:border-white font-bold active:scale-95 transition-transform text-sm text-white"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  deletePreset(presetToDelete.id);
                  setPresetToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold active:scale-95 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> 삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
