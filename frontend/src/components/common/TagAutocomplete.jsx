import { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { StatsApi } from '../../api/resources.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const customStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    height: '42px',
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? 'var(--border-focus, #86b7fe)' : 'var(--border-color, #ced4da)',
    backgroundColor: 'var(--bg-input, #ffffff)',
    fontSize: '1rem',
    boxShadow: state.isFocused ? '0 0 0 0.25rem var(--shadow-focus, rgba(13, 110, 253, 0.25))' : 'none',
  }),
  valueContainer: (base) => ({
    ...base,
    height: '40px',
    padding: '0 8px',
  }),
  input: (base) => ({
    ...base,
    margin: '0',
    padding: '0',
    height: '38px',
    fontSize: '1rem',
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '40px',
  }),
  indicatorSeparator: (base) => ({
    ...base,
    display: 'none',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-option-hover, #0d6efd)',
    borderRadius: '0.25rem',
    margin: '2px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#ffffff',
    fontSize: '0.875rem',
    padding: '2px 8px',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#ffffff',
    padding: '2px 8px',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
    },
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: '1rem',
    color: 'var(--text-placeholder, #6c757d)',
    fontWeight: '400',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-dropdown, #ffffff)',
    borderRadius: '0.375rem',
    boxShadow: '0 0.5rem 1rem var(--shadow-color, rgba(0, 0, 0, 0.15))',
    zIndex: 1000,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? 'var(--bg-option-hover, #0d6efd)' : 'transparent',
    color: state.isSelected ? '#ffffff' : 'var(--text-primary, #212529)',
    ':hover': {
      backgroundColor: state.isSelected ? 'var(--bg-option-hover, #0d6efd)' : 'var(--bg-option-hover, #0d6efd)',
      color: '#ffffff',
    },
    fontSize: '1rem',
    padding: '0.375rem 1rem',
  }),
  menuList: (base) => ({
    ...base,
    padding: '0.25rem 0',
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: '4px',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px',
  }),
};

export default function TagAutocomplete({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => { 
    StatsApi.tagCloud()
      .then((tags) => {
        setOptions(tags.map((t) => ({ value: t.tag, label: t.tag })));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (selected) => {
    const tags = (selected || []).map((s) => s.value);
    onChange(tags);
  };

  const handleCreate = (inputValue) => {
    const newOption = { value: inputValue, label: inputValue };
    setOptions((prev) => [...prev, newOption]);
    const newTags = [...value, inputValue];
    onChange(newTags);
  };

  if (loading) {
    return <div className="text-muted small">{t('loading')}</div>;
  }

  return (
    <CreatableSelect
      isMulti
      placeholder={t('addTechnologyTags')}
      options={options}
      value={value.map((v) => ({ value: v, label: v }))}
      onChange={handleChange}
      onCreateOption={handleCreate}
      styles={customStyles}
      classNamePrefix="tag-select"
      formatCreateLabel={(input) => `${t('create')} "${input}"`}
    />
  );
}