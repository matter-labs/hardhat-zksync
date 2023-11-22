// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MintingContract is ERC721, Ownable {
    string public baseMetadataURI;

    bool public preSaleActive;
    mapping(address => uint8) public freeMintAddr;
    mapping(address => uint16) public walletToToken;

    // trait masks
    bytes8 public groupMask = bytes8(uint64(0x38000000000));

    // founder
    uint16 public founders = 0;

    // trait maps
    mapping(uint64 => uint64) public groupMap;
    mapping(uint64 => uint64) public headMap;

    // minted traits and combinations
    mapping(uint256 => bytes8) public tokenTraits;
    mapping(uint64 => uint8) public existingCombinations;

    uint16 public availableNFTs = 10000;
    uint16 public mintedNFTs = 0;
    uint8 public maxTokensPerWallet = 8;
    uint256 public cost = 0.07 ether;

    uint16 public tokenId;

    constructor(
        string memory _collectionName,
        string memory _collectionSymbol,
        string memory _initMetadataURI,
        address[] memory freeMinterAddresses
    ) ERC721(_collectionName, _collectionSymbol) {
        baseMetadataURI = _initMetadataURI;
        for (uint i = 0; i < freeMinterAddresses.length; i++) {
            freeMintAddr[freeMinterAddresses[i]] = 1;
        }
        preSaleActive = true;
    }

    function tokenForWallet(address wallet) public view returns (uint256) {
        return walletToToken[wallet];
    }

    function setFreeMinter(address minter) public onlyOwner {
        freeMintAddr[minter] = 1;
    }

    function internalMint(uint64 traits) internal {
        if ((mintedNFTs + 1) % 10 == 0) {
            founders++;
        }

        // decode
        uint64 groupTrait = groupTraitIndex(traits);

        // traits validation
        require(
            groupTrait <= 4 && groupTrait >= 0,
            "Group trait not in required range."
        );

        groupMap[groupTrait]++;

        tokenTraits[tokenId] = bytes8(traits);
        existingCombinations[traits] = 1;

        walletToToken[msg.sender] = tokenId;
    }

    function setPreSaleActive(bool active) public onlyOwner {
        preSaleActive = active;
    }

    function setMaximumTokensPerWallet(uint8 value) public onlyOwner {
        maxTokensPerWallet = value;
    }

    function mint(uint64 traits) external payable {
        require(
            existingCombinations[traits] == 0,
            "Combination of traits already minted."
        );

        uint8 mintAmount = 1;

        require(
            mintedNFTs + mintAmount <= availableNFTs,
            "Maximum available NFTs exceeded."
        );
        require(
            balanceOf(msg.sender) < maxTokensPerWallet,
            "Maximum tokens to mint reached."
        );

        require(
            msg.value >= cost * mintAmount,
            "Not enough funds to mind token."
        );

        internalMint(traits);
        _safeMint(msg.sender, tokenId);
        mintedNFTs++;
        tokenId++;
    }

    function freeMint(uint64 traits) external {
        if (freeMintAddr[msg.sender] == 0) {
            revert();
        }

        require(
            existingCombinations[traits] == 0,
            "Combination of traits already minted."
        );

        uint8 mintAmount = 1;
        require(
            mintedNFTs + mintAmount <= availableNFTs,
            "Maximum available NFTs exceeded."
        );
        require(
            balanceOf(msg.sender) < maxTokensPerWallet,
            "Maximum tokens to mint reached."
        );

        internalMint(traits);
        _safeMint(msg.sender, tokenId);
        mintedNFTs++;
        tokenId++;
    }

    function contractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseMetadataURI;
    }

    function availableTokens() public view returns (uint256) {
        return availableNFTs - mintedNFTs;
    }

    function groupTraitIndex(uint64 traits) internal view returns (uint64) {
        return uint64((bytes8(traits) & groupMask) >> 39);
    }
}