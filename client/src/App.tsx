import React, { useEffect, useState } from 'react';

interface HelloResponse {
  message: string;
}

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHello = async () => {
      try {
        const response = await fetch('/api/hello');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: HelloResponse = await response.json();
        setMessage(data.message);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch message from server');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchHello();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">React + Express App</h1>
        
        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading message from server...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-medium text-gray-700 p-4 bg-gray-50 rounded">
              {message}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Message received from the Express backend
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;