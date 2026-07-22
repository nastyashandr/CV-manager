import Form from "react-bootstrap/Form";
import MarkdownView from "./MarkdownView.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function MarkdownEditor({ value, onChange, rows = 6 }) {
  const { t } = useLanguage();
  
  return (
    <div>
      <Form.Control
        as="textarea"
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('writeMarkdown')}
      />
      <div className="mt-2">
        <small className="text-muted">{t('preview')}:</small>
        <div className="border rounded p-2" style={{ minHeight: "60px" }}>
          <MarkdownView content={value} />
        </div>
      </div>
    </div>
  );
}