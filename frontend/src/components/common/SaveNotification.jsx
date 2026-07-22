import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useSaveNotification() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const toastIdRef = useState(null);

  const startSaving = () => {
    setIsSaving(true);
    setIsSaved(false);
    setError(null);
  };

  const finishSaving = (success = true, errorMsg = null) => {
    setIsSaving(false);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } else {
      setError(errorMsg);
    }
  };

  return { isSaving, isSaved, error, startSaving, finishSaving };
}

export function SaveNotification({ isSaving, isSaved, error }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (isSaving) {
      toast.info(t("saving"), {
        position: "bottom-right",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        toastId: "saving-toast",
      });
    } else {
      toast.dismiss("saving-toast");
    }

    if (isSaved) {
      toast.success(t("autoSaved"), {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "saved-toast",
      });
    }

    if (error) {
      toast.error(error, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "error-toast",
      });
    }
  }, [isSaving, isSaved, error, t]);

  return null;
}
