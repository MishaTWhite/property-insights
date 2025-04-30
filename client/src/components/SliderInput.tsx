import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue: string;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={label.replace(/\s+/g, '')} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm font-medium text-indigo-600">{displayValue}</span>
      </div>
      <input
        type="range"
        id={label.replace(/\s+/g, '')}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default SliderInput;