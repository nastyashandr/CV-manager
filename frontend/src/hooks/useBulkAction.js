import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export function useBulkAction(actionFn, loadFn, options = {}) {
  const { t } = useLanguage();
  const {
    successMessage,
    errorMessage,
    selfId = null,
    showToast = true,
    getSuccessParams
  } = options;

  return useCallback(async (ids, actionParams = {}) => {
    if (!ids || ids.size === 0) {
      if (showToast) toast.warning(t('noItemsSelected'));
      return false;
    }

    const idsArray = Array.from(ids);
    const count = idsArray.length;

    if (selfId && idsArray.includes(selfId)) {
      if (showToast) toast.error(t('cannotActionSelf'));
      return false;
    }

    try {
      for (const id of idsArray) {
        await actionFn(id, actionParams);
      }
      if (showToast) {
        const params = getSuccessParams ? getSuccessParams(actionParams) : { count };
        toast.success(t(successMessage, { count, ...params }));
      }
      if (loadFn) {
        await loadFn();
      }
      return true;
    } catch (error) {
      if (showToast) {
        toast.error(error.response?.data?.message || t(errorMessage));
      }
      return false;
    }
  }, [actionFn, loadFn, t, successMessage, errorMessage, selfId, showToast, getSuccessParams]);
}