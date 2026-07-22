import { useLanguage } from "../../contexts/LanguageContext.jsx";

function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "object" && !value.start && !value.end)
  );
}

function formatValue(type, value) {
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "period")
    return `${value?.start || "?"} – ${value?.end || "present"}`;
  if (type === "image") return null;
  return String(value);
}

export default function AttributeValueDisplay({ name, type, value }) {
  const { t } = useLanguage();
  const empty = isEmpty(value);
  return (
    <div className="attribute-display mb-2">
      <div className="text-muted small">{name}</div>
      {empty ? (
        <div className="text-danger fw-semibold">{t("empty")}</div>
      ) : type === "image" ? (
        <img src={value} alt={name} className="attribute-image-preview" />
      ) : (
        <div>{formatValue(type, value)}</div>
      )}
    </div>
  );
}
