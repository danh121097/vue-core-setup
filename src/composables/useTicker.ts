export function useTicker(mode: 's' | 'm' = 's') {
  const now = ref(Date.now());
  let secInterval: NodeJS.Timer;
  onMounted(() => {
    secInterval = setInterval(
      () => {
        now.value = Date.now();
      },
      mode === 's' ? 1000 : 60000
    );
  });
  const stopTicker = () => {
    clearInterval(secInterval);
  };
  onBeforeUnmount(stopTicker);
  return {
    now,
    stopTicker,
  };
}
