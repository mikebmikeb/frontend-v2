import { computed, Ref, ref, watch } from 'vue';
import { bnum, forChange } from '@/lib/utils';
import { formatUnits } from '@ethersproject/units';
// Types
import { FullPool } from '@/services/balancer/subgraph/types';
// Services
import PoolCalculator from '@/services/pool/calculator/calculator.sevice';
// Composables
import useUserSettings from '@/composables/useUserSettings';
import useSlippage from '@/composables/useSlippage';
import useTokens from '@/composables/useTokens';
import useNumbers from '@/composables/useNumbers';
import useWeb3 from '@/services/web3/useWeb3';
import { isStablePhantom, usePool } from '@/composables/usePool';
import { BatchSwap } from '@/types';
// import { queryBatchSwapTokensOut } from '@balancer-labs/sor2';

/**
 * TYPES
 */
export type WithdrawMathResponse = {
  hasAmounts: Ref<boolean>;
  fullAmounts: Ref<string[]>;
  amountsOut: Ref<string[]>;
  fiatAmounts: Ref<string[]>;
  tokenOutAmount: Ref<string>;
  propBptIn: Ref<string>;
  bptIn: Ref<string>;
  bptBalance: Ref<string>;
  hasBpt: Ref<boolean>;
  fiatTotalLabel: Ref<string>;
  priceImpact: Ref<number>;
  highPriceImpact: Ref<boolean>;
  proportionalAmounts: Ref<string[]>;
  proportionalPoolTokenAmounts: Ref<string[]>;
  singleAssetMaxes: Ref<string[]>;
  exactOut: Ref<boolean>;
  singleAssetMaxOut: Ref<boolean>;
  tokenOutPoolBalance: Ref<string>;
  initMath: () => void;
  resetMath: () => void;
};

