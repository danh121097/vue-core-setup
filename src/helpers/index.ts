import { NotifyOtp } from '@helpers/notify';
import { Notify } from 'quasar';
import dayjs from 'dayjs';

let dismiss: (opt?: NotifyOtp) => void;

export const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export function showNotify(options: NotifyOtp) {
  dismiss != void 0 && dismiss();
  if (!options) return;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  dismiss = Notify.create({ ...options, html: true });
  return dismiss;
}

export function closeNotify() {
  dismiss && dismiss();
}

export function formatName(str: string) {
  if (str) {
    const convertToArray = str.toLowerCase().split('_');
    const result = convertToArray.map(function (val) {
      return val.replace(val.charAt(0), val.charAt(0).toUpperCase());
    });
    return result.join(' ');
  }
  return '';
}

export function removeSpace(str: string) {
  return str.replace(/\s/g, '');
}

export function timeFormat(date: string | number, format = 'HH:mm:ss') {
  return dayjs(date).format(format);
}

export function dateFormat(date: string, format = 'DD/MM/YYYY') {
  return dayjs(date).format(format);
}

export function isSingaporeNumber(mobile_number: string) {
  return /^\+?65(8|9)\d{7}$/.test(mobile_number);
}

export function countdownTimer(milisecons: number) {
  const mils = Math.max(milisecons, 0);
  const days = Math.floor(mils / (1000 * 60 * 60 * 24));
  const hours = Math.floor((mils / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((mils / 1000 / 60) % 60);
  const seconds = Math.floor((mils / 1000) % 60);
  return {
    days: ('0' + days).slice(-2),
    hours: ('0' + hours).slice(-2),
    seconds: ('0' + seconds).slice(-2),
    minutes: ('0' + minutes).slice(-2),
  };
}

export function isEmailValid(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
