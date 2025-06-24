import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle, 
  AlertCircle,  Loader2,
  QrCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isDemoMode, getDemoData, simulateApiCall } from '../../config/demoConfig';
import QRScanner from './QRScanner';

function VoterSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { searchVoter, selectVoter, loading, error, clearError } = useApp();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState('id');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  useEffect(() => {
    // Auto-search if query from URL
    const initialQuery = searchParams.get('q');
    if (initialQuery && initialQuery.trim()) {
      handleSearch(initialQuery.trim());
    }
  }, [handleSearch, searchParams]);

  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim()) return;

    setIsSearching(true);
    clearError();

    try {
      if (isDemoMode()) {
        // Use demo voter data
        const demoVoters = getDemoData('voters');
        await simulateApiCall(null, 800); // Simulate API delay
        
        const results = demoVoters.filter(voter => {
          const searchTerm = query.toLowerCase();
          if (searchType === 'id') {
            return voter.voterId.toLowerCase().includes(searchTerm);
          } else {
            return voter.name.toLowerCase().includes(searchTerm) ||
                   voter.fatherName.toLowerCase().includes(searchTerm);
          }
        });
        
        setSearchResults(results.map(voter => ({
          ...voter,
          voter_id: voter.voterId,
          voter_name: voter.name,
          father_name: voter.fatherName,
          is_active: true,
          phone: voter.documents?.phone || 'Not available',
          constituency: voter.constituency,
          polling_station: voter.pollingStation
        })));
      } else {
        const results = await searchVoter(query.trim(), searchType);
        setSearchResults(results);
      }    } catch (error) {
      // Search failed
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType, searchVoter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSelectVoter = async (voterId) => {
    try {
      const voter = await selectVoter(voterId);
      if (voter) {
        navigate(`/verify/${voterId}`);
      }
    } catch (error) {
      // Console statement removed
    }
  };

  const handleQRScan = (scannedData) => {
    try {
      // Parse QR code data - could be JSON or just voter ID
      let voterId = scannedData;
      
      try {
        const parsed = JSON.parse(scannedData);
        voterId = parsed.voterId || parsed.voter_id || parsed.id || scannedData;
      } catch {
        // Not JSON, use as-is
      }

      setSearchQuery(voterId);
      setSearchType('id');
      setShowQRScanner(false);
      
      // Auto-search the scanned ID
      setTimeout(() => {
        handleSearch(voterId);
      }, 100);

    } catch (error) {
      // Console statement removed
    }
  };

  const getResultIcon = (voter) => {
    if (!voter.is_active) {
      return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Voter Search</h1>
        <p className="text-gray-600">
          Search for voters by ID, name, or scan their QR code to begin verification
        </p>
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

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Type Selector */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="id"
                checked={searchType === 'id'}
                onChange={(e) => setSearchType(e.target.value)}
                className="mr-2"
              />
              Voter ID
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="name"
                checked={searchType === 'name'}
                onChange={(e) => setSearchType(e.target.value)}
                className="mr-2"
              />
              Full Name
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="mobile"
                checked={searchType === 'mobile'}
                onChange={(e) => setSearchType(e.target.value)}
                className="mr-2"
              />
              Mobile Number
            </label>
          </div>

          {/* Search Input */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchType === 'id' ? 'Enter Voter ID (e.g., WBN123456)' :
                  searchType === 'name' ? 'Enter full name' :
                  'Enter mobile number'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching || loading}
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </button>
          </div>
        </form>

        {/* Search Tips */}
        <div className="mt-4 text-sm text-gray-500">
          <p>
            <strong>Tips:</strong>
            {searchType === 'id' && ' You can enter partial Voter ID for broader search'}
            {searchType === 'name' && ' Enter the full name as registered'}
            {searchType === 'mobile' && ' Enter the registered mobile number'}
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Search Results */}
      {(searchResults.length > 0 || (searchQuery && !isSearching)) && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
              {searchResults.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({searchResults.length} found)
                </span>
              )}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {searchResults.length > 0 ? (
              searchResults.map((voter) => (
                <div
                  key={voter.voter_id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectVoter(voter.voter_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Status Icon */}
                      <div className="pt-1">
                        {getResultIcon(voter)}
                      </div>

                      {/* Voter Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {voter.full_name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {voter.voter_id}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-600">
                          {voter.registered_mobile && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {voter.registered_mobile}
                            </div>
                          )}
                          {voter.district && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {voter.district}
                            </div>
                          )}
                          {voter.polling_booth && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {voter.polling_booth}
                            </div>
                          )}
                        </div>

                        {voter.date_of_birth && (
                          <div className="mt-1 text-sm text-gray-500">
                            DOB: {new Date(voter.date_of_birth).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVoter(voter.voter_id);
                        }}
                        disabled={!voter.is_active}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          voter.is_active
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {voter.is_active ? 'Verify' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  {!voter.is_active && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      ⚠️ This voter is marked as inactive
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No voters found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search terms or check the spelling
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchQuery && searchResults.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border py-12">
          <div className="text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search for Voters
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Enter a Voter ID, full name, or mobile number to find registered voters.
              You can also scan a QR code for quick lookup.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Use Voter ID for exact matches</p>
              <p>• Full name search is case-insensitive</p>
              <p>• QR code scanning works with voter ID cards</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoterSearch;
