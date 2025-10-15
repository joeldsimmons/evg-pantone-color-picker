/**
 * Convert 2024 Pantone data (with LAB values) to our format
 * This data includes 3,219 Pantone colors with accurate LAB values
 */

const fs = require('fs');
const path = require('path');

// LAB to RGB conversion (D65 illuminant)
function labToRgb(L, a, b) {
    // Step 1: LAB to XYZ
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    // Apply inverse transformation
    const invTransform = (t) => {
        return t > 0.206897 ? Math.pow(t, 3) : (t - 16/116) / 7.787;
    };

    x = invTransform(x);
    y = invTransform(y);
    z = invTransform(z);

    // Apply D65 white point
    x = x * 95.047;
    y = y * 100.000;
    z = z * 108.883;

    // Convert to 0-1 range
    x = x / 100;
    y = y / 100;
    z = z / 100;

    // Step 2: XYZ to linear RGB (D65)
    let r = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
    let g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
    let bVal = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;

    // Step 3: Apply gamma correction (linear RGB to sRGB)
    const toSRGB = (value) => {
        return value > 0.0031308
            ? 1.055 * Math.pow(value, 1/2.4) - 0.055
            : 12.92 * value;
    };

    r = toSRGB(r);
    g = toSRGB(g);
    bVal = toSRGB(bVal);

    // Step 4: Convert to 0-255 range and clamp
    r = Math.max(0, Math.min(255, Math.round(r * 255)));
    g = Math.max(0, Math.min(255, Math.round(g * 255)));
    bVal = Math.max(0, Math.min(255, Math.round(bVal * 255)));

    return { r, g, b: bVal };
}

console.log('\n=== Converting 2024 Pantone Data (LAB to RGB) ===\n');

// Read source JSON
const sourceFile = path.join(__dirname, '..', 'data', 'pantone-2024-temp.json');
const outputFile = path.join(__dirname, '..', 'data', 'pantone-colors.json');

const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

console.log(`Source: ${sourceData.colors.length} colors`);
console.log(`Title: ${sourceData.title}`);
console.log(`Description: ${sourceData.description}\n`);

// Convert to our format
const colors = sourceData.colors.map((item, index) => {
    // Extract LAB components
    const L = item.components[0];
    const a = item.components[1];
    const bVal = item.components[2];

    // Convert LAB to RGB
    const rgb = labToRgb(L, a, bVal);

    // Convert to hex
    const hex = '#' + [rgb.r, rgb.g, rgb.b]
        .map(c => c.toString(16).padStart(2, '0'))
        .join('');

    // Extract code number and format as pantone code
    const codeNum = item.code;
    const pantoneCode = item.name.replace('PANTONE ', '').replace(' C', '').toLowerCase() + '-c';

    if ((index + 1) % 100 === 0 || index === sourceData.colors.length - 1) {
        process.stdout.write(`\r  Progress: ${index + 1}/${sourceData.colors.length} colors`);
    }

    return {
        name: item.name,
        code: pantoneCode,
        rgb: rgb,
        hex: hex.toUpperCase(),
        lab: {
            L: Math.round(L * 100) / 100,
            a: Math.round(a * 100) / 100,
            b: Math.round(bVal * 100) / 100
        }
    };
});

console.log('\n✓ Conversion complete');

// Create output data
const outputData = {
    metadata: {
        title: sourceData.title || "PANTONE Solid Coated 2024",
        prefix: sourceData.colorNamePrefix || "PANTONE",
        suffix: sourceData.colorNamePostfix || "C",
        description: sourceData.description || "PANTONE+ Solid Coated color library 2024",
        colorModel: "Lab",
        totalColors: colors.length,
        source: "https://github.com/aj90909/unofficial-pantone-solid-coated-2024-v5"
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

// Display test colors
console.log('\n=== Test Colors (User Examples) ===');

// Find Pantone 2097 C (should match #5F3EFF)
const color2097 = colors.find(c => c.name === 'PANTONE 2097 C');
if (color2097) {
    console.log('\n1. PANTONE 2097 C (should match #5F3EFF):');
    console.log(`   HEX: ${color2097.hex}`);
    console.log(`   RGB: rgb(${color2097.rgb.r}, ${color2097.rgb.g}, ${color2097.rgb.b})`);
    console.log(`   LAB: L=${color2097.lab.L}, a=${color2097.lab.a}, b=${color2097.lab.b}`);
} else {
    console.log('\n✗ PANTONE 2097 C NOT FOUND');
}

// Find Pantone 2395 C (should match #E300FF)
const color2395 = colors.find(c => c.name === 'PANTONE 2395 C');
if (color2395) {
    console.log('\n2. PANTONE 2395 C (should match #E300FF):');
    console.log(`   HEX: ${color2395.hex}`);
    console.log(`   RGB: rgb(${color2395.rgb.r}, ${color2395.rgb.g}, ${color2395.rgb.b})`);
    console.log(`   LAB: L=${color2395.lab.L}, a=${color2395.lab.a}, b=${color2395.lab.b}`);
} else {
    console.log('\n✗ PANTONE 2395 C NOT FOUND');
}

console.log('\n=== Conversion Complete ===\n');

// Clean up temp file
fs.unlinkSync(sourceFile);
console.log('✓ Cleaned up temporary file\n');
