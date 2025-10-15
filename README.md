# Hex to Pantone Converter

A professional web application for converting hex colors to their nearest Pantone Solid Coated matches using CIE76 (Delta E 1976) color difference in LAB space.

## Features

- **Color Matching**: Uses CIE76 (Delta E 1976) algorithm for LAB color space matching
- **3,219 Pantone Colors**: Comprehensive Pantone Solid Coated 2024 color library with LAB values
- **LAB Color Space**: Conversions performed in LAB color space for consistent color comparison
- **Recent Colors History**: Automatically saves your recent color searches
- **Copy to Clipboard**: Quick copy buttons for hex values
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Offline Capable**: Works without internet connection after initial load

## Color Matching Quality

Results are rated based on Delta E values:

- **Perfect** (ΔE < 1.0): Not perceptible by human eyes
- **Excellent** (ΔE < 2.0): Perceptible through close observation
- **Good** (ΔE < 10.0): Perceptible at a glance
- **Fair** (ΔE < 50.0): Colors are more similar than opposite
- **Poor** (ΔE ≥ 50.0): Colors are significantly different

## Project Structure

```
evg-pantone-color-picker/
├── index.html                 # Main application file
├── css/
│   └── styles.css             # All styles
├── js/
│   ├── color-algorithms.js    # Color conversion & Delta E calculations
│   ├── pantone-database.js    # Database management
│   └── app.js                 # Main application logic
├── data/
│   └── pantone-colors.json    # 1,341 Pantone colors with RGB/LAB values
├── scripts/
│   ├── convert-pantone-json.js # Convert Pantone data to app format
│   └── [other parser scripts]  # ACB file parsing experiments
└── README.md
```

## Getting Started

### Option 1: Direct File Access

Simply open `index.html` in a modern web browser. The application will load the Pantone database from the `data/` folder.

### Option 2: Local Web Server (Recommended)

For best results, serve the application through a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## Usage

1. **Enter a Hex Color**: Type a hex color code (e.g., `#FF5733`, `#F00`, or `FF5733`)
2. **Or Pick a Color**: Use the color picker to visually select a color
3. **Find Matches**: Click "Find Pantone Matches" or press Enter
4. **View Results**: See the top 10 closest Pantone matches with:
   - Side-by-side color comparison
   - Delta E distance value
   - Match quality rating
   - RGB, HEX, and LAB values
   - Copy buttons for quick use

## Technical Details

### Color Algorithms

#### RGB to LAB Conversion
- Uses D65 illuminant (daylight, 6500K)
- Gamma correction for sRGB color space
- XYZ intermediate color space
- Perceptually uniform LAB color space

#### Delta E 2000 (CIEDE2000)
- Most advanced color difference formula
- Accounts for perceptual non-uniformities in LAB space
- Includes weighting factors for:
  - Lightness (kL)
  - Chroma (kC)
  - Hue (kH)
- Rotation term for improved blue region accuracy

### Data Source

Pantone color data (3,219 colors with LAB values) sourced from [aj90909/unofficial-pantone-solid-coated-2024-v5](https://github.com/aj90909/unofficial-pantone-solid-coated-2024-v5).

**Important Color Matching Notes**:
- This application uses **CIE76 (Delta E 1976)** algorithm in LAB color space for color matching
- LAB values are from 2024 Pantone data (unofficial source with ACB-derived values)
- RGB conversions use D65 illuminant and sRGB color space
- **Results may differ from Adobe Illustrator** due to:
  - Different LAB values (Adobe uses proprietary Pantone data)
  - Different color space conversions (Adobe RGB vs sRGB)
  - Display calibration differences
  - Adobe may use proprietary matching algorithms
- This tool provides **mathematical color distance** - not a guarantee of perfect Adobe Illustrator match
- Always verify with physical Pantone swatches for production work

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Development

### Adding More Colors

To add additional Pantone colors:

1. Update `data/pantone-colors.json` with new color entries
2. Each color must include:
   ```json
   {
     "name": "PANTONE XXX C",
     "code": "xxx-c",
     "rgb": { "r": 255, "g": 0, "b": 0 },
     "hex": "#FF0000",
     "lab": { "L": 53.24, "a": 80.09, "b": 67.20 }
   }
   ```

### Customizing Match Count

Edit `MAX_RESULTS` in `js/app.js` to change the number of matches displayed (default: 10).

### Parsing ACB Files

The `scripts/` folder contains experimental ACB file parsers if you want to extract colors from Adobe Color Book (.acb) files. Note: The ACB format is complex and proprietary.

## Performance

- **Initial Load**: ~330KB JSON database
- **Color Matching**: < 100ms for 1,341 colors
- **Memory Usage**: ~2MB total

## Limitations

- Colors are in RGB color space, which has a smaller gamut than some Pantone colors
- Display calibration affects color accuracy
- Pantone spot colors may use special inks not reproducible in RGB
- Always verify with physical Pantone swatch books for production

## License

MIT License - Feel free to use for personal or commercial projects.

## Disclaimer

This is an unofficial tool for internal professional use. Pantone® is a registered trademark of Pantone LLC. This tool is not affiliated with or endorsed by Pantone. For official Pantone color matching, use Pantone's licensed tools and physical swatch books.

## Credits

- **Color Algorithm**: CIE Delta E 2000 (CIEDE2000)
- **Pantone Data**: [brettapeters/pantones](https://github.com/brettapeters/pantones)
- **Built with**: Vanilla JavaScript (no frameworks)

## Support

For bugs, feature requests, or questions, please open an issue on the GitHub repository.

---

**Built with ❤️ for designers and developers who need accurate Pantone color matching.**
