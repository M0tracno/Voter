import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User,   Phone, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Send,
  ArrowLeft,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

function VoterVerification() {
  const { voterId } = useParams();
  const navigate = useNavigate();
  const {
    currentVoter,
    verificationStep,
    verificationResult,
    sendOTP,
    verifyOTP,
    clearCurrentVerification,
    loading,
    error,
    clearError
  } = useApp();

  const [otpCode, setOtpCode] = useState('');
  const [otpData, setOtpData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    // Countdown timer for OTP expiry
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  useEffect(() => {
    // Clean up on unmount
    return () => {
      clearCurrentVerification();
    };
  }, [clearCurrentVerification]);

  const handleSendOTP = async () => {
    try {
      clearError();
      const result = await sendOTP(voterId);
      
      if (result && result.success) {
        setOtpData(result);
        setCountdown(300); // 5 minutes countdown
        setAttemptCount(0);
      }
    } catch (error) {
      // Console statement removed
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      return;
    }

    try {
      clearError();
      const result = await verifyOTP(
        voterId, 
        otpCode.trim(), 
        otpData?.verificationId,
      );
      
      if (result && result.verified) {
        // Success - will be handled by context
        setOtpCode('');
      } else {
        setAttemptCount(prev => prev + 1);
        setOtpCode('');
      }
    } catch (error) {
      // Console statement removed
      setAttemptCount(prev => prev + 1);
      setOtpCode('');
    }
  };

  const handleBack = () => {
    if (verificationStep === 'confirm') {
      navigate('/search');
    } else if (verificationStep === 'otp') {
      clearCurrentVerification();
      navigate('/search');
    } else if (verificationStep === 'result') {
      clearCurrentVerification();
      navigate('/');
    }
  };

  const handleNewVerification = () => {
    clearCurrentVerification();
    navigate('/search');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentVoter && verificationStep !== 'result') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Voter Not Found</h2>
          <p className="text-gray-600 mb-6">
            The voter you&apos;re trying to verify could not be loaded.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voter Verification</h1>
          <p className="text-gray-600">
            Step {verificationStep === 'confirm' ? '1' : verificationStep === 'otp' ? '2' : '3'} of 3
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Confirm Voter Details */}
      {verificationStep === 'confirm' && currentVoter && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Voter Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Please verify the voter information is correct before proceeding
            </p>
          </div>

          <div className="p-6">
            {/* Voter Details Card */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {currentVoter.full_name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="font-mono">{currentVoter.voter_id}</span>
                    </div>
                    {currentVoter.registered_mobile && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{currentVoter.registered_mobile}</span>
                      </div>
                    )}
                    {currentVoter.district && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{currentVoter.district}</span>
                      </div>
                    )}
                    {currentVoter.polling_booth && (
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>Assigned to: {currentVoter.polling_booth}</span>
                      </div>
                    )}
                    {currentVoter.date_of_birth && (
                      <div className="text-sm text-gray-500">
                        DOB: {new Date(currentVoter.date_of_birth).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to Search
              </button>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {verificationStep === 'otp' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Enter OTP</h2>
            <p className="text-sm text-gray-600 mt-1">
              We&apos;ve sent a 6-digit code to {currentVoter?.registered_mobile}
            </p>
          </div>

          <div className="p-6">
            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(value);
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                autoComplete="one-time-code"
              />
              
              {/* Countdown Timer */}
              {countdown > 0 && (
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-500">
                    Code expires in: <span className="font-mono font-medium">{formatTime(countdown)}</span>
                  </span>
                  {attemptCount > 0 && (
                    <span className="text-red-600">
                      {attemptCount} failed attempt{attemptCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {countdown === 0 && (
                <p className="text-red-600 text-sm mt-2">
                  ⏰ OTP has expired. Please request a new one.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {countdown > 0 ? (
                <button
                  onClick={handleVerifyOTP}
                  disabled={otpCode.length !== 6 || loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Verify
                </button>
              ) : (
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Verification Result */}
      {verificationStep === 'result' && verificationResult && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 text-center">
            {verificationResult.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Verification Successful!
                </h2>
                <p className="text-green-700 mb-6">
                  Voter {verificationResult.voterId} has been successfully verified.
                </p>
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-green-800">
                    <p><strong>Method:</strong> {verificationResult.method}</p>
                    <p><strong>Time:</strong> {new Date(verificationResult.timestamp).toLocaleString()}</p>
                    <p><strong>Status:</strong> ✅ Verified and logged</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">
                  Verification Failed
                </h2>
                <p className="text-red-700 mb-6">
                  The verification could not be completed.
                </p>
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-red-800">
                    <p><strong>Reason:</strong> {verificationResult.reason || 'Unknown error'}</p>
                    <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/audit')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                View Audit Log
              </button>
              <button
                onClick={handleNewVerification}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                New Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoterVerification;
