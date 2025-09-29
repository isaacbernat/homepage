const { marked } = require('./marked'); // Import your mock

describe('Mocked Marked Parser', () => {
  it('should handle simple markdown correctly', () => {
    const markdown = '# Title\n\n**Bold text**';
    const result = marked.parse(markdown);
    expect(result).toContain('<h1 id="title">Title</h1>');
    expect(result).toContain('<strong>Bold text</strong>');
  });

  it('should correctly handle multiple, separate lists in one string', () => {
    // Arrange: Create the markdown that breaks the greedy regex
    const markdownWithTwoLists = `
- Item A1
- Item A2

This is a paragraph separating the lists.

- Item B1
- Item B2
`;

    // Act: Parse the markdown
    const result = marked.parse(markdownWithTwoLists);

    // Assert: Verify the output is correct
    // 1. Check that there are two separate <ul> tags
    const ulMatches = result.match(/<ul>/g);
    expect(ulMatches).not.toBeNull();
    expect(ulMatches.length).toBe(2);

    // 2. Check that the paragraph is NOT inside a <ul> tag
    expect(result).not.toContain('<ul><p>This is a paragraph');

    // 3. Check for the content of both lists
    expect(result).toContain('<li>Item A1</li>');
    expect(result).toContain('<li>Item B2</li>');
  });
});
