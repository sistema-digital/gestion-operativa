import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import { formatPanamaCaptureDateTime } from '@/utils/dateUtils';

export function useLivePanamaCaptureTime() {
  const now = shallowRef(new Date());
  let nextTickTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearScheduledTick = () => {
    if (nextTickTimeout) {
      clearTimeout(nextTickTimeout);
      nextTickTimeout = null;
    }
  };

  const scheduleNextTick = () => {
    clearScheduledTick();

    const current = new Date();
    const millisecondsUntilNextMinute = (
      ((59 - current.getSeconds()) * 1000)
      + (1000 - current.getMilliseconds())
    );

    nextTickTimeout = window.setTimeout(() => {
      now.value = new Date();
      scheduleNextTick();
    }, millisecondsUntilNextMinute);
  };

  onMounted(() => {
    now.value = new Date();
    scheduleNextTick();
  });

  onUnmounted(() => {
    clearScheduledTick();
  });

  const captureTimestampLabel = computed(() => formatPanamaCaptureDateTime(now.value));

  return {
    captureTimestampLabel,
  };
}
