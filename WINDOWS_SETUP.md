# Windows PowerShell Setup Guide

This document provides specific instructions for setting up and running the Polish Mortgage Calculator application on Windows using PowerShell.

## Installation

1. Clone the repository
2. Install dependencies:
   ```powershell
   npm run install-all
   ```

3. Install the required SQLite dependency:
   ```powershell
   cd server
   npm install better-sqlite3 --save
   cd ..
   ```

4. Verify the installation:
   ```powershell
   cd server
   npm ls better-sqlite3
   cd ..
   ```

## Running the Application

Use VS Code's Run and Debug feature:
1. Open the project in VS Code
2. Go to Run and Debug tab (Ctrl+Shift+D)
3. Select "Run Full App" from the dropdown
4. Click the green play button or press F5

Alternatively, you can start the application manually:
```powershell
npm start
```

## Useful Commands for Windows PowerShell

### Search in Files
Instead of using `grep` which is not available in PowerShell, use `Select-String`:

```powershell
Get-Content package.json | Select-String express   # search for Express
```

Or simply open the file in VS Code and use its search functionality (Ctrl+F).

### Checking Installed Packages
To verify installed npm packages:

```powershell
npm ls package-name
```

## Troubleshooting

If you encounter the error "Cannot find module 'sqlite3'", ensure you've installed better-sqlite3 in the server directory:

```powershell
cd server
npm install better-sqlite3 --save
```

Then restart the development server.