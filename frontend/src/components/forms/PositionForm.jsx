import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import { toast } from "react-toastify";
import AttributePicker from "./AttributePicker.jsx";
import AccessRuleBuilder from "./AccessRuleBuilder.jsx";
import TagAutocomplete from "../common/TagAutocomplete.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useSelection } from "../../hooks/useApi.js";
import { ATTRIBUTE_TYPE_LABELS } from "../../utils/constants.js";

function toDefaults(position) {
  return {
    title: position?.title || "",
    shortDescription: position?.shortDescription || "",
    isPublic: position?.isPublic ?? true,
    projectTags: position?.projectTags || [],
    maxProjects: position?.maxProjects ?? null,
    attributes: (position?.positionAttributes || []).map((pa) => ({
      attributeId: pa.attributeId,
      attribute: pa.attribute,
      order: pa.order,
      required: pa.required || false,
    })),
    accessRules: (position?.accessRules || []).map((r) => ({
      id: r.id || Date.now().toString() + Math.random(),
      attributeId: r.attributeId,
      operator: r.operator,
      value: r.value,
    })),
  };
}

function ruleIsInvalid(rule, attributes) {
  const attr = attributes.find((a) => a.attributeId === rule.attributeId);
  const type = attr?.attribute?.type;
  if (type === "period") return !rule.value?.start || !rule.value?.end;
  if (type === "boolean") return false;
  return !rule.value || rule.value === "";
}

function validateAccessRules(form) {
  const errors = {};
  if (form.isPublic) return errors;
  form.accessRules.forEach((rule, index) => {
    if (ruleIsInvalid(rule, form.attributes)) {
      errors[rule.id || index] = true;
    }
  });
  return errors;
}

function buildPayload(form) {
  return {
    title: form.title,
    shortDescription: form.shortDescription,
    isPublic: form.isPublic,
    projectTags: form.projectTags,
    maxProjects:
      form.maxProjects === "" || form.maxProjects === null
        ? null
        : Number(form.maxProjects),
    attributes: form.attributes.map((a, i) => ({
      attributeId: a.attributeId,
      order: i,
      required: a.required || false,
    })),
    accessRules: form.isPublic
      ? []
      : form.accessRules.map((r) => ({
          attributeId: r.attributeId,
          operator: r.operator,
          value: r.value,
        })),
  };
}

function AttributeRow({ item, selected, onToggle }) {
  const { t } = useLanguage();
  const typeLabel =
    t(ATTRIBUTE_TYPE_LABELS[item.attribute?.type]) ||
    ATTRIBUTE_TYPE_LABELS[item.attribute?.type] ||
    item.attribute?.type;
  return (
    <ListGroup.Item className="d-flex align-items-center">
      <Form.Check
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="me-2"
        style={{ flexShrink: 0 }}
      />
      <span>
        {item.attribute?.name}
        <span className="text-muted small ms-1">({typeLabel})</span>
        {item.required && <span className="text-danger ms-1">*</span>}
      </span>
    </ListGroup.Item>
  );
}

function AttributesSection({
  form,
  showPicker,
  setShowPicker,
  addAttribute,
  removeAttributes,
  t,
}) {
  const { selected, toggle, clear, isSelected, count } = useSelection();

  const handleDeleteSelected = () => {
    if (count === 0) return;
    removeAttributes(selected);
    clear();
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Label className="mb-0 fw-bold">{t("attributes")}</Form.Label>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-danger"
            disabled={count === 0}
            onClick={handleDeleteSelected}
          >
            {t("deleteSelected")}
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => setShowPicker((s) => !s)}
          >
            {showPicker ? t("close") : t("addAttributeToPosition")}
          </Button>
        </div>
      </div>

      {showPicker && (
        <div className="mb-2">
          <AttributePicker
            excludeIds={form.attributes.map((a) => a.attributeId)}
            onPick={addAttribute}
          />
        </div>
      )}

      {count > 0 && (
        <div className="text-muted small mb-2">
          {t("selectedCount", { count })}
        </div>
      )}

      <ListGroup className="mb-3">
        {form.attributes.map((item) => (
          <AttributeRow
            key={item.attributeId}
            item={item}
            selected={isSelected(item.attributeId)}
            onToggle={() => toggle(item.attributeId)}
          />
        ))}
        {!form.attributes.length && (
          <ListGroup.Item className="text-muted">
            {t("noAttributesSelected")}
          </ListGroup.Item>
        )}
      </ListGroup>
    </>
  );
}

