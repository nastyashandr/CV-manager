import { useLanguage } from "../contexts/LanguageContext.jsx";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="text-center py-5">
      <h1 className="display-3">404</h1>
      <p className="text-muted">{t("pageNotFound")}</p>
    </div>
  );
}
