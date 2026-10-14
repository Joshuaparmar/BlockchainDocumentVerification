
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentVerification", function () {
  let contract;
  let owner;
  let otherUser;

  const cid = "bafkreiensn45n2flc3t5coyyqa3vt3zrh3pjw6fdwjuooizk6wxj6ti4hu";
  const fileHash = ethers.keccak256(
    ethers.toUtf8Bytes("sample document content")
  );

  beforeEach(async function () {
    [owner, otherUser] = await ethers.getSigners();

    const DocumentVerification = await ethers.getContractFactory(
      "DocumentVerification"
    );

    contract = await DocumentVerification.deploy();
    await contract.waitForDeployment();
  });

  it("registers a document successfully", async function () {
    await contract.registerDocument(cid, fileHash);

    const doc = await contract.getDocument(fileHash);

    expect(doc.cid).to.equal(cid);
    expect(doc.uploader).to.equal(owner.address);
    expect(doc.exists).to.equal(true);
  });

  it("returns true for a registered document", async function () {
    await contract.registerDocument(cid, fileHash);

    expect(await contract.verifyDocument(fileHash)).to.equal(true);
  });

  it("returns false for an unregistered document", async function () {
    const unknownHash = ethers.keccak256(
      ethers.toUtf8Bytes("unknown document")
    );

    expect(await contract.verifyDocument(unknownHash)).to.equal(false);
  });

  it("rejects duplicate document hashes", async function () {
    await contract.registerDocument(cid, fileHash);

    await expect(
      contract.connect(otherUser).registerDocument(cid, fileHash)
    ).to.be.revertedWith("Already registered");
  });

  it("rejects an empty CID", async function () {
    await expect(
      contract.registerDocument("", fileHash)
    ).to.be.revertedWith("CID cannot be empty");
  });

  it("rejects a zero file hash", async function () {
    await expect(
      contract.registerDocument(cid, ethers.ZeroHash)
    ).to.be.revertedWith("Invalid file hash");
  });
});
