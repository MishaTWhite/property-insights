import React from 'react';
import useBankOffers from '../hooks/useBankOffers';

const BankOffersTable = ({ onSelectBankOffer, onSelectBaseRate }) => {
  const { offers, loading, error } = useBankOffers();

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>
          Bank Mortgage Offers
        </h2>
        <div className="text-center py-6">Loading bank offers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>
          Bank Mortgage Offers
        </h2>
        <div className="text-center py-6 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-heading)', fontSize: '18px' }}>
        Bank Mortgage Offers
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Margin
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offers.map((offer, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectBankOffer(offer)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{offer.bankName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{offer.margin.toFixed(2)}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the row click
                      onSelectBaseRate(offer);
                    }}
                  >
                    {offer.baseRateName} ({offer.baseRateValue.toFixed(2)}%)
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-blue-600">{offer.totalRate.toFixed(2)}%</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 italic">
        * The actual rate may vary depending on your credit score, loan amount, and other factors.
      </div>
    </div>
  );
};

export default BankOffersTable;