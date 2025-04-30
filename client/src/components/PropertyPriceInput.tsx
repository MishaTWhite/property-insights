import React from 'react';
import { Currency, formatCurrency } from '../utils/exchangeRates';

interface PropertyPriceInputProps {
  propertyPrice: number;
  currency: Currency;
  onPropertyPriceChange: (price: number) => void;
}

const PropertyPriceInput: React.FC<PropertyPriceInputProps> = ({ 
  propertyPrice, 
  currency, 
  onPropertyPriceChange 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(value)) {
      onPropertyPriceChange(value);
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="propertyPrice" className="block text-sm font-medium text-gray-700 mb-1">
        Property Price
      </label>
      <input
        type="text"
        id="propertyPrice"
        value={formatCurrency(propertyPrice, currency)}
        onChange={handleChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
};

export default PropertyPriceInput;