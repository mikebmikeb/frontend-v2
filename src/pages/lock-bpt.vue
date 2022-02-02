<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed, onBeforeMount, toRefs } from 'vue';
</script>

<template>
  <LockBptForm v-if="isLockBptSupported" />
  <div v-else class="text-center">
    <div class="font-semibold text-lg">
      {{ $t('staking.lock.notSupported.title') }}
    </div>
    <div>{{ $t('staking.lock.notSupported.description') }}</div>
  </div>
</template>
