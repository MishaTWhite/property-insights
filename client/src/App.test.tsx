import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the MortgageCalculator component
jest.mock('./components/MortgageCalculator', () => () => (
  <div data-testid="mortgage-calculator">Mortgage Calculator Mock</div>
));

describe('App Component', () => {
  test('renders the mortgage calculator', () => {
    render(<App />);
    expect(screen.getByTestId('mortgage-calculator')).toBeInTheDocument();
  });
});