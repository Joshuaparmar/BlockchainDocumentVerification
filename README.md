# DocuProof — Blockchain-Based Document Verification

A decentralized document verification system that combines **blockchain technology, IPFS, and cryptographic hashing** to verify document integrity and maintain a transparent, tamper-evident record of document registrations.

## Overview

DocuProof is a web application designed to simplify document integrity verification. It allows users to register documents on a local Ethereum-compatible blockchain, store documents on IPFS, and verify their integrity using cryptographic hashes.

Instead of storing entire documents directly on the blockchain, DocuProof calculates a SHA-256 hash of each file and records the hash alongside its IPFS Content Identifier (CID). The blockchain maintains a permanent registration record, while IPFS provides content-addressed document storage.

The application also provides a document history interface where users can review registered documents, inspect transaction details, and access stored files.

## Key Features

- **Blockchain-Based Registration:** Records document hashes, IPFS CIDs, uploader addresses, and timestamps through a Solidity smart contract.
- **Cryptographic Integrity Verification:** Calculates SHA-256 hashes to check whether a selected file matches a registered document.
- **IPFS Storage:** Stores documents using the InterPlanetary File System (IPFS) and retrieves them through their CIDs.
- **Duplicate Detection:** Checks whether a document hash has already been registered before proceeding with registration.
- **Document History:** Displays registration records and relevant blockchain transaction information.
- **Search and Filtering:** Helps users find document records through the history interface.
- **MetaMask Integration:** Connects the frontend to an Ethereum-compatible blockchain through a browser wallet.
- **Local Development Environment:** Uses Hardhat to run a local blockchain for development and demonstration.

## How It Works

1. **Select a document:** The user chooses a file through the web interface.
2. **Calculate its hash:** The frontend calculates a SHA-256 hash of the file's contents.
3. **Check for duplicates:** The application checks whether the hash is already registered.
4. **Upload to IPFS:** The backend uploads the document to IPFS and obtains its CID.
5. **Register on the blockchain:** The frontend calls the smart contract to store the CID and file hash.
6. **Confirm the transaction:** The blockchain records the registration, and the application retrieves the resulting transaction information.
7. **Verify a document:** A user selects a file again, and the application compares its calculated hash against the registered blockchain record.

A matching hash indicates that the file's contents match those of the registered file. A different hash indicates that the file differs from the registered version.

## System Architecture

```text
                 ┌─────────────────────────┐
                 │      React Frontend     │
                 │  Upload, Verify, History│
                 └────────────┬────────────┘
                              │
                 ┌────────────▼────────────┐
                 │        MetaMask         │
                 │  Wallet & Transactions │
                 └────────────┬────────────┘
                              │
                 ┌────────────▼────────────┐
                 │ Solidity Smart Contract │
                 │   Document Registry     │
                 └────────────┬────────────┘
                              │
                    Local Hardhat Chain
                             
       ┌─────────────────────────────────────────┐
       │              Express Backend            │
       │         Document Upload Handling        │
       └────────────────────┬────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   IPFS / Pinata│
                    │ Document Storage│
                    └────────────────┘
```

The frontend handles document selection, hashing, wallet interaction, verification, and history. The Express backend handles document uploads to IPFS, while the Solidity contract maintains document registration records on the blockchain.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling and Icons | CSS, Lucide React |
| Blockchain | Ethereum-compatible local blockchain |
| Smart Contracts | Solidity |
| Development Framework | Hardhat |
| Blockchain Interaction | Ethers.js, MetaMask |
| Backend | Node.js, Express.js |
| File Upload Handling | Multer |
| Decentralized Storage | IPFS, Pinata |
| File Integrity | SHA-256 |
| Testing | Hardhat, Chai |

## Project Structure

```text
BlockchainDocumentVerification/
│
├── contracts/
│   └── DocumentVerification.sol
│
├── scripts/
│   └── deploy.js
│
├── tests/
│   ├── DocumentVerification.test.js
│   └── storage.test.js
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── contract.js
│   └── package.json
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── hardhat.config.js
├── package.json
├── .gitignore
└── README.md
```

*The structure above highlights the main project files; additional configuration and source files may exist.*

## Prerequisites

Before running DocuProof, install:

