# Outlet ORM MCP Server - Contribution Guide

Thank you for your interest in contributing to the Outlet ORM MCP Server!

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. A clear description of the problem
2. Steps to reproduce
3. Expected behavior vs observed behavior
4. Your environment (OS, Node.js version, database)
5. Relevant error logs

### Proposing Features

To propose a new feature:

1. Check that it doesn't already exist in the issues
2. Open an issue describing:
   - The use case
   - The desired behavior
   - Usage examples
   - Why it's useful

### Submitting Pull Requests

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Use descriptive variable names
- Comment complex code
- Follow modern JavaScript conventions (ES6+)
- Ensure code works with Node.js >= 18

### Testing Your Changes

Before submitting:

1. Test with the MCP inspector:

   ```bash
   npx @modelcontextprotocol/inspector node index.js
   ```

2. Test with Claude Desktop
3. Verify that all tools work
4. Test with different databases if possible

### Documentation

If you add a feature:

- Update README.md
- Add examples in EXAMPLES.js
- Update CHANGELOG.md

## Code of Conduct

- Be respectful and professional
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

## Questions?

Don't hesitate to open an issue to ask questions!

Thank you for your contribution! 🙏
