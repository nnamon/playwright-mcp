# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Compile
- `npm run build` - Compile TypeScript to JavaScript (outputs to `lib/` directory)
- `npm run watch` - Watch mode compilation for development
- `npm run clean` - Remove compiled output

### Testing
- `npm test` - Run all Playwright tests across all browsers
- `npm run ctest` - Run tests on Chrome only
- `npm run ftest` - Run tests on Firefox only  
- `npm run wtest` - Run tests on WebKit only

### Code Quality
- `npm run lint` - Run ESLint and TypeScript type checking (also updates README)
- `npm run update-readme` - Update README.md with generated tool documentation

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright. The architecture follows a modular tool-based system:

### Core Components

**Connection Layer** (`src/connection.ts`, `src/server.ts`)
- `Connection` class manages individual MCP client connections
- `Server` class handles multiple connections and lifecycle management
- Tool routing and request handling through MCP SDK

**Browser Management** (`src/browserContextFactory.ts`, `src/context.ts`)
- `BrowserContextFactory` creates and manages browser instances
- `Context` class manages browser state, tabs, modal dialogs, and tool execution
- Supports both persistent profiles and isolated sessions

**Tool System** (`src/tools.ts`, `src/tools/`)
- Two operation modes: **Snapshot Mode** (default) uses accessibility trees, **Vision Mode** uses screenshots
- Tools organized by capability: `core`, `tabs`, `pdf`, `history`, `wait`, `files`, `install`, `testing`
- Each tool implements the `Tool` interface with schema validation and execution logic

**Configuration** (`src/config.ts`)
- Supports CLI options, configuration files, and programmatic configuration
- Handles browser launch options, network settings, capabilities, and output directories

### Tool Categories

The codebase separates tools into logical groups:
- **Navigation**: `navigate.ts` - URL navigation, back/forward
- **Interaction**: `common.ts` - clicking, typing, hovering, drag/drop  
- **Content**: `snapshot.ts`, `screenshot.ts`, `pdf.ts` - page content capture
- **Tabs**: `tabs.ts` - tab management and switching
- **Testing**: `testing.ts` - Playwright test generation
- **Utilities**: `wait.ts`, `files.ts`, `install.ts` - various helper tools

### Key Patterns

**Modal State Management**: Tools can declare they handle specific modal states (dialogs, file choosers) to ensure proper sequencing.

**Capability Filtering**: Tools are filtered based on enabled capabilities to customize the available toolset.

**Transport Abstraction**: Supports both stdio (for direct MCP integration) and HTTP/SSE (for standalone server mode).

## Testing Configuration

Tests use custom fixtures (`tests/fixtures.ts`) that can:
- Test against different browser engines (Chrome, Firefox, WebKit, Edge)
- Run in Docker containers with limited capabilities
- Switch between snapshot and vision modes
- Configure different MCP server options per test

## Entry Points

- `cli.js` - CLI entry point that loads `lib/program.js`
- `src/index.ts` - Programmatic API entry point for `createConnection()`
- `src/program.ts` - CLI argument parsing and server startup

## Development Workflow

**CRITICAL: Always use feature branches and pull requests. NEVER commit directly to main.**

### Required Workflow
1. **Create feature branch**: `git checkout -b feature/description-of-work`
2. **Implement changes** on the feature branch
3. **Test functionality**: Use `npm test` for comprehensive testing
4. **Commit changes** to feature branch with descriptive messages
5. **Push branch**: `git push -u origin feature/branch-name`
6. **Test with running server**: Before creating a PR, ask the user to verify the changes work with the running server
7. **Create Pull Request**: Use `gh pr create` with proper title and description ONLY after all tests pass and user confirms the implementation works
8. **Only merge** after review/approval

### Important Development Practices

#### Commit Frequently
**Save progress often with commits** to enable easy rollback of changes:
- Commit working states before making major changes
- Use descriptive commit messages that explain what was changed
- This allows you to revert to a known-good state if something breaks

### Branch Naming Convention
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates