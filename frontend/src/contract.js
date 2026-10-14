
export const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_cid", type: "string" },
      { internalType: "bytes32", name: "_fileHash", type: "bytes32" },
    ],
    name: "registerDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_fileHash", type: "bytes32" },
    ],
    name: "verifyDocument",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_fileHash", type: "bytes32" },
    ],
    name: "getDocument",
    outputs: [
      { internalType: "string", name: "cid", type: "string" },
      { internalType: "address", name: "uploader", type: "address" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "fileHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "string",
        name: "cid",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "uploader",
        type: "address",
      },
    ],
    name: "DocumentRegistered",
    type: "event",
  },
];
