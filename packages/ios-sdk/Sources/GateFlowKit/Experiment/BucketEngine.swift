import Foundation

/// Total number of buckets (0–9999), supports 0.1% traffic allocation granularity.
public let totalBuckets = 10000

/// Default salt for hash computation.
public let defaultSalt = "victor"

/// Specification for a variant in a bucket computation.
public struct VariantSpec {
    public let variantKey: String
    public let bucketStart: Int
    public let bucketEnd: Int

    public init(variantKey: String, bucketStart: Int, bucketEnd: Int) {
        self.variantKey = variantKey
        self.bucketStart = bucketStart
        self.bucketEnd = bucketEnd
    }
}

/// Specification for an experiment in a bucket computation.
public struct ExperimentSpec {
    public let expId: String
    public let layerId: String
    public let salt: String
    public let bucketStart: Int
    public let bucketEnd: Int
    public let variants: [VariantSpec]

    public init(expId: String, layerId: String, salt: String, bucketStart: Int, bucketEnd: Int, variants: [VariantSpec]) {
        self.expId = expId
        self.layerId = layerId
        self.salt = salt
        self.bucketStart = bucketStart
        self.bucketEnd = bucketEnd
        self.variants = variants
    }
}

/// Result of a bucket computation for a single experiment.
public struct BucketResult: Equatable {
    public let userId: String
    public let experimentKey: String
    public let bucket: Int
    public let variant: String?
    public let layerId: String?
    public let hit: Bool

    public init(userId: String, experimentKey: String, bucket: Int, variant: String?, layerId: String?, hit: Bool) {
        self.userId = userId
        self.experimentKey = experimentKey
        self.bucket = bucket
        self.variant = variant
        self.layerId = layerId
        self.hit = hit
    }

    public static func hit(userId: String, experimentKey: String, bucket: Int, variant: String, layerId: String) -> BucketResult {
        BucketResult(userId: userId, experimentKey: experimentKey, bucket: bucket, variant: variant, layerId: layerId, hit: true)
    }

    public static func notHit(userId: String, experimentKey: String, bucket: Int) -> BucketResult {
        BucketResult(userId: userId, experimentKey: experimentKey, bucket: bucket, variant: nil, layerId: nil, hit: false)
    }
}

/// Core bucketing engine. Pure computation, no side effects.
public enum BucketEngine {

    /// Compute the bucket number (0–9999) for a user in a specific layer.
    public static func computeBucket(userId: String, layerId: String, salt: String) -> Int {
        let hashInput = "\(userId)#\(layerId)#\(salt)"
        let hash = MurmurHash3.hash32(hashInput)
        return Int(abs(hash)) % totalBuckets
    }

    /// Find the variant key for a given bucket number.
    public static func findVariant(bucket: Int, variantSpecs: [VariantSpec]) -> String? {
        for spec in variantSpecs {
            if bucket >= spec.bucketStart && bucket <= spec.bucketEnd {
                return spec.variantKey
            }
        }
        return nil
    }

    /// Check if a bucket falls within an experiment's traffic range.
    public static func isInExperiment(bucket: Int, bucketStart: Int, bucketEnd: Int) -> Bool {
        bucket >= bucketStart && bucket <= bucketEnd
    }

    /// Compute the full bucket result for a single experiment.
    public static func computeBucketResult(userId: String, experiment: ExperimentSpec) -> BucketResult {
        let bucket = computeBucket(userId: userId, layerId: experiment.layerId, salt: experiment.salt)

        guard isInExperiment(bucket: bucket, bucketStart: experiment.bucketStart, bucketEnd: experiment.bucketEnd) else {
            return .notHit(userId: userId, experimentKey: experiment.expId, bucket: bucket)
        }

        guard let variant = findVariant(bucket: bucket, variantSpecs: experiment.variants) else {
            return .notHit(userId: userId, experimentKey: experiment.expId, bucket: bucket)
        }

        return .hit(userId: userId, experimentKey: experiment.expId, bucket: bucket, variant: variant, layerId: experiment.layerId)
    }

    /// Compute bucket results for all experiments at once.
    public static func computeAllBucketResults(userId: String, experiments: [ExperimentSpec]) -> [BucketResult] {
        experiments.map { computeBucketResult(userId: userId, experiment: $0) }
    }
}
