// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRNSResolver {
    function addr(bytes32 node) external view returns (address);

    function setAddr(bytes32 node, address a) external;

    function text(bytes32 node, string calldata key) external view returns (string memory);

    function setText(bytes32 node, string calldata key, string calldata value) external;
}

