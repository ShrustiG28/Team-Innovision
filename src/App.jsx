import React, { useState } from 'react';
import IdentityTab from './components/IdentityTab';
import CredentialTab from './components/CredentialTab';
import VerifyTab from './components/VerifyTab';

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
// Decentralized Identity & Credential Vault
// Demonstrates self-sovereign identity using DIDs, VCs, and IPFS
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('identity');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🔐 Decentralized Identity Vault
          </h1>
          <p className="text-blue-100 mt-1">
            Self-Sovereign Identity using DIDs, Verifiable Credentials & IPFS
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'identity'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            🆔 Identity
          </button>
          <button
            onClick={() => setActiveTab('credential')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'credential'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            📜 Credential
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'verify'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            🔍 Verify
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-xl p-6 min-h-96">
          {activeTab === 'identity' && <IdentityTab />}
          {activeTab === 'credential' && <CredentialTab />}
          {activeTab === 'verify' && <VerifyTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-bold text-white mb-2">🔗 Technology Stack</h3>
              <ul className="text-sm space-y-1">
                <li>• React + Tailwind CSS (Frontend)</li>
                <li>• Node.js + Express (Backend)</li>
                <li>• Ethers.js (DID & Signing)</li>
                <li>• IPFS (Decentralized Storage)</li>
                <li>• AES Encryption (Privacy)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">📚 Key Concepts</h3>
              <ul className="text-sm space-y-1">
                <li>• DIDs (Decentralized Identifiers)</li>
                <li>• W3C Verifiable Credentials</li>
                <li>• Self-Sovereign Identity (SSI)</li>
                <li>• Cryptographic Signatures</li>
                <li>• Decentralized Storage</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">🎯 Flow Overview</h3>
              <ul className="text-sm space-y-1">
                <li>1. Create DID & Key Pair</li>
                <li>2. Request Signed VC</li>
                <li>3. Encrypt & Store on IPFS</li>
                <li>4. Retrieve & Verify</li>
                <li>5. Share CID with Verifiers</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4 text-center text-sm">
            <p>
              Built for Hackathon • Demonstrates Self-Sovereign Identity • Data stays under your control
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
