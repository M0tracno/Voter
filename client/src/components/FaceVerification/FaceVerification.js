import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { isDemoMode, simulateApiCall } from '../../config/demoConfig';

function FaceVerification({ voterId, onVerificationComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  // Initialize camera when component mounts
  useEffect(() => {
    if (!isDemoMode()) {
      initializeCamera();
    }
    return () => {
      // Cleanup camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError(null);
  };

  const performVerification = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (isDemoMode()) {
        // Demo mode - simulate verification
        const result = await simulateApiCall(() => {
          // Simulate different verification outcomes
          const outcomes = [
            { 
              success: true, 
              confidence: 0.92, 
              message: 'Face verification successful! Identity confirmed.',
              matchDetails: {
                faceMatch: true,
                livenessDetected: true,
                qualityScore: 0.89
              }
            },
            { 
              success: true, 
              confidence: 0.87, 
              message: 'Face verification successful with good confidence.',
              matchDetails: {
                faceMatch: true,
                livenessDetected: true,
                qualityScore: 0.78
              }
            },
            { 
              success: false, 
              confidence: 0.45, 
              message: 'Face verification failed. Please ensure good lighting and face the camera directly.',
              matchDetails: {
                faceMatch: false,
                livenessDetected: true,
                qualityScore: 0.65
              }
            }
          ];
          
          return outcomes[Math.floor(Math.random() * outcomes.length)];
        }, 2000);

        setVerificationResult(result);
        
        if (result.success && onVerificationComplete) {
          setTimeout(() => {
            onVerificationComplete({
              type: 'face',
              success: true,
              confidence: result.confidence,
              timestamp: new Date().toISOString(),
              data: result
            });
          }, 1500);
        }
      } else {
        // Real API call would go here
        // const response = await fetch('/api/verify-face', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ 
        //     voterId, 
        //     faceImage: capturedImage 
        //   })
        // });
        // const result = await response.json();
        // setVerificationResult(result);
        
        // For now, show error in non-demo mode
        setError('Face verification API not implemented in this demo');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed due to a technical error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (onVerificationComplete && verificationResult?.success) {
      onVerificationComplete({
        type: 'face',
        success: true,
        confidence: verificationResult.confidence,
        timestamp: new Date().toISOString(),
        data: verificationResult
      });
    }
  };

  const handleCancel = () => {
    // Clean up camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Face Verification</h1>
          <p className="text-gray-600">
            {voterId ? `Verifying identity for Voter ID: ${voterId}` : 'Verify your identity using facial recognition'}
          </p>
          
          {isDemoMode() && (
            <div className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800 font-medium">Demo Mode</span>
              </div>
              <p className="text-orange-700 mt-1">
                This is a simulated face verification. The camera will not be accessed and results are randomized.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera/Image Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Camera Capture</span>
            </h2>

            <div className="relative">
              {!capturedImage ? (
                <>
                  {isDemoMode() ? (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Demo Camera View</p>
                        <p className="text-sm opacity-75">Click capture to simulate photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full aspect-video bg-black rounded-lg"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-medium">Camera Error</span>
                      </div>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={capturePhoto}
                    disabled={!isDemoMode() && (!videoRef.current || error)}
                    className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <img
                    src={isDemoMode() ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2Yjc3ODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRlbW8gRmFjZSBJbWFnZTwvdGV4dD48L3N2Zz4=' : capturedImage}
                    alt="Captured face"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={retakePhoto}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
                    </button>
                    
                    <button
                      onClick={performVerification}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Verify Face</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Results</h2>

            {!verificationResult && !isProcessing && (
              <div className="text-center text-gray-500 py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No verification performed yet</p>
                <p className="text-sm">Capture a photo and click verify to see results</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-12">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-lg font-medium text-gray-900">Processing...</p>
                <p className="text-sm text-gray-600">Analyzing facial features and comparing with records</p>
              </div>
            )}

            {verificationResult && (
              <div className="space-y-6">
                {/* Main Result */}
                <div className={`p-4 rounded-lg ${
                  verificationResult.success 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-red-100 border border-red-300'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {verificationResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      verificationResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
                    </span>
                  </div>
                  <p className={`${
                    verificationResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationResult.message}
                  </p>
                </div>

                {/* Confidence Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(verificationResult.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        verificationResult.confidence >= 0.8 
                          ? 'bg-green-600' 
                          : verificationResult.confidence >= 0.6 
                          ? 'bg-yellow-600' 
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${verificationResult.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Match Details */}
                {verificationResult.matchDetails && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Verification Details</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Face Match</span>
                        <span className={`text-sm font-medium ${
                          verificationResult.matchDetails.faceMatch ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {verificationResult.matchDetails.faceMatch ? 'Matched' : 'No Match'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Liveness Detection</span>
                        <span className={`text-sm font-medium ${
                          verificationResult.matchDetails.livenessDetected ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {verificationResult.matchDetails.livenessDetected ? 'Live Person' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Image Quality</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(verificationResult.matchDetails.qualityScore * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  {verificationResult.success ? (
                    <button
                      onClick={handleComplete}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Complete Verification</span>
                    </button>
                  ) : (
                    <button
                      onClick={retakePhoto}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Try Again</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaceVerification;
