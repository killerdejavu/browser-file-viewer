// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('markdownViewerTheme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let theme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);

  // Update button text
  updateThemeButton(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Toggle syntax highlighting themes
  const lightStyle = document.getElementById('hljs-light');
  const darkStyle = document.getElementById('hljs-dark');

  if (lightStyle && darkStyle) {
    if (theme === 'dark') {
      lightStyle.disabled = true;
      darkStyle.disabled = false;
    } else {
      lightStyle.disabled = false;
      darkStyle.disabled = true;
    }
  }
}

function updateThemeButton(theme) {
  const button = document.getElementById('themeToggle');
  if (button) {
    button.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  applyTheme(newTheme);
  updateThemeButton(newTheme);
  localStorage.setItem('markdownViewerTheme', newTheme);
}

// Wait for dependencies to load
function initializeMarked() {
  if (typeof marked === 'undefined' || typeof hljs === 'undefined') {
    setTimeout(initializeMarked, 50);
    return;
  }

  // Initialize theme
  initTheme();

  // Configure marked with GitHub Flavored Markdown options
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {
          console.error('Highlight error:', err);
        }
      }
      try {
        return hljs.highlightAuto(code).value;
      } catch (err) {
        return code;
      }
    }
  });

  // Try to load file immediately if available
  if (sessionStorage.getItem('fileContent')) {
    loadFile();
  }
}

// Start initialization
initializeMarked();

// Load and render the file content
function loadFile() {
  const content = sessionStorage.getItem('fileContent');
  const fileType = sessionStorage.getItem('fileType');
  const url = sessionStorage.getItem('fileUrl');

  if (!content) {
    document.getElementById('content').innerHTML = '<p class="error">No file content found.</p>';
    return;
  }

  // Display the file path
  const filePath = decodeURIComponent(url.replace('file://', ''));
  document.getElementById('filePath').textContent = filePath;
  const fileName = filePath.split('/').pop();

  if (fileType === 'csv') {
    document.title = fileName + ' - CSV Viewer';
    loadCsv(content);
  } else if (fileType === 'json') {
    document.title = fileName + ' - JSON Viewer';
    loadJson(content);
  } else {
    document.title = fileName + ' - Markdown Viewer';
    loadMarkdown(content);
  }
}

// Load and render markdown content
function loadMarkdown(content) {
  // Render the markdown
  try {
    const html = marked.parse(content);
    document.getElementById('content').innerHTML = html;
    document.getElementById('content').style.display = 'block';

    // Add copy buttons to code blocks
    addCopyButtons();
  } catch (error) {
    console.error('Markdown parsing error:', error);
    document.getElementById('content').innerHTML = `<p class="error">Error parsing markdown: ${error.message}</p>`;
  }
}

// Load and render JSON content
function loadJson(content) {
  try {
    // Hide markdown and CSV content, show JSON container
    document.getElementById('content').style.display = 'none';
    document.getElementById('csvControls').style.display = 'none';
    document.getElementById('csvContainer').style.display = 'none';
    document.getElementById('jsonContainer').style.display = 'block';

    // Parse and pretty-print JSON
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);

    // Display with syntax highlighting
    const codeElement = document.getElementById('jsonContent');
    codeElement.textContent = formatted;

    // Apply syntax highlighting
    if (typeof hljs !== 'undefined') {
      hljs.highlightElement(codeElement);
    }

    // Add copy button for JSON
    addJsonCopyButton();
  } catch (error) {
    console.error('JSON parsing error:', error);
    document.getElementById('jsonContainer').innerHTML = `<p class="error">Error parsing JSON: ${error.message}</p>`;
  }
}

// Add copy button to JSON viewer
function addJsonCopyButton() {
  const container = document.getElementById('jsonContainer');
  const pre = container.querySelector('pre');

  if (!pre) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'code-block-wrapper';

  const button = document.createElement('button');
  button.className = 'copy-button';
  button.textContent = 'Copy';
  button.onclick = () => {
    const content = document.getElementById('jsonContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  pre.parentNode.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);
  wrapper.appendChild(button);
}

// Load and render CSV content
function loadCsv(content) {
  try {
    // Hide markdown content, show CSV table
    document.getElementById('content').style.display = 'none';
    document.getElementById('csvControls').style.display = 'block';
    document.getElementById('csvContainer').style.display = 'block';

    // Parse CSV
    const rows = parseCSV(content);

    if (rows.length === 0) {
      document.getElementById('csvContainer').innerHTML = '<p class="error">No data found in CSV file.</p>';
      return;
    }

    // Store original data for filtering
    window.csvData = rows;

    // Render the table
    renderCsvTable(rows);

    // Setup search
    document.getElementById('searchInput').addEventListener('input', filterCsvTable);
    document.getElementById('wrapText').addEventListener('change', toggleTextWrap);
  } catch (error) {
    console.error('CSV parsing error:', error);
    document.getElementById('csvContainer').innerHTML = `<p class="error">Error parsing CSV: ${error.message}</p>`;
  }
}

// Simple CSV parser (handles quotes and commas)
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  // Handle last row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Render CSV table
function renderCsvTable(rows) {
  const table = document.getElementById('csvTable');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Clear existing content
  table.innerHTML = '';

  if (rows.length === 0) return;

  // Create header
  const headerRow = document.createElement('tr');
  rows[0].forEach((cell, index) => {
    const th = document.createElement('th');
    th.textContent = cell || `Column ${index + 1}`;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Create body rows
  for (let i = 1; i < rows.length; i++) {
    const tr = document.createElement('tr');
    rows[i].forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;

      // Add copy button to each cell
      const copyBtn = document.createElement('button');
      copyBtn.className = 'cell-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        copyCellContent(cell, copyBtn);
      };
      td.appendChild(copyBtn);

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
}

// Copy cell content to clipboard
function copyCellContent(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy:', err);
    button.textContent = 'Error';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 1500);
  });
}

// Filter CSV table based on search
function filterCsvTable() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const rows = window.csvData;

  if (!searchTerm) {
    renderCsvTable(rows);
    return;
  }

  // Filter rows that match search term
  const filteredRows = [rows[0]]; // Keep header
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].some(cell => cell.toLowerCase().includes(searchTerm))) {
      filteredRows.push(rows[i]);
    }
  }

  renderCsvTable(filteredRows);
}

// Toggle text wrapping in table
function toggleTextWrap() {
  const table = document.getElementById('csvTable');
  const checked = document.getElementById('wrapText').checked;
  table.classList.toggle('nowrap', !checked);
}

// Add copy buttons to code blocks
function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach((block) => {
    const pre = block.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.onclick = () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
      });
    };

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(button);
  });
}

// Download file
document.getElementById('downloadButton').addEventListener('click', () => {
  const content = sessionStorage.getItem('fileContent');
  const fileType = sessionStorage.getItem('fileType');
  const url = sessionStorage.getItem('fileUrl');

  // Get the filename from the URL
  const urlPath = url.replace('file://', '');
  const fileName = decodeURIComponent(urlPath.split('/').pop());

  // Determine MIME type
  let mimeType = 'text/markdown';
  if (fileType === 'csv') mimeType = 'text/csv';
  else if (fileType === 'json') mimeType = 'application/json';

  // Create blob and download
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
});

// View raw file
document.getElementById('rawButton').addEventListener('click', () => {
  const content = sessionStorage.getItem('fileContent');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Listen for the file ready event
document.addEventListener('fileReady', () => {
  console.log('File ready event received');
  loadFile();
});
