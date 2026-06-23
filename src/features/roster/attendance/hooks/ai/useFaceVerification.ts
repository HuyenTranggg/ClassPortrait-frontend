import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

export const FACE_MATCH_THRESHOLD = 0.42;
const MAX_MATCHED_DESCRIPTOR_SAMPLES = 20;

interface VerificationResult {
  isMatch: boolean;
  matchScore: number;
  distance: number;
  box?: faceapi.Box;
}

/**
 * Chuyển khoảng cách Euclidean (thường từ 0.0 đến 1.0+) thành phần trăm độ khớp thân thiện với người dùng.
 * Trong face-api.js (sử dụng SSD MobileNet V1 & ResNet-like recognition model):
 * - Khoảng cách < 0.4: Rất giống nhau (cùng một người).
 * - Khoảng cách từ 0.4 đến 0.44: Khớp tốt (ngưỡng tự động điểm danh an toàn).
 * - Khoảng cách từ 0.44 đến 0.5: Vùng biên nhạy cảm (cần kiểm tra thêm).
 * - Khoảng cách > 0.5: Rất nhiều khả năng là khác người.
 */
function distanceToPercentage(distance: number): number {
  if (distance < 0.4) {
    // Rất giống nhau: Khoảng cách [0.0 - 0.4] tương ứng [92% - 100%]
    return Math.round(92 + (1 - distance / 0.4) * 8);
  } else if (distance < 0.5) {
    // Khớp biên: Khoảng cách [0.4 - 0.5] tương ứng [50% - 92%]
    const ratio = (distance - 0.4) / 0.1;
    return Math.round(92 - ratio * 42);
  } else {
    // Khác người hoàn toàn: Khoảng cách [0.5 - 1.0] tương ứng [0% - 50%]
    const ratio = Math.min(1.0, (distance - 0.5) / 0.5);
    return Math.round(50 - ratio * 50);
  }
}

function selectRepresentativeDescriptor(descriptors: Float32Array[]): Float32Array | null {
  if (descriptors.length === 0) return null;
  if (descriptors.length === 1) return new Float32Array(descriptors[0]);

  let bestDescriptorIndex = 0;
  let lowestTotalDistance = Number.POSITIVE_INFINITY;

  for (let candidateIndex = 0; candidateIndex < descriptors.length; candidateIndex += 1) {
    let totalDistance = 0;

    for (let otherIndex = 0; otherIndex < descriptors.length; otherIndex += 1) {
      if (candidateIndex === otherIndex) continue;
      totalDistance += faceapi.euclideanDistance(
        descriptors[candidateIndex],
        descriptors[otherIndex],
      );
    }

    if (totalDistance < lowestTotalDistance) {
      lowestTotalDistance = totalDistance;
      bestDescriptorIndex = candidateIndex;
    }
  }

  return new Float32Array(descriptors[bestDescriptorIndex]);
}

