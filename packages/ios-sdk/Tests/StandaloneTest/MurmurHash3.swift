import Foundation

/// MurmurHash3 32-bit implementation for bucket computation.
/// Non-cryptographic hash with high performance and low collision rate.
public enum MurmurHash3 {
    private static let c1: UInt32 = 0xcc9e2d51
    private static let c2: UInt32 = 0x1b873593

    public static func hash32(_ data: Data, seed: UInt32 = 0) -> Int32 {
        var h: UInt32 = seed
        let length = data.count
        let roundedEnd = length & ~3

        // Process 4-byte blocks
        for i in stride(from: 0, to: roundedEnd, by: 4) {
            var k: UInt32 = UInt32(data[i])
                | UInt32(data[i + 1]) << 8
                | UInt32(data[i + 2]) << 16
                | UInt32(data[i + 3]) << 24

            k = k &* c1
            k = rotateLeft(k, 15)
            k = k &* c2

            h ^= k
            h = rotateLeft(h, 13)
            h = h &* 5 + 0xe6546b64
        }

        // Process remaining bytes
        var k: UInt32 = 0
        for i in roundedEnd..<length {
            k |= UInt32(data[i]) << (UInt32(i & 3) * 8)
        }

        if k != 0 {
            k = k &* c1
            k = rotateLeft(k, 15)
            k = k &* c2
            h ^= k
        }

        // Final mixing
        h ^= UInt32(length)
        h ^= h >> 16
        h = h &* 0x85ebca6b
        h ^= h >> 13
        h = h &* 0xc2b2ae35
        h ^= h >> 16

        return Int32(bitPattern: h)
    }

    public static func hash32(_ string: String, seed: UInt32 = 0) -> Int32 {
        hash32(string.data(using: .utf8) ?? Data(), seed: seed)
    }

    private static func rotateLeft(_ value: UInt32, _ amount: UInt32) -> UInt32 {
        (value << amount) | (value >> (32 - amount))
    }
}
