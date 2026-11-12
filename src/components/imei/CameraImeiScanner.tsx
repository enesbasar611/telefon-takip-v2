"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyImeiAutoComplete,
  isValidImeiLuhn,
  normalizeImeiDigits,
} from "@/lib/imei-utils";

interface CameraImeiScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (imei: string) => void;
}

export function CameraImeiScanner({
  open,
  onOpenChange,
  onDetected,
}: CameraImeiScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const handleSuccess = useCallback(
    (imei: string, sourceLabel: string) => {
      stopCamera();
      toast.success(`IMEI okundu (${sourceLabel}): ${imei}`);
      onDetected(imei);
      onOpenChange(false);
    },
    [onDetected, onOpenChange, stopCamera]
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCameraError(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function startCameraAndDetector() {
      setCameraError(null);
      setCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Tarayıcınız doğrudan kamera erişimini desteklemiyor. Aşağıdan fotoğraf yükleyebilirsiniz."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
          setCameraReady(true);
        }

        const BarcodeDetectorCtor = (window as any).BarcodeDetector;
        if (BarcodeDetectorCtor) {
          setBarcodeSupported(true);
          let detector: any = null;
          try {
            detector = new BarcodeDetectorCtor({
              formats: [
                "code_128",
                "code_39",
                "ean_13",
                "itf",
                "codabar",
                "qr_code",
              ],
            });
          } catch {
            detector = new BarcodeDetectorCtor();
          }

          intervalId = setInterval(async () => {
            if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
              return;
            }
            try {
              const barcodes = await detector.detect(videoRef.current);
              for (const item of barcodes || []) {
                const rawValue = String(item?.rawValue || "");
                const candidates = rawValue.match(/\d{14,15}/g) || [];
                const valid15 = candidates.find(
                  (c) => c.length === 15 && isValidImeiLuhn(c)
                );
                if (valid15) {
                  if (intervalId) clearInterval(intervalId);
                  handleSuccess(valid15, "Barkod");
                  return;
                }
                const digits = normalizeImeiDigits(rawValue);
                if (digits.length === 14) {
                  const completed = applyImeiAutoComplete("", digits).value;
                  if (intervalId) clearInterval(intervalId);
                  handleSuccess(completed, "Barkod 14+1");
                  return;
                }
              }
            } catch {
              // Silent retry per frame
            }
          }, 350);
        } else {
          setBarcodeSupported(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(
            err?.name === "NotAllowedError"
              ? "Kamera izni reddedildi. Fotoğraf yükleyerek IMEI okuyabilirsiniz."
              : "Kamera başlatılamadı. Fotoğraf yükleyerek devam edebilirsiniz."
          );
        }
      }
    }

    startCameraAndDetector();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      stopCamera();
    };
  }, [open, stopCamera, handleSuccess]);

  const sendImageToOcr = async (dataUrl: string) => {
    setIsProcessingOcr(true);
    try {
      const res = await fetch("/api/imei/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data?.imei) {
        toast.error(data?.error || "Fotoğraftan 15 haneli IMEI okunamadı.");
        return;
      }
      handleSuccess(data.imei, "AI OCR");
    } catch {
      toast.error("IMEI okuma servisine bağlanılamadı.");
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const scale = Math.min(1, 1400 / Math.max(width, height));

    const canvas = canvasRef.current;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    await sendImageToOcr(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        await sendImageToOcr(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg p-0 overflow-hidden bg-zinc-950 text-white border border-white/10 rounded-none sm:rounded-3xl h-[100dvh] sm:h-auto flex flex-col">
        <DialogHeader className="px-5 py-4 border-b border-white/10 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="space-y-0.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-400" />
              Kamera ile IMEI Tarama
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {barcodeSupported
                ? "Kutu barkodunu gösterin veya *#06# ekranını fotoğraf çekip okutun."
                : "*#06# ekranını veya kutu etiketini kadraja alıp Fotoğraf Çek'e dokunun."}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="relative flex-1 min-h-[300px] sm:min-h-[340px] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-4 max-w-sm">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
              <p className="text-xs text-zinc-300 leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                  <span className="text-xs text-zinc-300">Kamera başlatılıyor...</span>
                </div>
              )}
              {cameraReady && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div className="w-full max-w-xs h-32 rounded-2xl border-2 border-blue-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative flex items-center justify-center">
                    <ScanLine className="h-5 w-5 text-blue-400 animate-pulse opacity-80" />
                    <span className="absolute -bottom-6 text-[10px] font-semibold text-blue-200 tracking-wide bg-black/70 px-2.5 py-0.5 rounded-full">
                      {barcodeSupported
                        ? "Otomatik Barkod Aktif • AI Fotoğraf Hazır"
                        : "IMEI Rakamlarını Kutuya Hizalayın"}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 bg-zinc-900/95 border-t border-white/10 flex flex-col sm:flex-row gap-2.5 shrink-0">
          <Button
            type="button"
            disabled={!cameraReady || isProcessingOcr}
            onClick={handleCaptureSnapshot}
            className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 text-xs"
          >
            {isProcessingOcr ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isProcessingOcr ? "IMEI Okunuyor..." : "Fotoğraf Çek / Ekrandan Oku"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isProcessingOcr}
            onClick={() => fileInputRef.current?.click()}
            className="h-12 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 gap-2 text-xs"
          >
            <Upload className="h-4 w-4" />
            Galeriden Seç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