export function useFaceVerification(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraActive: boolean,
  modelsLoaded: boolean,
  referenceImageUrl: string | null
) {
  // SỬ DỤNG REF để tránh Closure Race Condition trong vòng lặp Async
  const referenceDescriptorRef = useRef<Float32Array | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refImageError, setRefImageError] = useState<string | null>(null);
  
  const requestRef = useRef<number>(null);
  const isMatchingRef = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(false);
  // Chỉ giữ các descriptor khớp liên tiếp để tổng hợp trước khi xác minh ở Backend.
  const matchedDescriptorSamplesRef = useRef<Float32Array[]>([]);

  const clearLiveDescriptors = useCallback(() => {
    matchedDescriptorSamplesRef.current = [];
  }, []);

  // 1. Tải và trích xuất đặc trưng của ảnh gốc (Reference Image)
  useEffect(() => {
    let isMounted = true;
    
    const loadReferenceImage = async () => {
      // ĐỒNG BỘ TUYỆT ĐỐI: Reset ngay lập tức để vòng lặp camera thấy null ngay trong frame kế tiếp
      referenceDescriptorRef.current = null;
      clearLiveDescriptors();
      if (isMounted) {
        setVerificationResult(null);
        setRefImageError(null);
      }

      if (!referenceImageUrl || !modelsLoaded) {
        return;
      }
      
      try {
        // Tạo HTMLImageElement từ URL
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Important for fetching from external APIs
        img.src = referenceImageUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Failed to load image'));
        });

        // Phát hiện khuôn mặt trong ảnh gốc
        const detection = await faceapi.detectSingleFace(img)
                                       .withFaceLandmarks()
                                       .withFaceDescriptor();
                                       
        if (!detection) {
          if (isMounted) setRefImageError('Không nhận diện được khuôn mặt trong ảnh thẻ.');
          return;
        }

        if (isMounted) {
          referenceDescriptorRef.current = detection.descriptor;
          setRefImageError(null);
        }
      } catch (err: any) {
        console.error('Error extracting reference descriptor:', err);
        if (isMounted) setRefImageError('Lỗi xử lý ảnh hồ sơ.');
      }
    };

    loadReferenceImage();

    return () => {
      isMounted = false;
    };
  }, [referenceImageUrl, modelsLoaded, clearLiveDescriptors]);

  // 2. Vòng lặp quét video trực tiếp
  const processVideoFrame = useCallback(async () => {
    if (!isRunningRef.current || !videoRef.current || !modelsLoaded || isMatchingRef.current) {
      if (isRunningRef.current) {
        requestRef.current = requestAnimationFrame(processVideoFrame);
      }
      return;
    }

    try {
      isMatchingRef.current = true;
      const videoEl = videoRef.current;

      // BẢO VỆ LỖI TREO (HANG): Đảm bảo video thực sự có frame dữ liệu (readyState >= 2)
      // Nếu giao cho faceapi khi chưa có frame, faceapi có thể bị kẹt Promise vĩnh viễn
      if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
        isMatchingRef.current = false;
        if (isRunningRef.current) {
          requestRef.current = requestAnimationFrame(processVideoFrame);
        }
        return;
      }

      // Phát hiện khuôn mặt từ Video
      const detection = await faceapi.detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                                     .withFaceLandmarks()
                                     .withFaceDescriptor();

      // Nếu đã unmount hoặc dừng camera trong lúc chờ await, thoát ngay lập tức để tránh state update
      if (!isRunningRef.current) return;

      if (detection) {
        const currentRefDesc = referenceDescriptorRef.current;
        if (currentRefDesc) {
          // Tính toán khoảng cách Euclidean
          const distance = faceapi.euclideanDistance(currentRefDesc, detection.descriptor);
          
          // Chuyển đổi sang phần trăm khớp bằng hàm phi tuyến tính hiệu chuẩn nghiêm ngặt hơn
          const score = distanceToPercentage(distance);
          const isMatch = distance <= FACE_MATCH_THRESHOLD;

          setVerificationResult({
            isMatch,
            matchScore: score,
            distance,
            box: detection.detection.box
          });
          if (isMatch) {
            matchedDescriptorSamplesRef.current = [
              ...matchedDescriptorSamplesRef.current,
              detection.descriptor,
            ].slice(-MAX_MATCHED_DESCRIPTOR_SAMPLES);
          } else {
            matchedDescriptorSamplesRef.current = [];
          }
        } else {
          // Có mặt nhưng chưa có reference descriptor hợp lệ (ví dụ ảnh thẻ lỗi/SVG)
          clearLiveDescriptors();
          setVerificationResult({
            isMatch: false,
            matchScore: 0,
            distance: 1,
            box: detection.detection.box
          });
        }
      } else {
        // Không tìm thấy khuôn mặt
        clearLiveDescriptors();
        setVerificationResult(null);
      }
    } catch (err) {
      clearLiveDescriptors();
      console.error('Frame processing error', err);
    } finally {
      isMatchingRef.current = false;
      if (isRunningRef.current) {
        requestRef.current = requestAnimationFrame(processVideoFrame);
      }
    }
  }, [modelsLoaded, videoRef, clearLiveDescriptors]);

  useEffect(() => {
    isRunningRef.current = isCameraActive && modelsLoaded;
    
    if (isRunningRef.current) {
      setIsProcessing(true);
      requestRef.current = requestAnimationFrame(processVideoFrame);
    } else {
      setIsProcessing(false);
      clearLiveDescriptors();
      setVerificationResult(null);
    }

    return () => {
      isRunningRef.current = false;
      clearLiveDescriptors();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraActive, modelsLoaded, processVideoFrame, clearLiveDescriptors]);

  return {
    referenceDescriptor: referenceDescriptorRef.current,
    verificationResult,
    isProcessing,
    refImageError,
    /**
     * Chọn descriptor đại diện nhất (medoid) trong các frame khớp liên tiếp gần nhất.
     * Cách này giảm ảnh hưởng của frame rung/nhòe mà vẫn giữ descriptor gốc từ model.
     */
    getAggregatedLiveDescriptor: (): Float32Array | null =>
      selectRepresentativeDescriptor(matchedDescriptorSamplesRef.current),
  };
}