export default function useWithdrawMath(
  pool: Ref<FullPool>,
  isProportional: Ref<boolean> = ref(true),
  tokenOut: Ref<string> = ref(''),
  tokenOutIndex: Ref<number> = ref(0)
): WithdrawMathResponse {
  /**
   * STATE
   */
  const propBptIn = ref('');
  const tokenOutAmount = ref('');
  // const batchSwap = ref<BatchSwap | null>(null);
  // const batchSwapLoading = ref(false);

  /**
   * COMPOSABLES
   */
  const { isWalletReady, account } = useWeb3();
  const { toFiat, fNum } = useNumbers();
  const {
    tokens: allTokens,
    balances,
    balanceFor,
    getToken,
    dynamicDataLoading
  } = useTokens();
  const { minusSlippage, addSlippage } = useSlippage();
  const { currency } = useUserSettings();
  const { isStablePhantomPool } = usePool(pool);

  /**
   * Services
   */
  const poolCalculator = new PoolCalculator(pool, allTokens, balances, 'exit');

  /**
   * COMPUTED
   */
  const tokenAddresses = computed((): string[] => {
    if (isStablePhantom(pool.value.poolType)) {
      return pool.value.mainTokens || [];
    }
    return pool.value.tokenAddresses;
  });

  const tokenCount = computed((): number => pool.value.tokenAddresses.length);

  const tokens = computed(() =>
    tokenAddresses.value.map(address => getToken(address))
  );

  const bptBalance = computed(() => {
    return balanceFor(pool.value.address);
  });

  const hasBpt = computed(() => bnum(bptBalance.value).gt(0));

  const tokenOutPoolBalance = computed(() => {
    const balances = Object.values(pool.value.onchain.tokens).map(
      token => token.balance
    );
    return balances[tokenOutIndex.value];
  });

  const amountExceedsPoolBalance = computed(() =>
    bnum(tokenOutAmount.value).gt(tokenOutPoolBalance.value)
  );

  const proportionalPoolTokenAmounts = computed((): string[] => {
    const { receive } = poolCalculator.propAmountsGiven(
      propBptIn.value,
      0,
      'send'
    );
    return receive;
  });

  const proportionalMainTokenAmounts = computed((): string[] => {
    if (pool.value.onchain.linearPools) {
      const linearPools = Object.values(pool.value.onchain.linearPools);
      return proportionalPoolTokenAmounts.value.map((amount, i) => {
        return bnum(amount)
          .times(linearPools[i].priceRate)
          .toString();
      });
    }
    return [];
  });

  const proportionalAmounts = computed((): string[] => {
    if (isStablePhantomPool.value) {
      return proportionalMainTokenAmounts.value;
    }
    return proportionalPoolTokenAmounts.value;
  });

  const fullAmounts = computed(() => {
    if (isProportional.value) return proportionalAmounts.value;
    return new Array(tokenCount.value).fill('0').map((_, i) => {
      return i === tokenOutIndex.value ? tokenOutAmount.value : '0';
    });
  });

  const amountsOut = computed(() => {
    return fullAmounts.value.map((amount, i) => {
      if (amount === '0' || exactOut.value) return amount;
      return minusSlippage(amount, tokens.value[i].decimals);
    });
  });

  const bptIn = computed(() => {
    if (isProportional.value) return propBptIn.value;
    if (!exactOut.value) return bptBalance.value; // Single asset max withdrawal

    // Else single asset exact amount case
    let _bptIn = poolCalculator
      .bptInForExactTokenOut(tokenOutAmount.value, tokenOutIndex.value)
      .toString();

    _bptIn = formatUnits(_bptIn, pool.value.onchain.decimals);

    return addSlippage(_bptIn, pool.value.onchain.decimals);
  });

  const hasAmounts = computed(() => bnum(fiatTotal.value).gt(0));

  const singleAssetMaxes = computed((): string[] => {
    return tokens.value.map((token, tokenIndex) => {
      return formatUnits(
        poolCalculator
          .exactBPTInForTokenOut(bptBalance.value, tokenIndex)
          .toString(),
        token.decimals
      );
    });
  });

  const singleAssetMaxed = computed(() => {
    return (
      singleAssetMaxes.value[tokenOutIndex.value] ===
      fullAmounts.value[tokenOutIndex.value]
    );
  });

  const exactOut = computed(() => {
    return !isProportional.value && !singleAssetMaxed.value;
  });

  const singleAssetMaxOut = computed(
    () => !isProportional.value && singleAssetMaxed.value
  );

  const priceImpact = computed((): number => {
    if (amountExceedsPoolBalance.value) return 1;
    if (!hasAmounts.value || isProportional.value) return 0;

    return poolCalculator
      .priceImpact(fullAmounts.value, {
        exactOut: exactOut.value,
        tokenIndex: tokenOutIndex.value
      })
      .toNumber();
  });

  const highPriceImpact = computed(() =>
    bnum(priceImpact.value).isGreaterThanOrEqualTo(0.01)
  );

  const fiatAmounts = computed((): string[] =>
    fullAmounts.value.map((amount, i) =>
      toFiat(amount, tokens.value[i].address)
    )
  );

  const fiatTotal = computed((): string =>
    fiatAmounts.value.reduce(
      (total, amount) =>
        bnum(total)
          .plus(amount)
          .toString(),
      '0'
    )
  );

  const fiatTotalLabel = computed((): string =>
    fNum(fiatTotal.value, currency.value)
  );

  // const shouldFetchBatchSwap = computed(
  //   (): boolean => pool.value && isStablePhantomPool.value && hasAmounts.value
  // );

  /**
   * METHODS
   */
  function initMath(): void {
    propBptIn.value = bptBalance.value;
  }

  function resetMath(): void {
    initMath();
    tokenOutAmount.value = '';
  }

  // async function getBatchSwap(): Promise<void> {
  //   batchSwapLoading.value = true;
  //   batchSwap.value = await queryBatchSwapTokensOut(
  //     sor,
  //     vault,
  //     Object.keys(batchSwapAmountMap.value),
  //     Object.values(batchSwapAmountMap.value),
  //     pool.value.address.toLowerCase()
  //   );
  //   batchSwapLoading.value = false;
  // }

  /**
   * WATCHERS
   */
  watch(tokenOut, () => (tokenOutAmount.value = ''));

  watch(isWalletReady, async () => {
    await forChange(dynamicDataLoading, false);
    initMath();
  });

  watch(account, () => initMath());

  // watch(fullAmounts, async () => {
  //   if (shouldFetchBatchSwap.value) await getBatchSwap();
  // });

  return {
    // computed
    hasAmounts,
    fullAmounts,
    amountsOut,
    fiatAmounts,
    tokenOutAmount,
    propBptIn,
    bptIn,
    bptBalance,
    hasBpt,
    fiatTotalLabel,
    priceImpact,
    highPriceImpact,
    proportionalAmounts,
    proportionalPoolTokenAmounts,
    singleAssetMaxes,
    exactOut,
    singleAssetMaxOut,
    tokenOutPoolBalance,
    // methods
    initMath,
    resetMath
  };
}
