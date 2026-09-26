import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export function Options() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['geminiApiKey']).then((result) => {
      if (result.geminiApiKey) {
        setApiKey(result.geminiApiKey);
      }
    });
  }, []);

  async function handleValidate() {
    if (!apiKey.trim()) {
      setStatus('invalid');
      setErrorMessage('Please enter an API key');
      return;
    }

    setStatus('validating');
    setErrorMessage('');

    try {
      // Validate by making a trivial direct Gemini call — no backend needed
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: "Reply with just the word 'ok'." }] }],
      });
      setStatus('valid');
    } catch (err) {
      setStatus('invalid');
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.includes('API_KEY_INVALID') || msg.includes('invalid')) {
        setErrorMessage('Invalid API key. Check your key at aistudio.google.com/apikey');
      } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage('API key is valid but rate-limited. Try again in a moment.');
        setStatus('valid'); // key itself is fine
      } else {
        setErrorMessage(`Validation failed: ${msg}`);
      }
    }
  }

  async function handleSave() {
    await chrome.storage.local.set({ geminiApiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClear() {
    await chrome.storage.local.remove('geminiApiKey');
    setApiKey('');
    setStatus('idle');
    setSaved(false);
  }

  return (
    <div style={{
      maxWidth: 520,
      margin: '40px auto',
      padding: 32,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#1a1a1a',
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Creative Intelligence Pin
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Extension settings
      </p>

      {/* API Key Section */}
      <div style={{
        background: '#f9f9f9',
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#ED2224' }}>
          Gemini API Key
        </h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
          This extension uses Google's Gemini AI to analyze images. You need your own API key.
          Get a free key at{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ED2224', textDecoration: 'none', fontWeight: 500 }}
          >
            aistudio.google.com/apikey
          </a>
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setStatus('idle');
            }}
            placeholder="Paste your Gemini API key"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: '1px solid #d0d0d0',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              color: '#666',
            }}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleValidate}
            disabled={status === 'validating'}
            style={{
              padding: '10px 20px',
              background: '#fff',
              color: '#ED2224',
              border: '1px solid #ED2224',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: status === 'validating' ? 'wait' : 'pointer',
              opacity: status === 'validating' ? 0.7 : 1,
            }}
          >
            {status === 'validating' ? 'Validating...' : 'Validate'}
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            style={{
              padding: '10px 20px',
              background: '#ED2224',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: !apiKey.trim() ? 'not-allowed' : 'pointer',
              opacity: !apiKey.trim() ? 0.5 : 1,
            }}
          >
            Save
          </button>
          {apiKey && (
            <button
              onClick={handleClear}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#d32f2f',
                border: '1px solid #d32f2f',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Status feedback */}
        {status === 'valid' && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#e8f5e9', borderRadius: 8, fontSize: 13, color: '#2e7d32' }}>
            ✓ API key is valid
          </div>
        )}
        {status === 'invalid' && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fce4ec', borderRadius: 8, fontSize: 13, color: '#c62828' }}>
            {errorMessage}
          </div>
        )}
        {saved && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fde7e8', borderRadius: 8, fontSize: 13, color: '#ED2224' }}>
            API key saved
          </div>
        )}
      </div>

      {/* Privacy info */}
      <div style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>
        <p>
          Your API key is stored locally in this browser and is sent directly to
          Google&apos;s Gemini API. It never passes through any intermediary server.
        </p>
      </div>
    </div>
  );
}
