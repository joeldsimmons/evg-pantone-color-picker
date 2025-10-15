/**
 * Pantone Database Module
 * Manages loading and searching of Pantone colors
 */

const PantoneDatabase = (function() {
    'use strict';

    let colorsData = null;
    let isLoaded = false;

    /**
     * Load Pantone colors from JSON file
     * @returns {Promise} Resolves when colors are loaded
     */
    async function load() {
        if (isLoaded) {
            return colorsData;
        }

        try {
            const response = await fetch('data/pantone-colors.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            colorsData = data;
            isLoaded = true;

            console.log(`✓ Loaded ${data.colors.length} Pantone colors`);
            return colorsData;
        } catch (error) {
            console.error('Failed to load Pantone database:', error);
            throw error;
        }
    }

    /**
     * Get all colors
     * @returns {Array} Array of color objects
     */
    function getAllColors() {
        if (!isLoaded) {
            throw new Error('Database not loaded. Call load() first.');
        }

        return colorsData.colors;
    }

    /**
     * Get metadata
     * @returns {object} Metadata object
     */
    function getMetadata() {
        if (!isLoaded) {
            throw new Error('Database not loaded. Call load() first.');
        }

        return colorsData.metadata;
    }

    /**
     * Search colors by name
     * @param {string} query - Search query
     * @returns {Array} Matching colors
     */
    function searchByName(query) {
        if (!isLoaded) {
            throw new Error('Database not loaded. Call load() first.');
        }

        query = query.toLowerCase().trim();

        return colorsData.colors.filter(color =>
            color.name.toLowerCase().includes(query) ||
            color.code.toLowerCase().includes(query)
        );
    }

    /**
     * Find exact color by name
     * @param {string} name - Exact color name
     * @returns {object} Color object or null
     */
    function findByName(name) {
        if (!isLoaded) {
            throw new Error('Database not loaded. Call load() first.');
        }

        return colorsData.colors.find(color =>
            color.name.toLowerCase() === name.toLowerCase()
        ) || null;
    }

    /**
     * Find color by code
     * @param {string} code - Pantone code (e.g., "100-c")
     * @returns {object} Color object or null
     */
    function findByCode(code) {
        if (!isLoaded) {
            throw new Error('Database not loaded. Call load() first.');
        }

        return colorsData.colors.find(color =>
            color.code.toLowerCase() === code.toLowerCase()
        ) || null;
    }

    /**
     * Get database stats
     * @returns {object} Stats object
     */
    function getStats() {
        if (!isLoaded) {
            throw new Error('Database not loaded. Call load() first.');
        }

        return colorsData.stats;
    }

    /**
     * Check if database is loaded
     * @returns {boolean} True if loaded
     */
    function checkIsLoaded() {
        return isLoaded;
    }

    // Public API
    return {
        load,
        getAllColors,
        getMetadata,
        searchByName,
        findByName,
        findByCode,
        getStats,
        isLoaded: isLoaded
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PantoneDatabase;
}
