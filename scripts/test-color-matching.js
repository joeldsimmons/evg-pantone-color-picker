/**
 * Test color matching with user's examples
 */

const ColorAlgorithms = require('../js/color-algorithms.js');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'pantone-colors.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('\n=== Testing Color Matching ===\n');
console.log(`Database: ${data.colors.length} Pantone colors loaded\n`);

// Test case 1: #5F3EFF should match PANTONE 2097 C
console.log('Test 1: #5F3EFF (violet/purple)');
console.log('Expected: PANTONE 2097 C\n');

const test1Hex = '#5F3EFF';
const test1Lab = ColorAlgorithms.hexToLab(test1Hex);

const test1Matches = data.colors.map(pantone => {
    const distance = ColorAlgorithms.deltaE76(test1Lab, pantone.lab);
    return {
        ...pantone,
        deltaE: distance
    };
}).sort((a, b) => a.deltaE - b.deltaE).slice(0, 5);

console.log('Top 5 Matches:');
test1Matches.forEach((match, i) => {
    const interpretation = ColorAlgorithms.getDeltaEInterpretation(match.deltaE);
    console.log(`${i + 1}. ${match.name}`);
    console.log(`   HEX: ${match.hex} | ΔE: ${match.deltaE.toFixed(2)} (${interpretation.rating})`);
});

// Test case 2: #E300FF should match PANTONE 2395 C
console.log('\n\nTest 2: #E300FF (magenta/pink)');
console.log('Expected: PANTONE 2395 C\n');

const test2Hex = '#E300FF';
const test2Lab = ColorAlgorithms.hexToLab(test2Hex);

const test2Matches = data.colors.map(pantone => {
    const distance = ColorAlgorithms.deltaE76(test2Lab, pantone.lab);
    return {
        ...pantone,
        deltaE: distance
    };
}).sort((a, b) => a.deltaE - b.deltaE).slice(0, 5);

console.log('Top 5 Matches:');
test2Matches.forEach((match, i) => {
    const interpretation = ColorAlgorithms.getDeltaEInterpretation(match.deltaE);
    console.log(`${i + 1}. ${match.name}`);
    console.log(`   HEX: ${match.hex} | ΔE: ${match.deltaE.toFixed(2)} (${interpretation.rating})`);
});

console.log('\n=== Test Complete ===\n');

// Summary
const test1Match = test1Matches[0].name === 'PANTONE 2097 C';
const test2Match = test2Matches[0].name === 'PANTONE 2395 C';

console.log('Summary:');
console.log(`✓ Test 1: ${test1Match ? 'PASSED' : 'FAILED'} - ${test1Matches[0].name}`);
console.log(`✓ Test 2: ${test2Match ? 'PASSED' : 'FAILED'} - ${test2Matches[0].name}`);

if (test1Match && test2Match) {
    console.log('\n🎉 All tests passed! Color matching is accurate.\n');
} else {
    console.log('\n⚠️  Some tests failed. Review the matches above.\n');
}
