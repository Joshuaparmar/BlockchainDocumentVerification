
const { ethers } = require("hardhat");

async function main() {
  const DocumentVerification =
    await ethers.getContractFactory("DocumentVerification");

  const contract = await DocumentVerification.deploy();
  await contract.waitForDeployment();

  console.log(
    "DocumentVerification deployed to:",
    await contract.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
