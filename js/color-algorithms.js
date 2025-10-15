/**
 * Color Algorithms Module
 * Provides color space conversions and Delta E calculations
 */

const ColorAlgorithms = (function() {
    'use strict';

    /**
     * Convert HEX to RGB
     * @param {string} hex - Hex color code (#RRGGBB or RRGGBB or #RGB)
     * @returns {object} RGB object {r, g, b} or null if invalid
     */
    function hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace(/^#/, '');

        // Expand shorthand form (#RGB to #RRGGBB)
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        // Validate hex
        if (!/^[0-9A-F]{6}$/i.test(hex)) {
            return null;
        }

        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    /**
     * Convert RGB to HEX
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {string} Hex color code
     */
    function rgbToHex(r, g, b) {
        const toHex = (value) => {
            const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    /**
     * Convert RGB to LAB (D65 illuminant)
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {object} LAB object {L, a, b}
     */
    function rgbToLab(r, g, b) {
        // Step 1: Normalize RGB to [0, 1]
        r = r / 255;
        g = g / 255;
        b = b / 255;

        // Step 2: Apply gamma correction (sRGB to linear RGB)
        const toLinear = (value) => {
            return value > 0.04045
                ? Math.pow((value + 0.055) / 1.055, 2.4)
                : value / 12.92;
        };

        r = toLinear(r);
        g = toLinear(g);
        b = toLinear(b);

        // Step 3: Convert to XYZ (D65 illuminant)
        let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

        // Step 4: Normalize by D65 white point
        x = (x * 100) / 95.047;
        y = (y * 100) / 100.000;
        z = (z * 100) / 108.883;

        // Step 5: Apply Lab transformation
        const transform = (value) => {
            return value > 0.008856
                ? Math.pow(value, 1/3)
                : (7.787 * value) + (16 / 116);
        };

        x = transform(x);
        y = transform(y);
        z = transform(z);

        // Step 6: Calculate Lab values
        const L = (116 * y) - 16;
        const a = 500 * (x - y);
        const bValue = 200 * (y - z);

        return {
            L: L,
            a: a,
            b: bValue
        };
    }

    /**
     * Convert HEX to LAB
     * @param {string} hex - Hex color code
     * @returns {object} LAB object {L, a, b} or null if invalid
     */
    function hexToLab(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return null;

        return rgbToLab(rgb.r, rgb.g, rgb.b);
    }

    /**
     * Calculate Delta E (CIE76) - Simple Euclidean distance in LAB space
     * @param {object} lab1 - LAB color {L, a, b}
     * @param {object} lab2 - LAB color {L, a, b}
     * @returns {number} Delta E value
     */
    function deltaE76(lab1, lab2) {
        const dL = lab1.L - lab2.L;
        const da = lab1.a - lab2.a;
        const db = lab1.b - lab2.b;

        return Math.sqrt(dL * dL + da * da + db * db);
    }

    /**
     * Calculate Delta E 2000 (CIEDE2000)
     * Most accurate color difference formula
     * @param {object} lab1 - LAB color {L, a, b}
     * @param {object} lab2 - LAB color {L, a, b}
     * @returns {number} Delta E 2000 value
     */
    function deltaE2000(lab1, lab2) {
        // Weights (typically 1)
        const kL = 1;
        const kC = 1;
        const kH = 1;

        // Calculate C and h
        const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
        const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);

        const Cab = (C1 + C2) / 2;

        const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));

        const a1prime = (1 + G) * lab1.a;
        const a2prime = (1 + G) * lab2.a;

        const C1prime = Math.sqrt(a1prime * a1prime + lab1.b * lab1.b);
        const C2prime = Math.sqrt(a2prime * a2prime + lab2.b * lab2.b);

        const h1prime = (Math.atan2(lab1.b, a1prime) * 180 / Math.PI + 360) % 360;
        const h2prime = (Math.atan2(lab2.b, a2prime) * 180 / Math.PI + 360) % 360;

        const deltaLprime = lab2.L - lab1.L;
        const deltaCprime = C2prime - C1prime;

        let deltahprime;
        if (C1prime * C2prime === 0) {
            deltahprime = 0;
        } else if (Math.abs(h2prime - h1prime) <= 180) {
            deltahprime = h2prime - h1prime;
        } else if (h2prime - h1prime > 180) {
            deltahprime = h2prime - h1prime - 360;
        } else {
            deltahprime = h2prime - h1prime + 360;
        }

        const deltaHprime = 2 * Math.sqrt(C1prime * C2prime) * Math.sin(deltahprime * Math.PI / 360);

        const Lbarprime = (lab1.L + lab2.L) / 2;
        const Cbarprime = (C1prime + C2prime) / 2;

        let Hbarprime;
        if (C1prime * C2prime === 0) {
            Hbarprime = h1prime + h2prime;
        } else if (Math.abs(h1prime - h2prime) <= 180) {
            Hbarprime = (h1prime + h2prime) / 2;
        } else if (h1prime + h2prime < 360) {
            Hbarprime = (h1prime + h2prime + 360) / 2;
        } else {
            Hbarprime = (h1prime + h2prime - 360) / 2;
        }

        const T = 1
            - 0.17 * Math.cos((Hbarprime - 30) * Math.PI / 180)
            + 0.24 * Math.cos(2 * Hbarprime * Math.PI / 180)
            + 0.32 * Math.cos((3 * Hbarprime + 6) * Math.PI / 180)
            - 0.20 * Math.cos((4 * Hbarprime - 63) * Math.PI / 180);

        const SL = 1 + (0.015 * Math.pow(Lbarprime - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarprime - 50, 2));
        const SC = 1 + 0.045 * Cbarprime;
        const SH = 1 + 0.015 * Cbarprime * T;

        const deltaTheta = 30 * Math.exp(-Math.pow((Hbarprime - 275) / 25, 2));
        const RC = 2 * Math.sqrt(Math.pow(Cbarprime, 7) / (Math.pow(Cbarprime, 7) + Math.pow(25, 7)));
        const RT = -RC * Math.sin(2 * deltaTheta * Math.PI / 180);

        const deltaE = Math.sqrt(
            Math.pow(deltaLprime / (kL * SL), 2) +
            Math.pow(deltaCprime / (kC * SC), 2) +
            Math.pow(deltaHprime / (kH * SH), 2) +
            RT * (deltaCprime / (kC * SC)) * (deltaHprime / (kH * SH))
        );

        return deltaE;
    }

    /**
     * Get interpretation of Delta E value
     * @param {number} deltaE - Delta E value
     * @returns {object} {rating, description}
     */
    function getDeltaEInterpretation(deltaE) {
        if (deltaE < 1.0) {
            return { rating: 'Perfect', description: 'Not perceptible by human eyes', class: 'perfect' };
        } else if (deltaE < 2.0) {
            return { rating: 'Excellent', description: 'Perceptible through close observation', class: 'excellent' };
        } else if (deltaE < 10.0) {
            return { rating: 'Good', description: 'Perceptible at a glance', class: 'good' };
        } else if (deltaE < 50.0) {
            return { rating: 'Fair', description: 'Colors are more similar than opposite', class: 'fair' };
        } else {
            return { rating: 'Poor', description: 'Colors are significantly different', class: 'poor' };
        }
    }

    /**
     * Convert RGB to HSL
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {object} HSL object {h, s, l}
     */
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        let h, s;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * Validate hex color format
     * @param {string} hex - Hex color code
     * @returns {boolean} True if valid
     */
    function isValidHex(hex) {
        hex = hex.replace(/^#/, '');
        return /^[0-9A-F]{3}$|^[0-9A-F]{6}$/i.test(hex);
    }

    // Public API
    return {
        hexToRgb,
        rgbToHex,
        rgbToLab,
        hexToLab,
        deltaE76,
        deltaE2000,
        getDeltaEInterpretation,
        rgbToHsl,
        isValidHex
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorAlgorithms;
}
