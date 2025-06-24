import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

function QRScanner({ onScan, onClose }) {  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize QR scanner when component mounts
    const initScanner = () => {
      try {
        const qrScanner = new Html5QrcodeScanner(
          'qr-scanner',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            supportedScanTypes: [0, 1] // QR Code and Data Matrix
          },
          false
        );        qrScanner.render(
          (decodedText) => {
            // Successfully scanned
            // Console statement removed
            onScan(decodedText);
            cleanup();
          },
          (error) => {
            // Scanning failed - this is normal and happens continuously
            // Only log actual errors, not scanning attempts
            if (error.includes('NotFoundException') === false) {
              // Console statement removed
            }
          }
        );        setScanner(qrScanner);
      } catch (error) {
        // Console statement removed
        setError('Failed to initialize camera. Please check permissions.');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [onScan, cleanup]);

  const cleanup = useCallback(() => {
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        // Error cleaning up scanner
      }
    }
  }, [scanner]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (scanner) {
        scanner.scanFile(file, true)          .then(decodedText => {
            // Console statement removed
            onScan(decodedText);
            cleanup();
          })
          .catch(() => {
            // Console statement removed
            setError('Could not read QR code from image. Please try again.');
          });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Camera className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Scan QR Code</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Scanner Error</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* QR Scanner Container */}
              <div className="mb-4">
                <div 
                  id="qr-scanner" 
                  ref={scannerRef}
                  className="w-full"
                  style={{ minHeight: '300px' }}
                />
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-600 mb-4">
                <p className="mb-2">
                  📱 Point your camera at the QR code on the voter&apos;s ID card
                </p>
                <p className="text-xs text-gray-500">
                  Make sure the QR code is clearly visible and well-lit
                </p>
              </div>

              {/* File Upload Alternative */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Or upload an image with QR code:
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    📷 Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Cancel Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRScanner;
