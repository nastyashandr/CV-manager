import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import CustomSelect from "../common/CustomSelect.jsx";
import {
  ATTRIBUTE_TYPES,
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_TYPE_LABELS,
} from "../../utils/constants.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const EMPTY = {
  name: "",
  category: ATTRIBUTE_CATEGORIES[0] || "Personal",
  type: "string",
  options: [],
};
const BUILTIN_NAMES = ["First Name", "Last Name", "Location", "Personal Photo"];

function parseOptions(text) {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function BuiltinNotice({ show, onHide, t }) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Body>
        <p className="text-center">{t("builtinCannotEdit")}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {t("close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function AttributeForm({ show, onHide, onSubmit, initial }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [optionsText, setOptionsText] = useState(
    (initial?.options || []).join(", "),
  );
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const isBuiltin = initial && BUILTIN_NAMES.includes(initial.name);

  const categoryOptions = ATTRIBUTE_CATEGORIES.map((c) => ({
    value: c,
    label: t(c) || c,
  }));
  const typeOptions = ATTRIBUTE_TYPES.map((type) => ({
    value: type,
    label:
      t(ATTRIBUTE_TYPE_LABELS[type]) || ATTRIBUTE_TYPE_LABELS[type] || type,
  }));

  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const options = form.type === "select" ? parseOptions(optionsText) : [];
    onSubmit({ ...form, options });
    setSubmitting(false);
  };

  const updateField = (field) => (val) =>
    setForm((f) => ({ ...f, [field]: val }));

  if (isBuiltin) {
    return <BuiltinNotice show={show} onHide={onHide} t={t} />;
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {initial ? t("editAttribute") : t("newAttribute")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{t("name")}</Form.Label>
            <Form.Control
              required
              value={form.name}
              onChange={(e) => updateField("name")(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("category")}</Form.Label>
            <CustomSelect
              value={form.category}
              options={categoryOptions}
              onChange={updateField("category")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("type")}</Form.Label>
            <CustomSelect
              value={form.type}
              options={typeOptions}
              onChange={updateField("type")}
            />
          </Form.Group>

          {form.type === "select" && (
            <Form.Group className="mb-3">
              <Form.Label>{t("options")}</Form.Label>
              <Form.Control
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Junior, Middle, Senior"
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("saving") : t("save")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
