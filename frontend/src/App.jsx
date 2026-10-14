
import { useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  Upload,
  Wallet,
  CheckCircle2,
  Search,
  LoaderCircle,
  Copy,
} from "lucide-react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import "./App.css";

const API_URL = "http://localhost:3001";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function calculateSHA256(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return (
    "0x" +
    Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function App() {
  const [account, setAccount] = useState("");
  const [registerFile, setRegisterFile] = useState(null);
  const [verifyFile, setVerifyFile] = useState(null);
  const [registerHash, setRegisterHash] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [registerResult, setRegisterResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  function showStatus(type, message) {
    setStatus({ type, message });
  }

  function validateFile(file) {
    if (!file) return false;

    if (file.size > MAX_FILE_SIZE) {
      showStatus("error", "The maximum file size is 10 MB.");
      return false;
    }

    return true;
  }

  async function connectWallet() {
    if (!window.ethereum) {
      showStatus("error", "MetaMask is not installed.");
      return;
    }

    try {
      setWalletLoading(true);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts.length) {
        throw new Error("No wallet account selected.");
      }

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (BigInt(chainId) !== 31337n) {
        showStatus(
          "error",
          "Switch MetaMask to Hardhat Local (Chain ID 31337), then connect again."
        );
        return;
      }

      setAccount(accounts[0]);
      showStatus("success", "MetaMask connected successfully.");
    } catch (error) {
      showStatus(
        "error",
        error.message || "Wallet connection failed."
      );
    } finally {
      setWalletLoading(false);
    }
  }

  async function getContract(withSigner = false) {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId !== 31337n) {
      throw new Error(
        "Switch MetaMask to Hardhat Local (Chain ID 31337)."
      );
    }

    const code = await provider.getCode(CONTRACT_ADDRESS);

    if (code === "0x") {
      throw new Error(
        "No contract found at the configured address. Ensure Hardhat is running, the contract is deployed, and frontend/src/contract.js contains the current address."
      );
    }

    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }

    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }

  async function handleRegister() {
    if (!registerFile) {
      showStatus("error", "Choose a document to register first.");
      return;
    }

    if (!validateFile(registerFile)) return;

    setRegisterLoading(true);
    setRegisterResult(null);
    setRegisterHash("");
    setStatus(null);

    try {
      const hash = await calculateSHA256(registerFile);
      setRegisterHash(hash);

      const contract = await getContract(true);

      const existing = await contract.verifyDocument(hash);

      if (existing) {
        const existingDocument = await contract.getDocument(hash);

        setRegisterResult({
          cid: existingDocument.cid,
          hash,
          duplicate: true,
        });

        showStatus(
          "error",
          "This file is already registered. Its existing registration is shown below."
        );
        return;
      }

      showStatus("info", "Uploading your document to IPFS...");

      const formData = new FormData();
      formData.append("file", registerFile);

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "IPFS upload failed.");
      }

      if (!uploadData.cid) {
        throw new Error("The IPFS service did not return a CID.");
      }

      showStatus(
        "info",
        "Document uploaded. Confirm the registration transaction in MetaMask."
      );

      const tx = await contract.registerDocument(uploadData.cid, hash);
      const receipt = await tx.wait();

      setRegisterResult({
        cid: uploadData.cid,
        hash,
        transactionHash: receipt.hash,
        duplicate: false,
      });

      showStatus(
        "success",
        "Document uploaded to IPFS and registered on the blockchain."
      );
    } catch (error) {
      console.error("Registration failed:", error);

      showStatus(
        "error",
        error.shortMessage ||
          error.reason ||
          error.message ||
          "Document registration failed."
      );
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleVerify() {
    if (!verifyFile) {
      showStatus("error", "Choose a document to verify first.");
      return;
    }

    if (!validateFile(verifyFile)) return;

    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyHash("");
    setStatus(null);

    try {
      const hash = await calculateSHA256(verifyFile);
      setVerifyHash(hash);

      const contract = await getContract(false);
      const doc = await contract.getDocument(hash);

      if (!doc.exists) {
        setVerifyResult({ exists: false, hash });
        showStatus(
          "info",
          "No registered document was found for this file hash."
        );
      } else {
        setVerifyResult({
          exists: true,
          hash,
          cid: doc.cid,
          uploader: doc.uploader,
          timestamp: doc.timestamp.toString(),
        });

        showStatus(
          "success",
          "This exact file matches a registered document hash."
        );
      }
    } catch (error) {
      console.error("Verification failed:", error);

      showStatus(
        "error",
        error.shortMessage ||
          error.reason ||
          error.message ||
          "Document verification failed."
      );
    } finally {
      setVerifyLoading(false);
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      showStatus("success", "Copied to clipboard.");
    } catch {
      showStatus(
        "error",
        "Unable to copy automatically. Select and copy the text manually."
      );
    }
  }

  
  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const contract = await getContract(false);
      const provider = new BrowserProvider(window.ethereum);
      const latestBlock = await provider.getBlockNumber();

      const events = await contract.queryFilter(
        contract.filters.DocumentRegistered(),
        0,
        latestBlock
      );

      const records = events.map((event) => ({
        fileHash: event.args.fileHash,
        cid: event.args.cid,
        uploader: event.args.uploader,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
      })).reverse();

      setHistory(records);
    } catch (error) {
      console.error("History loading failed:", error);
      setHistoryError(
        error.shortMessage ||
          error.message ||
          "Could not load document history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }


  function handleFileChange(event, type) {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = "";
      if (type === "register") setRegisterFile(null);
      else setVerifyFile(null);
      return;
    }

    if (type === "register") {
      setRegisterFile(file);
      setRegisterResult(null);
      setRegisterHash("");
    } else {
      setVerifyFile(file);
      setVerifyResult(null);
      setVerifyHash("");
    }

    setStatus(null);
  }

  function renderFilePicker(type) {
    const isRegister = type === "register";
    const file = isRegister ? registerFile : verifyFile;
    const inputId = isRegister ? "register-file-input" : "verify-file-input";

    return (
      <div
        className="dropzone"
        style={{
          cursor: "pointer",
          padding: 16,
          position: "relative",
        }}
      >
        <FileCheck2 size={29} />

        <strong>
          {file
            ? file.name
            : isRegister
              ? "Choose a document"
              : "Choose a document to verify"}
        </strong>

        <span>
          {file
            ? formatBytes(file.size)
            : isRegister
              ? "Select a file up to 10 MB"
              : "Select the original file or a copy"}
        </span>

        <input
          id={inputId}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          aria-label={
            isRegister
              ? "Choose a document to register"
              : "Choose a document to verify"
          }
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
          onChange={(event) => handleFileChange(event, type)}
        />
      </div>
    );
  }

  function renderHash(hash) {
    if (!hash) return null;

    return (
      <div style={{ marginTop: 14, overflowWrap: "anywhere" }}>
        <strong style={{ fontSize: 12 }}>SHA-256</strong>
        <p style={{ fontSize: 11, color: "#64746a" }}>{hash}</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => copyText(hash)}
        >
          <Copy size={14} /> Copy hash
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">
            <ShieldCheck size={23} />
          </span>
          <span>
            Docu<span className="brand-accent">Proof</span>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#register">Register</a>
          <a href="#verify">Verify</a>
          <a href="#history">History</a>
        </nav>

        <button
          type="button"
          className="wallet-button"
          onClick={connectWallet}
          disabled={walletLoading}
        >
          {walletLoading ? (
            <LoaderCircle size={17} />
          ) : (
            <Wallet size={17} />
          )}
          {walletLoading
            ? "Connecting..."
            : account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"}
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="eyebrow">
            <ShieldCheck size={15} />
            BLOCKCHAIN-POWERED VERIFICATION
          </div>

          <h1>
            Trust your documents.
            <br />
            <span>Verify every detail.</span>
          </h1>

          <p className="hero-description">
            Store documents on IPFS and register their cryptographic
            fingerprints on the blockchain. Verify whether a document
            matches its registered version.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#register">
              <Upload size={17} /> Register a document
            </a>
            <a className="secondary-button" href="#verify">
              <Search size={17} /> Verify a document
            </a>
          </div>

          <div className="feature-row">
            <span><CheckCircle2 size={16} /> Tamper detection</span>
            <span><CheckCircle2 size={16} /> Decentralized storage</span>
            <span><CheckCircle2 size={16} /> On-chain records</span>
          </div>
        </section>

        {status && (
          <section
            role="status"
            aria-live="polite"
            style={{
              marginBottom: 28,
              padding: 16,
              borderRadius: 12,
              overflowWrap: "anywhere",
              border: `1px solid ${
                status.type === "error"
                  ? "#edc5c5"
                  : status.type === "success"
                    ? "#b9ddc6"
                    : "#cbd8e8"
              }`,
              background:
                status.type === "error"
                  ? "#fff0f0"
                  : status.type === "success"
                    ? "#edf8f0"
                    : "#eff5fc",
              color:
                status.type === "error"
                  ? "#922d2d"
                  : status.type === "success"
                    ? "#205e3b"
                    : "#284f7a",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <strong>
              {status.type === "error"
                ? "Error: "
                : status.type === "success"
                  ? "Success: "
                  : "Notice: "}
            </strong>
            {status.message}
          </section>
        )}

        <section className="workspace">
          <div className="section-heading">
            <div>
              <p className="section-label">DOCUMENT WORKSPACE</p>
              <h2>Manage your documents</h2>
            </div>

            <span className="network-label">
              <span className="status-dot" /> Hardhat Local · Chain 31337
            </span>
          </div>

          <div className="panel-grid">
            <article className="panel" id="register">
              <div className="panel-icon">
                <Upload size={21} />
              </div>

              <h3>Register a document</h3>

              <p>
                Upload a file to IPFS, calculate its SHA-256 fingerprint,
                and register the CID and fingerprint on the blockchain.
              </p>

              {renderFilePicker("register")}
              {renderHash(registerHash)}

              <button
                type="button"
                className="panel-button"
                onClick={handleRegister}
                disabled={!registerFile || registerLoading}
              >
                {registerLoading ? (
                  <>
                    <LoaderCircle size={17} /> Registering...
                  </>
                ) : (
                  <>
                    <Upload size={17} /> Upload &amp; Register
                  </>
                )}
              </button>

              {registerResult && (
                <div
                  style={{
                    marginTop: 18,
                    fontSize: 13,
                    overflowWrap: "anywhere",
                  }}
                >
                  <strong>
                    {registerResult.duplicate
                      ? "Hash already registered"
                      : "Registration details"}
                  </strong>

                  <p><b>IPFS CID:</b> {registerResult.cid}</p>
                  
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${registerResult.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 10,
                      textDecoration: "none",
                    }}
                  >
                    Open document on IPFS ↗
                  </a>

                  <p><b>SHA-256:</b> {registerResult.hash}</p>

                  {registerResult.transactionHash && (
                    <p>
                      <b>Transaction:</b> {registerResult.transactionHash}
                    </p>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => copyText(registerResult.cid)}
                  >
                    <Copy size={14} /> Copy CID
                  </button>
                </div>
              )}
            </article>

            <article className="panel" id="verify">
              <div className="panel-icon verify-icon">
                <ShieldCheck size={21} />
              </div>

              <h3>Verify a document</h3>

              <p>
                Select a document to calculate its fingerprint and check
                whether that exact file has been registered.
              </p>

              {renderFilePicker("verify")}
              {renderHash(verifyHash)}

              <button
                type="button"
                className="panel-button secondary-panel-button"
                onClick={handleVerify}
                disabled={!verifyFile || verifyLoading}
              >
                {verifyLoading ? (
                  <>
                    <LoaderCircle size={17} /> Verifying...
                  </>
                ) : (
                  <>
                    <Search size={17} /> Verify document
                  </>
                )}
              </button>

              {verifyResult && (
                <div
                  style={{
                    marginTop: 18,
                    fontSize: 13,
                    overflowWrap: "anywhere",
                  }}
                >
                  <strong>
                    {verifyResult.exists
                      ? "Document hash is registered"
                      : "Document hash not found"}
                  </strong>

                  <p><b>SHA-256:</b> {verifyResult.hash}</p>

                  {verifyResult.exists ? (
                    <>
                      <p><b>IPFS CID:</b> {verifyResult.cid}</p>
                      
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${verifyResult.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 10,
                          textDecoration: "none",
                        }}
                      >
                        Open registered document ↗
                      </a>

                      <p><b>Uploader:</b> {verifyResult.uploader}</p>
                      <p>
                        <b>Registered:</b>{" "}
                        {new Date(
                          Number(verifyResult.timestamp) * 1000
                        ).toLocaleString()}
                      </p>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => copyText(verifyResult.cid)}
                      >
                        <Copy size={14} /> Copy CID
                      </button>
                    </>
                  ) : (
                    <p>
                      This file's SHA-256 hash is not present in the
                      configured contract's registry.
                    </p>
                  )}
                </div>
              )}
            </article>
          </div>
        </section>

        <section className="notice">
          <ShieldCheck size={20} />
          <div>
            <strong>What does verification prove?</strong>
            <p>
              A matching hash shows that the file's contents match a
              registered fingerprint. It does not independently prove
              who originally authored the document or whether its claims
              are true.
            </p>
          </div>
        </section>
        
        <section className="history-section" id="history">
          <div className="history-header">
            <div>
              <p className="section-label">ON-CHAIN RECORDS</p>
              <h2>Document History</h2>
              <p>View documents registered on the blockchain.</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading ? "Loading history..." : "Load History"}
            </button>
          </div>

          {historyError && (
            <p role="alert" className="history-error">
              {historyError}
            </p>
          )}

          {!historyError && history.length === 0 && !historyLoading && (
            <p>No records loaded. Click "Load History" to retrieve registrations.</p>
          )}

          <div className="history-list">
            {history.map((record, index) => (
              <article
                className="history-card"
                key={record.transactionHash}
              >
                <h3>Registration #{history.length - index}</h3>

                <p><strong>SHA-256 hash</strong></p>
                <code>{record.fileHash}</code>

                <p><strong>IPFS CID</strong></p>
                <code>{record.cid}</code>

                <p><strong>Uploader</strong></p>
                <code>{record.uploader}</code>

                <p><strong>Block:</strong> {record.blockNumber}</p>

                <p><strong>Transaction</strong></p>
                <code>{record.transactionHash}</code>

                <p>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${record.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open document on IPFS ↗
                  </a>
                </p>
              </article>
            ))}
          </div>
        </section>

      </main>

      <footer>
        <span>DocuProof · Academic Blockchain Prototype</span>
        <span>IPFS + Ethereum-compatible blockchain</span>
      </footer>
    </div>
  );
}

export default App;