import { computed } from 'vue';
import { parseUnits, formatUnits } from '@ethersproject/units';
import useUserSettings from './useUserSettings';
import { bnum } from '@/lib/utils';
import BigNumber from 'bignumber.js';

export default function useSlippage() {
  const { slippage } = useUserSettings();

  const slippageBasisPoints = computed((): string => {
    return bnum(slippage.value)
      .times(10000)
      .toString();
  });

  function minusSlippage(_amount: string, decimals: number): string {
    let amount = parseUnits(_amount, decimals).toString();
    amount = minusSlippageScaled(amount, decimals);

    return formatUnits(amount, decimals);
  }

  function minusSlippageScaled(amount: string, decimals: number): string {
    const delta = bnum(amount)
      .times(slippageBasisPoints.value)
      .div(10000)
      .toPrecision(decimals, BigNumber.ROUND_UP);

    return bnum(amount)
      .minus(delta)
      .toString();
  }

  function addSlippage(_amount: string, decimals: number): string {
    let amount = parseUnits(_amount, decimals).toString();
    amount = addSlippageScaled(amount, decimals);

    return formatUnits(amount, decimals).toString();
  }

  function addSlippageScaled(amount: string, decimals: number): string {
    const delta = bnum(amount)
      .times(slippageBasisPoints.value)
      .div(10000)
      .toPrecision(decimals, BigNumber.ROUND_DOWN);

    return bnum(amount)
      .plus(delta)
      .toString();
  }

  return { minusSlippage, minusSlippageScaled, addSlippage, addSlippageScaled };
}
