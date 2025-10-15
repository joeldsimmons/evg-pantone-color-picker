/**
 * Convert Pantone JSON to our format with RGB and LAB values
 */

const fs = require('fs');
const path = require('path');

// RGB to LAB conversion (D65 illuminant)
function rgbToLab(r, g, b) {
    // Normalize to [0, 1]
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Gamma correction (sRGB to linear RGB)
    const toLinear = (value) => {
        return value > 0.04045
            ? Math.pow((value + 0.055) / 1.055, 2.4)
            : value / 12.92;
    };

    r = toLinear(r);
    g = toLinear(g);
    b = toLinear(b);

    // Convert to XYZ (D65 illuminant)
    let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

    // Normalize by D65 white point
    x = (x * 100) / 95.047;
    y = (y * 100) / 100.000;
    z = (z * 100) / 108.883;

    // Apply Lab transformation
    const transform = (value) => {
        return value > 0.008856
            ? Math.pow(value, 1/3)
            : (7.787 * value) + (16 / 116);
    };

    x = transform(x);
    y = transform(y);
    z = transform(z);

    // Calculate Lab values
    const L = (116 * y) - 16;
    const a = 500 * (x - y);
    const bValue = 200 * (y - z);

    return {
        L: Math.round(L * 100) / 100,
        a: Math.round(a * 100) / 100,
        b: Math.round(bValue * 100) / 100
    };
}

// Hex to RGB
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

console.log('\n=== Converting Pantone JSON ===\n');

// Read source JSON
const sourceFile = path.join(__dirname, '..', 'data', 'pantone-colors-temp.json');
const outputFile = path.join(__dirname, '..', 'data', 'pantone-colors.json');

const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

// Convert to array and add RGB/LAB
const colors = Object.values(sourceData).map((item, index) => {
    const rgb = hexToRgb(item.hex);
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

    // Format name as "PANTONE XXX C"
    const name = `PANTONE ${item.pantone.toUpperCase().replace('-C', ' C')}`;

    if ((index + 1) % 100 === 0 || index === Object.values(sourceData).length - 1) {
        process.stdout.write(`\r  Progress: ${index + 1}/${Object.values(sourceData).length} colors`);
    }

    return {
        name: name,
        code: item.pantone,
        rgb: rgb,
        hex: item.hex.toUpperCase(),
        lab: lab
    };
});

console.log('\n✓ Conversion complete');

// Create output data
const outputData = {
    metadata: {
        title: "PANTONE Solid Coated",
        prefix: "PANTONE",
        suffix: "C",
        description: "Pantone Solid Coated color library",
        colorModel: "RGB",
        totalColors: colors.length,
        source: "https://github.com/brettapeters/pantones"
    },
    colors: colors,
    generated: new Date().toISOString(),
    stats: {
        totalColors: colors.length,
        uniqueNames: new Set(colors.map(c => c.name)).size,
        uniqueCodes: new Set(colors.map(c => c.code)).size
    }
};

fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

console.log(`\n✓ Exported to: ${outputFile}`);
console.log(`  Total colors: ${colors.length}`);
console.log(`  File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);

// Display samples
console.log('\n=== Sample Colors ===');
colors.slice(0, 10).forEach((color, i) => {
    console.log(`${i + 1}. ${color.name}`);
    console.log(`   HEX: ${color.hex}`);
    console.log(`   RGB: rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`);
    console.log(`   LAB: L=${color.lab.L}, a=${color.lab.a}, b=${color.lab.b}`);
});

console.log('\n=== Conversion Complete ===\n');

// Clean up temp file
fs.unlinkSync(sourceFile);
console.log('✓ Cleaned up temporary file\n');
