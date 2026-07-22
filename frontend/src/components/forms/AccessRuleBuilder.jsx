import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import CustomSelect from "../common/CustomSelect.jsx";
import {
  OPERATORS_BY_TYPE,
  ATTRIBUTE_TYPE_LABELS,
} from "../../utils/constants.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useSelection } from "../../hooks/useApi.js";

function attributeTypeLabel(attribute, t) {
  return (
    t(ATTRIBUTE_TYPE_LABELS[attribute?.type]) ||
    ATTRIBUTE_TYPE_LABELS[attribute?.type] ||
    attribute?.type
  );
}

function RuleLabel({ attribute, t }) {
  return (
    <>
      <span className="fw-semibold">{attribute?.name || "Unknown"}</span>
      <span className="text-muted small ms-1">
        ({attributeTypeLabel(attribute, t)})
      </span>
    </>
  );
}

function SelectionCheckbox({ checked, onToggle }) {
  return (
    <Col xs={1}>
      <Form.Check type="checkbox" checked={checked} onChange={onToggle} />
    </Col>
  );
}

function BooleanRuleRow({ rule, attribute, onChange, selected, onToggle, t }) {
  return (
    <Row className="g-2 align-items-center mb-2">
      <SelectionCheckbox checked={selected} onToggle={onToggle} />
      <Col xs={3}>
        <RuleLabel attribute={attribute} t={t} />
      </Col>
      <Col xs={8}>
        <Form.Check
          type="checkbox"
          checked={rule.value === true || rule.value === "true"}
          onChange={(e) =>
            onChange({ ...rule, operator: "checked", value: e.target.checked })
          }
          label={t("checked")}
        />
      </Col>
    </Row>
  );
}

function PeriodRuleRow({
  rule,
  attribute,
  onChange,
  hasError,
  selected,
  onToggle,
  t,
}) {
  const setBound = (bound) => (e) =>
    onChange({ ...rule, value: { ...rule.value, [bound]: e.target.value } });
  return (
    <Row className="g-2 align-items-center mb-2">
      <SelectionCheckbox checked={selected} onToggle={onToggle} />
      <Col xs={2}>
        <RuleLabel attribute={attribute} t={t} />
      </Col>
      <Col xs={9}>
        <div className="d-flex gap-2">
          <Form.Control
            size="sm"
            type="date"
            value={rule.value?.start || ""}
            onChange={setBound("start")}
            placeholder={t("start")}
            className={hasError ? "is-invalid" : ""}
            style={{ height: "31px" }}
          />
          <Form.Control
            size="sm"
            type="date"
            value={rule.value?.end || ""}
            onChange={setBound("end")}
            placeholder={t("end")}
            className={hasError ? "is-invalid" : ""}
            style={{ height: "31px" }}
          />
        </div>
      </Col>
    </Row>
  );
}

function ValueInput({ rule, attribute, onChange, hasError, t }) {
  const invalidClass = hasError ? "is-invalid" : "";
  const setValue = (val) => onChange({ ...rule, value: val });

  if (attribute?.type === "date") {
    return (
      <Form.Control
        size="sm"
        type="date"
        value={rule.value || ""}
        onChange={(e) => setValue(e.target.value)}
        className={invalidClass}
        style={{ height: "31px" }}
      />
    );
  }

  if (attribute?.type === "select" && attribute?.options?.length) {
    const options = [
      { value: "", label: t("selectValue") },
      ...attribute.options.map((opt) => ({ value: opt, label: opt })),
    ];
    return (
      <CustomSelect
        value={rule.value || ""}
        options={options}
        onChange={setValue}
        wrapperClassName={invalidClass}
        style={{ height: "31px", minHeight: "31px" }}
      />
    );
  }

  if (attribute?.type === "number") {
    return (
      <Form.Control
        size="sm"
        type="number"
        value={rule.value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("enterNumber")}
        className={invalidClass}
        style={{ height: "31px" }}
      />
    );
  }

  return (
    <Form.Control
      size="sm"
      type="text"
      value={rule.value ?? ""}
      onChange={(e) => setValue(e.target.value)}
      placeholder={t("enterValue")}
      className={invalidClass}
      style={{ height: "31px" }}
    />
  );
}