export default function PositionForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(toDefaults(initial));
  const [showPicker, setShowPicker] = useState(false);
  const [accessRuleErrors, setAccessRuleErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const setMaxProjects = (e) => {
    const val = e.target.value === "" ? null : Number(e.target.value);
    setForm((f) => ({ ...f, maxProjects: val }));
  };

  const setTags = (tags) => {
    setForm((f) => ({ ...f, projectTags: tags }));
  };

  const setAccessRules = (rules) => {
    setForm((f) => ({ ...f, accessRules: rules }));
  };

  const setPublic = (checked) => {
    setForm((f) => ({ ...f, isPublic: checked }));
  };

  const addAttribute = (attribute) => {
    setForm((f) => ({
      ...f,
      attributes: [
        ...f.attributes,
        {
          attributeId: attribute.id,
          attribute,
          order: f.attributes.length,
          required: false,
        },
      ],
    }));
    setShowPicker(false);
  };

  const removeAttributes = (selectedIds) => {
    const idsToRemove = Array.from(selectedIds);
    setForm((f) => ({
      ...f,
      attributes: f.attributes.filter(
        (a) => !idsToRemove.includes(a.attributeId),
      ),
      accessRules: f.accessRules.filter(
        (r) => !idsToRemove.includes(r.attributeId),
      ),
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    const errors = validateAccessRules(form);
    if (Object.keys(errors).length > 0) {
      setAccessRuleErrors(errors);
      toast.error(t("fillAccessRules"));
      return;
    }

    setAccessRuleErrors({});
    setSubmitting(true);
    try {
      onSubmit(buildPayload(form));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={submit}>
      <Form.Group className="mb-3">
        <Form.Label>{t("title")}</Form.Label>
        <Form.Control required value={form.title} onChange={set("title")} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t("description")}</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.shortDescription || ""}
          onChange={set("shortDescription")}
        />
      </Form.Group>

      <Row className="mb-3 align-items-center">
        <Col md={6} className="mb-3">
          <Form.Check
            type="switch"
            label={form.isPublic ? t("public") : t("restricted")}
            checked={form.isPublic}
            onChange={(e) => setPublic(e.target.checked)}
            className="mb-0"
          />
        </Col>
        <Col md={6}>
          <Form.Label className="mb-1">{t("maxProjects")}</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={form.maxProjects === null ? "" : form.maxProjects}
            onChange={setMaxProjects}
            placeholder={t("unlimited")}
          />
          <Form.Text className="text-muted">
            {t("leaveEmptyUnlimited")}
          </Form.Text>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>{t("projectTags")}</Form.Label>
        <TagAutocomplete value={form.projectTags} onChange={setTags} />
      </Form.Group>

      <AttributesSection
        form={form}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        addAttribute={addAttribute}
        removeAttributes={removeAttributes}
        t={t}
      />

      {!form.isPublic && form.attributes.length > 0 && (
        <AccessRuleBuilder
          rules={form.accessRules}
          positionAttributes={form.attributes}
          onChange={setAccessRules}
          errors={accessRuleErrors}
        />
      )}

      {!form.isPublic && form.attributes.length === 0 && (
        <p className="text-muted small">{t("addAttributesFirst")}</p>
      )}

      <div className="d-flex gap-2 mt-3">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? t("saving") : t("save")}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          {t("cancel")}
        </Button>
      </div>
    </Form>
  );
}
