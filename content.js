// Wait for the document to be ready
function initViewer() {
  const url = window.location.href;

  // Check if this is a markdown or CSV file by URL
  const isMarkdown = url.match(/\.(md|markdown)$/i);
  const isCsv = url.match(/\.csv$/i);

  if (!isMarkdown && !isCsv) {
    return;
  }

  // CRITICAL: Check content-type first to avoid intercepting HTML pages
  // This prevents intercepting auth/login pages that have .csv/.md in the URL
  const contentType = document.contentType || '';

  // Only proceed if content-type is NOT HTML
  // HTML pages (like auth/login) should be left alone
  if (contentType === 'text/html' || contentType.startsWith('application/xhtml')) {
    return;
  }

  // Only intercept if content-type is text/plain, text/csv, or text/markdown
  const validContentTypes = ['text/plain', 'text/csv', 'text/markdown', ''];
  const isValidContentType = validContentTypes.some(type => contentType === type || contentType.startsWith(type));

  if (!isValidContentType) {
    return;
  }

  // Wait for body to be available
  if (!document.body) {
    setTimeout(initViewer, 10);
    return;
  }

  // Get the file content from the page
  // For web URLs, the content might be in a <pre> tag or directly in body
  let fileContent;
  const preTag = document.querySelector('pre');

  if (preTag) {
    // If there's a pre tag (common for plain text responses), get its content
    fileContent = preTag.textContent;
  } else {
    // Otherwise get all body text
    fileContent = document.body.textContent;
  }

  // CRITICAL: Validate that the content is NOT HTML
  // This catches auth/login pages even if they have the wrong content-type
  const contentTrimmed = fileContent.trim();
  const looksLikeHtml = contentTrimmed.toLowerCase().startsWith('<!doctype') ||
                        contentTrimmed.toLowerCase().startsWith('<html') ||
                        contentTrimmed.includes('<head>') ||
                        contentTrimmed.includes('<body>') ||
                        contentTrimmed.includes('<script>') ||
                        contentTrimmed.includes('<form');

  if (looksLikeHtml) {
    // This is HTML (likely auth/login page)
    // Render it properly instead of showing as text
    document.open();
    document.write(fileContent);
    document.close();
    return;
  }

  // Create our viewer interface
  document.documentElement.innerHTML = '';

  const viewerUrl = chrome.runtime.getURL('viewer.html');

  fetch(viewerUrl)
    .then(response => response.text())
    .then(html => {
      // Replace relative URLs with extension URLs
      const stylesUrl = chrome.runtime.getURL('styles.css');
      const scriptUrl = chrome.runtime.getURL('viewer.js');

      html = html.replace('href="styles.css"', `href="${stylesUrl}"`);
      html = html.replace('src="viewer.js"', `src="${scriptUrl}"`);

      // Store the file content, type, and original URL BEFORE writing HTML
      sessionStorage.setItem('fileContent', fileContent);
      sessionStorage.setItem('fileType', isCsv ? 'csv' : 'markdown');
      sessionStorage.setItem('fileUrl', url);

      document.open();
      document.write(html);
      document.close();

      // Wait a bit for scripts to load, then trigger the event
      setTimeout(() => {
        const event = new CustomEvent('fileReady');
        document.dispatchEvent(event);
      }, 100);
    })
    .catch(error => {
      console.error('Error loading file viewer:', error);
      document.body.innerHTML = `<p style="color: red; padding: 20px;">Error loading file viewer: ${error.message}</p>`;
    });
}

// Start the initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewer);
} else {
  initViewer();
}
