import { useState, useEffect } from 'react';

/**
 * Custom hook для работы с базовой ставкой WIBOR
 * @returns {Object} Фиксированное значение WIBOR
 */
export const useBankOffers = () => {
  // Используем фиксированное значение WIBOR = 5.41
  const baseRate = 5.41;
  
  return { 
    baseRate,
    loading: false,
    error: null,
    offers: [] // Пустой массив, так как блок оферов банков больше не используется
  };
};

export default useBankOffers;