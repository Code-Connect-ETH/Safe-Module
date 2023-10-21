// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.9.0;

import { AllowanceModuleCC } from "../src/AllowanceModuleCC.sol";

import { BaseScript } from "./Base.s.sol";

/// @dev See the Solidity Scripting tutorial: https://book.getfoundry.sh/tutorials/solidity-scripting
contract Deploy is BaseScript {
    function run() public broadcast returns (AllowanceModuleCC allowanceModuleCC) {
        allowanceModuleCC = new AllowanceModuleCC();
    }
}
