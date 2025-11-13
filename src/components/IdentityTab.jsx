import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ============================================================================
// IDENTITY TAB COMPONENT
// ============================================================================
// This component handles DID creation and displays the user's identity
// Features:
// - Generate a new DID (Decentralized Identifier)
// - Display public key and DID
// - Store private key in local storage (simulated wallet)
// - Clear identity (for testing)
// ============================================================================

export default function IdentityTab() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const API_URL = 'http://localhost:5000/api';

  // Load identity from localStorage on component mount
  useEffect(() => {
    const savedIdentity = localStorage.getItem('userIdentity');
    if (savedIdentity) {
      try {
        setIdentity(JSON.parse(savedIdentity));
        setMessage('✓ Identity loaded from local storage');
      } catch (error) {
        console.error('Error loading identity:', error);
      }
    }
  }, []);

  // ========================================================================
  // Function: Create New DID
  // ========================================================================
  // Calls backend to generate a new DID
  // Stores the identity (including private key) in localStorage
  // ========================================================================

  const handleCreateDID = async () => {
    try {
      setLoading(true);
      setMessage('Creating your DID...');

      // Call backend API to create DID
      const response = await axios.post("http://localhost:5000/api/create-did");

      if (response.data.success) {
        const newIdentity = {
          did: response.data.did,
          publicKey: response.data.publicKey,
          privateKey: response.data.privateKey,
          address: response.data.address,
          createdAt: new Date().toISOString()
        };

        // Store in localStorage (simulated wallet)
        localStorage.setItem('userIdentity', JSON.stringify(newIdentity));
        setIdentity(newIdentity);
        setMessage('✅ ' + response.data.message);

        console.log('📝 New DID Created:');
        console.log(`   DID: ${newIdentity.did}`);
        console.log(`   Public Key: ${newIdentity.publicKey.slice(0, 30)}...`);
      }
    } catch (error) {
      setMessage('❌ Error creating DID: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Function: Clear Identity
  // ========================================================================
  // Clears identity from localStorage (useful for testing multiple users)
  // ========================================================================

  const handleClearIdentity = () => {
    if (window.confirm('Are you sure you want to clear your identity? This cannot be undone!')) {
      localStorage.removeItem('userIdentity');
      setIdentity(null);
      setMessage('✓ Identity cleared from local storage');
    }
  };

  // ========================================================================
  // UI RENDERING
  // ========================================================================

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">🆔 Your Digital Identity</h2>

        {!identity ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No identity created yet. Click the button below to generate your DID (Decentralized Identifier).
            </p>
            <button
              onClick={handleCreateDID}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              {loading ? '⏳ Creating DID...' : '➕ Create New DID'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* DID Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600">Your DID</label>
              <p className="text-lg font-mono text-blue-700 break-all mt-1">{identity.did}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(identity.did);
                  setMessage('✓ DID copied to clipboard');
                }}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                📋 Copy to Clipboard
              </button>
            </div>

            {/* Address Display */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600">Ethereum Address</label>
              <p className="text-lg font-mono text-purple-700 break-all mt-1">{identity.address}</p>
            </div>

            {/* Public Key Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600">Public Key (Use for verification)</label>
              <p className="text-sm font-mono text-green-700 break-all mt-1">{identity.publicKey.slice(0, 50)}...</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(identity.publicKey);
                  setMessage('✓ Public key copied to clipboard');
                }}
                className="mt-2 text-sm text-green-600 hover:underline"
              >
                📋 Copy Public Key
              </button>
            </div>

            {/* Private Key Warning */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600">⚠️ Private Key (Keep Secret!)</label>
              <details className="mt-2">
                <summary className="text-sm text-red-600 hover:underline cursor-pointer">
                  Click to reveal (do NOT share)
                </summary>
                <p className="text-xs font-mono text-red-700 break-all mt-2 bg-red-100 p-2 rounded">
                  {identity.privateKey}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Never share this with anyone. It controls your identity and credentials.
                </p>
              </details>
            </div>

            {/* Created At */}
            <div className="text-sm text-gray-500">
              Created: {new Date(identity.createdAt).toLocaleString()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleCreateDID}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition flex-1"
              >
                {loading ? '⏳ Creating...' : '🔄 Create New Identity'}
              </button>
              <button
                onClick={handleClearIdentity}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✓') || message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ What is a DID?</h3>
        <p className="text-sm text-blue-800">
          A DID (Decentralized Identifier) is a globally unique identifier that you control. It uses the did:ethr method
          based on Ethereum. Your DID is derived from your public key and can be used to prove ownership of credentials
          without relying on a central authority.
        </p>
      </div>
    </div>
  );
}
