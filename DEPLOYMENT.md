# Deployment Instructions

This project has been configured for deployment on Render.com. Follow these steps to deploy:

## Prerequisites

1. Create a Render.com account if you don't have one
2. Push this repository to GitHub, GitLab, or another Git provider that Render supports

## Deployment Steps

1. Log in to Render.com
2. Click on "New" and select "Blueprint"
3. Connect to your repository
4. Render will automatically detect the `render.yaml` file in the repository
5. Review the configuration and click "Apply"
6. Wait for the deployment to complete

The render.yaml file configures two services:

1. **Frontend Static Site (property-insights)**
   - A static site that serves the React application
   - Built with Vite

2. **Backend API (property-insights-api)**
   - A Node.js web service that runs the Express server
   - Includes Python script execution capabilities

## Accessing Your Application

Once deployment is complete, you can access your application at:

- Frontend: https://property-insights.onrender.com
- Backend: https://property-insights-api.onrender.com

## Environment Variables

The necessary environment variables have been configured in the `render.yaml` file. If you need to change them:

1. Go to the service dashboard in Render
2. Click on "Environment" tab
3. Add or modify the environment variables

## Monitoring and Logs

You can monitor your application and view logs through the Render dashboard:

1. Go to your service in the Render dashboard
2. Click on "Logs" to view the application logs
3. Use the filter options to search for specific log entries

## Troubleshooting

If you encounter issues with the deployment:

1. Check the build logs for errors
2. Verify that the environment variables are set correctly
3. Check the Python version is 3.13.0 as specified in runtime.txt
4. Ensure all dependencies are correctly listed in package.json and requirements.txt