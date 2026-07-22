export class DateFormatter {
  static short(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  }

  static period(start, end) {
    const s = start ? DateFormatter.short(start) : '?';
    const e = end ? DateFormatter.short(end) : 'present';
    return `${s} – ${e}`;
  }

  static dateTime(dateStr) {
    return new Date(dateStr).toLocaleString();
  }
}

export function fullName(user) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Unknown';
}

export function formatAttributeValue(type, value) {
  if (value === null || value === undefined || value === '') return null;
  
  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'period':
      if (typeof value === 'object' && value !== null) {
        const start = value.start || value.startDate || '';
        const end = value.end || value.endDate || '';
        return `${start || '?'} – ${end || 'present'}`;
      }
      return String(value);
    case 'image':
      return '📷 Image';
    case 'select':
    case 'string':
    case 'text':
    case 'numeric':
    case 'date':
    default:
      return String(value);
  }
}