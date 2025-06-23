import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle, ArrowLeft, FileText } from 'lucide-react';
import { isDemoMode, simulateApiCall } from '../../config/demoConfig';

function DocumentVerification({ voterId, onVerificationComplete, onCancel }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [documentImage, setDocumentImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captureMode, setCaptureMode] = useState(false);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Back camera for documents
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCaptureMode(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCaptureMode(false);
  };

  const captureDocument = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setDocumentImage(imageData);
    stopCamera();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyDocument = async () => {
    if (!documentImage) return;

    setLoading(true);
    setError(null);

    try {
      if (isDemoMode()) {
        // Simulate demo document verification
        await simulateApiCall(null, 3000);
        
        // Random simulation results for demo
        const isValid = Math.random() > 0.2; // 80% success rate
        const confidence = isValid ? (0.90 + Math.random() * 0.09) : (0.3 + Math.random() * 0.4);
        
        const documentTypes = ['Aadhar Card', 'Voter ID', 'Passport', 'Driving License'];
        const detectedType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
        
        setVerificationResult({
          valid: isValid,
          confidence: confidence,
          documentType: detectedType,
          extractedData: isValid ? {
            name: 'John Doe',
            id: 'ABCD1234567890',
            dateOfBirth: '1988-05-15',
            address: '123 Demo Street, Demo City'
          } : null,
          message: isValid 
            ? `${detectedType} verified successfully with ${(confidence * 100).toFixed(1)}% confidence`
            : 'Document verification failed - invalid or unclear document'
        });

        if (isValid && confidence > 0.85) {
          setTimeout(() => {
            onVerificationComplete && onVerificationComplete({
              method: 'DOCUMENT_VERIFICATION',
              success: true,
              confidence: confidence,
              documentType: detectedType,
              data: { documentImage }
            });
          }, 2000);
        }
      } else {
        // Real API call for document verification
        const response = await fetch('/api/verification/document-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            voterId,
            documentImage: documentImage,
            timestamp: new Date().toISOString()
          })
        });

        const result = await response.json();

        if (result.success) {
          setVerificationResult({
            valid: result.valid,
            confidence: result.confidence,
            documentType: result.documentType,
            extractedData: result.extractedData,
            message: result.message
          });

          if (result.valid && result.confidence > 0.85) {
            setTimeout(() => {
              onVerificationComplete && onVerificationComplete({
                method: 'DOCUMENT_VERIFICATION',
                success: true,
                confidence: result.confidence,
                documentType: result.documentType,
                data: result.data
              });
            }, 2000);
          }
        } else {
          throw new Error(result.message || 'Document verification failed');
        }
      }
    } catch (error) {
      console.error('Document verification error:', error);
      setError(error.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const resetDocument = () => {
    setDocumentImage(null);
    setVerificationResult(null);
    setError(null);
    stopCamera();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Demo mode standalone component
  if (isDemoMode() && !voterId && !onVerificationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Document Verification Demo</h1>
            <p className="text-gray-600 mt-2">
              Test our AI-powered document verification and OCR system
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <DocumentVerification 
              voterId="demo-voter-001"
              onVerificationComplete={(result) => {
                console.log('Demo verification result:', result);
                alert(`Demo document verification completed! Success: ${result.success}, Type: ${result.documentType}, Confidence: ${(result.confidence * 100).toFixed(1)}%`);
              }}
              onCancel={() => window.history.back()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Document Verification</h2>
        <p className="text-gray-600 mt-2">
          Upload or capture a photo of your identity document for verification
        </p>
        {isDemoMode() && (
          <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
            Demo Mode - Simulated OCR & Verification
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!documentImage && !captureMode && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700">Upload Document</span>
              <span className="text-sm text-gray-500 mt-1">Choose from gallery</span>
            </button>

            <button
              onClick={startCamera}
              className="flex flex-col items-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Camera className="w-12 h-12 text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700">Capture Document</span>
              <span className="text-sm text-gray-500 mt-1">Use camera</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="text-xs text-gray-500 text-center">
            Supported documents: Aadhar Card, Voter ID, Passport, Driving License
          </div>
        </div>
      )}

      {captureMode && (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover rounded-lg bg-gray-100"
            />
            <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-80 h-48 border-2 border-blue-400 rounded-lg opacity-50"></div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={stopCamera}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={captureDocument}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </button>
          </div>
        </div>
      )}

      {documentImage && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={documentImage}
              alt="Document"
              className="w-full max-h-96 object-contain rounded-lg border"
            />
            {verificationResult && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white p-4 bg-black bg-opacity-70 rounded-lg max-w-sm">
                  {verificationResult.valid ? (
                    <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-2" />
                  ) : (
                    <XCircle className="w-16 h-16 mx-auto text-red-400 mb-2" />
                  )}
                  <p className="text-lg font-semibold mb-2">
                    {verificationResult.valid ? 'Document Valid!' : 'Verification Failed'}
                  </p>
                  {verificationResult.documentType && (
                    <p className="text-sm mb-1">Type: {verificationResult.documentType}</p>
                  )}
                  <p className={`text-sm ${getConfidenceColor(verificationResult.confidence)}`}>
                    Confidence: {(verificationResult.confidence * 100).toFixed(1)}%
                  </p>
                  {verificationResult.extractedData && (
                    <div className="mt-2 text-xs">
                      <p>Name: {verificationResult.extractedData.name}</p>
                      <p>ID: {verificationResult.extractedData.id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={resetDocument}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Try Again
            </button>
            <button
              onClick={verifyDocument}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Document
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-6 flex justify-center">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DocumentVerification;
