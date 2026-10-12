'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle2, AlertTriangle, RefreshCw, Sun, Sparkles,
  User, ArrowRight, Video, ChevronLeft, ChevronRight, Loader2, RotateCcw
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CameraGuideProps {
  onPhotosComplete: (photos: { front: string; left: string; right: string }) => void;
}

type ScanStep = 'front' | 'left' | 'right';

type ScanState =
  | 'searching'       // no face found yet
  | 'found'           // face found but not perfectly positioned
  | 'centered'        // face in center + acceptable quality
  | 'hold'            // countdown before capture
  | 'capturing'       // snapshot being taken
  | 'validating'      // backend validation in progress
  | 'success'         // this step done
  | 'failed';         // validation failed, retry

interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CheckResult {
  face: boolean;
  centered: boolean;
  size: boolean;
  lighting: boolean;
  sharp: boolean;
  pose: boolean;
  box: FaceBox | null;
}

// ─── State Labels ─────────────────────────────────────────────────────────────
const STEP_LABELS: Record<ScanStep, string> = {
  front: 'Placez votre visage bien en face de la caméra',
  left:  'Tournez votre tête vers la gauche (~45°)',
  right: 'Tournez votre tête vers la droite (~45°)',
};

const STATE_LABELS: Record<ScanState, string> = {
  searching:  'Recherche du visage...',
  found:      'Ajustez la position / l\'angle du visage',
  centered:   'Parfait — restez immobile',
  hold:       'Capture dans ...',
  capturing:  'Capture en cours...',
  validating: 'Validation par l\'IA...',
  success:    'Photo acceptée !',
  failed:     'Photo invalide — nouvelle tentative...',
};

// ─── AI Face Detector (using face-api.js + landmarks) ──────────────────────────
class LiveFaceDetector {
  private faceapi: typeof import('face-api.js') | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  async init() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;

    if (typeof window !== 'undefined') {
      try {
        const fa = await import('face-api.js');
        this.faceapi = fa;

        // Load TinyFaceDetector and FaceLandmark68 models
        await Promise.all([
          fa.nets.tinyFaceDetector.loadFromUri('/models'),
          fa.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);

        this.isLoaded = true;
        console.log('[LiveFaceDetector] face-api.js AI models loaded successfully');
      } catch (err) {
        console.warn('[LiveFaceDetector] Error loading face-api models, falling back to CV:', err);
        this.isLoaded = false;
      } finally {
        this.isLoading = false;
      }
    }
  }

