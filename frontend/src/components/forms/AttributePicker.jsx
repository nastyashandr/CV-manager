import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import { AttributesApi } from "../../api/resources.js";
import CustomSelect from "../common/CustomSelect.jsx";
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_TYPE_LABELS,
} from "../../utils/constants.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function AttributePicker({ onPick, excludeIds = [] }) {
  const [prefix, setPrefix] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    AttributesApi.categories().then(setCategories);
  }, []);

  useEffect(() => {
    const params = {};
    if (prefix) params.prefix = prefix;
    else params.recent = "true";
    if (category) params.category = category;
    setLoading(true);
    AttributesApi.list(params)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [prefix, category]);

  const visible = results.filter((a) => !excludeIds.includes(a.id));

  const categoryOptions = [
    { value: "", label: t("allCategories") },
    ...(categories || []).map((c) => ({ value: c, label: t(c) || c })),
  ];

  return (
    <div className="attribute-picker">
      <div className="d-flex gap-2 mb-2">
        <Form.Control
          size="sm"
          placeholder={t("searchByPrefix")}
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
        <CustomSelect
          value={category}
          options={categoryOptions}
          onChange={setCategory}
          wrapperClassName="flex-grow-1"
        />
      </div>
      <ListGroup style={{ maxHeight: 220, overflowY: "auto" }}>
        {loading ? (
          <ListGroup.Item className="text-muted">{t("loading")}</ListGroup.Item>
        ) : visible.length > 0 ? (
          visible.map((a) => (
            <ListGroup.Item key={a.id} action onClick={() => onPick(a)}>
              <strong>{a.name}</strong>{" "}
              <span className="text-muted small">
                {t(a.category) || a.category} ·{" "}
                {t(ATTRIBUTE_TYPE_LABELS[a.type]) ||
                  ATTRIBUTE_TYPE_LABELS[a.type] ||
                  a.type}
              </span>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="text-muted">
            {t("noAttributesFound")}
          </ListGroup.Item>
        )}
      </ListGroup>
    </div>
  );
}
