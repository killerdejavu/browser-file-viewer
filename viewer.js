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

    // Parse JSON
    const parsed = JSON.parse(content);

    // Store original content for copy functionality
    window.jsonOriginalContent = content;

    // Create JSON tree viewer
    const container = document.getElementById('jsonContainer');
    container.innerHTML = '';

    // Add controls
    const controls = document.createElement('div');
    controls.className = 'json-controls';
    controls.innerHTML = `
      <button id="jsonExpandAll" class="json-control-btn">Expand All</button>
      <button id="jsonCollapseAll" class="json-control-btn">Collapse All</button>
      <button id="jsonCopy" class="json-control-btn">Copy JSON</button>
    `;
    container.appendChild(controls);

    // Create tree view
    const treeWrapper = document.createElement('div');
    treeWrapper.className = 'json-tree-wrapper';
    const tree = document.createElement('div');
    tree.className = 'json-tree';
    tree.appendChild(renderJsonNode(parsed, '', true));
    treeWrapper.appendChild(tree);
    container.appendChild(treeWrapper);

    // Add event listeners for controls
    document.getElementById('jsonExpandAll').addEventListener('click', () => expandCollapseAll(true));
    document.getElementById('jsonCollapseAll').addEventListener('click', () => expandCollapseAll(false));
    document.getElementById('jsonCopy').addEventListener('click', copyJsonContent);

  } catch (error) {
    console.error('JSON parsing error:', error);
    document.getElementById('jsonContainer').innerHTML = `<p class="error">Error parsing JSON: ${error.message}</p>`;
  }
}

// Render a JSON node (recursive)
function renderJsonNode(value, key, isRoot = false, isLast = false) {
  const node = document.createElement('div');
  node.className = 'json-node';

  const type = Array.isArray(value) ? 'array' : typeof value;

  if (type === 'object' && value !== null) {
    // Object
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;

    const line = document.createElement('div');
    line.className = 'json-line';

    if (!isEmpty) {
      const toggle = document.createElement('span');
      toggle.className = 'json-toggle';
      toggle.textContent = '▼';
      toggle.onclick = (e) => {
        e.stopPropagation();
        toggleNode(node);
      };
      line.appendChild(toggle);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'json-toggle-spacer';
      line.appendChild(spacer);
    }

    if (key) {
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key';
      keySpan.textContent = `"${key}"`;
      line.appendChild(keySpan);
      line.appendChild(document.createTextNode(': '));
    }

    const brace = document.createElement('span');
    brace.className = 'json-brace json-open-brace';
    brace.textContent = isEmpty ? '{}' : '{';
    line.appendChild(brace);

    if (!isEmpty) {
      // Add collapsed preview (hidden by default, shown when collapsed)
      const preview = document.createElement('span');
      preview.className = 'json-preview';
      preview.style.display = 'none';
      preview.textContent = '...}';
      line.appendChild(preview);

      const count = document.createElement('span');
      count.className = 'json-count';
      count.textContent = ` // ${keys.length} ${keys.length === 1 ? 'key' : 'keys'}`;
      line.appendChild(count);
    }

    node.appendChild(line);

    if (!isEmpty) {
      const children = document.createElement('div');
      children.className = 'json-children';

      keys.forEach((k, index) => {
        children.appendChild(renderJsonNode(value[k], k, false, index === keys.length - 1));
      });

      node.appendChild(children);

      const closeLine = document.createElement('div');
      closeLine.className = 'json-line json-close';
      const closeSpacer = document.createElement('span');
      closeSpacer.className = 'json-toggle-spacer';
      closeLine.appendChild(closeSpacer);
      const closeBrace = document.createElement('span');
      closeBrace.className = 'json-brace';
      closeBrace.textContent = '}';
      closeLine.appendChild(closeBrace);
      node.appendChild(closeLine);
    }

  } else if (type === 'array') {
    // Array
    const isEmpty = value.length === 0;

    const line = document.createElement('div');
    line.className = 'json-line';

    if (!isEmpty) {
      const toggle = document.createElement('span');
      toggle.className = 'json-toggle';
      toggle.textContent = '▼';
      toggle.onclick = (e) => {
        e.stopPropagation();
        toggleNode(node);
      };
      line.appendChild(toggle);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'json-toggle-spacer';
      line.appendChild(spacer);
    }

    if (key) {
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key';
      keySpan.textContent = `"${key}"`;
      line.appendChild(keySpan);
      line.appendChild(document.createTextNode(': '));
    }

    const bracket = document.createElement('span');
    bracket.className = 'json-brace json-open-brace';
    bracket.textContent = isEmpty ? '[]' : '[';
    line.appendChild(bracket);

    if (!isEmpty) {
      // Add collapsed preview (hidden by default, shown when collapsed)
      const preview = document.createElement('span');
      preview.className = 'json-preview';
      preview.style.display = 'none';
      preview.textContent = '...]';
      line.appendChild(preview);

      const count = document.createElement('span');
      count.className = 'json-count';
      count.textContent = ` // ${value.length} ${value.length === 1 ? 'item' : 'items'}`;
      line.appendChild(count);
    }

    node.appendChild(line);

    if (!isEmpty) {
      const children = document.createElement('div');
      children.className = 'json-children';

      value.forEach((item, index) => {
        children.appendChild(renderJsonNode(item, '', false, index === value.length - 1));
      });

      node.appendChild(children);

      const closeLine = document.createElement('div');
      closeLine.className = 'json-line json-close';
      const closeSpacer = document.createElement('span');
      closeSpacer.className = 'json-toggle-spacer';
      closeLine.appendChild(closeSpacer);
      const closeBracket = document.createElement('span');
      closeBracket.className = 'json-brace';
      closeBracket.textContent = ']';
      closeLine.appendChild(closeBracket);
      node.appendChild(closeLine);
    }

  } else {
    // Primitive value
    const line = document.createElement('div');
    line.className = 'json-line json-primitive';

    const spacer = document.createElement('span');
    spacer.className = 'json-toggle-spacer';
    line.appendChild(spacer);

    if (key) {
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key';
      keySpan.textContent = `"${key}"`;
      line.appendChild(keySpan);
      line.appendChild(document.createTextNode(': '));
    }

    const valueSpan = document.createElement('span');
    valueSpan.className = `json-value json-${type}`;

    if (type === 'string') {
      valueSpan.textContent = `"${value}"`;
    } else if (type === 'number') {
      valueSpan.textContent = value;
    } else if (type === 'boolean') {
      valueSpan.textContent = value;
    } else if (value === null) {
      valueSpan.className = 'json-value json-null';
      valueSpan.textContent = 'null';
    }

    line.appendChild(valueSpan);
    node.appendChild(line);
  }

  return node;
}

