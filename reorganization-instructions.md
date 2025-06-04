# Project Reorganization Instructions

## Problem
The project currently has excessive nesting with all code located inside the `/property-insights/` directory. We need to move everything to the project root level.

## Solution
The following steps should be taken to reorganize the project structure:

1. **Backup** the entire project before making any changes.

2. **Move all files and directories** from the `/property-insights/` directory up one level to the project root:
   - Move package.json
   - Move README.md
   - Move client directory (with all its contents intact)
   - Move server directory (with all its contents intact)
   - Move .gitignore
   - Move README_VS_CODE_SETUP.md
   - Move any other files and directories

3. **Delete the now empty** `/property-insights/` directory once all content has been moved.

4. **Update any absolute paths** in the codebase that might reference the old directory structure. Check:
   - Import statements
   - File paths in scripts
   - Configuration files
   - Documentation references

5. **Test the application** to ensure it still functions correctly after the reorganization:
   - Run `npm install-all` to reinstall dependencies
   - Start the application with `npm start`
   - Verify that both client and server components work as expected

This reorganization will maintain all the project functionality while eliminating the unnecessary directory nesting, as requested in "Достань все из property-insights, сохрани всю структуру внутри" (Get everything out of property-insights, save the entire structure inside).