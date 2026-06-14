package com.gateflow.sdk.experiment

import com.gateflow.sdk.misc.MurmurHash3

const val TOTAL_BUCKETS = 10000
const val DEFAULT_SALT = "victor"

/** Specification for a variant in a bucket computation. */
data class VariantSpec(
    val variantKey: String,
    val bucketStart: Int,
    val bucketEnd: Int,
)

/** Specification for an experiment in a bucket computation. */
data class ExperimentSpec(
    val expId: String,
    val layerId: String,
    val salt: String,
    val bucketStart: Int,
    val bucketEnd: Int,
    val variants: List<VariantSpec>,
)

/** Result of a bucket computation for a single experiment. */
data class BucketResult(
    val userId: String,
    val experimentKey: String,
    val bucket: Int,
    val variant: String? = null,
    val layerId: String? = null,
    val hit: Boolean = false,
) {
    companion object {
        fun hit(userId: String, experimentKey: String, bucket: Int, variant: String, layerId: String) =
            BucketResult(userId, experimentKey, bucket, variant, layerId, true)

        fun notHit(userId: String, experimentKey: String, bucket: Int) =
            BucketResult(userId, experimentKey, bucket, hit = false)
    }
}

/** Core bucketing engine. Pure computation, no side effects. */
object BucketEngine {

    /** Compute the bucket number (0–9999) for a user in a specific layer. */
    @JvmStatic
    fun computeBucket(userId: String, layerId: String, salt: String): Int {
        val hashInput = "$userId#$layerId#$salt"
        val hash = MurmurHash3.hash32(hashInput)
        // Use bitmask instead of abs() to avoid Integer.MIN_VALUE overflow
        return (hash and Int.MAX_VALUE) % TOTAL_BUCKETS
    }

    /** Find the variant key for a given bucket number. */
    @JvmStatic
    fun findVariant(bucket: Int, variantSpecs: List<VariantSpec>): String? {
        for (spec in variantSpecs) {
            if (bucket in spec.bucketStart..spec.bucketEnd) {
                return spec.variantKey
            }
        }
        return null
    }

    /** Check if a bucket falls within an experiment's traffic range. */
    @JvmStatic
    fun isInExperiment(bucket: Int, bucketStart: Int, bucketEnd: Int): Boolean =
        bucket in bucketStart..bucketEnd

    /** Compute the full bucket result for a single experiment. */
    @JvmStatic
    fun computeBucketResult(userId: String, experiment: ExperimentSpec): BucketResult {
        val bucket = computeBucket(userId, experiment.layerId, experiment.salt)

        if (!isInExperiment(bucket, experiment.bucketStart, experiment.bucketEnd)) {
            return BucketResult.notHit(userId, experiment.expId, bucket)
        }

        val variant = findVariant(bucket, experiment.variants)
            ?: return BucketResult.notHit(userId, experiment.expId, bucket)

        return BucketResult.hit(userId, experiment.expId, bucket, variant, experiment.layerId)
    }

    /** Compute bucket results for all experiments at once. */
    @JvmStatic
    fun computeAllBucketResults(userId: String, experiments: List<ExperimentSpec>): List<BucketResult> =
        experiments.map { computeBucketResult(userId, it) }
}
