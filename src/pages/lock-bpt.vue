<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onBeforeMount } from 'vue';

import LockBptForm from '@/components/forms/staking_actions/LockBptForm/LockBptForm.vue';

import LockableTokens from '@/components/forms/staking_actions/LockBptForm/components/LockableTokens.vue';
import MyLockedBpt from '@/components/forms/staking_actions/LockBptForm/components/MyLockedBpt.vue';

import useLockBpt from '@/composables/useLockBpt';

/**
 * COMPOSABLES
 */

const router = useRouter();
const { isLockBptSupported } = useLockBpt();

/**
 * QUERIES
 */

/**
 * COMPUTED
 */

/**
 * CALLBACKS
 */
onBeforeMount(() => {
  if (isLockBptSupported.value) {
    router.push({ name: 'home' });
  }
});
</script>

<template>
  <Col3Layout offsetGutters>
    <template #gutterLeft>
      <LockableTokens />
    </template>

    <LockBptForm />

    <template #gutterRight>
      <MyLockedBpt />
    </template>
  </Col3Layout>
</template>
