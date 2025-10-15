/**
 * Main Application Logic
 * Handles color matching and UI coordination
 */

const App = (function() {
    'use strict';

    let pantoneColors = [];
    let recentColors = [];
    const MAX_RECENT = 10;
    const MAX_RESULTS = 10;

    /**
     * Initialize the application
     */
    async function init() {
        console.log('🎨 Initializing Pantone Color Matcher...');

        try {
            // Load Pantone database
            const data = await PantoneDatabase.load();
            pantoneColors = data.colors;

            // Load recent colors from localStorage
            loadRecentColors();

            // Setup event listeners
            setupEventListeners();

            // Update UI
            updateStats();
            renderRecentColors();

            console.log('✓ Application initialized');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            showError('Failed to load Pantone database. Please refresh the page.');
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const hexInput = document.getElementById('hexInput');
        const colorPicker = document.getElementById('colorPicker');
        const matchButton = document.getElementById('matchButton');
        const clearButton = document.getElementById('clearButton');

        // Hex input events
        hexInput.addEventListener('input', handleHexInput);
        hexInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                findMatches();
            }
        });

        // Color picker events
        colorPicker.addEventListener('input', handleColorPickerChange);

        // Button events
        matchButton.addEventListener('click', findMatches);
        clearButton.addEventListener('click', clearInput);

        // Paste detection
        hexInput.addEventListener('paste', () => {
            setTimeout(findMatches, 100);
        });
    }

    /**
     * Handle hex input changes
     */
    function handleHexInput(e) {
        let value = e.target.value;

        // Auto-add # if not present
        if (value && !value.startsWith('#')) {
            value = '#' + value;
            e.target.value = value;
        }

        // Validate and update color picker
        if (ColorAlgorithms.isValidHex(value)) {
            document.getElementById('colorPicker').value = value;
            document.getElementById('hexInput').classList.remove('invalid');
        } else if (value.length > 1) {
            document.getElementById('hexInput').classList.add('invalid');
        }
    }

    /**
     * Handle color picker changes
     */
    function handleColorPickerChange(e) {
        const hex = e.target.value;
        document.getElementById('hexInput').value = hex;
        document.getElementById('hexInput').classList.remove('invalid');
    }

    /**
     * Clear input fields
     */
    function clearInput() {
        document.getElementById('hexInput').value = '';
        document.getElementById('colorPicker').value = '#000000';
        document.getElementById('resultsContainer').innerHTML = '';
        document.getElementById('hexInput').classList.remove('invalid');
        document.getElementById('hexInput').focus();
    }

    /**
     * Find closest Pantone matches
     */
    function findMatches() {
        const hexValue = document.getElementById('hexInput').value;

        // Validate hex
        if (!ColorAlgorithms.isValidHex(hexValue)) {
            showError('Please enter a valid hex color code (e.g., #FF0000)');
            return;
        }

        // Convert to LAB
        const inputLab = ColorAlgorithms.hexToLab(hexValue);
        if (!inputLab) {
            showError('Invalid color format');
            return;
        }

        // Calculate distances and sort (using CIE76 for compatibility with Adobe)
        const matches = pantoneColors.map(pantone => {
            const distance = ColorAlgorithms.deltaE76(inputLab, pantone.lab);
            return {
                ...pantone,
                deltaE: distance,
                match: ((100 - Math.min(distance, 100)) / 100) * 100
            };
        }).sort((a, b) => a.deltaE - b.deltaE).slice(0, MAX_RESULTS);

        // Save to recent colors
        addToRecent(hexValue);

        // Display results
        displayResults(hexValue, matches);
    }

    /**
     * Display matching results
     */
    function displayResults(inputHex, matches) {
        const resultsContainer = document.getElementById('resultsContainer');
        const inputRgb = ColorAlgorithms.hexToRgb(inputHex);

        let html = `
            <div class="input-color-display">
                <div class="color-swatch" style="background-color: ${inputHex}"></div>
                <div class="color-info">
                    <h3>Your Color</h3>
                    <p class="color-hex">${inputHex.toUpperCase()}</p>
                    <p class="color-rgb">RGB(${inputRgb.r}, ${inputRgb.g}, ${inputRgb.b})</p>
                </div>
            </div>

            <h2 class="results-title">Top ${matches.length} Closest Matches</h2>

            <div class="matches-grid">
        `;

        matches.forEach((match, index) => {
            const interpretation = ColorAlgorithms.getDeltaEInterpretation(match.deltaE);

            html += `
                <div class="match-card">
                    <div class="match-rank">#${index + 1}</div>
                    <div class="match-colors">
                        <div class="color-swatch" style="background-color: ${inputHex}" title="Your color"></div>
                        <div class="vs-separator">→</div>
                        <div class="color-swatch large" style="background-color: ${match.hex}" title="${match.name}"></div>
                    </div>
                    <div class="match-info">
                        <h3 class="match-name">${match.name}</h3>
                        <p class="match-code">${match.code}</p>

                        <div class="match-quality ${interpretation.class}">
                            <span class="quality-badge">${interpretation.rating}</span>
                            <span class="delta-e">ΔE = ${match.deltaE.toFixed(2)}</span>
                        </div>

                        <div class="color-values">
                            <div class="value-row">
                                <span class="label">HEX:</span>
                                <span class="value">${match.hex}
                                    <button class="copy-btn" onclick="App.copyToClipboard('${match.hex}')" title="Copy">📋</button>
                                </span>
                            </div>
                            <div class="value-row">
                                <span class="label">RGB:</span>
                                <span class="value">rgb(${match.rgb.r}, ${match.rgb.g}, ${match.rgb.b})</span>
                            </div>
                            <div class="value-row">
                                <span class="label">LAB:</span>
                                <span class="value">L=${match.lab.L.toFixed(1)}, a=${match.lab.a.toFixed(1)}, b=${match.lab.b.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        resultsContainer.innerHTML = html;
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Show error message
     */
    function showError(message) {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Add color to recent history
     */
    function addToRecent(hex) {
        // Remove if already exists
        recentColors = recentColors.filter(c => c.toLowerCase() !== hex.toLowerCase());

        // Add to beginning
        recentColors.unshift(hex);

        // Limit to MAX_RECENT
        if (recentColors.length > MAX_RECENT) {
            recentColors = recentColors.slice(0, MAX_RECENT);
        }

        // Save to localStorage
        localStorage.setItem('recentColors', JSON.stringify(recentColors));

        // Update UI
        renderRecentColors();
    }

    /**
     * Load recent colors from localStorage
     */
    function loadRecentColors() {
        try {
            const stored = localStorage.getItem('recentColors');
            if (stored) {
                recentColors = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load recent colors:', error);
            recentColors = [];
        }
    }

    /**
     * Render recent colors UI
     */
    function renderRecentColors() {
        const container = document.getElementById('recentColorsContainer');

        if (!container || recentColors.length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        let html = '<h3>Recent Colors</h3><div class="recent-colors-list">';

        recentColors.forEach(hex => {
            html += `
                <div class="recent-color-item"
                     style="background-color: ${hex}"
                     onclick="App.loadColor('${hex}')"
                     title="${hex}">
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Load a color into the input
     */
    function loadColor(hex) {
        document.getElementById('hexInput').value = hex;
        document.getElementById('colorPicker').value = hex;
        findMatches();
    }

    /**
     * Copy text to clipboard
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Show brief feedback
            showToast(`Copied ${text}`);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Update statistics display
     */
    function updateStats() {
        const statsEl = document.getElementById('stats');
        if (statsEl) {
            statsEl.textContent = `${pantoneColors.length} Pantone colors loaded`;
        }
    }

    // Public API
    return {
        init,
        findMatches,
        loadColor,
        copyToClipboard
    };
})();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}
