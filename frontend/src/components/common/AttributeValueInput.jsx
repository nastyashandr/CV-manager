import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ImageDropzone from "./ImageDropzone.jsx";
import CustomSelect from "../common/CustomSelect.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function StringInput({ value, onChange }) {
  return (
    <Form.Control
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextInput({ value, onChange }) {
  return (
    <Form.Control
      as="textarea"
      rows={3}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function NumberInput({ value, onChange }) {
  return (
    <Form.Control
      type="number"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
    />
  );
}

function DateInput({ value, onChange }) {
  return (
    <Form.Control
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function PeriodInput({ value, onChange }) {
  const period = value || { start: "", end: "" };
  const { t } = useLanguage();
  return (
    <Row className="g-2">
      <Col>
        <Form.Control
          type="date"
          value={period.start || ""}
          onChange={(e) => onChange({ ...period, start: e.target.value })}
          placeholder={t("start")}
        />
      </Col>
      <Col>
        <Form.Control
          type="date"
          value={period.end || ""}
          onChange={(e) => onChange({ ...period, end: e.target.value })}
          placeholder={t("end")}
        />
      </Col>
    </Row>
  );
}

function BooleanInput({ value, onChange }) {
  return (
    <Form.Check
      type="checkbox"
      checked={Boolean(value)}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function SelectInput({ value, onChange, options }) {
  const { t } = useLanguage();
  const selectOptions = [
    { value: "", label: t("select") },
    ...(options || []).map((opt) => ({ value: opt, label: opt })),
  ];

  return (
    <CustomSelect
      value={value || ""}
      options={selectOptions}
      onChange={onChange}
    />
  );
}

function ImageInput({ value, onChange }) {
  return <ImageDropzone value={value} onChange={onChange} />;
}

const INPUT_BY_TYPE = {
  string: StringInput,
  text: TextInput,
  number: NumberInput,
  date: DateInput,
  period: PeriodInput,
  boolean: BooleanInput,
  select: SelectInput,
  image: ImageInput,
};

export default function AttributeValueInput({
  type,
  value,
  onChange,
  options,
}) {
  const Input = INPUT_BY_TYPE[type] || StringInput;
  return <Input value={value} onChange={onChange} options={options} />;
}
