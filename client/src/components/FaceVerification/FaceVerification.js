import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

function FaceVerification({ voterId, onVerificationComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setIsCapturing(true);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    setVerificationResult(null);
    setError(null);
  };

  const verifyFace = async () => {
    if (!capturedImage) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate AI face verification API call
      const response = await fetch('/api/verification/face-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          voterId,
          faceImage: capturedImage,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (result.success) {
        setVerificationResult({
          matched: result.matched,
          confidence: result.confidence,
          message: result.message
        });

        if (result.matched && result.confidence > 0.8) {
          setTimeout(() => {
            onVerificationComplete({
              method: 'FACE_RECOGNITION',
              success: true,
              confidence: result.confidence,
              timestamp: new Date().toISOString()
            });
          }, 2000);
        }
      } else {
        setError(result.message || 'Face verification failed');
      }
    } catch (err) {
      setError('Network error during face verification');
      console.error('Face verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <Camera className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Face Verification</h2>
        <p className="text-gray-600 mt-2">
          Position your face in the camera frame and capture a clear photo
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="relative">
        {!isCapturing ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover rounded-lg bg-gray-100"
            />
            <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border-2 border-blue-400 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured face"
              className="w-full h-64 object-cover rounded-lg"
            />
            {verificationResult && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  {verificationResult.matched ? (
                    <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-2" />
                  ) : (
                    <XCircle className="w-16 h-16 mx-auto text-red-400 mb-2" />
                  )}
                  <p className="text-lg font-semibold">
                    {verificationResult.matched ? 'Face Matched!' : 'No Match'}
                  </p>
                  <p className={`text-sm ${getConfidenceColor(verificationResult.confidence)}`}>
                    Confidence: {(verificationResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex space-x-3 mt-6">
        {!isCapturing ? (
          <>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </button>
          </>
        ) : (
          <>
            <button
              onClick={retakePhoto}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake
            </button>
            <button
              onClick={verifyFace}
              disabled={loading || verificationResult?.matched}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Verify
            </button>
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>• Ensure good lighting for best results</p>
        <p>• Look directly at the camera</p>
        <p>• Remove glasses or hats if possible</p>
      </div>
    </div>
  );
}

export default FaceVerification;