function DefaultRuleRow({
  rule,
  attribute,
  onChange,
  hasError,
  selected,
  onToggle,
  t,
}) {
  const operators = OPERATORS_BY_TYPE[attribute?.type] || [
    { value: "=", label: "=" },
  ];
  const operatorOptions = operators.map((op) => ({
    value: op.value,
    label: t(op.label) || op.label,
  }));

  return (
    <Row className="g-2 align-items-center mb-2">
      <SelectionCheckbox checked={selected} onToggle={onToggle} />
      <Col xs={2}>
        <RuleLabel attribute={attribute} t={t} />
      </Col>
      <Col xs={3}>
        <CustomSelect
          value={rule.operator || "="}
          options={operatorOptions}
          onChange={(val) => onChange({ ...rule, operator: val })}
          wrapperClassName={hasError ? "is-invalid" : ""}
          style={{ height: "31px", minHeight: "31px" }}
        />
      </Col>
      <Col xs={6}>
        <ValueInput
          rule={rule}
          attribute={attribute}
          onChange={onChange}
          hasError={hasError}
          t={t}
        />
      </Col>
    </Row>
  );
}

function RuleRow({
  rule,
  attribute,
  onChange,
  errors = {},
  selected,
  onSelectChange,
}) {
  const { t } = useLanguage();
  const hasError = errors[rule.id || ""] || false;
  const onToggle = () => onSelectChange?.(rule.id);

  if (attribute?.type === "image") return null;
  if (attribute?.type === "boolean") {
    return (
      <BooleanRuleRow
        rule={rule}
        attribute={attribute}
        onChange={onChange}
        selected={selected}
        onToggle={onToggle}
        t={t}
      />
    );
  }
  if (attribute?.type === "period") {
    return (
      <PeriodRuleRow
        rule={rule}
        attribute={attribute}
        onChange={onChange}
        hasError={hasError}
        selected={selected}
        onToggle={onToggle}
        t={t}
      />
    );
  }
  return (
    <DefaultRuleRow
      rule={rule}
      attribute={attribute}
      onChange={onChange}
      hasError={hasError}
      selected={selected}
      onToggle={onToggle}
      t={t}
    />
  );
}

function buildNewRule(attribute) {
  const isBoolean = attribute.type === "boolean";
  const isPeriod = attribute.type === "period";
  return {
    id: Date.now().toString(),
    attributeId: attribute.id,
    operator: isBoolean ? "checked" : "=",
    value: isPeriod ? { start: "", end: "" } : isBoolean ? false : "",
  };
}

function BuilderToolbar({
  selectedCount,
  onDeleteSelected,
  canAddRule,
  onAddRule,
  t,
}) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <Form.Label className="mb-0 fw-bold">{t("accessRules")}</Form.Label>
      <div className="d-flex gap-2">
        <Button
          size="sm"
          variant="outline-danger"
          disabled={selectedCount === 0}
          onClick={onDeleteSelected}
        >
          {t("deleteSelected")}
        </Button>
        <Button
          size="sm"
          variant="outline-primary"
          disabled={!canAddRule}
          onClick={onAddRule}
        >
          {t("addRule")}
        </Button>
      </div>
    </div>
  );
}

export default function AccessRuleBuilder({
  rules,
  positionAttributes,
  onChange,
  errors = {},
}) {
  const { selected, toggle, clear, isSelected, count } = useSelection();
  const { t } = useLanguage();

  const filteredAttributes = positionAttributes.filter(
    (pa) => pa.attribute?.type !== "image",
  );
  const availableAttributes = filteredAttributes.filter(
    (pa) => !rules.find((r) => r.attributeId === pa.attributeId),
  );

  const update = (idx, next) =>
    onChange(rules.map((r, i) => (i === idx ? next : r)));

  const addRule = () => {
    if (!availableAttributes.length) return;
    onChange([...rules, buildNewRule(availableAttributes[0].attribute)]);
  };

  const deleteSelected = () => {
    if (!count) return;
    onChange(rules.filter((r) => !selected.has(r.id)));
    clear();
  };

  if (!filteredAttributes.length) {
    return <p className="text-muted small">{t("noAttributesForRules")}</p>;
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        <BuilderToolbar
          selectedCount={count}
          onDeleteSelected={deleteSelected}
          canAddRule={availableAttributes.length > 0}
          onAddRule={addRule}
          t={t}
        />

        {count > 0 && (
          <div className="text-muted small mb-2">
            {t("rulesSelected", { count })}
          </div>
        )}

        {rules.map((rule, idx) => {
          const attr = filteredAttributes.find(
            (pa) => pa.attributeId === rule.attributeId,
          );
          if (!attr) return null;
          return (
            <RuleRow
              key={rule.id || idx}
              rule={rule}
              attribute={attr.attribute}
              onChange={(r) => update(idx, r)}
              errors={errors}
              selected={isSelected(rule.id)}
              onSelectChange={toggle}
            />
          );
        })}
        {!rules.length && (
          <p className="text-muted small mt-2">{t("accessRulesDescription")}</p>
        )}
      </Card.Body>
    </Card>
  );
}