- [Node.js](https://nodejs.org/) — use Node.js 22.13.0 or later for the current Hardhat setup.
- npm — included with Node.js.
- [Git](https://git-scm.com/) — to clone the repository.
- [MetaMask](https://metamask.io/) — for wallet interaction.
- A [Pinata](https://pinata.cloud/) account and API credentials for IPFS uploads.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Joshuaparmar/BlockchainDocumentVerification.git
cd BlockchainDocumentVerification
```

### 2. Install dependencies

Install the root, frontend, and backend dependencies:

```bash
npm install
cd frontend
npm install
cd ..
cd backend
npm install
cd ..
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory and add your own Pinata credentials using the variable names expected by `backend/server.js`.

For example, if the backend supports the JWT configuration:

```env
PINATA_JWT=your_pinata_jwt
```

Alternatively, configure `PINATA_API_KEY` and `PINATA_API_SECRET` if supported by your backend.

**Security:** Never commit API credentials, wallet private keys, or other secrets to GitHub.

### 4. Compile the smart contract

From the project root, run:

```bash
npx hardhat compile
```

### 5. Start the local blockchain

Open a terminal at the project root and run:

```bash
npx hardhat node
```

Keep this terminal open while using the application.

### 6. Deploy the smart contract

Open a second terminal at the project root:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Record the deployed contract address and ensure that `frontend/src/contract.js` references the correct address and ABI.

### 7. Configure MetaMask

Add a custom network in MetaMask with these local development settings:

| Setting | Value |
|---|---|
| Network Name | Hardhat Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | ETH |

For local testing only, import an account from the test accounts printed by Hardhat. Never use Hardhat's publicly displayed test private keys for real funds.

### 8. Start the backend

Open another terminal:

```bash
cd backend
npm run start
```

If the backend package defines a different start script, use the command specified in `backend/package.json`.

The backend is expected to run at:

```text
http://localhost:3001
```

### 9. Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open the application in your browser:

**http://localhost:5173**

Keep the blockchain, backend, and frontend running while testing the application.

## Running with the Windows Launcher

A `DocuProof-Start.bat` launcher can automate dependency checks, contract compilation, blockchain startup, deployment, and frontend/backend startup.

To use it:

1. Place the launcher in the repository root.
2. Configure `backend/.env` with your own IPFS credentials.
3. Double-click `DocuProof-Start.bat`.
4. Check the deployment output and confirm that the frontend uses the newly deployed contract address.
5. Open `http://localhost:5173`.

The launcher is a local development convenience; it does not replace correct environment configuration or deployment verification.

## Smart Contract Functions

The `DocumentVerification.sol` contract exposes the following functions:

| Function | Purpose |
|---|---|
| `registerDocument(string _cid, bytes32 _fileHash)` | Registers a document's CID and hash. Rejects empty CIDs, zero hashes, and duplicate registrations. |
| `getDocument(bytes32 _fileHash)` | Returns the registered CID, uploader address, timestamp, and existence status. |
| `verifyDocument(bytes32 _fileHash)` | Checks whether the supplied hash has been registered. |

The contract emits a `DocumentRegistered` event when a document is registered. The event can be used to retrieve registration history and transaction information.

## Testing

Run the smart contract tests from the project root:

```bash
npx hardhat test
```

These tests cover the smart contract and storage-related functionality defined in the repository's test suite.

## Security and Limitations

- **Integrity is not authorship:** A matching SHA-256 hash demonstrates that the file matches a registered version. It does not independently prove who originally created the document or whether its contents are truthful.
- **Blockchain records are persistent:** Registrations on a public blockchain may be difficult or impossible to remove. The local Hardhat chain is intended for development and testing.
- **IPFS availability:** Content retrieval depends on the content being available through the IPFS network or a pinning service.
- **Credential protection:** Pinata credentials must remain on the backend and should not be exposed in frontend code or committed to source control.
- **Local network configuration:** The frontend contract address must match the address deployed to the currently running blockchain.
- **Prototype status:** This project is intended for educational and demonstration purposes unless additional production security, access control, infrastructure, and deployment reviews are completed.

## Future Enhancements

Potential extensions include:

- Support for multiple document types and larger files.
- Role-based access and permission management.
- Document versioning and revision history.
- QR-code-based verification.
- More detailed transaction receipts and verification reports.
- Deployment to a public testnet.
- Improved error handling and automated deployment configuration.

## Use Cases

DocuProof demonstrates how blockchain and decentralized storage can support document integrity checks in scenarios such as:

- Academic certificates and transcripts.
- Digital agreements and contracts.
- Reports and research documents.
- Administrative records.
- Other files that benefit from verifiable integrity records.

These are potential applications of the approach, not claims of certified or legally recognized verification.

## Author

**Joshua Parmar**

GitHub: [@Joshuaparmar](https://github.com/Joshuaparmar)

## License

No license has been specified yet. If you intend to make the project open source, add an appropriate `LICENSE` file and update this section.

---

*DocuProof — Making document integrity easier to verify through blockchain and decentralized storage.*