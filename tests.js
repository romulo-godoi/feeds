// --- Simple Test Framework ---
let testsPassed = 0;
let testsFailed = 0;

/**
 * Asserts that the expected and actual values are strictly equal.
 * @param {*} expected - The expected value.
 * @param {*} actual - The actual value.
 * @param {string} testName - The name of the test.
 */
function assertEquals(expected, actual, testName) {
    if (expected === actual) {
        console.log(`PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`FAIL: ${testName} - Expected: "${expected}", Actual: "${actual}"`);
        testsFailed++;
    }
}

/**
 * Asserts that a value is true.
 * @param {boolean} value - The value to check.
 * @param {string} testName - The name of the test.
 */
function assertTrue(value, testName) {
    if (value === true) {
        console.log(`PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`FAIL: ${testName} - Expected: true, Actual: ${value}`);
        testsFailed++;
    }
}

/**
 * Asserts that a value is false.
 * @param {boolean} value - The value to check.
 * @param {string} testName - The name of the test.
 */
function assertFalse(value, testName) {
    if (value === false) {
        console.log(`PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`FAIL: ${testName} - Expected: false, Actual: ${value}`);
        testsFailed++;
    }
}

// --- Function to be tested (copied from script.js) ---
/**
 * Gets a unique identifier for a feed item.
 * Uses the item's GUID if available and valid, otherwise falls back to its link.
 * @param {Object} item - The feed item.
 * @param {string} [item.guid] - The GUID of the item.
 * @param {string} item.link - The link to the item.
 * @returns {string} The unique identifier for the item.
 */
function getItemId(item) {
    if (item.guid && typeof item.guid === 'string' && item.guid.trim() !== '') return item.guid;
    return item.link;
}

// --- Test Cases ---
/**
 * Runs test cases for the getItemId function.
 */
function testGetItemId() {
    console.log("--- Testing getItemId ---");

    const item1 = { guid: 'test-guid-123', link: 'http://example.com/item1' };
    assertEquals('test-guid-123', getItemId(item1), 'testGetItemId: Valid GUID');

    const item2 = { guid: '', link: 'http://example.com/item2' };
    assertEquals('http://example.com/item2', getItemId(item2), 'testGetItemId: Empty string GUID, should use link');

    const item3 = { guid: null, link: 'http://example.com/item3' };
    assertEquals('http://example.com/item3', getItemId(item3), 'testGetItemId: Null GUID, should use link');

    const item4 = { link: 'http://example.com/item4' }; // No guid property
    assertEquals('http://example.com/item4', getItemId(item4), 'testGetItemId: No GUID property, should use link');

    const item5 = { guid: 12345, link: 'http://example.com/item5' }; // GUID is not a string
    assertEquals('http://example.com/item5', getItemId(item5), 'testGetItemId: Non-string GUID, should use link');

    const item6 = { guid: '   ', link: 'http://example.com/item6' }; // GUID with only spaces
    assertEquals('http://example.com/item6', getItemId(item6), 'testGetItemId: GUID with only spaces, should use link');
    
    const item7 = { guid: '  valid-guid  ', link: 'http://example.com/item7' }; // GUID with leading/trailing spaces
    assertEquals('  valid-guid  ', getItemId(item7), 'testGetItemId: GUID with leading/trailing spaces, should use guid (trim is not applied to the value itself)');

    const item8 = { guid: 'another-guid', link: undefined };
    assertEquals('another-guid', getItemId(item8), 'testGetItemId: Undefined link, valid GUID');
    
    // Test case where guid is present but link is the preferred fallback if guid is invalid (e.g. empty)
    const item9 = { guid: '', link: 'http://example.com/preferredLink' };
    assertEquals('http://example.com/preferredLink', getItemId(item9), 'testGetItemId: Empty GUID, preferred link');

    // Test with only link and no guid field
    const item10 = { link: 'http://example.com/onlyLink' };
    assertEquals('http://example.com/onlyLink', getItemId(item10), 'testGetItemId: Only link field');

}

/**
 * Runs all defined test suites.
 */
function runAllTests() {
    console.log("--- Running Unit Tests ---");
    
    // Reset counters for multiple runs if needed (though typically run once)
    testsPassed = 0;
    testsFailed = 0;

    testGetItemId();
    testStorageModuleReadItems(); // Add call to the new test suite

    console.log("\n--- Test Summary ---");
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);

    if (testsFailed > 0) {
        console.error("!!! SOME TESTS FAILED !!!");
    } else {
        console.log(">>> All tests passed! <<<");
    }
}

// Example of how to run tests:
// runAllTests();
// This line can be commented out or removed if tests are run by a dedicated test runner.
// For this task, the file just needs to be created with the contents.
// If you want to execute this in a Node.js environment, you would uncomment runAllTests()
// and run `node tests.js` in your terminal.
// To make it runnable in a browser, you would include this script in an HTML file
// and call runAllTests() from a script tag or the console.

// --- Mock localStorage ---
let mockStorage = {};
const mockLocalStorage = {
    getItem: function(key) { return mockStorage[key] || null; },
    setItem: function(key, value) { mockStorage[key] = String(value); },
    removeItem: function(key) { delete mockStorage[key]; },
    clear: function() { mockStorage = {}; }
};

// --- Dependencies for storageModule (copied/adapted from script.js) ---
const testConfig = {
    READ_ITEMS_STORAGE_KEY: 'rss_feed_reader_read_items_v2_test', // Use a distinct key for tests
    READ_ITEM_EXPIRY_MS: 72 * 60 * 60 * 1000,
};

// Mock for uiModule.showToast to avoid errors during storage tests
const mockUiModule = {
    showToast: function(message, type) {
        // console.log(`MockToast: [${type}] ${message}`); // Optional: log toast messages
    }
};

// Global state used by storageModule functions (managed by tests)
let readItems = {}; 

// --- Testable StorageModule (adapted to use mockLocalStorage and mockUiModule) ---
const testableStorageModule = {
    loadReadItems() {
        try {
            const storedReadItems = mockLocalStorage.getItem(testConfig.READ_ITEMS_STORAGE_KEY);
            readItems = storedReadItems ? JSON.parse(storedReadItems) : {};
        } catch (e) { 
            readItems = {}; 
            console.error("Error loading read items from mock storage:", e);
        }
        this.cleanupOldReadItems(); // 'this' refers to testableStorageModule
    },

    saveReadItems() {
        try {
            mockLocalStorage.setItem(testConfig.READ_ITEMS_STORAGE_KEY, JSON.stringify(readItems));
        } catch (e) { 
            console.error("Error saving read items to mock storage:", e);
            mockUiModule.showToast("Error saving read state.", "error");
        }
    },

    cleanupOldReadItems() {
        const now = Date.now();
        let changed = false;
        for (const itemId in readItems) {
            if (now - readItems[itemId] > testConfig.READ_ITEM_EXPIRY_MS) {
                delete readItems[itemId];
                changed = true;
            }
        }
        if (changed) this.saveReadItems(); // 'this' refers to testableStorageModule
    },

    isItemRead(item) {
        return readItems.hasOwnProperty(getItemId(item)); // getItemId is already in tests.js
    }
};


// --- Test Cases for StorageModule (Read Items) ---
function testStorageModuleReadItems() {
    console.log("--- Testing StorageModule Read Items ---");

    // Setup / Teardown for each logical group or test
    const resetTestState = () => {
        mockLocalStorage.clear();
        readItems = {}; // Reset the global readItems for the module
    };

    // Test 1: saveReadItems and loadReadItems
    resetTestState();
    readItems = { 'http://example.com/itemA': Date.now(), 'http://example.com/itemB': Date.now() - 10000 };
    testableStorageModule.saveReadItems();
    
    const savedData = mockLocalStorage.getItem(testConfig.READ_ITEMS_STORAGE_KEY);
    assertTrue(savedData !== null, "testSaveAndLoad: localStorage.setItem should have been called");
    assertEquals(JSON.stringify(readItems), savedData, "testSaveAndLoad: Saved data matches original readItems");

    readItems = {}; // Clear in-memory readItems before loading
    testableStorageModule.loadReadItems();
    assertEquals(2, Object.keys(readItems).length, "testSaveAndLoad: Loaded readItems has correct number of items");
    assertTrue(readItems.hasOwnProperty('http://example.com/itemA'), "testSaveAndLoad: itemA loaded correctly");
    assertTrue(readItems.hasOwnProperty('http://example.com/itemB'), "testSaveAndLoad: itemB loaded correctly");
    console.log("testSaveAndLoadReadItems: Completed.");

    // Test 2: isItemRead
    resetTestState();
    readItems = { 'http://example.com/read': Date.now(), 'guid-read': Date.now() };
    // No need to call save/load, just test against the in-memory `readItems` as `isItemRead` uses it directly.
    
    assertTrue(testableStorageModule.isItemRead({ link: 'http://example.com/read' }), "testIsItemRead: Item known by link should be read");
    assertTrue(testableStorageModule.isItemRead({ guid: 'guid-read', link: 'http://example.com/other' }), "testIsItemRead: Item known by GUID should be read");
    assertFalse(testableStorageModule.isItemRead({ link: 'http://example.com/unread' }), "testIsItemRead: Unread item by link");
    assertFalse(testableStorageModule.isItemRead({ guid: 'guid-unread', link: 'http://example.com/unreadLink' }), "testIsItemRead: Unread item by GUID");
    console.log("testIsItemRead: Completed.");

    // Test 3: cleanupOldReadItems
    resetTestState();
    const now = Date.now();
    const veryOldTimestamp = now - (testConfig.READ_ITEM_EXPIRY_MS + 100000); // 100 seconds older than expiry
    const recentTimestamp = now - 10000; // 10 seconds old, well within expiry

    readItems = {
        'item-old-link': veryOldTimestamp,
        'item-recent-link': recentTimestamp,
        'guid-old': veryOldTimestamp,
        'guid-recent': recentTimestamp
    };
    testableStorageModule.saveReadItems(); // Save initial state with old and recent items

    // To make cleanupOldReadItems work as expected, we call it.
    // It modifies the global `readItems` and then calls `saveReadItems` internally.
    testableStorageModule.cleanupOldReadItems();

    // After cleanup, loadReadItems should reflect the cleaned state from mockStorage
    // because cleanupOldReadItems calls saveReadItems which updates mockStorage.
    readItems = {}; // Clear memory to ensure we load from mockStorage
    testableStorageModule.loadReadItems(); // This will load from mockStorage, which should have been updated by cleanup's save.
                                       // And loadReadItems itself calls cleanupOldReadItems again, but it should be idempotent.
    
    assertEquals(2, Object.keys(readItems).length, "testCleanupOldReadItems: Should have 2 items after cleanup");
    assertFalse(readItems.hasOwnProperty('item-old-link'), "testCleanupOldReadItems: Old item by link should be removed");
    assertTrue(readItems.hasOwnProperty('item-recent-link'), "testCleanupOldReadItems: Recent item by link should remain");
    assertFalse(readItems.hasOwnProperty('guid-old'), "testCleanupOldReadItems: Old item by GUID should be removed");
    assertTrue(readItems.hasOwnProperty('guid-recent'), "testCleanupOldReadItems: Recent item by GUID should remain");
    
    // Verify that saveReadItems was called by cleanup (by checking mockStorage)
    const finalStorageState = mockLocalStorage.getItem(testConfig.READ_ITEMS_STORAGE_KEY);
    const expectedFinalStorage = JSON.stringify({
        'item-recent-link': recentTimestamp,
        'guid-recent': recentTimestamp
    });
    assertEquals(expectedFinalStorage, finalStorageState, "testCleanupOldReadItems: mockLocalStorage should reflect cleaned items");
    console.log("testCleanupOldReadItems: Completed.");
}


// --- Original getItemId tests (no changes needed here for this task) ---

The structure of `tests.js` includes:
-   `testsPassed` and `testsFailed` counters.
-   `assertEquals(expected, actual, testName)` function.
-   `assertTrue(value, testName)` function.
-   `assertFalse(value, testName)` function.
-   The `getItemId(item)` function, copied from `script.js`.
-   `testGetItemId()` function containing various test cases for `getItemId`:
    -   Valid `guid`.
    -   Empty string `guid` (should use `link`).
    -   `null` `guid` (should use `link`).
    -   No `guid` property (should use `link`).
    -   Non-string `guid` (should use `link`).
    -   `guid` with only spaces (should use `link`).
    -   `guid` with leading/trailing spaces (should use `guid` as is).
    -   Valid `guid` with an undefined `link`.
    -   Empty `guid` with a preferred `link`.
    -   Only `link` field present.
-   `runAllTests()` function to execute defined test suites and log a summary.
-   Comments clarifying how to run the tests and noting that the worker's task is file creation.

The file is ready.
