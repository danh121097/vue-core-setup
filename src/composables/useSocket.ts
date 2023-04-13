import { userStore } from '@store';
import io, { Socket } from 'socket.io-client';
import { createHmac } from 'crypto';
import { throttle } from 'lodash';

export declare interface IoComposable {
  socket: Socket;
  authenticated: Ref<boolean>;
}

function signHeader() {
  const ctime = +new Date();
  const stringToSign = `GET
application/json
${ctime}
/socket
`;
  const sig = createHmac('sha256', process.env.HMAC_SECRET || '')
    .update(stringToSign)
    .digest('base64');
  return {
    sig,
    ctime,
  };
}

export function useSocket(onConnected?: () => unknown) {
  const URL = process.env.ENDPOINT || '';
  const store = userStore();
  const { token, ioStore } = storeToRefs(store);

  const socket = io(URL, {
    auth: {
      token: `Bearer ${
        LocalStorage.getItem(`${process.env.APP_NAME}_token`) || ''
      }`,
      role: 'user',
      ...signHeader(),
    },
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
    forceBase64: true,
  });

  const reConnect = () => {
    destroySocket();
    connectSocket();
  };
  const throttleReConnect = throttle(reConnect, 2000);

  const onConnectError = async (e: Error) => {
    if (e.message === 'Unauthorized!') {
      store.setSocket({ authenticated: false });
    }
    throttleReConnect();
  };

  const throttleOnConnectError = throttle(onConnectError, 1000);

  socket.on('authenticated', () => {
    if (onConnected) onConnected();
  });

  socket.on('connect_error', throttleOnConnectError);
  socket.on('unauthorized', async () => {
    destroySocket();
  });

  function destroySocket() {
    socket.disconnect();
    store.setSocket({ socket: socket });
  }

  function connectSocket() {
    if (!token.value) return;
    socket.auth = {
      token: `Bearer ${token.value || ''}`,
      role: 'user',
      ...signHeader(),
    };
    socket.connect();
    store.setSocket({ authenticated: true, socket: socket });
  }

  onMounted(() => {
    if (token.value) {
      connectSocket();
    }
  });

  onBeforeUnmount(() => {
    destroySocket();
  });

  return {
    socket,
    authenticated: !!ioStore.value?.authenticated,
    connectSocket,
    destroySocket,
  };
}

export function useIo() {
  const { ioStore } = storeToRefs(userStore());

  if (!ioStore.value.socket) {
    const { socket, authenticated } = useSocket(void 0);
    return {
      socket,
      authenticated,
    };
  }

  return {
    socket: ioStore.value.socket,
    authenticated: ioStore.value.authenticated,
  };
}
