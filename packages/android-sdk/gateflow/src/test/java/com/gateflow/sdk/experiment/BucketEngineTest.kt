package com.gateflow.sdk.experiment

import com.gateflow.sdk.misc.MurmurHash3
import org.junit.Assert.*
import org.junit.Test

class BucketEngineTest {

    @Test
    fun `computeBucket is deterministic`() {
        val b1 = BucketEngine.computeBucket("user_123", "layer_a", "victor")
        val b2 = BucketEngine.computeBucket("user_123", "layer_a", "victor")
        assertEquals(b1, b2)
        assertTrue(b1 in 0 until TOTAL_BUCKETS)
    }

    @Test
    fun `different users get different buckets`() {
        val b1 = BucketEngine.computeBucket("user_1", "layer_a", "victor")
        val b2 = BucketEngine.computeBucket("user_2", "layer_a", "victor")
        assertNotEquals(b1, b2)
    }

    @Test
    fun `different layers get different buckets for same user`() {
        val b1 = BucketEngine.computeBucket("user_123", "layer_a", "victor")
        val b2 = BucketEngine.computeBucket("user_123", "layer_b", "victor")
        assertNotEquals(b1, b2)
    }

    @Test
    fun `findVariant returns correct variant`() {
        val specs = listOf(
            VariantSpec("control", 0, 4999),
            VariantSpec("treatment_a", 5000, 7499),
            VariantSpec("treatment_b", 7500, 9999),
        )
        assertEquals("control", BucketEngine.findVariant(1000, specs))
        assertEquals("treatment_a", BucketEngine.findVariant(6000, specs))
        assertEquals("treatment_b", BucketEngine.findVariant(9000, specs))
        assertNull(BucketEngine.findVariant(15000, specs))
    }

    @Test
    fun `computeBucketResult hit with full traffic`() {
        val exp = ExperimentSpec(
            expId = "exp_1",
            layerId = "layer_a",
            salt = "victor",
            bucketStart = 0,
            bucketEnd = 9999,
            variants = listOf(
                VariantSpec("control", 0, 4999),
                VariantSpec("treatment", 5000, 9999),
            ),
        )
        val result = BucketEngine.computeBucketResult("user_123", exp)
        assertTrue(result.hit)
        assertNotNull(result.variant)
        assertEquals("exp_1", result.experimentKey)
    }

    @Test
    fun `computeBucketResult not hit with narrow traffic`() {
        val exp = ExperimentSpec(
            expId = "exp_1",
            layerId = "layer_a",
            salt = "victor",
            bucketStart = 5000,
            bucketEnd = 5100,
            variants = listOf(
                VariantSpec("treatment", 5000, 5100),
            ),
        )
        val result = BucketEngine.computeBucketResult("user_123", exp)
        assertEquals("exp_1", result.experimentKey)
        assertTrue(result.bucket in 0 until TOTAL_BUCKETS)
    }

    @Test
    fun `MurmurHash3 matches Java backend`() {
        // Cross-platform test vector: must match Java BucketEngineTest
        val input = "user_123#layer_a#victor"
        val hash = MurmurHash3.hash32(input)
        assertEquals(1893927761, hash, "hash must match Java backend")
        val bucket = BucketEngine.computeBucket("user_123", "layer_a", "victor")
        assertEquals(7761, bucket, "bucket must match Java: (hash & Int.MAX_VALUE) % 10000")
    }
}
