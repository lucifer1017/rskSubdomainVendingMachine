// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRNSResolver} from "./interfaces/IRNSResolver.sol";
contract MockRNSResolver is IRNSResolver {
    mapping(bytes32 => address) private _addrs;
    mapping(bytes32 => mapping(string => string)) private _texts;

    function addr(bytes32 node) external view returns (address) {
        return _addrs[node];
    }

    function setAddr(bytes32 node, address a) external {
        _addrs[node] = a;
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return _texts[node][key];
    }

    function setText(bytes32 node, string calldata key, string calldata value) external {
        _texts[node][key] = value;
    }
}

