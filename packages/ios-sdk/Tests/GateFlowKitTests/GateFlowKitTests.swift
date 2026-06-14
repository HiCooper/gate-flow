import XCTest
@testable import GateFlowKit

/// XCTest suite for GateFlowKit — cross-platform bucketing consistency.
final class BucketEngineTests: XCTestCase {

    // MARK: - computeBucket

    func testComputeBucketDeterministic() {
        let b1 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_001", salt: "v1")
        let b2 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_001", salt: "v1")
        XCTAssertEqual(b1, b2, "Same input should produce same bucket")
    }

    func testComputeBucketInRange() {
        for i in 0..<1000 {
            let b = BucketEngine.computeBucket(userId: "user_\(i)", layerId: "layer_test", salt: "salt")
            XCTAssertTrue(b >= 0 && b < 10000, "Bucket \(b) should be in 0-9999")
        }
    }

    func testDifferentUsersGetDifferentBuckets() {
        let b1 = BucketEngine.computeBucket(userId: "user_001", layerId: "layer_001", salt: "v1")
        let b2 = BucketEngine.computeBucket(userId: "user_002", layerId: "layer_001", salt: "v1")
        XCTAssertNotEqual(b1, b2, "Different users should likely get different buckets")
    }

    func testDifferentLayersGetDifferentBuckets() {
        let b1 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_001", salt: "v1")
        let b2 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_002", salt: "v1")
        XCTAssertNotEqual(b1, b2, "Different layers = orthogonal bucketing")
    }

    // MARK: - Cross-Platform Test Vectors

    func testCrossPlatformVector1() {
        let bucket = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_001", salt: "v1")
        XCTAssertEqual(bucket, 473, "Must match Java/Kotlin: user_123#layer_001#v1 → 473")
    }

    func testCrossPlatformVector2() {
        let bucket = BucketEngine.computeBucket(userId: "user_456", layerId: "layer_recommend", salt: "salt_2024")
        XCTAssertEqual(bucket, 2896, "Must match Java/Kotlin: user_456#layer_recommend#salt_2024 → 2896")
    }

    func testCrossPlatformVector3() {
        let bucket = BucketEngine.computeBucket(userId: "user_789", layerId: "layer_search", salt: "salt_prod")
        XCTAssertEqual(bucket, 1511, "Must match Java/Kotlin: user_789#layer_search#salt_prod → 1511")
    }

    func testCrossPlatformVector4() {
        let bucket = BucketEngine.computeBucket(userId: "alice", layerId: "default", salt: "victor_default")
        XCTAssertEqual(bucket, 7176, "Must match Java/Kotlin: alice#default#victor_default → 7176")
    }

    // MARK: - findVariant

    func testFindVariant() {
        let specs = [
            VariantSpec(variantKey: "control", bucketStart: 0, bucketEnd: 4999),
            VariantSpec(variantKey: "treatment_a", bucketStart: 5000, bucketEnd: 7499),
            VariantSpec(variantKey: "treatment_b", bucketStart: 7500, bucketEnd: 9999),
        ]
        XCTAssertEqual(BucketEngine.findVariant(bucket: 0, variantSpecs: specs), "control")
        XCTAssertEqual(BucketEngine.findVariant(bucket: 6000, variantSpecs: specs), "treatment_a")
        XCTAssertEqual(BucketEngine.findVariant(bucket: 9999, variantSpecs: specs), "treatment_b")
        XCTAssertNil(BucketEngine.findVariant(bucket: 15000, variantSpecs: specs))
    }

    // MARK: - computeBucketResult

    func testComputeBucketResultHit() {
        let exp = ExperimentSpec(
            expId: "exp_1", layerId: "layer_a", salt: "victor",
            bucketStart: 0, bucketEnd: 9999,
            variants: [
                VariantSpec(variantKey: "control", bucketStart: 0, bucketEnd: 4999),
                VariantSpec(variantKey: "treatment", bucketStart: 5000, bucketEnd: 9999),
            ]
        )
        let result = BucketEngine.computeBucketResult(userId: "user_123", experiment: exp)
        XCTAssertTrue(result.hit)
        XCTAssertNotNil(result.variant)
    }

    func testNoIntegerMinOverflow() {
        // Verify we use bitmask, not abs(), to avoid Int32.min overflow
        let bucket = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_001", salt: "v1")
        XCTAssertTrue(bucket >= 0, "Bucket should never be negative (abs(Int32.min) overflow)")
        XCTAssertTrue(bucket < 10000, "Bucket should be less than 10000")
    }
}

/// Tests for IdentityLogic utility.
final class IdentityLogicTests: XCTestCase {

    func testSanitizeTrims() {
        XCTAssertEqual(IdentityLogic.sanitize("  user123  "), "user123")
    }

    func testSanitizeBlankIsNil() {
        XCTAssertNil(IdentityLogic.sanitize(""))
        XCTAssertNil(IdentityLogic.sanitize("   "))
    }

    func testGenerateAliasPrefix() {
        let alias = IdentityLogic.generateAlias()
        XCTAssertTrue(alias.hasPrefix("sw_"), "Alias should start with 'sw_'")
    }

    func testGenerateSeedPositive() {
        for _ in 0..<100 {
            let seed = IdentityLogic.generateSeed()
            XCTAssertTrue(seed >= 0, "Seed should be non-negative")
        }
    }

    func testShouldGetAssignments() {
        XCTAssertTrue(IdentityLogic.shouldGetAssignments(isLoggedIn: false, isFirstAppOpen: true))
        XCTAssertTrue(IdentityLogic.shouldGetAssignments(isLoggedIn: false, isFirstAppOpen: false))
        XCTAssertFalse(IdentityLogic.shouldGetAssignments(isLoggedIn: true, isFirstAppOpen: false))
    }
}
