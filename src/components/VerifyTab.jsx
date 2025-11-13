import React, { useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// ============================================================================
// VERIFY TAB COMPONENT
// ============================================================================
// This component handles VC verification
// Flow:
// 1. User pastes a CID
// 2. Retrieve encrypted VC from IPFS
// 3. Decrypt using holder's private key
// 4. Verify signature using backend
// 5. Display verification result
// ============================================================================

export default function VerifyTab() {
  const [cid, setCID] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [decryptedVC, setDecryptedVC] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // ========================================================================
  // Function: Verify Credential
  // ========================================================================
  // This function:
  // 1. Retrieves encrypted VC from IPFS using CID
  // 2. Gets user's private key from localStorage to decrypt
  // 3. Decrypts the VC locally
  // 4. Sends to backend for signature verification
  // 5. Displays verification result
  // ========================================================================

  const handleVerify = async () => {
    try {
      if (!cid.trim()) {
        setMessage('❌ Please enter a CID');
        return;
      }

      setLoading(true);
      setMessage('🔍 Verifying credential...');
      setVerificationResult(null);
      setDecryptedVC(null);

      // Step 1: Get user's private key from localStorage (needed for decryption)
      const identityStr = localStorage.getItem('userIdentity');
      if (!identityStr) {
        setMessage('❌ Please create an identity first to verify credentials!');
        return;
      }

      const identity = JSON.parse(identityStr);
      const decryptionKey = identity.privateKey.slice(0, 32);

      console.log('🔍 Verifying credential with CID:', cid);

      // Step 2: Retrieve encrypted VC from IPFS
      setMessage('📥 Retrieving credential from IPFS...');
      let encryptedVC;

      try {
        const retrieveResponse = await axios.post(`${API_URL}/retrieve-from-ipfs`, {
          cid: cid.trim()
        });

        if (retrieveResponse.data.success) {
          encryptedVC = retrieveResponse.data.data;
          console.log('✓ Retrieved from IPFS');
        } else {
          // If IPFS fails, check if it's a simulated CID from localStorage credentials
          const credentialsStr = localStorage.getItem('userCredentials');
          if (credentialsStr) {
            const credentials = JSON.parse(credentialsStr);
            const foundCred = credentials.find((c) => c.cid === cid.trim());

            if (foundCred) {
              setMessage('✓ Found in local credentials (simulated IPFS)');
              // We need to retrieve from local storage and re-encrypt
              setMessage('⚠️ This is a simulated credential. Skipping IPFS retrieval.');
              encryptedVC = null;
            } else {
              setMessage('❌ CID not found in IPFS or local storage');
              return;
            }
          } else {
            setMessage('❌ Error retrieving from IPFS: ' + retrieveResponse.data.error);
            return;
          }
        }
      } catch (error) {
        setMessage('⚠️ Could not retrieve from IPFS. Make sure your local IPFS daemon is running, or use a simulated CID.');
        return;
      }

      if (!encryptedVC) {
        setMessage('❌ No encrypted credential data found');
        return;
      }

      // Step 3: Decrypt the VC locally using AES
      setMessage('🔐 Decrypting credential...');
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedVC, decryptionKey).toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
          setMessage('❌ Decryption failed - wrong key or corrupted data');
          return;
        }

        const vc = JSON.parse(decrypted);
        setDecryptedVC(vc);
        console.log('✓ Credential decrypted');
        console.log('VC:', vc);

        // Step 4: Verify signature with backend
        setMessage('🔐 Verifying credential signature...');

        // Get the signature from local credentials
        const credentialsStr = localStorage.getItem('userCredentials');
        if (!credentialsStr) {
          setMessage('❌ Could not find credential signature in local storage');
          return;
        }

        const credentials = JSON.parse(credentialsStr);
        const foundCred = credentials.find((c) => c.cid === cid.trim());

        if (!foundCred) {
          setMessage('❌ Credential not found in local storage');
          return;
        }

        const verifyResponse = await axios.post(`${API_URL}/verify-vc`, {
          credentialPayload: vc,
          signature: foundCred.signature
        });

        console.log('✓ Signature verified');
        console.log('Verification result:', verifyResponse.data);

        // Step 5: Display verification result
        setVerificationResult({
          isValid: verifyResponse.data.isValid,
          verified: verifyResponse.data.verified,
          message: verifyResponse.data.message,
          issuer: verifyResponse.data.issuer,
          subject: verifyResponse.data.subject
        });

        setMessage(verifyResponse.data.message);
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        setMessage('❌ Error decrypting credential: ' + decryptError.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Function: Handle Enter Key
  // ========================================================================

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  // ========================================================================
  // UI RENDERING
  // ========================================================================

  return (
    <div className="space-y-4">
      {/* CID Input Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">🔍 Verify Credential</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Credential CID (IPFS Hash)</label>
            <input
              type="text"
              value={cid}
              onChange={(e) => setCID(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paste CID here (e.g., Qm...)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can paste a CID from a credential you received or from your stored credentials
            </p>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || !cid.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            {loading ? '⏳ Verifying...' : '✓ Verify Credential'}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('✓') ||
            message.includes('✅') ||
            message.includes('Signature valid') ||
            (message.includes('✅') && message.includes('valid'))
              ? 'bg-green-50 text-green-700 border border-green-200'
              : message.includes('⚠')
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div
          className={`rounded-lg shadow-md p-6 border-l-4 ${
            verificationResult.verified
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">
              {verificationResult.verified ? '✅' : '❌'}
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${
                verificationResult.verified ? 'text-green-800' : 'text-red-800'
              }`}>
                {verificationResult.verified ? 'Credential Valid' : 'Credential Invalid'}
              </h3>
              <p className={verificationResult.verified ? 'text-green-700' : 'text-red-700'}>
                {verificationResult.message}
              </p>
            </div>
          </div>

          {/* Credential Details */}
          {decryptedVC && (
            <div className="space-y-3 mt-4">
              <div className="bg-white rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold">Issuer</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {decryptedVC.issuer}
                </p>
              </div>

              <div className="bg-white rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold">Credential Subject (Holder)</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {decryptedVC.credentialSubject.id}
                </p>
              </div>

              <div className="bg-white rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold">Degree Information</p>
                <div className="text-sm text-gray-800 mt-2 space-y-1">
                  <div>
                    <strong>Type:</strong> {decryptedVC.credentialSubject.degree.type}
                  </div>
                  <div>
                    <strong>Name:</strong> {decryptedVC.credentialSubject.degree.name}
                  </div>
                  <div>
                    <strong>University:</strong> {decryptedVC.credentialSubject.degree.university}
                  </div>
                  <div>
                    <strong>Graduation Year:</strong> {decryptedVC.credentialSubject.degree.graduationYear}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold">Issuance Date</p>
                <p className="text-sm text-gray-800">
                  {new Date(decryptedVC.issuanceDate).toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold">Credential Types</p>
                <p className="text-sm text-gray-800">
                  {decryptedVC.type.join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ How Verification Works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
          <li>
            <strong>Step 1:</strong> Provide the CID (IPFS hash) of a credential
          </li>
          <li>
            <strong>Step 2:</strong> System retrieves the encrypted credential from IPFS
          </li>
          <li>
            <strong>Step 3:</strong> Your private key decrypts it (stays on your device)
          </li>
          <li>
            <strong>Step 4:</strong> Backend verifies the issuer's signature
          </li>
          <li>
            <strong>Step 5:</strong> Result shows if credential is authentic and unmodified
          </li>
        </ul>
      </div>

      {/* Test Data Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-bold text-purple-900 mb-2">🧪 Testing Tips</h3>
        <ul className="text-sm text-purple-800 space-y-1 list-disc pl-5">
          <li>
            First, create an identity in the <strong>Identity</strong> tab
          </li>
          <li>
            Then request a credential in the <strong>Credential</strong> tab
          </li>
          <li>
            Copy the CID from your stored credentials and paste it here
          </li>
          <li>
            Click "Verify Credential" to verify it with the issuer's signature
          </li>
          <li>
            Try modifying the CID slightly to see verification fail
          </li>
        </ul>
      </div>
    </div>
  );
}
