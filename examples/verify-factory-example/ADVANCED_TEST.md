# Advanced Factory Verification Test

## What Changed

Instead of simple contracts, we now have **comprehensive test cases** covering ALL reported scenarios:

### New Contracts

1. **AdvancedFactory.sol** - Factory with 3 deployment methods:
   - `deployChildDirect()` - Direct deployment (Issue #350)
   - `deployChildCreate2()` - CREATE2 deployment (Issue #519)
   - `deployChildViaLibrary()` - Library-based deployment (Issue #519)

2. **ComplexChild.sol** - Child contract with:
   - Multiple constructor arguments: `string name`, `uint256 value`, `address owner`
   - Struct-based configuration
   - Unique identifiers to avoid auto-matching
   - Complex state and logic

3. **DeploymentLibrary.sol** - Library for contract deployment:
   - Tests the library deployment pattern from Issue #519
   - Unique identifiers

### Why These Are Better

✅ **Unique identifiers** - Contracts have unique VERSION strings and IDs to avoid false positives
✅ **Complex constructors** - Multiple parameters of different types (string, uint256, address)
✅ **Real-world patterns** - Matches actual user scenarios from the issues
✅ **Multiple test cases** - Tests 3 different deployment patterns in one run

## How to Run

```bash
cd examples/verify-factory-example

# Compile (already done!)
pnpm hardhat compile

# Run comprehensive test
export WALLET_PRIVATE_KEY="your_key"
pnpm hardhat deploy-zksync --script deploy-advanced.ts
```

## What It Tests

### Test 1: Direct Deployment (Issue #350)
- Factory deploys `ComplexChild` with constructor: `("DirectChild_TestCase_2024", 12345, owner)`
- **Expected to fail** per Issue #350: "Constructor arguments are not correct"

### Test 2: CREATE2 Deployment (Issue #519)
- Factory uses CREATE2 opcode with salt for deterministic address
- Child has constructor: `("CREATE2Child_TestCase_2024", 67890, owner)`
- **Expected to fail** per Issue #519: Bytecode mismatch

### Test 3: Library Deployment (Issue #519)
- Factory calls `DeploymentLibrary.deployChild()` to deploy
- Child has constructor: `("LibraryChild_TestCase_2024", 11111, owner)`
- **Expected to fail** per Issue #519: Bytecode doesn't match

## Expected Output

The script will test all 3 scenarios and give you a final summary:

```
=========================================================
    FINAL TEST RESULTS
=========================================================

Deployed Contracts:
  Factory:         0x...
  Child (Direct):  0x...
  Child (CREATE2): 0x...
  Child (Library): 0x...

Verification Results:
  Factory:         ✅ PASS
  Direct Deploy:   ✅/❌ (Issue #350)
  CREATE2 Deploy:  ✅/❌ (Issue #519)
  Library Deploy:  ✅/❌ (Issue #519)

🎉 ALL TESTS PASSED! or ⚠️  SOME TESTS FAILED
```

## Manual Verification

After running, check the explorer URLs for each child contract to confirm:
- Green checkmark = Verified ✅
- Source code visible = Verified ✅
- Constructor args shown = Verified ✅
- No checkmark / "Not Verified" = Still broken ❌

## Comparison with Previous Test

| Aspect | Simple Test | Advanced Test |
|--------|-------------|---------------|
| Contracts | Factory, Child | AdvancedFactory, ComplexChild, Library |
| Constructor Args | 1 (uint256) | 3 (string, uint256, address) |
| Deployment Methods | 1 (direct) | 3 (direct, CREATE2, library) |
| Uniqueness | Basic | Unique IDs & names |
| Test Cases | 1 | 3 |
| Issues Covered | #350 | #350, #362, #519 |

This comprehensive test ensures we're not getting false positives!
