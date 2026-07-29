import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { SalesforceApi } from "../../api/resources.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useErrorHandler } from "../../utils/errorHandler.js";
import SalesforceExportForm from "../forms/SalesforceExportForm.jsx";

export default function SalesforceModal({ show, onHide }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (show && user) {
      loadStatus();
    }
  }, [show, user]);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await SalesforceApi.getStatus();
      setSyncStatus(status);
    } catch (err) {
      console.debug("Status check not available");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubmit = async (formData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await SalesforceApi.sync(formData);

      toast.success(
        result.action === "created"
          ? t("salesforceExportSuccess")
          : t("salesforceUpdateSuccess"),
      );

      await loadStatus();

      setTimeout(() => {
        onHide();
      }, 1000);
    } catch (err) {
      const message = translateError(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(t("confirmDeactivateSync"))) return;

    try {
      await SalesforceApi.deactivate();
      toast.success(t("syncDeactivated"));
      await loadStatus();
    } catch (err) {
      toast.error(translateError(err));
    }
  };

  const renderStatus = () => {
    if (loadingStatus) {
      return <div className="text-muted">{t("loading")}</div>;
    }

    if (syncStatus?.synced) {
      return (
        <div className="mb-3 p-2 bg-success bg-opacity-10 border border-success rounded">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="text-success">✅ {t("syncedToSalesforce")}</div>
              <small className="text-muted">
                Account: {syncStatus.accountId}
                <br />
                Contact: {syncStatus.contactId}
                <br />
                {t("syncedAt")}:{" "}
                {new Date(syncStatus.syncedAt).toLocaleString()}
              </small>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleDeactivate}
            >
              {t("disconnect")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-3 p-2 bg-info bg-opacity-10 border border-info rounded">
        <div className="text-info"> {t("notSyncedToSalesforce")}</div>
        <small className="text-muted">{t("salesforceExportInfo")}</small>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <span className="me-2">☁️</span>
          {t("salesforceIntegration")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderStatus()}
        <SalesforceExportForm
          user={user}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          onCancel={onHide}
        />
      </Modal.Body>
    </Modal>
  );
}
