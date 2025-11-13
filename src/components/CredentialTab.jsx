import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// ============================================================================
// CREDENTIAL TAB COMPONENT
// ============================================================================
// This component handles VC (Verifiable Credential) issuance and storage
// Flow:
// 1. Request VC from backend (issuer signs it)
// 2. Encrypt VC locally using user's private key (AES encryption)
// 3. Upload encrypted VC to IPFS
// 4. Display CID (IPFS hash) for sharing
// ============================================================================

export default function CredentialTab() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [issuerInfo, setIssuerInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [degreeData, setDegreeData] = useState({
    type: 'BachelorDegree',
    name: 'Bachelor of Technology in Computer Science',
    university: 'Example Tech University',
    graduationYear: 2025
  });

  const API_URL = 'http://localhost:5000/api';

  // Load credentials from localStorage on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('userCredentials');
    if (savedCredentials) {
      try {
        setCredentials(JSON.parse(savedCredentials));
      } catch (error) {
        console.error('Error loading credentials:', error);
      }
    }

    // Fetch issuer info
    fetchIssuerInfo();
  }, []);

  // ========================================================================
  // Function: Fetch Issuer Information
  // ========================================================================
  const fetchIssuerInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/issuer-info`);
      setIssuerInfo(response.data);
    } catch (error) {
      console.error('Error fetching issuer info:', error);
    }
  };

  // ========================================================================
  // Function: Request and Store VC
  // ========================================================================
  // This function:
  // 1. Retrieves user's identity from localStorage
  // 2. Requests backend to issue a signed VC
  // 3. Encrypts the VC using AES (key derived from private key)
  // 4. Uploads encrypted VC to IPFS
  // 5. Saves CID and metadata to localStorage
  // ========================================================================

  const handleRequestVC = async () => {
    try {
      setLoading(true);
      setMessage('Processing credential request...');

      // Step 1: Get user identity from localStorage
      const identityStr = localStorage.getItem('userIdentity');
      if (!identityStr) {
        setMessage('❌ Please create an identity first!');
        return;
      }

      const identity = JSON.parse(identityStr);
      console.log('📜 Requesting VC for user:', identity.did);

      // Step 2: Request VC from backend (issuer signs it)
      setMessage('📤 Requesting credential from issuer...');
      const vcResponse = await axios.post(`${API_URL}/issue-vc`, {
        holderDID: identity.did,
        holderPublicKey: identity.publicKey,
        degree: degreeData
      });

      if (!vcResponse.data.success) {
        setMessage('❌ Error issuing VC');
        return;
      }

      const vc = vcResponse.data.vc;
      const signature = vcResponse.data.signature;

      console.log('✓ VC Received from issuer');
      console.log('VC:', vc);
      console.log('Signature:', signature);

      // Step 3: Encrypt the VC using AES encryption
      // Key is derived from user's private key (using first 32 chars as encryption key)
      setMessage('🔐 Encrypting credential locally...');
      const encryptionKey = identity.privateKey.slice(0, 32); // Use first 32 chars as encryption key
      const encryptedVC = CryptoJS.AES.encrypt(JSON.stringify(vc), encryptionKey).toString();

      console.log('✓ VC encrypted');
      console.log('Encrypted VC:', encryptedVC.slice(0, 50) + '...');

      // Step 4: Upload encrypted VC to IPFS
      setMessage('📤 Uploading to IPFS...');
      const ipfsResponse = await axios.post(`${API_URL}/upload-to-ipfs`, {
        encryptedVC,
        metadata: {
          holderDID: identity.did,
          issuerDID: vc.issuer,
          issuanceDate: vc.issuanceDate,
          credentialType: vc.type
        }
      });

      if (!ipfsResponse.data.success) {
        setMessage('❌ Error uploading to IPFS');
        return;
      }

      const cid = ipfsResponse.data.cid;
      console.log('✓ Credential stored on IPFS');
      console.log('CID:', cid);

      // Step 5: Save credential record to localStorage
      const credentialRecord = {
        id: Date.now(),
        did: identity.did,
        issuer: vc.issuer,
        cid,
        signature,
        degreeData: vc.credentialSubject.degree,
        issuanceDate: vc.issuanceDate,
        isSimulated: ipfsResponse.data.isSimulated || false,
        ipfsGatewayUrl: ipfsResponse.data.ipfsGatewayUrl
      };

      const updatedCredentials = [credentialRecord, ...credentials];
      localStorage.setItem('userCredentials', JSON.stringify(updatedCredentials));
      setCredentials(updatedCredentials);

      setMessage(
        `✅ Credential issued and stored! CID: ${cid}${ipfsResponse.data.isSimulated ? ' (Simulated)' : ''}`
      );
      setShowForm(false);
      setDegreeData({
        type: 'BachelorDegree',
        name: 'Bachelor of Technology in Computer Science',
        university: 'Example Tech University',
        graduationYear: 2025
      });
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Function: Copy CID to Clipboard
  // ========================================================================
  const handleCopyCID = (cid) => {
    navigator.clipboard.writeText(cid);
    setMessage('✓ CID copied to clipboard');
  };

  // ========================================================================
  // Function: Share Credential
  // ========================================================================
  const handleShare = (credential) => {
    const shareText = `Check out my verifiable credential!\nCID: ${credential.cid}\nIssuer: ${credential.issuer}\nVerify at: ${credential.ipfsGatewayUrl}`;
    navigator.clipboard.writeText(shareText);
    setMessage('✓ Credential share info copied to clipboard');
  };

  // ========================================================================
  // UI RENDERING
  // ========================================================================

  return (
    <div className="space-y-4">
      {/* Issuer Info Card */}
      {issuerInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">
            <strong>Current Issuer:</strong> {issuerInfo.name}
          </p>
          <p className="text-xs text-gray-500 font-mono mt-1">{issuerInfo.did.slice(0, 40)}...</p>
        </div>
      )}

      {/* Request New Credential Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          {loading ? '⏳ Processing...' : '➕ Request New Credential'}
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">📋 Degree Information</h3>

          <div className="space-y-4">
            {/* Degree Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Degree Type</label>
              <select
                value={degreeData.type}
                onChange={(e) => setDegreeData({ ...degreeData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>BachelorDegree</option>
                <option>MastersDegree</option>
                <option>Diploma</option>
                <option>Certificate</option>
              </select>
            </div>

            {/* Degree Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Degree Name</label>
              <input
                type="text"
                value={degreeData.name}
                onChange={(e) => setDegreeData({ ...degreeData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">University/Institution</label>
              <input
                type="text"
                value={degreeData.university}
                onChange={(e) => setDegreeData({ ...degreeData, university: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Graduation Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Graduation Year</label>
              <input
                type="number"
                value={degreeData.graduationYear}
                onChange={(e) => setDegreeData({ ...degreeData, graduationYear: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleRequestVC}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {loading ? '⏳ Issuing...' : '✓ Request & Store'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('✓') || message.includes('✅')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Stored Credentials */}
      {credentials.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">📂 My Credentials ({credentials.length})</h3>

          <div className="space-y-4">
            {credentials.map((cred, index) => (
              <div key={cred.id} className="border-l-4 border-blue-500 bg-blue-50 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800">
                    {index + 1}. {cred.degreeData.name}
                  </h4>
                  {cred.isSimulated && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Simulated</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>
                    <strong>University:</strong> {cred.degreeData.university}
                  </div>
                  <div>
                    <strong>Graduation:</strong> {cred.degreeData.graduationYear}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Issued:</strong> {new Date(cred.issuanceDate).toLocaleDateString()}
                  </div>
                </div>

                {/* CID Display */}
                <div className="mt-3 bg-white p-2 rounded border border-gray-300">
                  <p className="text-xs text-gray-600 font-semibold">CID (IPFS Hash)</p>
                  <p className="font-mono text-xs text-blue-700 break-all">{cred.cid}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleCopyCID(cred.cid)}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition"
                  >
                    📋 Copy CID
                  </button>
                  <button
                    onClick={() => handleShare(cred)}
                    className="text-sm bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded transition"
                  >
                    🔗 Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ What Happens Here?</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
          <li>
            <strong>Step 1:</strong> You request a credential from the issuer (University)
          </li>
          <li>
            <strong>Step 2:</strong> Issuer signs the credential with their private key
          </li>
          <li>
            <strong>Step 3:</strong> Your browser encrypts it using your private key (AES)
          </li>
          <li>
            <strong>Step 4:</strong> Encrypted credential is stored on IPFS
          </li>
          <li>
            <strong>Step 5:</strong> You get a CID (hash) to retrieve it anytime
          </li>
        </ul>
      </div>
    </div>
  );
}
