import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import CitySelector from '../CitySelector';

// Mock axios
jest.mock('axios');

describe('CitySelector Component', () => {
  const mockCities = ['warszawa', 'krakow', 'gdansk'];
  const mockOnCityChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state initially', () => {
    axios.get.mockResolvedValueOnce({ data: mockCities });
    render(<CitySelector onCityChange={mockOnCityChange} />);
    
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
  });
  
  test('loads and displays cities', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCities });
    render(<CitySelector onCityChange={mockOnCityChange} />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Open the dropdown
    fireEvent.mouseDown(screen.getByLabelText(/city/i));
    
    // Check if cities are rendered in the dropdown
    await waitFor(() => {
      mockCities.forEach(city => {
        expect(screen.getByText(city)).toBeInTheDocument();
      });
    });
  });
  
  test('calls onCityChange when a city is selected', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCities });
    render(<CitySelector onCityChange={mockOnCityChange} />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Open the dropdown
    fireEvent.mouseDown(screen.getByLabelText(/city/i));
    
    // Select a city
    fireEvent.click(screen.getByText('krakow'));
    
    // Check if onCityChange was called with the selected city
    expect(mockOnCityChange).toHaveBeenCalledWith('krakow');
  });
  
  test('handles empty cities array', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<CitySelector onCityChange={mockOnCityChange} />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Check if error message is displayed
    expect(await screen.findByText(/No cities available/i)).toBeInTheDocument();
  });
  
  test('handles API error', async () => {
    axios.get.mockRejectedValueOnce(new Error('API error'));
    render(<CitySelector onCityChange={mockOnCityChange} />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Check if error message is displayed
    expect(await screen.findByText(/Failed to load cities/i)).toBeInTheDocument();
  });
});