import React from 'react';

/**
 * LoadingOverlay component that displays a spinner and loading message
 */
const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <div className="flex justify-center items-center p-10">
      <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
        <svg className="animate-spin h-10 w-10 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;