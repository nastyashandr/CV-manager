import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function TagCloud({ tags }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!tags?.length) return <p className="text-muted">{t('noTags')}</p>;

  const handleTagClick = (tag) => {
    if (user?.role === 'recruiter' || user?.role === 'admin') {
      navigate(`/search?q=${tag}`);
    } else {
      navigate(`/positions?tag=${tag}`);
    }
  };

  return (
    <div className="d-flex flex-wrap gap-2 tag-cloud">
      {tags.map((t) => (
        <span
          key={t.tag}
          className="badge bg-light text-dark border p-2"
          style={{
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            backgroundColor: 'var(--badge-bg, #f8f9fa)',
            color: 'var(--badge-text, #212529)',
            borderColor: 'var(--badge-border, #dee2e6)',
          }}
          onClick={() => handleTagClick(t.tag)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#0d6efd';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '';
            e.target.style.color = '';
          }}
        >
          {t.tag}
        </span>
      ))}
    </div>
  );
}