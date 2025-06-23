import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Eye, AlertTriangle } from 'lucide-react';

function DocumentVerification({ voterId, onVerificationComplete, onCancel }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [documentType, setDocumentType] = useState('AADHAAR');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('voterId', voterId);
      formData.append('documentType', documentType);

      // OCR Processing
      const ocrResponse = await fetch('/api/verification/document-ocr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const ocrData = await ocrResponse.json();

      if (ocrData.success) {
        setOcrResult(ocrData.data);

        // Verify extracted data against voter record
        const verifyResponse = await fetch('/api/verification/document-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            voterId,
            documentType,
            extractedData: ocrData.data,
            documentHash: ocrData.documentHash
          })
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          setVerificationResult(verifyData.verification);

          if (verifyData.verification.isValid && verifyData.verification.matchScore > 0.8) {
            setTimeout(() => {
              onVerificationComplete({
                method: 'DOCUMENT_VERIFICATION',
                success: true,
                documentType,
                matchScore: verifyData.verification.matchScore,
                extractedData: ocrData.data,
                timestamp: new Date().toISOString()
              });
            }, 2000);
          }
        } else {
          setError(verifyData.message || 'Document verification failed');
        }
      } else {
        setError(ocrData.message || 'OCR processing failed');
      }
    } catch (err) {
      setError('Network error during document processing');
      console.error('Document verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const retryProcess = () => {
    setOcrResult(null);
    setVerificationResult(null);
    setError(null);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const documentTypes = [
    { value: 'AADHAAR', label: 'Aadhaar Card' },
    { value: 'VOTER_ID', label: 'Voter ID Card' },
    { value: 'PAN', label: 'PAN Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' }
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Document Verification</h2>
        <p className="text-gray-600 mt-2">
          Upload a clear photo of your identity document for verification
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

      {/* Document Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {documentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Click to upload document image</p>
          <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative">
            <img
              src={previewUrl}
              alt="Document preview"
              className="w-full max-h-64 object-contain rounded-lg border"
            />
            {verificationResult && (
              <div className="absolute top-2 right-2">
                {verificationResult.isValid ? (
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </div>
                ) : (
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                    <XCircle className="w-3 h-3 mr-1" />
                    Invalid
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OCR Results */}
          {ocrResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Extracted Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(ocrResult).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-medium">{value || 'Not found'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Results */}
          {verificationResult && (
            <div className={`rounded-lg p-4 ${verificationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className="font-medium mb-3 flex items-center">
                {verificationResult.isValid ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                )}
                Verification Result
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Match Score:</span>
                  <span className={`font-medium ${getMatchScoreColor(verificationResult.matchScore)}`}>
                    {(verificationResult.matchScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${verificationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationResult.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                {verificationResult.issues && verificationResult.issues.length > 0 && (
                  <div className="mt-2">
                    <span className="text-red-600 font-medium">Issues:</span>
                    <ul className="list-disc list-inside text-red-600 ml-2">
                      {verificationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>

        {selectedFile && !ocrResult && (
          <button
            onClick={processDocument}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Process Document
          </button>
        )}

        {ocrResult && !verificationResult && (
          <button
            onClick={retryProcess}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Retry
          </button>
        )}

        {selectedFile && (
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setOcrResult(null);
              setVerificationResult(null);
              setError(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Choose Different File
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
        <p>• Ensure document is clearly visible and well-lit</p>
        <p>• Avoid shadows or glare on the document</p>
        <p>• Supported formats: JPG, PNG (max 5MB)</p>
      </div>
    </div>
  );
}

export default DocumentVerification;
