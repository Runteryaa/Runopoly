import { create } from 'zustand';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertOptions = {
  cancelable?: boolean;
};

interface AlertState {
  isVisible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  options?: AlertOptions;
  showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  title: '',
  message: '',
  buttons: [],
  options: {},
  showAlert: (title, message = '', buttons = [{ text: 'OK' }], options = {}) => 
    set({ isVisible: true, title, message, buttons, options }),
  hideAlert: () => set({ isVisible: false, title: '', message: '', buttons: [] }),
}));
