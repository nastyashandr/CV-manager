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
  city: "",
  country: "",
  notes: "",
};

export default function SalesforceForm({ show, onHide, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
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
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Label>{t("salesforcePhone")}</Form.Label>
              <Form.Control value={form.phone} onChange={set("phone")} />
            </Col>
            <Col>
              <Form.Label>{t("salesforceJobTitle")}</Form.Label>
              <Form.Control value={form.jobTitle} onChange={set("jobTitle")} />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Label>{t("salesforceCity")}</Form.Label>
              <Form.Control value={form.city} onChange={set("city")} />
            </Col>
            <Col>
              <Form.Label>{t("salesforceCountry")}</Form.Label>
              <Form.Control value={form.country} onChange={set("country")} />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>{t("salesforceNotes")}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder={t("salesforceNotesPlaceholder")}
            />
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
