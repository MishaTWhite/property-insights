# VS Code Setup for Property Insights Project

This project has been fully configured for development in Visual Studio Code. Below is a summary of the setup and how to use it effectively.

## Setup Completed

1. **VS Code Configuration Files**:
   - `.vscode/launch.json` - Debugging configurations for server, client, and full-stack development
   - `.vscode/settings.json` - Workspace settings for formatting and code quality
   - `.vscode/extensions.json` - Recommended extensions for this project

2. **Development Environment**:
   - Vite configuration for React client with API proxy setup
   - Backend server configured on port 3000
   - Client development server on port 5173
   - Concurrent execution of both client and server

## Getting Started

1. **Install Dependencies**:
   ```
   npm run install-all
   ```

2. **Start the Development Environment**:
   ```
   npm start
   ```

3. **Debugging**:
   - Use the "Launch Server" configuration to debug the Node.js backend
   - Use the "Launch Client" configuration to debug the React frontend in Chrome
   - Use the "Server/Client" compound configuration to debug both simultaneously
   - Use the "Full Stack" configuration for an integrated debugging experience

4. **Extensions**: 
   - Install the recommended extensions from the Extensions view in VS Code

## Project Structure

- `/client` - React frontend with Vite
- `/server` - Node.js/Express backend API

## API Communication

The Vite development server is configured to proxy API requests to the backend:
- Frontend requests to `/api/*` are automatically forwarded to `http://localhost:3000/api/*`
- No need to hardcode the backend URL in frontend code

This setup provides a seamless development experience in VS Code with full debugging capabilities for both client and server code.