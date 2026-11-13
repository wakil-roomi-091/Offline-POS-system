import { create } from 'zustand';
import { db } from '../db';

interface SecurityState {
  managerPin: string;
  adminPinRequired: boolean;
  managerWitnessPin: boolean;
  isPinModalOpen: boolean;
  pinPromptReason: string;
  pinCallback: (() => void) | null;

  loadSecurityConfig: () => Promise<void>;
  requestPinAuthorization: (reason: string, onSuccess: () => void) => void;
  closePinModal: () => void;
  verifyPin: (pin: string) => boolean;
  updateManagerPin: (newPin: string) => Promise<boolean>;
  setSecurityToggles: (adminRequired: boolean, witnessRequired: boolean) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  managerPin: '1234',
  adminPinRequired: true,
  managerWitnessPin: true,
  isPinModalOpen: false,
  pinPromptReason: 'Supervisor Authorization Required',
  pinCallback: null,

  loadSecurityConfig: async () => {
    try {
      const pinRecord = await db.settings.get('managerPin');
      if (pinRecord && pinRecord.value) {
        set({ managerPin: String(pinRecord.value) });
      }

      const configRecord = await db.settings.get('storeConfig');
      if (configRecord && configRecord.value) {
        const val = configRecord.value;
        set({
          adminPinRequired: val.adminPinRequired !== undefined ? val.adminPinRequired : true,
          managerWitnessPin: val.managerWitnessPin !== undefined ? val.managerWitnessPin : true,
        });
      }
    } catch (err) {
      console.warn('Could not load security config:', err);
    }
  },

  requestPinAuthorization: (reason: string, onSuccess: () => void) => {
    const { adminPinRequired } = get();
    // If admin PIN requirement is toggled off, proceed directly
    if (!adminPinRequired) {
      onSuccess();
      return;
    }

    set({
      isPinModalOpen: true,
      pinPromptReason: reason,
      pinCallback: onSuccess,
    });
  },

  closePinModal: () => {
    set({
      isPinModalOpen: false,
      pinPromptReason: '',
      pinCallback: null,
    });
  },

  verifyPin: (pin: string) => {
    const { managerPin } = get();
    return pin.trim() === managerPin.trim();
  },

  updateManagerPin: async (newPin: string) => {
    if (!newPin || newPin.trim().length < 4) return false;
    try {
      await db.settings.put({
        key: 'managerPin',
        value: newPin.trim(),
      });
      set({ managerPin: newPin.trim() });
      return true;
    } catch {
      set({ managerPin: newPin.trim() });
      return true;
    }
  },

  setSecurityToggles: async (adminRequired: boolean, witnessRequired: boolean) => {
    set({ adminPinRequired: adminRequired, managerWitnessPin: witnessRequired });
    try {
      const existing = (await db.settings.get('storeConfig'))?.value || {};
      await db.settings.put({
        key: 'storeConfig',
        value: {
          ...existing,
          adminPinRequired: adminRequired,
          managerWitnessPin: witnessRequired,
        },
      });
    } catch {
      // ignore
    }
  },
}));
