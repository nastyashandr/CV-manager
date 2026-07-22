import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'react-toastify';

export function useAutoSave({
  value,
  onSave,
  delay = 1000,
  showToast = true,
}) {
  const [status, setStatus] = useState('idle');
  const timeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setStatus('saving');

    if (showToast) {
      toast.info('Saving...', {
        position: 'bottom-right',
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        toastId: 'auto-save-toast',
      });
    }

    try {
      await onSave(valueRef.current);
      setStatus('saved');

      if (showToast) {
        toast.dismiss('auto-save-toast');
        toast.success('Saved ✓', {
          position: 'bottom-right',
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: 'auto-save-success',
        });
      }

      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      if (showToast) {
        toast.dismiss('auto-save-toast');
        toast.error('Failed to save', {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: 'auto-save-error',
        });
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, showToast]);

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);
  }, [save, delay]);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      toast.dismiss('auto-save-toast');
    };
  }, []);

  return { status, triggerSave, flush, isSaving: status === 'saving' };
}