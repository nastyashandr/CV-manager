import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { SupportTicketApi } from "../../api/resources.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useSupportTicketContext } from "../../contexts/SupportTicketContext.jsx";
import { useErrorHandler } from "../../utils/errorHandler.js";
import PrioritySelect from "./PrioritySelect.jsx";

export default function SupportTicketModal({ show, onHide }) {
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("Average");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();
  const { positionTitle } = useSupportTicketContext();
  const { translateError } = useErrorHandler();

  const submit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setSubmitting(true);
    try {
      await SupportTicketApi.create({
        summary: summary.trim(),
        priority,
        positionTitle,
        link: window.location.href,
      });
      toast.success(t("supportTicketCreated"));
      setSummary("");
      setPriority("Average");
      onHide();
    } catch (err) {
      toast.error(translateError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>{t("createSupportTicket")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">{t("supportTicketDescription")}</p>

          {positionTitle && (
            <p className="text-muted small mb-3">
              {t("supportTicketPosition")}: <strong>{positionTitle}</strong>
            </p>
          )}

          <Form.Group className="mb-3">
            <Form.Label>{t("supportTicketSummary")}</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              required
              maxLength={1000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t("supportTicketSummaryPlaceholder")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("supportTicketPriority")}</Form.Label>
            <PrioritySelect value={priority} onChange={setPriority} t={t} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("saving") : t("supportTicketSubmit")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
