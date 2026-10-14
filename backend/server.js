
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
});

function getPinataHeaders() {
  if (process.env.PINATA_JWT) {
    return {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    };
  }

  if (process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET) {
    return {
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_API_SECRET,
    };
  }

  throw new Error("Pinata credentials are not configured.");
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "DocuProof IPFS backend",
  });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please select a file to upload.",
      });
    }

    const headers = getPinataHeaders();
    const formData = new FormData();

    const file = new Blob([req.file.buffer], {
      type: req.file.mimetype || "application/octet-stream",
    });

    formData.append("file", file, req.file.originalname);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers,
        body: formData,
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Pinata upload failed:", response.status, result);

      return res.status(502).json({
        error: "Pinata could not upload the file. Check credentials and permissions.",
      });
    }

    if (!result.IpfsHash) {
      return res.status(502).json({
        error: "Pinata did not return an IPFS CID.",
      });
    }

    return res.json({
      success: true,
      cid: result.IpfsHash,
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error.message);

    return res.status(500).json({
      error:
        error.message === "Pinata credentials are not configured."
          ? error.message
          : "An unexpected upload error occurred.",
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(413).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "File exceeds the 10 MB upload limit."
          : error.message,
    });
  }

  console.error("Server error:", error.message);

  return res.status(500).json({
    error: "Internal server error.",
  });
});

app.listen(PORT, () => {
  console.log(`DocuProof backend running at http://localhost:${PORT}`);
});
