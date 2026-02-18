// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GrantClawRegistry {
    struct Proposal {
        bytes32 proposalHash;
        address submitter;
        string grantId;
        string title;
        string uri;
        uint256 timestamp;
    }

    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => mapping(bytes32 => bool)) public milestoneSeen;

    event ProposalSubmitted(
        bytes32 indexed proposalHash,
        address indexed submitter,
        string grantId,
        string title,
        string uri,
        uint256 timestamp
    );

    event MilestoneSubmitted(
        bytes32 indexed proposalHash,
        bytes32 indexed milestoneHash,
        address indexed submitter,
        string title,
        string uri,
        uint256 timestamp
    );

    function submitProposal(bytes32 proposalHash, string calldata grantId, string calldata title, string calldata uri) external {
        require(proposals[proposalHash].timestamp == 0, "Proposal already exists");

        Proposal memory proposal = Proposal({
            proposalHash: proposalHash,
            submitter: msg.sender,
            grantId: grantId,
            title: title,
            uri: uri,
            timestamp: block.timestamp
        });

        proposals[proposalHash] = proposal;

        emit ProposalSubmitted(proposalHash, msg.sender, grantId, title, uri, block.timestamp);
    }

    function submitMilestone(bytes32 proposalHash, bytes32 milestoneHash, string calldata title, string calldata uri) external {
        require(proposals[proposalHash].timestamp != 0, "Proposal does not exist");
        require(!milestoneSeen[proposalHash][milestoneHash], "Milestone already submitted");

        milestoneSeen[proposalHash][milestoneHash] = true;

        emit MilestoneSubmitted(proposalHash, milestoneHash, msg.sender, title, uri, block.timestamp);
    }
}
