import Spinner from "react-bootstrap/Spinner";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function LoadingSpinner({ label }) {
  const { t } = useLanguage();
  const displayLabel = label || t("loading");

  return (
    <div className="d-flex align-items-center gap-2 text-muted py-4 justify-content-center">
      <Spinner animation="border" size="sm" />
      <span>{displayLabel}</span>
    </div>
  );
}