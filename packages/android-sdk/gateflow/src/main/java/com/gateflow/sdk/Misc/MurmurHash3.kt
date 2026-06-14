package com.gateflow.sdk.misc

import java.nio.charset.StandardCharsets

/**
 * MurmurHash3 32-bit implementation for bucket computation.
 * Non-cryptographic hash with high performance and low collision rate.
 */
object MurmurHash3 {
    private const val C1 = 0xcc9e2d51
    private const val C2 = 0x1b873593

    @JvmStatic
    fun hash32(data: ByteArray, seed: Int = 0): Int {
        return hash32(data, 0, data.size, seed)
    }

    @JvmStatic
    fun hash32(data: ByteArray, offset: Int, length: Int, seed: Int): Int {
        var h = seed
        val roundedEnd = offset + (length and 0xfffffffc)

        // Process 4-byte blocks
        var i = offset
        while (i < roundedEnd) {
            var k = (data[i].toInt() and 0xff) or
                    (data[i + 1].toInt() and 0xff shl 8) or
                    (data[i + 2].toInt() and 0xff shl 16) or
                    (data[i + 3].toInt() and 0xff shl 24)

            k *= C1
            k = k.rotateLeft(15)
            k *= C2

            h = h xor k
            h = h.rotateLeft(13)
            h = h * 5 + 0xe6546b64.toInt()

            i += 4
        }

        // Process remaining bytes (standard MurmurHash3 tail: first byte at LSB)
        var k = 0
        val tailLen = offset + length - roundedEnd
        for (i in 0 until tailLen) {
            k = k or ((data[roundedEnd + i].toInt() and 0xff) shl (i * 8))
        }

        if (k != 0) {
            k *= C1
            k = k.rotateLeft(15)
            k *= C2
            h = h xor k
        }

        // Final mixing
        h = h xor length
        h = h xor (h ushr 16)
        h *= 0x85ebca6b.toInt()
        h = h xor (h ushr 13)
        h *= 0xc2b2ae35.toInt()
        h = h xor (h ushr 16)

        return h
    }

    @JvmStatic
    fun hash32(str: String, seed: Int = 0): Int {
        return hash32(str.toByteArray(StandardCharsets.UTF_8), seed)
    }

    private fun Int.rotateLeft(distance: Int): Int =
        (this shl distance) or (this ushr (32 - distance))
}
