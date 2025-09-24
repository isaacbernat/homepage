/**
 * Mock implementation of the marked library for testing
 */

const marked = {
  parse: (markdown) => {
    // Simple mock implementation that converts basic markdown to HTML
    let html = markdown;

    // Helper function to create slug from text
    const createSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    };

    // Convert headers
    html = html.replace(/^# (.+)$/gm, (match, title) => {
      const slug = createSlug(title);
      return `<h1 id="${slug}">${title}</h1>`;
    });
    html = html.replace(/^## (.+)$/gm, (match, title) => {
      const slug = createSlug(title);
      return `<h2 id="${slug}">${title}</h2>`;
    });
    html = html.replace(/^### (.+)$/gm, (match, title) => {
      const slug = createSlug(title);
      return `<h3 id="${slug}">${title}</h3>`;
    });

    // Convert bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // Convert lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert paragraphs (simple implementation)
    const lines = html.split('\n').filter((line) => line.trim());
    const processedLines = lines.map((line) => {
      if (
        line.startsWith('<h') ||
        line.startsWith('<ul') ||
        line.startsWith('<li')
      ) {
        return line;
      }
      return line.trim() ? `<p>${line}</p>` : '';
    });

    return processedLines.join('\n');
  },
};

module.exports = { marked };