  async detect(video: HTMLVideoElement, canvas: HTMLCanvasElement, step: ScanStep): Promise<CheckResult> {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return this._noFace();

    // ── A. AI Face Detection with Facial Landmarks (Primary) ────────────────
    if (this.isLoaded && this.faceapi) {
      try {
        const detection = await this.faceapi
          .detectSingleFace(
            video,
            new this.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 })
          )
          .withFaceLandmarks();

        if (!detection) {
          return this._noFace();
        }

        const { x, y, width, height } = detection.detection.box;
        const landmarks = detection.landmarks;

        // Calculate 3D Yaw / Head Pose using 68 Facial Landmarks
        const jaw = landmarks.getJawOutline();
        const nose = landmarks.getNose();

        const leftJaw = jaw[0];
        const rightJaw = jaw[16];
        const noseTip = nose[3] || nose[0];

        const distToLeft = Math.hypot(noseTip.x - leftJaw.x, noseTip.y - leftJaw.y);
        const distToRight = Math.hypot(noseTip.x - rightJaw.x, noseTip.y - rightJaw.y);
        const yawRatio = distToLeft / Math.max(1, distToRight);

        // Evaluate Head Pose based on step requirement:
        // - Front step: face looking straight ahead at camera
        // - Left/Right step: user turns head ~25°-45° to the side
        let poseOk = false;
        if (step === 'front') {
          poseOk = yawRatio >= 0.40 && yawRatio <= 2.50;
        } else if (step === 'left' || step === 'right') {
          poseOk = yawRatio < 0.55 || yawRatio > 1.80;
        }

        return this._evaluate(
          { x, y, w: width, h: height },
          vw, vh, video, canvas, step, poseOk
        );
      } catch (e) {
        // Fall through to secondary check if frame fails
      }
    }

    // ── B. Secondary Computer Vision Heuristic (Fallback) ───────────────────
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return this._noFace();
    canvas.width = Math.floor(vw / 4);
    canvas.height = Math.floor(vh / 4);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let skinPixels = 0;
    const maxYSearch = Math.floor(height * 0.80);

    for (let py = Math.floor(height * 0.05); py < maxYSearch; py++) {
      for (let px = Math.floor(width * 0.10); px < Math.floor(width * 0.90); px++) {
        const idx = (py * width + px) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (isSkinPixel(r, g, b)) {
          skinPixels++;
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px > maxX) maxX = px;
          if (py > maxY) maxY = py;
        }
      }
    }

    const totalSampleArea = (width * 0.8) * (height * 0.75);
    const skinRatio = skinPixels / totalSampleArea;
    if (skinRatio < 0.08 || minX >= maxX || minY >= maxY) return this._noFace();

    let boxW = maxX - minX;
    let boxH = maxY - minY;
    if (boxH / boxW > 1.65 || boxH / boxW < 0.9) return this._noFace();

    const scale = 4;
    const box: FaceBox = {
      x: minX * scale,
      y: minY * scale,
      w: boxW * scale,
      h: boxH * scale,
    };

    const avgBrightness = this._avgBrightness(data);
    const lighting = avgBrightness > 40 && avgBrightness < 230;

    return this._evaluate(box, vw, vh, video, canvas, step, true, lighting);
  }

  private _evaluate(
    box: FaceBox,
    vw: number,
    vh: number,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    step: ScanStep,
    poseOverride: boolean,
    lightingOverride?: boolean
  ): CheckResult {
    const faceArea = box.w * box.h;
    const frameArea = vw * vh;
    const areaRatio = faceArea / frameArea;

    // Face must take up 3.0% to 45% of the camera frame
    // This allows comfortable positioning inside the oval on 720p / 1080p webcams
    const size = areaRatio >= 0.030 && areaRatio <= 0.45;

    const faceCX = box.x + box.w / 2;
    const faceCY = box.y + box.h / 2;
    const centerOffsetX = Math.abs(faceCX - vw / 2) / vw;
    const centerOffsetY = Math.abs(faceCY - vh / 2) / vh;

    // Centering: face center within 28% horizontal and 30% vertical of camera center
    const centered = centerOffsetX < 0.28 && centerOffsetY < 0.30;

    let lighting = lightingOverride ?? true;
    let sharp = true;

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = 80; canvas.height = 60;
        ctx.drawImage(video, 0, 0, 80, 60);
        const d = ctx.getImageData(0, 0, 80, 60).data;
        const brightness = this._avgBrightness(d);
        lighting = brightness > 38 && brightness < 230;
        sharp = this._laplacianSharp(d, 80, 60);
      }
    } catch { /* ignore */ }

    return { face: true, centered, size, lighting, sharp, pose: poseOverride, box };
  }

  private _noFace(): CheckResult {
    return { face: false, centered: false, size: false, lighting: false, sharp: false, pose: false, box: null };
  }

  private _avgBrightness(data: Uint8ClampedArray): number {
    let total = 0;
    const step = 4 * 4;
    let count = 0;
    for (let i = 0; i < data.length; i += step) {
      total += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      count++;
    }
    return count > 0 ? total / count : 128;
  }

  private _laplacianSharp(data: Uint8ClampedArray, w: number, h: number): boolean {
    let sum = 0, sum2 = 0, n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        const t = (y - 1) * w + x; const tc = t * 4;
        const grayT = data[tc] * 0.299 + data[tc + 1] * 0.587 + data[tc + 2] * 0.114;
        const lap = gray - grayT;
        sum += lap; sum2 += lap * lap; n++;
      }
    }
    const variance = n > 0 ? (sum2 / n) - (sum / n) ** 2 : 0;
    return variance > 5;
  }
}

