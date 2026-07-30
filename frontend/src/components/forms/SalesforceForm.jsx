import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const EMPTY = {
  companyName: "",
  phone: "",
  jobTitle: "",
  country: "",
  notes: "",
};

const LIMITS = {
  companyName: 80,
  phone: 20,
  jobTitle: 60,
  country: 40,
  notes: 500,
};

const sanitizePhone = (value) => value.replace(/[^\d+\-() ]/g, "");
const sanitizeLetters = (value) => value.replace(/[^\p{L}\s\-.]/gu, "");
const sanitizeFreeText = (value) => value.replace(/[<>]/g, "");

const SANITIZERS = {
  companyName: sanitizeFreeText,
  phone: sanitizePhone,
  jobTitle: sanitizeFreeText,
  country: sanitizeLetters,
  notes: sanitizeFreeText,
};

const PHONE_PATTERN = /^[\d+\-() ]{6,20}$/;

export default function SalesforceForm({ show, onHide, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  const set = (field) => (e) => {
    const sanitize = SANITIZERS[field] || ((v) => v);
    const value = sanitize(e.target.value).slice(0, LIMITS[field]);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      setError(t("salesforceInvalidPhone"));
      return;
    }

    setSubmitting(true);
    try {
      const trimmed = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      );
      await onSubmit(trimmed);
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || t("failedSalesforceSync"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>{t("salesforceSyncTitle")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">{t("salesforceSyncDescription")}</p>
          {error && <div className="alert alert-danger">{error}</div>}

          <Form.Group className="mb-3">
            <Form.Label>{t("salesforceCompanyName")}</Form.Label>
            <Form.Control
              value={form.companyName}
              onChange={set("companyName")}
              placeholder={t("salesforceCompanyNamePlaceholder")}
              maxLength={LIMITS.companyName}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Label>{t("salesforcePhone")}</Form.Label>
              <Form.Control
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+380 XX XXX XX XX"
                maxLength={LIMITS.phone}
              />
              {form.phone && !PHONE_PATTERN.test(form.phone) && (
                <Form.Text className="text-danger">
                  {t("salesforceInvalidPhone")}
                </Form.Text>
              )}
            </Col>
            <Col>
              <Form.Label>{t("salesforceJobTitle")}</Form.Label>
              <Form.Control
                value={form.jobTitle}
                onChange={set("jobTitle")}
                maxLength={LIMITS.jobTitle}
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>{t("salesforceCountry")}</Form.Label>
            <Form.Control
              value={form.country}
              onChange={set("country")}
              maxLength={LIMITS.country}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("salesforceNotes")}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder={t("salesforceNotesPlaceholder")}
              maxLength={LIMITS.notes}
            />
            <Form.Text className="text-muted">
              {form.notes.length}/{LIMITS.notes}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("saving") : t("salesforceSyncButton")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
