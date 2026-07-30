import { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { toast } from "react-toastify";
import { PositionsApi } from "../../api/resources.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useErrorHandler } from "../../utils/errorHandler.js";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export default function ApiTokenModal({ show, onHide, positionId }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    PositionsApi.getApiToken(positionId)
      .then((res) => setToken(res.apiToken))
      .catch((err) => toast.error(translateError(err)))
      .finally(() => setLoading(false));
  }, [show, positionId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await PositionsApi.generateApiToken(positionId);
      setToken(res.apiToken);
      toast.success(t("apiTokenGenerated"));
    } catch (err) {
      toast.error(translateError(err));
    } finally {
      setGenerating(false);
    }
  };

  const externalUrl = token
    ? `${API_BASE_URL}/external/positions/aggregate?token=${token}`
    : "";

  const copy = (value) => {
    navigator.clipboard.writeText(value);
    toast.success(t("copied"));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{t("apiToken")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">{t("apiTokenDescription")}</p>

        {loading ? (
          <p>{t("loading")}</p>
        ) : token ? (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>{t("apiToken")}</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control value={token} readOnly />
                <Button variant="outline-secondary" onClick={() => copy(token)}>
                  {t("copy")}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("apiTokenUrl")}</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control value={externalUrl} readOnly />
                <Button
                  variant="outline-secondary"
                  onClick={() => copy(externalUrl)}
                >
                  {t("copy")}
                </Button>
              </div>
            </Form.Group>
          </div>
        ) : (
          <p className="text-muted">{t("apiTokenNotGenerated")}</p>
        )}

        <Button variant="primary" onClick={generate} disabled={generating}>
          {generating
            ? t("saving")
            : token
              ? t("apiTokenRegenerate")
              : t("apiTokenGenerate")}
        </Button>
        {token && (
          <p className="text-muted small mt-2 mb-0">
            {t("apiTokenRegenerateWarning")}
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {t("close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