function isSkinPixel(r: number, g: number, b: number): boolean {
  return (
    r > 60 && g > 30 && b > 20 &&
    r > g && r > b &&
    Math.abs(r - g) > 8 &&
    r - Math.min(g, b) > 15 &&
    r < 250 && g < 220 && b < 200
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export const CameraGuide: React.FC<CameraGuideProps> = ({ onPhotosComplete }) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentStep, setCurrentStep]           = useState<ScanStep>('front');
  const [scanState, setScanState]               = useState<ScanState>('searching');
  const [photos, setPhotos]                     = useState<{ front: string | null; left: string | null; right: string | null }>({
    front: null, left: null, right: null,
  });
  const [holdCountdown, setHoldCountdown]       = useState(0);
  const [failMessage, setFailMessage]           = useState('');
  const [cameraError, setCameraError]           = useState<string | null>(null);
  const [faceBox, setFaceBox]                   = useState<FaceBox | null>(null);
  const [checks, setChecks]                     = useState<Omit<CheckResult, 'box'>>({
    face: false, centered: false, size: false, lighting: true, sharp: true, pose: false,
  });
  const [streamActive, setStreamActive]         = useState(false);
  const [stepTransition, setStepTransition]     = useState<{ show: boolean; nextStep: ScanStep | null }>({ show: false, nextStep: null });

  const streamRef          = useRef<MediaStream | null>(null);
  const videoRef           = useRef<HTMLVideoElement | null>(null);
  const canvasRef          = useRef<HTMLCanvasElement | null>(null);
  const detectionLoopRef   = useRef<number | null>(null);
  const holdTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceDetectorRef    = useRef<LiveFaceDetector | null>(null);
  const stateRef           = useRef<ScanState>('searching');
  const stepRef            = useRef<ScanStep>('front');
  const photosRef          = useRef<{ front: string | null; left: string | null; right: string | null }>({
    front: null, left: null, right: null,
  });

  // Keep refs in sync with state
  useEffect(() => { stateRef.current = scanState; }, [scanState]);
  useEffect(() => { stepRef.current  = currentStep; }, [currentStep]);
  useEffect(() => { photosRef.current = photos; }, [photos]);

  // ── Camera Init ─────────────────────────────────────────────────────────────
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      setStreamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Init face detector
      if (!faceDetectorRef.current) {
        faceDetectorRef.current = new LiveFaceDetector();
        await faceDetectorRef.current.init();
      }

      startDetectionLoop();
    } catch {
      setCameraError('Accès à la caméra refusé ou indisponible. Vérifiez les permissions de votre navigateur.');
      setStreamActive(false);
    }
  };

  // ── Detection Loop ──────────────────────────────────────────────────────────
  const startDetectionLoop = () => {
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current);

    const loop = async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const detector = faceDetectorRef.current;

      if (!video || !canvas || !detector || video.readyState < 2) {
        detectionLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const state = stateRef.current;
      // Don't run detection while capturing/validating/success
      if (state === 'capturing' || state === 'validating' || state === 'success') {
        detectionLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const result = await detector.detect(video, canvas, stepRef.current);
      const { box, ...statusChecks } = result;

      setFaceBox(box);
      setChecks(statusChecks);

      const allGood = result.face && result.centered && result.size && result.lighting && result.sharp && result.pose;

      if (!result.face) {
        setScanState('searching');
        clearHoldTimer();
      } else if (!allGood) {
        setScanState('found');
        clearHoldTimer();
      } else {
        if (state === 'searching' || state === 'found' || state === 'failed') {
          setScanState('centered');
          startHoldTimer();
        }
      }

      // Run at ~8fps for battery/cpu friendliness
      detectionLoopRef.current = setTimeout(() => {
        detectionLoopRef.current = requestAnimationFrame(loop);
      }, 120) as unknown as number;
    };

    detectionLoopRef.current = requestAnimationFrame(loop);
  };

  // ── Hold timer (1.5 sec stable face → capture) ─────────────────────────────
  const startHoldTimer = () => {
    if (holdTimerRef.current) return; // already running
    let remaining = 2;
    setHoldCountdown(remaining);
    setScanState('hold');

    countdownIntervalRef.current = setInterval(() => {
      remaining--;
      setHoldCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        capturePhoto();
      }
    }, 700);
  };

  const clearHoldTimer = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  };

  // ── Photo Capture ────────────────────────────────────────────────────────────
  const capturePhoto = useCallback(async () => {
    clearHoldTimer();
    setScanState('capturing');

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { setScanState('failed'); return; }

    // Draw snapshot to canvas (full res)
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setScanState('failed'); return; }
    // Mirror-flip to natural orientation
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.92);

    setScanState('validating');

    // Validate via backend
    const step = stepRef.current;
    const payload: Record<string, string> = { [step]: imageData };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/validate-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const report = data?.reports?.[step];

      if (data?.overall_pass !== false && report?.usable !== false) {
        // SUCCESS
        const updatedPhotos = { ...photosRef.current, [step]: imageData };
        setPhotos(updatedPhotos);
        photosRef.current = updatedPhotos;
        setScanState('success');

        // Advance step after a short celebration
        setTimeout(() => {
          if (step === 'front') {
            setStepTransition({ show: true, nextStep: 'left' });
            setTimeout(() => {
              setStepTransition({ show: false, nextStep: null });
              setCurrentStep('left');
              setScanState('searching');
            }, 1900);
          } else if (step === 'left') {
            setStepTransition({ show: true, nextStep: 'right' });
            setTimeout(() => {
              setStepTransition({ show: false, nextStep: null });
              setCurrentStep('right');
              setScanState('searching');
            }, 1900);
          } else {
            // All 3 done
            if (updatedPhotos.front && updatedPhotos.left && updatedPhotos.right) {
              onPhotosComplete({
                front: updatedPhotos.front,
                left:  updatedPhotos.left,
                right: updatedPhotos.right,
              });
            }
          }
        }, 600);
      } else {
        // FAILED validation
        const reason = report?.reason || report?.issues?.[0] || 'Qualité insuffisante.';
        setFailMessage(reason);
        setScanState('failed');
        setTimeout(() => setScanState('searching'), 2500);
      }
    } catch {
      // If backend unavailable, accept the photo (graceful degradation)
      const updatedPhotos = { ...photosRef.current, [step]: imageData };
      setPhotos(updatedPhotos);
      photosRef.current = updatedPhotos;
      setScanState('success');
      setTimeout(() => {
        if (step === 'front') {
          setStepTransition({ show: true, nextStep: 'left' });
          setTimeout(() => {
            setStepTransition({ show: false, nextStep: null });
            setCurrentStep('left');
            setScanState('searching');
          }, 1900);
        } else if (step === 'left') {
          setStepTransition({ show: true, nextStep: 'right' });
          setTimeout(() => {
            setStepTransition({ show: false, nextStep: null });
            setCurrentStep('right');
            setScanState('searching');
          }, 1900);
        } else if (updatedPhotos.front && updatedPhotos.left && updatedPhotos.right) {
          onPhotosComplete({ front: updatedPhotos.front!, left: updatedPhotos.left!, right: updatedPhotos.right! });
        }
      }, 600);
    }
  }, [onPhotosComplete]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showInstructions) startCamera();
    return () => {
      if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current as unknown as number);
      clearHoldTimer();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [showInstructions]);

  // ── Retake a step ────────────────────────────────────────────────────────────
  const retakeStep = (step: ScanStep) => {
    clearHoldTimer();
    setPhotos(p => ({ ...p, [step]: null }));
    setCurrentStep(step);
    setScanState('searching');
  };

  // ── Derived Overlay Color ────────────────────────────────────────────────────
  const ovalColor = (() => {
    if (scanState === 'success')  return '#22c55e';
    if (scanState === 'hold')     return '#facc15';
    if (scanState === 'centered') return '#34d399';
    if (scanState === 'found')    return '#fbbf24';
    return '#38bdf8';
  })();

  const ovalGlow = (() => {
    if (scanState === 'success')  return '0 0 40px 10px rgba(34,197,94,0.5)';
    if (scanState === 'hold')     return '0 0 40px 10px rgba(250,204,21,0.4)';
    if (scanState === 'centered') return '0 0 35px 8px rgba(52,211,153,0.4)';
    return '0 0 30px 4px rgba(56,189,248,0.2)';
  })();

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* ── Step Transition Overlay (Light Mode) ────────────────────────────────── */}
      {stepTransition.show && stepTransition.nextStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md step-transition-enter">
          <div className="flex flex-col items-center gap-8 text-center px-8 py-10 rounded-3xl bg-white border border-slate-200 shadow-2xl max-w-md w-full mx-4">
            {/* Done badge */}
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-black text-emerald-950">Photo acceptée !</span>
            </div>

            {/* Animated face silhouette + direction arrow */}
            <div className="relative flex items-center gap-6">
              {stepTransition.nextStep === 'left' && (
                <div className="animate-arrow-left text-cyan-600">
                  <ChevronLeft className="w-16 h-16" strokeWidth={2.5} />
                </div>
              )}

              {/* Face icon with 3D turn animation */}
              <div
                className="relative"
                style={{ perspective: '600px' }}
              >
                <div
                  className={stepTransition.nextStep === 'left' ? 'animate-head-left' : 'animate-head-right'}
                  style={{ transformStyle: 'preserve-3d', display: 'inline-block' }}
                >
                  <div className="w-28 h-36 rounded-[50%] border-4 border-cyan-600 bg-gradient-to-b from-cyan-50 to-teal-50 flex items-end justify-center pb-4 animate-ring-pulse shadow-md">
                    {/* Face oval shape */}
                    <div className="flex flex-col items-center gap-1">
                      {/* Eyes */}
                      <div className="flex gap-5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-700" />
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-700" />
                      </div>
                      {/* Nose */}
                      <div className="w-1 h-3 rounded-full bg-cyan-600" />
                      {/* Mouth */}
                      <div className="w-6 h-1.5 rounded-full bg-cyan-700 mt-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              {stepTransition.nextStep === 'right' && (
                <div className="animate-arrow-right text-cyan-600">
                  <ChevronRight className="w-16 h-16" strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Instruction text */}
            <div className="space-y-2">
              <p className="text-2xl font-black text-black tracking-tight">
                {stepTransition.nextStep === 'left' ? 'Tournez vers la gauche' : 'Tournez vers la droite'}
              </p>
              <p className="text-slate-800 text-sm font-semibold">
                {stepTransition.nextStep === 'left'
                  ? 'Pivotez votre tête à ~45° vers la gauche'
                  : 'Pivotez votre tête à ~45° vers la droite'}
              </p>
            </div>

            {/* Step indicator dots */}
            <div className="flex items-center gap-3">
              {(['front', 'left', 'right'] as ScanStep[]).map((s, i) => {
                const stepOrder = { front: 0, left: 1, right: 2 };
                const nextOrder = stepTransition.nextStep ? stepOrder[stepTransition.nextStep] : 0;
                const isDone = stepOrder[s] < nextOrder;
                const isNext = stepOrder[s] === nextOrder;
                return (
                  <div key={s} className={`transition-all ${
                    isDone ? 'w-2.5 h-2.5 rounded-full bg-emerald-600' :
                    isNext ? 'w-8 h-2.5 rounded-full bg-cyan-600 shadow-md' :
                    'w-2.5 h-2.5 rounded-full bg-slate-300'
                  }`} />
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Instructions Screen */}
      {showInstructions ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-lg relative overflow-hidden bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-black">Scan Facial Automatique</h2>
              <p className="text-xs sm:text-sm text-slate-800 font-medium">Votre visage sera capturé automatiquement — aucun bouton nécessaire</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { icon: <User className="w-5 h-5" />, color: 'text-cyan-800', bg: 'bg-cyan-50 border-cyan-200', title: '1. Peau nette, sans maquillage', desc: 'Retirez tout le maquillage. N\'appliquez pas de crème riche juste avant.' },
              { icon: <Sun className="w-5 h-5" />, color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', title: '2. Éclairage naturel neutre', desc: 'Faites face à une lumière douce. Évitez les ombres dures et la lumière aveuglante.' },
              { icon: <Sparkles className="w-5 h-5" />, color: 'text-teal-800', bg: 'bg-teal-50 border-teal-200', title: '3. Restez immobile', desc: 'La capture est automatique dès que votre visage est bien positionné et stable.' },
              { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', title: '4. Suivez les instructions', desc: 'Face, puis gauche ~45°, puis droite ~45°. Le système vous guidera étape par étape.' },
            ].map((item, i) => (
              <div key={i} className="glass-card p-4 rounded-2xl flex items-start gap-3 border border-slate-300 bg-slate-50">
                <div className={`p-2 rounded-xl border ${item.bg} ${item.color}`}>{item.icon}</div>
                <div>
                  <h4 className="text-sm font-black text-black">{item.title}</h4>
                  <p className="text-xs text-slate-800 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowInstructions(false)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              Démarrer le scan automatique
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {/* ── Step Progress Bar ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {([
              { id: 'front', title: '1. Face', sub: 'Face caméra' },
              { id: 'left',  title: '2. Gauche', sub: '~45° gauche' },
              { id: 'right', title: '3. Droite', sub: '~45° droite' },
            ] as const).map((s) => {
              const isDone    = !!photos[s.id];
              const isCurrent = currentStep === s.id;
              return (
                <div
                  key={s.id}
                  className={`p-2 sm:p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-50 border-cyan-400 shadow-sm'
                      : isDone
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-100 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-black text-black">{s.title}</span>
                    {isDone
                      ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      : isCurrent
                      ? <div className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
                      : null
                    }
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold mt-0.5 sm:mt-1 truncate">{s.sub}</p>
                </div>
              );
            })}
          </div>

          {/* ── Main Scanner Panel ──────────────────────────────────────────────── */}
          <div className="glass-panel rounded-3xl border border-slate-300 overflow-hidden relative bg-white">
            {/* Viewfinder area */}
            <div className="relative flex items-center justify-center min-h-[340px] sm:min-h-[460px] md:min-h-[520px] bg-slate-900">
              {/* Video */}
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover rounded-t-3xl ${streamActive ? 'block scale-x-[-1]' : 'hidden'}`}
                style={{ minHeight: '340px', maxHeight: '520px' }}
              />

              {/* No camera fallback */}
              {!streamActive && (
                <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center space-y-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-100 border border-cyan-300 text-cyan-700 flex items-center justify-center">
                    <Video className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <p className="text-sm text-black font-black">Caméra en direct</p>
                    <p className="text-xs text-slate-700 font-medium mt-1 max-w-xs">{cameraError || 'Initialisation...'}</p>
                  </div>
                  <button onClick={startCamera} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs flex items-center gap-2 shadow-sm">
                    <Video className="w-4 h-4" /> Activer la caméra
                  </button>
                </div>
              )}

              {/* Oval face guide overlay */}
              {streamActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div
                    className="relative flex items-center justify-center w-[170px] h-[230px] sm:w-[220px] sm:h-[280px]"
                    style={{
                      border: `3px solid ${ovalColor}`,
                      borderRadius: '50%',
                      boxShadow: ovalGlow,
                      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
                    }}
                  >
                    {/* Corner marks */}
                    {['top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
                      'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
                      'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
                      'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
                    ].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full`}
                        style={{ backgroundColor: ovalColor, transition: 'background-color 0.4s ease' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Direction arrows for left/right steps */}
              {streamActive && currentStep !== 'front' && scanState === 'searching' && (
                <div className="absolute inset-0 flex items-center pointer-events-none z-30"
                  style={{ justifyContent: currentStep === 'left' ? 'flex-end' : 'flex-start' }}>
                  <div className={`flex flex-col items-center gap-1 px-4 py-3 mx-4 rounded-2xl bg-white/90 border border-cyan-400 shadow-lg backdrop-blur-sm`}>
                    {currentStep === 'left'
                      ? <ChevronLeft className="w-10 h-10 text-cyan-600 animate-bounce" />
                      : <ChevronRight className="w-10 h-10 text-cyan-600 animate-bounce" />
                    }
                    <span className="text-[10px] text-cyan-900 font-black uppercase tracking-widest">
                      {currentStep === 'left' ? 'Gauche' : 'Droite'}
                    </span>
                  </div>
                </div>
              )}

              {/* Scan laser line animation */}
              {(scanState === 'centered' || scanState === 'hold') && (
                <div className="animate-scan z-30 pointer-events-none" />
              )}

              {/* Success flash overlay */}
              {scanState === 'success' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-emerald-950/40 backdrop-blur-sm rounded-t-3xl">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="mt-4 text-emerald-100 font-black text-base">Photo acceptée !</p>
                  {currentStep === 'front' && <p className="text-white text-xs font-semibold mt-1">Maintenant tournez vers la gauche...</p>}
                  {currentStep === 'left'  && <p className="text-white text-xs font-semibold mt-1">Maintenant tournez vers la droite...</p>}
                </div>
              )}

              {/* Validating overlay */}
              {(scanState === 'capturing' || scanState === 'validating') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-slate-900/60 backdrop-blur-sm rounded-t-3xl">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                  <p className="mt-3 text-white font-black text-sm">
                    {scanState === 'capturing' ? 'Capture...' : 'Validation...'}
                  </p>
                </div>
              )}

              {/* Failed overlay */}
              {scanState === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-rose-950/40 backdrop-blur-sm rounded-t-3xl">
                  <AlertTriangle className="w-12 h-12 text-rose-400" />
                  <p className="mt-3 text-white font-black text-sm text-center px-6">{failMessage}</p>
                  <p className="text-slate-200 text-xs mt-1">Nouvelle tentative automatique...</p>
                </div>
              )}

              {/* Hold countdown overlay */}
              {scanState === 'hold' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-amber-500 border border-amber-600 shadow-md">
                  <span className="text-black font-black text-sm">Restez immobile... {holdCountdown}</span>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-300">
              {/* Main instruction */}
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  scanState === 'success'  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                  scanState === 'failed'   ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                  scanState === 'hold'     ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                  'bg-cyan-100 text-cyan-700 border border-cyan-300'
                }`}>
                  {scanState === 'success'                     ? <CheckCircle2 className="w-5 h-5" /> :
                   scanState === 'failed'                      ? <AlertTriangle className="w-5 h-5" /> :
                   (scanState === 'capturing' || scanState === 'validating') ? <Loader2 className="w-5 h-5 animate-spin" /> :
                   scanState === 'hold'                        ? <span className="font-black text-base">{holdCountdown}</span> :
                   <User className="w-5 h-5" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs text-slate-700 font-semibold truncate sm:whitespace-normal">{STEP_LABELS[currentStep]}</p>
                  <p className="text-xs sm:text-sm font-black text-black truncate sm:whitespace-normal">{STATE_LABELS[scanState]}</p>
                </div>
              </div>

              {/* Check chips */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { label: 'Visage', ok: checks.face },
                  { label: 'Centré', ok: checks.centered },
                  { label: 'Distance', ok: checks.size },
                  { label: 'Angle/Pose', ok: checks.pose },
                  { label: 'Éclairage', ok: checks.lighting },
                  { label: 'Netteté', ok: checks.sharp },
                ].map((c) => (
                  <span key={c.label} className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${
                    c.ok
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                    {c.label} {c.ok ? '✓' : '...'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Captured Thumbnails ──────────────────────────────────────────────── */}
          {(photos.front || photos.left || photos.right) && (
            <div className="grid grid-cols-3 gap-3">
              {(['front', 'left', 'right'] as ScanStep[]).map((step) => (
                <div key={step} className={`relative rounded-2xl overflow-hidden border ${
                  photos[step] ? 'border-emerald-400' : 'border-slate-300'
                } bg-slate-100 aspect-[3/4]`}>
                  {photos[step] ? (
                    <>
                      <img src={photos[step]!} alt={step} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <button
                        onClick={() => retakeStep(step)}
                        className="absolute bottom-2 right-2 bg-white text-black px-2 py-1 rounded-lg border border-slate-300 text-[10px] font-black flex items-center gap-1 hover:bg-slate-100 shadow-sm"
                      >
                        <RefreshCw className="w-3 h-3" /> Reprendre
                      </button>
                      <div className="absolute top-2 left-2 bg-emerald-100 border border-emerald-400 rounded-lg px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 inline mr-1" />
                        <span className="text-[10px] text-emerald-950 font-black capitalize">{step}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <User className="w-8 h-8 opacity-40" />
                      <span className="text-[10px] mt-1 font-bold capitalize">{step}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
