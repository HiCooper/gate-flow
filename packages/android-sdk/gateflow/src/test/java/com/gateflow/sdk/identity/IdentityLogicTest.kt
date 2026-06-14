package com.gateflow.sdk.identity

import org.junit.Assert.*
import org.junit.Test

class IdentityLogicTest {

    @Test
    fun `generateAlias starts with gf_ prefix`() {
        val alias = IdentityLogic.generateAlias()
        assertTrue("Alias should start with 'gf_'", alias.startsWith("gf_"))
    }

    @Test
    fun `generateAlias produces unique values`() {
        val aliases = (1..100).map { IdentityLogic.generateAlias() }.toSet()
        assertEquals("100 calls should produce 100 unique aliases", 100, aliases.size)
    }

    @Test
    fun `generateAlias has expected length`() {
        val alias = IdentityLogic.generateAlias()
        // "gf_" + UUID (36 chars) = 39 chars
        assertEquals(39, alias.length)
    }

    @Test
    fun `generateSeed returns positive value`() {
        repeat(100) {
            val seed = IdentityLogic.generateSeed()
            assertTrue("Seed should be >= 0, got $seed", seed >= 0)
            assertTrue("Seed should be <= Int.MAX_VALUE", seed <= Int.MAX_VALUE)
        }
    }

    @Test
    fun `sanitize returns trimmed string`() {
        assertEquals("user123", IdentityLogic.sanitize("  user123  "))
        assertEquals("user123", IdentityLogic.sanitize("user123"))
    }

    @Test
    fun `sanitize returns null for blank input`() {
        assertNull(IdentityLogic.sanitize(""))
        assertNull(IdentityLogic.sanitize("   "))
    }

    @Test
    fun `shouldGetAssignments true on first open`() {
        assertTrue(IdentityLogic.shouldGetAssignments(isLoggedIn = false, isFirstAppOpen = true))
        assertTrue(IdentityLogic.shouldGetAssignments(isLoggedIn = true, isFirstAppOpen = true))
    }

    @Test
    fun `shouldGetAssignments true when not logged in`() {
        assertTrue(IdentityLogic.shouldGetAssignments(isLoggedIn = false, isFirstAppOpen = false))
    }

    @Test
    fun `shouldGetAssignments false when logged in and not first open`() {
        assertFalse(IdentityLogic.shouldGetAssignments(isLoggedIn = true, isFirstAppOpen = false))
    }
}
