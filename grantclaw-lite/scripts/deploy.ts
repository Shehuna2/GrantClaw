import { ethers } from "hardhat";

async function main() {
  const registryFactory = await ethers.getContractFactory("GrantClawRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();

  console.log("GrantClawRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
