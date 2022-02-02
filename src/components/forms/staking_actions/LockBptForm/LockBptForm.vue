<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed, onBeforeMount, toRefs } from 'vue';

import LockBptForm from '@/components/forms/staking_actions/LockBptForm/LockBptForm.vue';

import LockableTokens from '@/components/forms/staking_actions/LockBptForm/components/LockableTokens.vue';
import MyLockedBpt from '@/components/forms/staking_actions/LockBptForm/components/MyLockedBpt.vue';

import useLockBpt from '@/composables/useLockBpt';
import useTokens from '@/composables/useTokens';
import usePoolQuery from '@/composables/queries/usePoolQuery';
import useRelayerApproval, {
  Relayer
} from '@/composables/trade/useRelayerApproval';
import { POOLS } from '@/constants/pools';
import { networkId } from '@/composables/useNetwork';

/**
 * COMPOSABLES
 */

const router = useRouter();
const { isLockBptSupported } = useLockBpt();
const { tokens } = useTokens();

const poolAddress = computed(
  () => POOLS.IdsMap[networkId.value]?.['B-80BAL-20WETH']
);

/**
 * QUERIES
 */
const poolQuery = usePoolQuery(poolAddress.value as string);
const batchRelayerApproval = useRelayerApproval(Relayer.BATCH);

const { loading: batchRelayerApprovalLoading } = toRefs(batchRelayerApproval);

/**
 * COMPUTED
 */
const poolLoading = computed(
  () => poolQuery.isLoading.value || poolQuery.isIdle.value
);

const pool = computed(() => poolQuery.data.value);

const isLoading = computed(
  () => poolLoading.value || batchRelayerApprovalLoading.value
);

/**
 * CALLBACKS
 */
onBeforeMount(() => {
  if (!isLockBptSupported.value) {
    router.push({ name: 'home' });
  }
});
</script>

<template>
  <Col3Layout offsetGutters>
    <template #gutterLeft>
      <LockableTokens />
    </template>

    <!-- <LockBptForm /> -->

    <template #gutterRight>
      <MyLockedBpt />
    </template>
  </Col3Layout>
</template>
