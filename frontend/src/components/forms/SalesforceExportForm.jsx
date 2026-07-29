import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function SalesforceExportForm({
  user,
  onSubmit,
  isSubmitting,
  error,
  onCancel,
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    company: "",
    phone: "",
    title: "",
    interests: "",
    consent: false,
  });

  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!form.company?.trim()) {
      errors.company = t("companyNameRequired");
    }
    if (!form.consent) {
      errors.consent = t("consentRequired");
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleConsentChange = (e) => {
    setForm((prev) => ({ ...prev, consent: e.target.checked }));
    if (validationErrors.consent) {
      setValidationErrors((prev) => ({ ...prev, consent: null }));
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>
          {t("companyName")} <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          type="text"
          value={form.company}
          onChange={handleChange("company")}
          placeholder={t("companyNamePlaceholder")}
          isInvalid={!!validationErrors.company}
          disabled={isSubmitting}
        />
        <Form.Control.Feedback type="invalid">
          {validationErrors.company}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t("phone")}</Form.Label>
        <Form.Control
          type="tel"
          value={form.phone}
          onChange={handleChange("phone")}
          placeholder={t("phonePlaceholder")}
          disabled={isSubmitting}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t("jobTitle")}</Form.Label>
        <Form.Control
          type="text"
          value={form.title}
          onChange={handleChange("title")}
          placeholder={t("jobTitlePlaceholder")}
          disabled={isSubmitting}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t("interests")}</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={form.interests}
          onChange={handleChange("interests")}
          placeholder={t("interestsPlaceholder")}
          disabled={isSubmitting}
        />
        <Form.Text className="text-muted">{t("interestsHelp")}</Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label={t("consentText")}
          checked={form.consent}
          onChange={handleConsentChange}
          isInvalid={!!validationErrors.consent}
          disabled={isSubmitting}
        />
        <Form.Control.Feedback type="invalid">
          {validationErrors.consent}
        </Form.Control.Feedback>
      </Form.Group>

      <div className="d-flex gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? t("exporting") : t("exportToSalesforce")}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t("cancel")}
        </Button>
      </div>

      <div className="mt-3">
        <small className="text-muted"> {t("salesforceInfo")}</small>
      </div>
    </Form>
  );
}
