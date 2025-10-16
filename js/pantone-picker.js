/**
 * Pantone Color Picker Component
 * Modal-based color picker with virtual scrolling for 3,219 colors
 */

console.log('🔄 Loading pantone-picker.js...');

window.PantonePicker = (function() {
    'use strict';

    console.log('🔄 Initializing PantonePicker module...');

    let allColors = [];
    let filteredColors = [];
    let selectedColor = null;
    let isOpen = false;

    // Virtual scrolling state
    const ITEMS_PER_ROW = 8;
    const ITEM_SIZE = 80; // px per swatch (including gap)
    const VISIBLE_ROWS = 6;
    const BUFFER_ROWS = 2;
    let scrollTop = 0;

    // DOM elements
    let modal, searchInput, colorGrid, selectedDisplay, colorCount;

    /**
     * Initialize the picker
     */
    function init(colors) {
        allColors = colors;
        filteredColors = colors;
        createModal();
        setupEventListeners();
        console.log('✓ Pantone Picker initialized with', allColors.length, 'colors');
    }

    /**
     * Create modal structure
     */
    function createModal() {
        const modalHTML = `
            <div id="pantonePickerModal" class="picker-modal" style="display: none;">
                <div class="picker-overlay"></div>
                <div class="picker-container">
                    <div class="picker-header">
                        <h2>🎨 Select Pantone Color</h2>
                        <button class="picker-close" aria-label="Close">&times;</button>
                    </div>

                    <div class="picker-search-bar">
                        <input
                            type="text"
                            id="pantoneSearch"
                            class="picker-search-input"
                            placeholder="Search by color name or code..."
                            autocomplete="off"
                        />
                        <span class="picker-color-count" id="pickerColorCount">3,219 colors</span>
                    </div>

                    <div class="picker-body">
                        <div class="picker-grid-container" id="pickerGridContainer">
                            <div class="picker-grid" id="pickerGrid"></div>
                        </div>
                    </div>

                    <div class="picker-footer" id="pickerFooter" style="display: none;">
                        <div class="picker-selected-preview">
                            <div class="selected-swatch" id="selectedSwatch"></div>
                            <div class="selected-info">
                                <h3 id="selectedName">PANTONE 185 C</h3>
                                <div class="selected-values">
                                    <span id="selectedHex">#FFFFFF</span>
                                    <span id="selectedRgb">RGB(255, 255, 255)</span>
                                </div>
                            </div>
                        </div>
                        <div class="picker-actions">
                            <button class="btn-copy" id="btnCopyHex">Copy HEX</button>
                            <button class="btn-select" id="btnSelectColor">Use This Color</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Cache DOM elements
        modal = document.getElementById('pantonePickerModal');
        searchInput = document.getElementById('pantoneSearch');
        colorGrid = document.getElementById('pickerGrid');
        selectedDisplay = document.getElementById('pickerFooter');
        colorCount = document.getElementById('pickerColorCount');
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Close button
        modal.querySelector('.picker-close').addEventListener('click', close);

        // Overlay click to close
        modal.querySelector('.picker-overlay').addEventListener('click', close);

        // Search input
        searchInput.addEventListener('input', handleSearch);

        // Virtual scroll
        const gridContainer = document.getElementById('pickerGridContainer');
        gridContainer.addEventListener('scroll', handleScroll);

        // Color selection
        colorGrid.addEventListener('click', handleColorClick);

        // Action buttons
        document.getElementById('btnCopyHex').addEventListener('click', copyHex);
        document.getElementById('btnSelectColor').addEventListener('click', selectColor);

        // Keyboard navigation
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Open picker modal
     */
    function open() {
        console.log('📂 Opening modal...', { modal: !!modal, colors: allColors.length });
        if (!modal) {
            console.error('❌ Modal element not found!');
            return;
        }
        isOpen = true;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        searchInput.value = '';
        filteredColors = allColors;
        updateColorCount();
        renderGrid();
        searchInput.focus();
        console.log('✓ Modal opened successfully');
    }

    /**
     * Close picker modal
     */
    function close() {
        isOpen = false;
        modal.style.display = 'none';
        document.body.style.overflow = '';
        selectedColor = null;
        selectedDisplay.style.display = 'none';
    }

    /**
     * Handle search input
     */
    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            filteredColors = allColors;
        } else {
            filteredColors = allColors.filter(color => {
                return color.name.toLowerCase().includes(query) ||
                       color.code.toLowerCase().includes(query) ||
                       color.hex.toLowerCase().includes(query);
            });
        }

        updateColorCount();
        renderGrid();
    }

    /**
     * Update color count display
     */
    function updateColorCount() {
        const count = filteredColors.length;
        colorCount.textContent = `${count.toLocaleString()} color${count !== 1 ? 's' : ''}`;
    }

    /**
     * Render color grid with virtual scrolling
     */
    function renderGrid() {
        const gridContainer = document.getElementById('pickerGridContainer');
        const totalColors = filteredColors.length;
        const totalRows = Math.ceil(totalColors / ITEMS_PER_ROW);
        const totalHeight = totalRows * ITEM_SIZE;

        // Set container height for scrollbar
        colorGrid.style.height = totalHeight + 'px';

        // Calculate visible range
        const scrollTop = gridContainer.scrollTop;
        const startRow = Math.max(0, Math.floor(scrollTop / ITEM_SIZE) - BUFFER_ROWS);
        const endRow = Math.min(totalRows, Math.ceil((scrollTop + gridContainer.clientHeight) / ITEM_SIZE) + BUFFER_ROWS);

        const startIndex = startRow * ITEMS_PER_ROW;
        const endIndex = Math.min(totalColors, endRow * ITEMS_PER_ROW);

        // Render visible swatches
        let html = '';
        for (let i = startIndex; i < endIndex; i++) {
            const color = filteredColors[i];
            const row = Math.floor(i / ITEMS_PER_ROW);
            const col = i % ITEMS_PER_ROW;
            const top = row * ITEM_SIZE;
            const left = col * ITEM_SIZE;

            // Determine text color based on brightness
            const brightness = (color.rgb.r * 299 + color.rgb.g * 587 + color.rgb.b * 114) / 1000;
            const textColor = brightness > 128 ? '#000' : '#fff';

            html += `
                <div class="picker-swatch"
                     style="position: absolute; top: ${top}px; left: ${left}px; background-color: ${color.hex}; color: ${textColor};"
                     data-index="${i}"
                     title="${color.name}">
                    <span class="swatch-code">${color.code.replace('-c', '')}</span>
                </div>
            `;
        }

        colorGrid.innerHTML = html;
    }

    /**
     * Handle scroll for virtual rendering
     */
    function handleScroll() {
        requestAnimationFrame(renderGrid);
    }

    /**
     * Handle color swatch click
     */
    function handleColorClick(e) {
        const swatch = e.target.closest('.picker-swatch');
        if (!swatch) return;

        const index = parseInt(swatch.dataset.index);
        selectedColor = filteredColors[index];

        // Remove previous selection
        colorGrid.querySelectorAll('.picker-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');

        // Update selected display
        updateSelectedDisplay();
    }

    /**
     * Update selected color display
     */
    function updateSelectedDisplay() {
        if (!selectedColor) return;

        selectedDisplay.style.display = 'flex';

        document.getElementById('selectedSwatch').style.backgroundColor = selectedColor.hex;
        document.getElementById('selectedName').textContent = selectedColor.name;
        document.getElementById('selectedHex').textContent = selectedColor.hex;
        document.getElementById('selectedRgb').textContent =
            `RGB(${selectedColor.rgb.r}, ${selectedColor.rgb.g}, ${selectedColor.rgb.b})`;
    }

    /**
     * Copy hex to clipboard
     */
    async function copyHex() {
        if (!selectedColor) return;

        try {
            await navigator.clipboard.writeText(selectedColor.hex);
            showToast('Copied ' + selectedColor.hex);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    /**
     * Select color and close modal
     */
    function selectColor() {
        if (!selectedColor) return;

        // Update main app with selected color
        if (window.App && window.App.loadColor) {
            close();
            App.loadColor(selectedColor.hex);
        }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyDown(e) {
        if (!isOpen) return;

        if (e.key === 'Escape') {
            close();
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

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Public API
    return {
        init,
        open,
        close
    };
})();

console.log('✓ PantonePicker module loaded successfully', typeof window.PantonePicker);
