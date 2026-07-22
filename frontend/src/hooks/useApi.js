import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export function useApi(apiFunction, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const { t } = useLanguage();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      if (mountedRef.current) {
        setData(result);
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        const message = err.response?.data?.message || t('errorOccurred');
        if (options.showToast !== false) {
          toast.error(message);
        }
        if (options.onError) {
          options.onError(err);
        }
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, options, t]);

  return { execute, loading, error, data };
}

export function useLoadData(apiFunction, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (loadingRef.current || !mountedRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const result = await apiFunction();
      if (mountedRef.current) {
        setData(result);
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        const message = error.response?.data?.message || t('errorOccurred');
        if (options.showToast !== false) {
          toast.error(message);
        }
        if (options.onError) {
          options.onError(error);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [apiFunction, options, t]);

  return { data, loading, load, setData };
}

export function useSelection() {
  const [selected, setSelected] = useState(new Set());

  const toggle = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);
  const isSelected = useCallback((id) => selected.has(id), [selected]);
  const count = selected.size;

  return { selected, toggle, clear, isSelected, count, setSelected };
}