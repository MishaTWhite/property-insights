import React from 'react';
import useBankOffers from '../hooks/useBankOffers';

/**
 * Компонент больше не отображает таблицу предложений банков
 * Вместо этого он просто возвращает null, так как блок оферов банков удален
 */
const BankOffersTable = ({ onSelectBankOffer, onSelectBaseRate }) => {
  // Компонент больше не отображается
  return null;
};

export default BankOffersTable;