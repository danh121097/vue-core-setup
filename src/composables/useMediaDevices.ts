type GetUserMedia = (
  constraints: MediaStreamConstraints | undefined,
  resolve: (value: MediaStream | PromiseLike<MediaStream>) => void,
  reject: (reason: unknown) => void
) => MediaStream;

export function useMediaDevice(
  config: {
    video?: any;
    audio?: any;
  },
  allowedCb?: (stream: any, size: any) => void,
  blockedCb?: () => void
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let track: any;
  const isAllowed = LocalStorage.getItem('camera_permission');
  const showAllowAccess = ref(false);
  const showBlockedAccess = ref(false);
  const showScan = ref(false);

  let flash = false;
  if (navigator.mediaDevices === undefined) {
    (navigator as unknown as { mediaDevices?: unknown }).mediaDevices = {};
  }

  const onUpdateFlash = () => {
    if (track) {
      flash = !flash;
      track.applyConstraints({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        advanced: [{ torch: flash }],
      });
    }
  };

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const { getUserMedia, webkitGetUserMedia, mozGetUserMedia } =
        navigator as unknown as {
          getUserMedia?: GetUserMedia;
          webkitGetUserMedia?: GetUserMedia;
          mozGetUserMedia?: GetUserMedia;
        };
      const _getUserMedia =
        getUserMedia || webkitGetUserMedia || mozGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!_getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser')
        );
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        _getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  function preRequest() {
    return request();
  }

  async function request() {
    showAllowAccess.value = false;
    try {
      const userM = await navigator.mediaDevices.getUserMedia(config);
      const { width, height } = userM.getTracks()[0].getSettings();
      LocalStorage.set('camera_permission', true);
      showBlockedAccess.value = false;
      showScan.value = true;
      allowedCb && allowedCb(userM, { width, height });
    } catch (e) {
      showBlockedAccess.value = true;
      LocalStorage.set('camera_permission', false);
      blockedCb && blockedCb();
    }
  }

  return {
    showScan,
    preRequest,
    request,
    showBlockedAccess,
    showAllowAccess,
    onUpdateFlash,
    isAllowed,
  };
}
