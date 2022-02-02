import { isMainnet, isKovan } from '@/composables/useNetwork';
import { computed } from 'vue';

export const isLockBptSupported = computed(
  () => isMainnet.value || isKovan.value
);

export default function useAlerts() {
  return {
    // computed
    isLockBptSupported
  };
}
