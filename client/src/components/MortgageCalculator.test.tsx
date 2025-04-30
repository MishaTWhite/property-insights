import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MortgageCalculator from './MortgageCalculator';

// Mock the Chart.js component to avoid errors in testing environment
jest.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="mock-doughnut-chart">Chart Mock</div>,
}));

describe('MortgageCalculator', () => {
  test('renders the mortgage calculator', () => {
    render(<MortgageCalculator />);
    
    // Check if the title is rendered
    expect(screen.getByText('Mortgage Calculator')).toBeInTheDocument();
    
    // Check if currency selector is rendered
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    
    // Check if property price input is rendered
    expect(screen.getByLabelText('Property Price')).toBeInTheDocument();
    
    // Check if down payment slider is rendered
    expect(screen.getByLabelText('Down Payment')).toBeInTheDocument();
    
    // Check if loan duration slider is rendered
    expect(screen.getByLabelText('Loan Duration')).toBeInTheDocument();
    
    // Check if interest rate section is rendered
    expect(screen.getByText('Interest Rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Base Rate (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Bank Margin (%)')).toBeInTheDocument();
    
    // Check if results section is rendered
    expect(screen.getByText('Mortgage Summary')).toBeInTheDocument();
    
    // Check if loan structure chart is rendered
    expect(screen.getByText('Loan Structure')).toBeInTheDocument();
  });

  test('updates calculations when inputs change', () => {
    render(<MortgageCalculator />);
    
    // Change property price
    const propertyPriceInput = screen.getByLabelText('Property Price');
    fireEvent.change(propertyPriceInput, { target: { value: '600000' } });
    
    // Change down payment percentage
    const downPaymentSlider = screen.getByLabelText('Down Payment');
    fireEvent.change(downPaymentSlider, { target: { value: '30' } });
    
    // Change loan duration
    const loanDurationSlider = screen.getByLabelText('Loan Duration');
    fireEvent.change(loanDurationSlider, { target: { value: '15' } });
    
    // Change interest rates
    const baseRateInput = screen.getByLabelText('Base Rate (%)');
    fireEvent.change(baseRateInput, { target: { value: '6' } });
    
    const bankMarginInput = screen.getByLabelText('Bank Margin (%)');
    fireEvent.change(bankMarginInput, { target: { value: '1.5' } });
    
    // Check if total interest rate is updated
    expect(screen.getByText('7.50%')).toBeInTheDocument();
  });

  test('changes currency when currency selector changes', () => {
    render(<MortgageCalculator />);
    
    // Get the currency selector
    const currencySelector = screen.getByLabelText('Currency');
    
    // Change currency to EUR
    fireEvent.change(currencySelector, { target: { value: 'EUR' } });
    
    // Check if currency has changed in the UI
    expect(currencySelector).toHaveValue('EUR');
  });
});