// Toggle expand/collapse for a node
function toggleNode(node) {
  const toggle = node.querySelector('.json-toggle');
  const children = node.querySelector('.json-children');
  const closeLine = node.querySelector('.json-close');
  const openBrace = node.querySelector('.json-open-brace');
  const preview = node.querySelector('.json-preview');

  if (!toggle || !children) return;

  const isExpanded = toggle.textContent === '▼';

  if (isExpanded) {
    // Collapse
    toggle.textContent = '▶';
    children.style.display = 'none';
    if (closeLine) closeLine.style.display = 'none';
    if (openBrace) openBrace.style.display = 'none';
    if (preview) preview.style.display = 'inline';
    node.classList.add('collapsed');
  } else {
    // Expand
    toggle.textContent = '▼';
    children.style.display = 'block';
    if (closeLine) closeLine.style.display = 'block';
    if (openBrace) openBrace.style.display = 'inline';
    if (preview) preview.style.display = 'none';
    node.classList.remove('collapsed');
  }
}

// Expand or collapse all nodes
function expandCollapseAll(expand) {
  const allToggles = document.querySelectorAll('.json-toggle');

  allToggles.forEach(toggle => {
    const node = toggle.closest('.json-node');
    const children = node.querySelector('.json-children');
    const closeLine = node.querySelector('.json-close');
    const openBrace = node.querySelector('.json-open-brace');
    const preview = node.querySelector('.json-preview');

    if (!children) return;

    if (expand) {
      // Expand
      toggle.textContent = '▼';
      children.style.display = 'block';
      if (closeLine) closeLine.style.display = 'block';
      if (openBrace) openBrace.style.display = 'inline';
      if (preview) preview.style.display = 'none';
      node.classList.remove('collapsed');
    } else {
      // Collapse
      toggle.textContent = '▶';
      children.style.display = 'none';
      if (closeLine) closeLine.style.display = 'none';
      if (openBrace) openBrace.style.display = 'none';
      if (preview) preview.style.display = 'inline';
      node.classList.add('collapsed');
    }
  });
}

// Copy JSON content
function copyJsonContent() {
  const content = window.jsonOriginalContent || '';
  const button = document.getElementById('jsonCopy');

  navigator.clipboard.writeText(content).then(() => {
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy JSON';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    button.textContent = 'Error';
    setTimeout(() => {
      button.textContent = 'Copy JSON';
    }, 2000);
  });
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
