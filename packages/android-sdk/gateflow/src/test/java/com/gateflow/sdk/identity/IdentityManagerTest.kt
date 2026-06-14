package com.gateflow.sdk.identity

import com.gateflow.sdk.storage.LocalStorage
import com.gateflow.sdk.storage.Storable
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

/** In-memory storage stub for testing. */
class InMemoryStorage : LocalStorage(null) {
    private val store = mutableMapOf<String, Any?>()

    @Suppress("UNCHECKED_CAST")
    override fun <T : Any> read(storable: Storable<T>): T? {
        return store[storable.key] as? T
    }

    override fun <T : Any> write(storable: Storable<T>, value: T?) {
        if (value != null) store[storable.key] = value else store.remove(storable.key)
    }

    override fun delete(storable: Storable<*>) {
        store.remove(storable.key)
    }

    override fun clean() {
        store.clear()
    }
}

class IdentityManagerTest {

    private lateinit var storage: InMemoryStorage
    private lateinit var manager: IdentityManager

    @Before
    fun setUp() {
        storage = InMemoryStorage()
        manager = IdentityManager(storage)
    }

    @Test
    fun `initial state is ready`() {
        assertTrue(manager.state.value.isReady)
    }

    @Test
    fun `initial state has aliasId with gf_ prefix`() {
        val alias = manager.state.value.aliasId
        assertTrue("Alias should start with 'gf_'", alias.startsWith("gf_"))
    }

    @Test
    fun `initial state userId equals aliasId when not logged in`() {
        val state = manager.state.value
        assertEquals(state.aliasId, state.userId)
        assertFalse(state.isLoggedIn)
    }

    @Test
    fun `identify sets appUserId`() {
        manager.identify("user_123")
        assertEquals("user_123", manager.state.value.appUserId)
        assertEquals("user_123", manager.state.value.userId)
        assertTrue(manager.state.value.isLoggedIn)
    }

    @Test
    fun `identify ignores empty user ID`() {
        val before = manager.state.value.aliasId
        manager.identify("")
        assertNull(manager.state.value.appUserId)
        assertEquals(before, manager.state.value.userId)
    }

    @Test
    fun `identify ignores blank user ID`() {
        val before = manager.state.value.aliasId
        manager.identify("   ")
        assertNull(manager.state.value.appUserId)
        assertEquals(before, manager.state.value.userId)
    }

    @Test
    fun `identify with same userId is idempotent`() {
        manager.identify("user_123")
        val state1 = manager.state.value
        manager.identify("user_123")
        val state2 = manager.state.value
        assertEquals(state1.appUserId, state2.appUserId)
    }

    @Test
    fun `reset clears appUserId`() {
        manager.identify("user_123")
        manager.reset()
        assertNull(manager.state.value.appUserId)
        assertFalse(manager.state.value.isLoggedIn)
    }

    @Test
    fun `reset generates new alias`() {
        val oldAlias = manager.state.value.aliasId
        manager.reset()
        val newAlias = manager.state.value.aliasId
        assertNotEquals(oldAlias, newAlias)
    }

    @Test
    fun `mergeUserAttributes adds to state`() {
        manager.mergeUserAttributes(mapOf("plan" to "premium", "age" to 30))
        val attrs = manager.state.value.userAttributes
        assertEquals("premium", attrs["plan"])
        assertEquals(30, attrs["age"])
    }

    @Test
    fun `mergeUserAttributes merges with existing`() {
        manager.mergeUserAttributes(mapOf("a" to 1))
        manager.mergeUserAttributes(mapOf("b" to 2))
        val attrs = manager.state.value.userAttributes
        assertEquals(1, attrs["a"])
        assertEquals(2, attrs["b"])
    }

    @Test
    fun `enrichedAttributes includes aliasId and seed`() {
        val enriched = manager.state.value.enrichedAttributes
        assertNotNull(enriched["aliasId"])
        assertNotNull(enriched["seed"])
        assertEquals(manager.state.value.aliasId, enriched["aliasId"])
    }

    @Test
    fun `configure sets isReady true`() {
        manager.configure(isFirstAppOpen = true)
        assertTrue(manager.state.value.isReady)
    }
}
