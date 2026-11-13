import React, { useState, useEffect, useCallback } from 'react';
import { useSecurityStore } from '../../store/useSecurityStore';
import { ShieldAlert, Delete, RotateCcw, X, CheckCircle2 } from 'lucide-react';

const SupervisorPinModalDialog: React.FC = () => {
  const { pinPromptReason, pinCallback, closePinModal, verifyPin } = useSecurityStore();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleDigit = useCallback(
    (digit: string) => {
      if (isSuccess) return;
      setErrorMessage('');
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        if (next.length === 4) {
          const isValid = verifyPin(next);
          if (isValid) {
            setIsSuccess(true);
            setTimeout(() => {
              if (pinCallback) {
                pinCallback();
              }
              closePinModal();
            }, 350);
          } else {
            setIsShaking(true);
            setErrorMessage('Incorrect PIN. Please re-enter supervisor PIN.');
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 500);
          }
        }
        return next;
      });
    },
    [isSuccess, verifyPin, pinCallback, closePinModal]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess]);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    setErrorMessage('');
    setPin('');
  }, [isSuccess]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        closePinModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, closePinModal]);

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-fade-in"
    >
      <div
        className={`bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center transition-all ${
          isShaking ? 'translate-x-1 animate-pulse border-rose-300' : ''
        }`}
      >
        {/* Close Button */}
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={closePinModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Cancel authorization"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shield Icon Badge */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
            isSuccess
              ? 'bg-emerald-100 text-emerald-600'
              : errorMessage
              ? 'bg-rose-100 text-rose-600'
              : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <ShieldAlert className="w-8 h-8" />
          )}
        </div>

        {/* Modal Title & Reason */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Manager Authorization
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
          {pinPromptReason || 'Enter 4-digit supervisor PIN to authorize this action.'}
        </p>

        {/* 4-Digit PIN Circles Indicator */}
        <div className="flex items-center justify-center gap-3 my-5">
          {[0, 1, 2, 3].map((idx) => {
            const hasChar = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isSuccess
                    ? 'bg-emerald-500 scale-110'
                    : errorMessage
                    ? 'bg-rose-500 scale-105'
                    : hasChar
                    ? 'bg-[#3FA9A8] scale-110 ring-4 ring-teal-100'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Status Notice */}
        {errorMessage && (
          <p className="text-[11px] font-semibold text-rose-500 -mt-2 mb-3">
            {errorMessage}
          </p>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-lg font-bold transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-xs font-semibold transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            title="Clear entered digits"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-lg font-bold transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-xs font-semibold transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Default Tip */}
        <p className="text-[10px] text-slate-400 mt-4">
          Default supervisor PIN is <strong>1234</strong> • Configurable in Settings
        </p>
      </div>
    </div>
  );
};

export const SupervisorPinModal: React.FC = () => {
  const isPinModalOpen = useSecurityStore((state) => state.isPinModalOpen);
  if (!isPinModalOpen) return null;
  return <SupervisorPinModalDialog />;
};
