import { Alert as RNAlert, Platform } from 'react-native';
import { useAlertStore, AlertButton, AlertOptions } from '../store/alertStore';

export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    useAlertStore.getState().showAlert(title, message, buttons || [{ text: 'OK' }], options);
  }
};
