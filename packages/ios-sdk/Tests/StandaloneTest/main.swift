import Foundation

// Standard MurmurHash3 cross-platform test vectors (Java/Kotlin/Swift must match):
// hash32("user_123#layer_a#victor") = 1893927761
// bucket = 7761

var passed = 0
var failed = 0

func check(_ condition: Bool, _ msg: String) {
    if condition {
        print("  ✅ \(msg)")
        passed += 1
    } else {
        print("  ❌ \(msg)")
        failed += 1
    }
}

// MARK: - 1. MurmurHash3

print("=== 1. MurmurHash3 ===")
print("(Java: hash=1893927761, bucket=7761)\n")

do {
    let input = "user_123#layer_a#victor"
    let hash = MurmurHash3.hash32(input)
    // Use bitmask instead of abs() to avoid Int32.min overflow
    let bucket = Int(hash & Int32.max) % 10000

    check(hash == 1893927761, "hash32 = \(hash) (expected 1893927761)")
    check(bucket == 7761, "bucket = \(bucket) (expected 7761)")

    let hash2 = MurmurHash3.hash32(input)
    check(hash == hash2, "deterministic: \(hash) == \(hash2)")

    let hash3 = MurmurHash3.hash32("user_456#layer_a#victor")
    check(hash != hash3, "different user → different hash")

    let hash4 = MurmurHash3.hash32("user_123#layer_b#victor")
    check(hash != hash4, "different layer → different hash")
}

// MARK: - 2. BucketEngine

print("\n=== 2. BucketEngine ===\n")

do {
    let b1 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_a", salt: "victor")
    let b2 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_a", salt: "victor")
    check(b1 == b2, "same input → same bucket (\(b1))")
    check(b1 >= 0 && b1 < 10000, "bucket in range: \(b1)")
    check(b1 == 7761, "bucket matches Java: \(b1) == 7761")

    let b3 = BucketEngine.computeBucket(userId: "user_1", layerId: "layer_a", salt: "victor")
    let b4 = BucketEngine.computeBucket(userId: "user_2", layerId: "layer_a", salt: "victor")
    check(b3 != b4, "different users → different buckets")

    let b5 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_a", salt: "victor")
    let b6 = BucketEngine.computeBucket(userId: "user_123", layerId: "layer_b", salt: "victor")
    check(b5 != b6, "different layers → different buckets")

    let specs = [
        VariantSpec(variantKey: "control", bucketStart: 0, bucketEnd: 4999),
        VariantSpec(variantKey: "treatment_a", bucketStart: 5000, bucketEnd: 7499),
        VariantSpec(variantKey: "treatment_b", bucketStart: 7500, bucketEnd: 9999),
    ]
    check(BucketEngine.findVariant(bucket: 1000, variantSpecs: specs) == "control", "bucket 1000 → control")
    check(BucketEngine.findVariant(bucket: 6000, variantSpecs: specs) == "treatment_a", "bucket 6000 → treatment_a")
    check(BucketEngine.findVariant(bucket: 9000, variantSpecs: specs) == "treatment_b", "bucket 9000 → treatment_b")
    check(BucketEngine.findVariant(bucket: 15000, variantSpecs: specs) == nil, "bucket 15000 → nil")
}

// MARK: - 3. Full experiment evaluation

print("\n=== 3. computeBucketResult ===\n")

do {
    let exp = ExperimentSpec(
        expId: "exp_1",
        layerId: "layer_a",
        salt: "victor",
        bucketStart: 0,
        bucketEnd: 9999,
        variants: [
            VariantSpec(variantKey: "control", bucketStart: 0, bucketEnd: 4999),
            VariantSpec(variantKey: "treatment", bucketStart: 5000, bucketEnd: 9999),
        ]
    )
    let result = BucketEngine.computeBucketResult(userId: "user_123", experiment: exp)
    check(result.experimentKey == "exp_1", "experiment key = \(result.experimentKey)")
    check(result.bucket == 7761, "bucket = \(result.bucket) (Java: 7761)")
    check(result.hit, "should hit (full range)")
    check(result.variant == "treatment", "variant = \(result.variant ?? "none")")

    // Narrow range experiment (bucket 7761 should NOT be in 5000-5100)
    let exp2 = ExperimentSpec(
        expId: "exp_narrow",
        layerId: "layer_a",
        salt: "victor",
        bucketStart: 5000,
        bucketEnd: 5100,
        variants: [
            VariantSpec(variantKey: "treatment", bucketStart: 5000, bucketEnd: 5100),
        ]
    )
    let result2 = BucketEngine.computeBucketResult(userId: "user_123", experiment: exp2)
    check(!result2.hit, "narrow range → not hit (bucket 7761 outside 5000-5100)")
}

// MARK: - 4. Summary

print("\n" + String(repeating: "=", count: 40))
print("Passed: \(passed)")
print("Failed: \(failed)")
print(String(repeating: "=", count: 40))

if failed > 0 {
    print("\n❌ \(failed) test(s) failed")
    exit(1)
} else {
    print("\n✅ All tests passed!")
    exit(0)
}
