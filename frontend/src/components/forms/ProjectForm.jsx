import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import TagAutocomplete from "../common/TagAutocomplete.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const EMPTY = {
  name: "",
  periodStart: "",
  periodEnd: "",
  description: "",
  tags: [],
};

export default function ProjectForm({ show, onHide, onSubmit, initial }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError(t("projectNameRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
      });
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || t("failedSaveProject"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {initial ? t("editProject") : t("newProject")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Form.Group className="mb-3">
            <Form.Label>{t("projectName")} *</Form.Label>
            <Form.Control
              required
              value={form.name}
              onChange={set("name")}
              placeholder={t("projectNamePlaceholder")}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Label>{t("start")}</Form.Label>
              <Form.Control
                type="date"
                value={form.periodStart || ""}
                onChange={set("periodStart")}
              />
            </Col>
            <Col>
              <Form.Label>{t("end")}</Form.Label>
              <Form.Control
                type="date"
                value={form.periodEnd || ""}
                onChange={set("periodEnd")}
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>{t("description")}</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={form.description || ""}
              onChange={set("description")}
              placeholder={t("projectDescriptionPlaceholder")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("tags")}</Form.Label>
            <TagAutocomplete
              value={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("saving") : initial ? t("update") : t("add")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
