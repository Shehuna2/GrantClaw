import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("GrantClawRegistry", () => {
  async function deployFixture() {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("GrantClawRegistry");
    const registry = await factory.deploy();
    await registry.waitForDeployment();
    return { registry, owner };
  }

  it("submit proposal success", async () => {
    const { registry, owner } = await deployFixture();
    const proposalHash = ethers.keccak256(ethers.toUtf8Bytes("proposal-1"));

    await expect(registry.submitProposal(proposalHash, "BNB-GRANT-1", "GrantClaw MVP", "ipfs://proposal"))
      .to.emit(registry, "ProposalSubmitted")
      .withArgs(proposalHash, owner.address, "BNB-GRANT-1", "GrantClaw MVP", "ipfs://proposal", anyValue);

    const proposal = await registry.proposals(proposalHash);
    expect(proposal.title).to.equal("GrantClaw MVP");
  });

  it("submit milestone success", async () => {
    const { registry, owner } = await deployFixture();
    const proposalHash = ethers.keccak256(ethers.toUtf8Bytes("proposal-2"));
    const milestoneHash = ethers.keccak256(ethers.toUtf8Bytes("milestone-1"));

    await registry.submitProposal(proposalHash, "BNB-GRANT-2", "Roadmap", "");

    await expect(registry.submitMilestone(proposalHash, milestoneHash, "Prototype", "ipfs://milestone"))
      .to.emit(registry, "MilestoneSubmitted")
      .withArgs(proposalHash, milestoneHash, owner.address, "Prototype", "ipfs://milestone", anyValue);
  });

  it("milestone for missing proposal reverts", async () => {
    const { registry } = await deployFixture();
    const proposalHash = ethers.keccak256(ethers.toUtf8Bytes("missing"));
    const milestoneHash = ethers.keccak256(ethers.toUtf8Bytes("milestone"));

    await expect(registry.submitMilestone(proposalHash, milestoneHash, "m", "")).to.be.revertedWith("Proposal does not exist");
  });

  it("duplicate milestone reverts", async () => {
    const { registry } = await deployFixture();
    const proposalHash = ethers.keccak256(ethers.toUtf8Bytes("proposal-3"));
    const milestoneHash = ethers.keccak256(ethers.toUtf8Bytes("milestone-dup"));

    await registry.submitProposal(proposalHash, "BNB-GRANT-3", "Title", "");
    await registry.submitMilestone(proposalHash, milestoneHash, "m1", "");

    await expect(registry.submitMilestone(proposalHash, milestoneHash, "m2", "")).to.be.revertedWith("Milestone already submitted");
  });
});
