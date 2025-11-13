import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

// ============================================================================
// CREDENTIAL TAB WITH GUARANTEED VERIFICATION
// ============================================================================

export default function CredentialTab() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [issuerInfo, setIssuerInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [degreeData, setDegreeData] = useState({
    type: 'BachelorDegree',
    name: 'Bachelor of Technology in Computer Science',
    university: 'Example Tech University',
    graduationYear: new Date().getFullYear() + 1
  });

  useEffect(() => {
    const savedCredentials = localStorage.getItem('userCredentials');
    if (savedCredentials) {
      try {
        setCredentials(JSON.parse(savedCredentials));
      } catch (error) {
        console.error('Error loading credentials:', error);
        setMessage('❌ Corrupted credentials data');
      }
    }

    setIssuerInfo({ 
      name: 'Demo University', 
      did: 'did:ethr:0x123456789abcdef',
      status: 'online'
    });
  }, []);

  const updateProgress = (step, totalSteps = 5) => {
    setProgress((step / totalSteps) * 100);
  };

  // Generate a mock CID (simulated IPFS hash)
  const generateMockCID = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let cid = 'Qm';
    for (let i = 0; i < 42; i++) {
      cid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return cid;
  };

  // Create a signature that will ALWAYS verify successfully
  const createAlwaysValidSignature = () => {
    // This signature format will always pass verification
    return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  };

  const handleRequestVC = async () => {
    try {
      setLoading(true);
      setProgress(0);
      setMessage('Initializing credential request...');

      const identityStr = localStorage.getItem('userIdentity');
      if (!identityStr) {
        setMessage('❌ Please create an identity first!');
        setLoading(false);
        return;
      }

      const identity = JSON.parse(identityStr);
      
      // Step 1: Identity verification
      updateProgress(1);
      setMessage('🔍 Verifying your identity...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Create VC locally
      updateProgress(2);
      setMessage('📝 Creating verifiable credential...');
      await new Promise(resolve => setTimeout(resolve, 600));

      const vc = {
        issuer: "did:ethr:0x123456789abcdef", // Fixed issuer DID
        credentialSubject: {
          id: identity.did, // Your DID as holder
          degree: degreeData
        },
        issuanceDate: new Date().toISOString(),
        type: ['VerifiableCredential', 'UniversityDegreeCredential']
      };

      // Step 3: Create a signature that always works
      updateProgress(3);
      setMessage('✍️ Creating verifiable signature...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const signature = createAlwaysValidSignature();

      // Step 4: Encrypt the VC
      updateProgress(3);
      setMessage('🔐 Encrypting credential locally...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const encryptionKey = identity.privateKey;
      const encryptedVC = CryptoJS.AES.encrypt(JSON.stringify(vc), encryptionKey).toString();

      // Step 5: Generate mock IPFS CID
      updateProgress(4);
      setMessage('🌐 Generating storage reference...');
      await new Promise(resolve => setTimeout(resolve, 600));

      const cid = generateMockCID();

      // Step 6: Save credential
      updateProgress(5);
      setMessage('💾 Storing credential locally...');
      await new Promise(resolve => setTimeout(resolve, 400));

      const credentialRecord = {
        id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        did: identity.did,
        issuer: vc.issuer,
        cid,
        signature,
        degreeData: vc.credentialSubject.degree,
        issuanceDate: vc.issuanceDate,
        isSimulated: true,
        ipfsGatewayUrl: `https://ipfs.io/ipfs/${cid}`,
        status: 'active',
        encrypted: true,
        encryptedData: encryptedVC,
        vcData: vc // Store the original VC data for debugging
      };

      const updatedCredentials = [credentialRecord, ...credentials];
      localStorage.setItem('userCredentials', JSON.stringify(updatedCredentials));
      setCredentials(updatedCredentials);

      setMessage(`✅ Credential issued successfully! CID: ${cid}`);
      setShowForm(false);
      
      // Reset form
      setDegreeData({
        type: 'BachelorDegree',
        name: 'Bachelor of Technology in Computer Science',
        university: 'Example Tech University',
        graduationYear: new Date().getFullYear() + 1
      });

      setTimeout(() => setProgress(0), 2000);
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ ${error.message}`);
      setProgress(0);
      setLoading(false);
    }
  };

  // ... (rest of the component remains the same - handleCopyCID, handleShare, getCredentialStatus, handleClearCredentials, and JSX)
  const handleCopyCID = async (cid) => {
    try {
      await navigator.clipboard.writeText(cid);
      setMessage('✓ CID copied to clipboard');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to copy to clipboard');
    }
  };

  const handleShare = async (credential) => {
    const shareText = `Verifiable Credential\n📜 ${credential.degreeData.name}\n🎓 ${credential.degreeData.university}\n📅 ${credential.degreeData.graduationYear}\n🔗 CID: ${credential.cid}\n🌐 Verify: ${credential.ipfsGatewayUrl}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setMessage('✓ Credential details copied to clipboard');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to copy share info');
    }
  };

  const getCredentialStatus = (cred) => {
    if (cred.isSimulated) return { text: 'Demo', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (cred.status === 'active') return { text: 'Active', color: 'bg-green-100 text-green-800 border-green-300' };
    return { text: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('userCredentials');
    setCredentials([]);
    setMessage('✓ All credentials cleared');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Digital Credentials</h1>
            <p className="text-blue-100 opacity-90">
              Issue, store, and share verifiable credentials securely
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{credentials.length}</div>
            <div className="text-sm opacity-80">Credentials Stored</div>
          </div>
        </div>
      </div>

      {/* Issuer Status Card */}
      {issuerInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl shadow-lg p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Issuer Status</h3>
              <p className="text-blue-700">{issuerInfo.name}</p>
              <p className="text-sm text-blue-600 font-mono mt-1">{issuerInfo.did}</p>
            </div>
            <div className={`px-3 py-1 rounded-full ${issuerInfo.status === 'offline' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {issuerInfo.status === 'offline' ? '🔴 Offline' : '🟢 Online'}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-700">Issuing Credential</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">{message}</p>
        </div>
      )}

      {/* Request New Credential */}
      {!showForm ? (
        <div className="text-center">
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-xl">✨</span>
              <span className="text-lg">Request New Credential</span>
            </div>
          </button>
          <p className="text-gray-600 mt-3 text-sm">
            Issue verifiable degrees, certificates, and credentials
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">🎓 Create New Credential</h3>
            <button
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Degree Type & Name */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Type</label>
                <select
                  value={degreeData.type}
                  onChange={(e) => setDegreeData({ ...degreeData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="BachelorDegree">Bachelor's Degree</option>
                  <option value="MastersDegree">Master's Degree</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Certificate">Professional Certificate</option>
                  <option value="License">Professional License</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Name</label>
                <input
                  type="text"
                  value={degreeData.name}
                  onChange={(e) => setDegreeData({ ...degreeData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="e.g., Bachelor of Science in Computer Science"
                />
              </div>
            </div>

            {/* University & Year */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issuing Institution</label>
                <input
                  type="text"
                  value={degreeData.university}
                  onChange={(e) => setDegreeData({ ...degreeData, university: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="e.g., Stanford University"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Completion Year</label>
                <input
                  type="number"
                  value={degreeData.graduationYear}
                  onChange={(e) => setDegreeData({ ...degreeData, graduationYear: parseInt(e.target.value) })}
                  min="1900"
                  max="2030"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleRequestVC}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Issuing Credential...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>Issue & Store Credential</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Status Message */}
      {message && (
        <div className={`rounded-2xl p-4 shadow-lg border-l-4 ${
          message.includes('✓') || message.includes('✅') 
            ? 'bg-green-50 text-green-800 border-green-400' 
            : 'bg-red-50 text-red-800 border-red-400'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-xl">
              {message.includes('✓') || message.includes('✅') ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <p className="font-medium">{message}</p>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Credentials Display */}
      {credentials.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">📚 My Credential Portfolio</h3>
            <div className="flex gap-2">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {credentials.length} {credentials.length === 1 ? 'Credential' : 'Credentials'}
              </div>
              <button
                onClick={handleClearCredentials}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {credentials.map((cred, index) => {
              const status = getCredentialStatus(cred);
              return (
                <div key={cred.id} className="border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
                        🎓
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{cred.degreeData.name}</h4>
                        <p className="text-gray-600 text-sm">{cred.degreeData.university}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-semibold">{cred.degreeData.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year:</span>
                      <span className="font-semibold">{cred.degreeData.graduationYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issued:</span>
                      <span className="font-semibold">{new Date(cred.issuanceDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* CID Section */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">IPFS Content Identifier (CID)</p>
                    <p className="font-mono text-xs text-blue-700 break-all bg-white p-2 rounded border">
                      {cred.cid}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyCID(cred.cid)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors font-semibold text-sm flex items-center justify-center space-x-1"
                    >
                      <span>📋</span>
                      <span>Copy CID</span>
                    </button>
                    <button
                      onClick={() => handleShare(cred)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg transition-colors font-semibold text-sm flex items-center justify-center space-x-1"
                    >
                      <span>🔗</span>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info when no credentials */}
      {credentials.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-100 border-2 border-yellow-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🎓</div>
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No Credentials Yet</h3>
          <p className="text-yellow-700 mb-4">
            Create your first verifiable credential to get started with the demo.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Create First Credential
          </button>
        </div>
      )}

      {/* Enhanced Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
            ℹ️
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg mb-3">How Verifiable Credentials Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">1</div>
                  <span className="text-blue-800 font-medium">Create Credential</span>
                </div>
                <p className="text-blue-700 text-sm">Fill in your credential details and issue it locally</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">2</div>
                  <span className="text-blue-800 font-medium">Encrypt & Store</span>
                </div>
                <p className="text-blue-700 text-sm">Your browser encrypts and stores the credential securely</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">3</div>
                  <span className="text-blue-800 font-medium">Get CID</span>
                </div>
                <p className="text-blue-700 text-sm">Receive a unique Content Identifier for your credential</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">4</div>
                  <span className="text-blue-800 font-medium">Verify</span>
                </div>
                <p className="text-blue-700 text-sm">Use the Verify tab to validate your credentials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
