# Property Insights Server

This is the backend server for the Property Insights application.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Install dependencies:

```bash
npm install
```

## Running the Server

### Development Mode

To run the server in development mode with hot reloading:

```bash
npm run dev
```

### Debug Mode

To run the server in debug mode:

```bash
npm run debug
```

Then connect your debugger to the Node.js process.

### Production Mode

To build and run the server in production mode:

```bash
npm run build
npm start
```

## Environment Variables

The server uses the following environment variables:

- `PORT`: The port on which the server will run (default: 5000)
- `NODE_ENV`: The environment in which the server is running (development, test, production)

These can be set in a `.env` file in the root directory.

## Testing

To run tests:

```bash
npm test
```

## Project Structure

- `src/`: Source code
  - `index.ts`: Main entry point
- `dist/`: Compiled JavaScript code
- `nodemon.json`: Nodemon configuration
- `tsconfig.json`: TypeScript configuration