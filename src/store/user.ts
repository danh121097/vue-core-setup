import { Socket } from 'socket.io-client';

interface UserState {
  token: string | null;
  ioStore: {
    socket?: Socket;
    authenticated?: boolean;
  };
}

export const userStore = defineStore('user', {
  state: (): UserState => ({
    token: LocalStorage.getItem(`${process.env.APP_NAME}_token`) || null,
    ioStore: {},
  }),
  getters: {
    isAuthenticated: (state) => {
      return !!state.token;
    },
  },
  actions: {
    setSocket(io: { socket?: Socket; authenticated?: boolean }) {
      this.ioStore = { ...this.ioStore, ...io };
    },
  },
});
