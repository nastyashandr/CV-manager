import { useLanguage } from '../contexts/LanguageContext.jsx';

export function useErrorHandler() {
  const { t } = useLanguage();

  const translateError = (error) => {
    const message = error.response?.data?.message;

    if (!message) {
      return t('errorOccurred');
    }

    const attrMatch = message.match(/Cannot change "(.+)" because it is used in access rules./);
    if (attrMatch) {
      return t('Cannot change "{name}" because it is used in access rules.', { name: attrMatch[1] });
    }

    return t(message) || message;
  };

  return { translateError };
}