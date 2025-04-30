# Full-Stack React + Express Application

This project consists of a React frontend with TypeScript and Tailwind CSS, and an Express backend with TypeScript.

## Project Structure

- `client/`: React frontend with TypeScript and Tailwind CSS
- `server/`: Express backend with TypeScript

## Getting Started

### Backend Setup

```bash
cd server
npm install
npm run dev
```

The server will start on port 5000.

### Frontend Setup

```bash
cd client
npm install
npm start
```

The React development server will start on port 3000 and proxy API requests to the backend.

## VSCode Run and Debug

This project is configured for VSCode's Run and Debug feature. To use it:

1. Open the project in VSCode
2. Go to the Run and Debug panel (Ctrl+Shift+D or Cmd+Shift+D on Mac)
3. Select one of the following configurations from the dropdown:
   - **Debug Server**: Runs and debugs only the Express backend
   - **Debug Client**: Runs and debugs only the React frontend
   - **Debug Full Stack**: Runs and debugs both the backend and frontend

You can also use the Tasks menu (Ctrl+Shift+P or Cmd+Shift+P, then type "Run Task") to:
- Start Server
- Start Client
- Build Server
- Build Client
- Start Full Stack (both server and client)

## Features

- React frontend with TypeScript and Tailwind CSS
- Express backend with TypeScript
- Mortgage calculator with interactive inputs for property price, down payment, loan duration, and interest rates
- Real-time calculation of monthly payments, total interest, and loan structure
- Currency conversion support

## Testing

### Backend Tests

```bash
cd server
npm test
```

### Frontend Tests

```bash
cd client
npm test
```