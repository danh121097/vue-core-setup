import { UnwrapRef } from 'vue';

export function useMicroStore<T>(initialState: T, key = 'state') {
  const state = ref(initialState);
  provide(key, state);
  return {
    state,
  };
}

export function useState<T>(key = 'state') {
  const state = inject<Ref<UnwrapRef<T>>>(key) as Ref<UnwrapRef<T>>;
  return {
    state,
  };
}
