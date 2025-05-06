# Deployment Guide for Property Insights on Render.com

This document outlines how to deploy the Property Insights application on Render.com.

## Project Structure

The project is organized as a monorepo with the following structure:
- `/client` - React frontend built with Vite
- `/server` - Express.js backend with Python scraper integration

## Deployment Configuration

### Prerequisites
1. A Render.com account
2. Git repository with the project code

### Deployment Process

1. **Push the code to a Git repository** (GitHub, GitLab, etc.)
2. **Connect your Git repository to Render.com**

3. **Deploy using the render.yaml configuration**
   - The `render.yaml` file in the repository root contains all needed configuration
   - Use Render's "Blueprint" deployment option and select the repository

### Environment Variables

#### Frontend
Set the following environment variables in the Render dashboard for the frontend service:
- `VITE_API_URL=https://property-insights-api.onrender.com/api`

#### Backend
Set the following environment variables in the Render dashboard for the backend service:
- `PORT=10000`
- `NODE_ENV=production`

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` in both `/client` and `/server` directories
3. Install dependencies:
   ```
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```
4. Start development servers:
   ```
   # Start client (in client directory)
   npm run dev
   
   # Start server (in server directory)
   npm run dev
   ```

## Troubleshooting

### API Connection Issues
- Check CORS settings in `server/src/index.js`
- Verify the `VITE_API_URL` environment variable is set correctly

### Python Script Execution
- Ensure Python 3.13.0 is available on your system
- Check that all Python dependencies are installed
- Verify the path to Python scripts in the Node.js code

For more help, please refer to the Render.com documentation or open an issue in the repository.