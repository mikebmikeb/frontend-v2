import { computed } from 'vue';
import { isMainnet, isKovan, networkId } from '@/composables/useNetwork';
import { TOKENS } from '@/constants/tokens';
import useTokens from './useTokens';
import { TokenInfo } from '@gnosis.pm/safe-apps-sdk';

export const isLockBptSupported = computed(
  () => isMainnet.value || isKovan.value
);

export const vebptBALaddress = computed<string>(
  () => TOKENS.IdsMap[networkId.value]
);

export default function useLockBpt() {
  const { tokens } = useTokens();

  const vebptBAL = computed<TokenInfo>(() => tokens[vebptBALaddress.value]);

  return {
    // computed
    isLockBptSupported,
    vebptBALaddress,
    vebptBAL
  };
}
