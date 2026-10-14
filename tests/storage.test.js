
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Storage", function () {
  let storage;

  beforeEach(async function () {
    const Storage = await ethers.getContractFactory("Storage");
    storage = await Storage.deploy();
    await storage.waitForDeployment();
  });

  it("test initial value", async function () {
    expect(await storage.retrieve()).to.equal(0n);
  });

  it("test updating and retrieving updated value", async function () {
    await storage.store(100n);
    expect(await storage.retrieve()).to.equal(100n);
  });
});
