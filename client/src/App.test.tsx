import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Hello from Q' }),
    });

    render(<App />);
    expect(screen.getByText(/loading message from server/i)).toBeInTheDocument();
  });

  test('displays message from server when fetch succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Hello from Q' }),
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Hello from Q')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/hello');
  });

  test('displays error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch message from server/i)).toBeInTheDocument();
    });
  });
});