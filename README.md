# Browser File Viewer - Chrome Extension

A Chrome extension that renders markdown, CSV, and JSON files beautifully in your browser with GitHub-flavored styling.

## Features

### Markdown Viewer
- GitHub-flavored markdown support
- Syntax highlighting for code blocks (JavaScript, Python, Java, C++, Go, Rust, Bash, SQL, JSON, YAML, XML, and more)
- Copy buttons for code blocks
- Clean, readable styling matching GitHub's markdown style

### CSV Viewer
- Beautiful table rendering with sortable columns
- **Search functionality** to filter rows
- **Text wrap toggle** for better readability
- Sticky headers for easy navigation
- Alternating row colors for readability
- Hover effects on rows

### JSON Viewer
- Pretty-printed JSON with proper indentation
- **Syntax highlighting** for keys, values, and data types
- **Copy button** to copy the entire JSON
- Support for nested objects and arrays
- **Works with API endpoints** - automatically detects JSON responses even without `.json` in URL
- Error handling for malformed JSON

### General Features
- **Dark mode support** with OS-level default and manual toggle
- **Beautiful typography** using Google Fonts (Roboto for text, JetBrains Mono for code)
- View raw file option
- Works with both local files and web URLs (http/https)
- Left-aligned content for natural reading

## Installation

### For Users

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable "Developer mode" by toggling the switch in the top-right corner

3. Click "Load unpacked"

4. Select the folder containing this extension

5. The extension is now installed!

### For Developers

1. **Clone the repository**:
   ```bash
   git clone https://github.com/killerdejavu/browser-file-viewer.git
   cd browser-file-viewer
   ```

2. **No build step required!**
   - This is a pure client-side Chrome extension
   - No TypeScript compilation, no bundlers, no minification
   - Dependencies (marked.js, highlight.js) are loaded from CDN
   - You can load the source files directly in Chrome

3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the cloned repository folder

4. **Make changes**:
   - Edit the source files (`viewer.js`, `styles.css`, `content.js`, etc.)
   - Click the refresh icon on the extension card in `chrome://extensions/` to reload changes
   - Refresh any open `.md`, `.csv`, or `.json` files to see updates

## Usage

1. **Enable file access**: After installation, make sure to enable "Allow access to file URLs" for this extension:
   - Go to `chrome://extensions/`
   - Find "Browser File Viewer" extension
   - Click "Details"
   - Scroll down and enable "Allow access to file URLs"
   - You may be prompted to grant additional permissions for download interception

2. **Open files**:
   - **Local files**: Drag and drop `.md`, `.csv`, or `.json` files into Chrome, or use `File > Open File` (Cmd+O on Mac, Ctrl+O on Windows)
   - **Web URLs**: Simply navigate to any URL ending in `.md`, `.markdown`, `.csv`, or `.json`
   - **API endpoints**: The extension automatically detects and formats JSON responses from APIs (even without `.json` in the URL)

3. **View options**:
   - Click "Dark Mode" / "Light Mode" to switch between themes
   - Click "View Raw" to see the original file source
   - Click "Download" to download the file
   - **For Markdown**: Code blocks have copy buttons for easy copying
   - **For CSV**: Use the search box to filter rows, toggle text wrapping
   - **For JSON**: Copy button to copy the entire formatted JSON
   - Theme preference is saved and persists across sessions

## Examples

### Test Markdown File

```bash
echo "# Hello World

This is a **test** markdown file.

\`\`\`javascript
console.log('Hello from code block!');
\`\`\`
" > test.md
```

Then open `test.md` in Chrome!

### Test CSV File

```bash
echo "Name,Email,Age,City
John Doe,john@example.com,30,New York
Jane Smith,jane@example.com,25,Los Angeles
Bob Johnson,bob@example.com,35,Chicago" > test.csv
```

Then open `test.csv` in Chrome!

### Test JSON File

```bash
echo '{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "hobbies": ["reading", "coding", "hiking"]
}' > test.json
```

Then open `test.json` in Chrome!

## Troubleshooting

- **File not rendering**: Make sure you've enabled "Allow access to file URLs" in the extension settings
- **Styles not loading**: Check that all files are in the same directory
- **Code highlighting not working**: The extension uses CDN resources, so you need an internet connection

## File Structure

```
browser-file-viewer/
├── manifest.json      # Extension configuration
├── content.js         # Content script that intercepts .md, .csv, and .json files
├── viewer.html        # File viewer page template
├── viewer.js          # Markdown, CSV, and JSON rendering logic
├── styles.css         # Styling for all file viewers
├── background.js      # Service worker for declarative net requests
├── rules.json         # Rules for CSV header handling
└── README.md          # This file
```

## Supported File Types

- **Markdown**: `.md`, `.markdown`
- **CSV**: `.csv`
- **JSON**: `.json`

## Development

### Prerequisites

- Google Chrome or Chromium-based browser (Edge, Brave, etc.)
- Basic knowledge of HTML, CSS, and JavaScript

### How It Works

1. **content.js**: Intercepts page loads for `.md`, `.markdown`, and `.csv` files
2. **viewer.html**: Template page that displays the rendered content
3. **viewer.js**: Core logic for parsing and rendering markdown (using marked.js) and CSV files
4. **styles.css**: Styling for both light and dark modes
5. **background.js**: Service worker for handling declarative net request rules
6. **rules.json**: Rules for CSV header handling

### Customization

You can easily customize the appearance and behavior:

- **Styling**: Edit `styles.css` to change colors, fonts, spacing, etc.
- **Markdown rendering**: Modify `viewer.js` to adjust marked.js options or add custom renderers
- **JSON formatting**: Adjust indentation levels or add collapsible sections in `viewer.js`
- **Supported formats**: Add new file extensions in `manifest.json` under `content_scripts.matches`

## Contributing

Contributions are welcome! Feel free to:

- Report bugs or suggest features via GitHub Issues
- Submit pull requests with improvements
- Fork the project for your own customizations

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [marked.js](https://marked.js.org/) for markdown parsing
- [highlight.js](https://highlightjs.org/) for syntax highlighting
- GitHub for markdown styling inspiration
