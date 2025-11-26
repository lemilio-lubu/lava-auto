'use client';

import { useState, useCallback } from 'react';

type ModalType = 'success' | 'error' | 'info' | 'warning';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showModal = useCallback((
    title: string,
    message: string,
    type: ModalType = 'info'
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showModal(title, message, 'success');
  }, [showModal]);

  const showError = useCallback((title: string, message: string) => {
    showModal(title, message, 'error');
  }, [showModal]);

  const showWarning = useCallback((title: string, message: string) => {
    showModal(title, message, 'warning');
  }, [showModal]);

  const showInfo = useCallback((title: string, message: string) => {
    showModal(title, message, 'info');
  }, [showModal]);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeModal,
  };
}
