import { useState, useEffect } from 'react';
import { getPayoutValue } from '@/lib/hive/client-functions';
import { convertHBDToDisplayCurrency } from '@/lib/utils/currencyConverter';

/**
 * Custom hook for displaying post payout values in the configured currency
 * 
 * Features:
 * - Automatically converts HBD to target currency if env variable is set
 * - No conversion if env variable is empty (displays as HBD/USD)
 * - Returns formatted string ready for display
 * - Handles loading state during async conversion
 * 
 * @param post - The post or comment object with payout information
 * @returns Formatted currency string (e.g., "R$25.50", "$5.123")
 */
export function useCurrencyDisplay(post: any): string {
  const [displayValue, setDisplayValue] = useState<string>('');
  const targetCurrency = process.env.NEXT_PUBLIC_DISPLAY_CURRENCY;

  useEffect(() => {
    async function convertValue() {
      // Get the HBD payout value
      const hbdValue = getPayoutValue(post);
      const hbdAmount = parseFloat(hbdValue);

      // If no valid amount, display zero
      if (isNaN(hbdAmount)) {
        setDisplayValue('$0.000');
        return;
      }

      // If no target currency or empty string, return HBD value as-is
      if (!targetCurrency || targetCurrency.trim() === '') {
        setDisplayValue(`$${hbdValue}`);
        return;
      }

      // Convert to target currency
      const converted = await convertHBDToDisplayCurrency(hbdAmount, targetCurrency);
      setDisplayValue(converted);
    }

    convertValue();
  }, [post, targetCurrency]);

  return displayValue || '$0.000';
}
