import { useCallback, useState, useRef } from 'react';
import CloudinaryUploader from './CloudinaryUploader.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function ImageDropzone({ value, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useLanguage();
  const isUploading = useRef(false);

  const handleFile = useCallback(async (file) => {
    if (!file || isUploading.current) return;
    isUploading.current = true;
    setBusy(true);
    setError(null);
    try {
      const url = await CloudinaryUploader.upload(file);
      onChange(url);
    } catch (err) {
      setError(err.message || t('uploadFailed'));
    } finally {
      setBusy(false);
      isUploading.current = false;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onChange, t]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!busy) {
      fileInputRef.current?.click();
    }
  }, [busy]);

  return (
    <div>
      <div
        className={`image-dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={handleClick}
        style={{
          border: '2px dashed #ced4da',
          borderRadius: '6px',
          padding: '20px',
          textAlign: 'center',
          cursor: busy ? 'default' : 'pointer',
          width: '200px',
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: dragging ? '#e9ecef' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {value ? (
          <img 
            src={value} 
            alt="uploaded" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <span className="text-muted small">{t('dragDropOrClick')}</span>
        )}
        {busy && <span className="d-block small text-muted mt-2">{t('uploading')}</span>}
        {error && <span className="d-block small text-danger mt-2">{error}</span>}
      </div>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={onFileSelect} 
      />
    </div>
  );
}