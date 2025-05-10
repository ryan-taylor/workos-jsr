import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";

interface ApiResponse {
  error?: string;
  encryptedData?: string;
  decryptedData?: string;
}

export default function VaultCryptoDemo() {
  const [inputText, setInputText] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setInputText(target.value);
    setError(null);
  };

  const handleModeChange = (newMode: "encrypt" | "decrypt") => {
    setMode(newMode);
    setError(null);
    setCopySuccess(null);
  };

  const handleEncrypt = async () => {
    if (!inputText.trim()) {
      setError("Please enter text to encrypt");
      return;
    }

    setLoading(true);
    setError(null);
    setCopySuccess(null);

    try {
      const response = await fetch("/api/vault/encrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: inputText }),
      });

      const result: ApiResponse = await response.json();

      if (result.error) {
        setError(result.error);
      } else if (result.encryptedData) {
        setEncryptedText(result.encryptedData);
        setDecryptedText("");
      }
    } catch (err) {
      setError("Failed to encrypt: Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!inputText.trim()) {
      setError("Please enter encrypted text to decrypt");
      return;
    }

    setLoading(true);
    setError(null);
    setCopySuccess(null);

    try {
      const response = await fetch("/api/vault/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encryptedData: inputText }),
      });

      const result: ApiResponse = await response.json();

      if (result.error) {
        setError(result.error);
      } else if (result.decryptedData) {
        setDecryptedText(result.decryptedData);
        setEncryptedText("");
      }
    } catch (err) {
      setError("Failed to decrypt: Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("Copied to clipboard!");
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setError("Failed to copy to clipboard");
    }
  };

  return (
    <div class="vault-demo">
      <div class="mode-selector">
        <button
          class={`mode-btn ${mode === "encrypt" ? "active" : ""}`}
          onClick={() => handleModeChange("encrypt")}
        >
          Encrypt
        </button>
        <button
          class={`mode-btn ${mode === "decrypt" ? "active" : ""}`}
          onClick={() => handleModeChange("decrypt")}
        >
          Decrypt
        </button>
      </div>

      <div class="input-section">
        <label htmlFor="input-text">
          {mode === "encrypt" ? "Text to Encrypt" : "Encrypted Text to Decrypt"}
        </label>
        <textarea
          id="input-text"
          value={inputText}
          onInput={handleInputChange}
          rows={4}
          placeholder={
            mode === "encrypt"
              ? "Enter text to encrypt..."
              : "Enter encrypted text to decrypt..."
          }
        />
      </div>

      <div class="button-section">
        <Button 
          onClick={mode === "encrypt" ? handleEncrypt : handleDecrypt}
          disabled={loading || !inputText.trim()}
        >
          {loading
            ? "Processing..."
            : mode === "encrypt"
            ? "Encrypt"
            : "Decrypt"}
        </Button>
      </div>

      {error && <div class="error-message">{error}</div>}
      {copySuccess && <div class="success-message">{copySuccess}</div>}

      {encryptedText && (
        <div class="result-section">
          <h3>Encrypted Result:</h3>
          <div class="result-container">
            <pre class="result-content">{encryptedText}</pre>
            <button
              class="copy-btn"
              onClick={() => handleCopy(encryptedText)}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {decryptedText && (
        <div class="result-section">
          <h3>Decrypted Result:</h3>
          <div class="result-container">
            <pre class="result-content">{decryptedText}</pre>
            <button
              class="copy-btn"
              onClick={() => handleCopy(decryptedText)}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <style>
        {`
        .vault-demo {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .mode-selector {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .mode-btn {
          padding: 12px 24px;
          font-size: 16px;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        
        .mode-btn.active {
          font-weight: bold;
          color: #6366f1;
        }
        
        .mode-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #6366f1;
        }
        
        .input-section {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-family: monospace;
          resize: vertical;
        }
        
        .button-section {
          margin-bottom: 20px;
        }
        
        .error-message {
          padding: 12px;
          background-color: #fee2e2;
          color: #ef4444;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .success-message {
          padding: 12px;
          background-color: #dcfce7;
          color: #10b981;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .result-section {
          margin-top: 20px;
        }
        
        .result-container {
          position: relative;
          background-color: #f8fafc;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;
          overflow: auto;
        }
        
        .result-content {
          font-family: monospace;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          background-color: #6366f1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .copy-btn:hover {
          background-color: #4f46e5;
        }
        `}
      </style>
    </div>
  );
}