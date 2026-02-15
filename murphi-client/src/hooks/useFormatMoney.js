import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const CURRENCY_CONFIG = {
  MXN: { locale: 'es-MX', symbol: '$' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'es-ES', symbol: '€' },
  GTQ: { locale: 'es-GT', symbol: 'Q' },
  COP: { locale: 'es-CO', symbol: '$' },
  ARS: { locale: 'es-AR', symbol: '$' },
  CLP: { locale: 'es-CL', symbol: '$' },
  PEN: { locale: 'es-PE', symbol: 'S/' }
};

export function useFormatMoney() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || 'MXN';
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.MXN;

  const formatMoney = useCallback((amount) => {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }, [currency, config.locale]);

  return { formatMoney, currency, symbol: config.symbol };
}
