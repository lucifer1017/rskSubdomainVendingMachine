// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRNSRegistry} from "./interfaces/IRNSRegistry.sol";
contract MockRNSRegistry is IRNSRegistry {
    mapping(bytes32 => address) private _owners;
    mapping(bytes32 => address) private _resolvers;
    mapping(bytes32 => uint64) private _ttls;

    function owner(bytes32 node) external view returns (address) {
        return _owners[node];
    }

    function resolver(bytes32 node) external view returns (address) {
        return _resolvers[node];
    }

    function ttl(bytes32 node) external view returns (uint64) {
        return _ttls[node];
    }

    function setOwner(bytes32 node, address owner_) external {
        _owners[node] = owner_;
        emit Transfer(node, owner_);
    }

    function setResolver(bytes32 node, address resolver_) external {
        _resolvers[node] = resolver_;
        emit NewResolver(node, resolver_);
    }

    function setTTL(bytes32 node, uint64 ttl_) external {
        _ttls[node] = ttl_;
        emit NewTTL(node, ttl_);
    }

    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner_
    ) external {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        _owners[subnode] = owner_;
        emit NewOwner(node, label, owner_);
        // mimic RNS behavior: propagate parent resolver to subnode
        _resolvers[subnode] = _resolvers[node];
        emit NewResolver(subnode, _resolvers[node]);
    }
}

