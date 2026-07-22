export const ATTRIBUTE_TYPES = ['string', 'text', 'image', 'number', 'date', 'period', 'boolean', 'select'];

export const ATTRIBUTE_CATEGORIES = ['Personal', 'Certification', 'Domain Knowledge', 'Soft Skills'];

export const ATTRIBUTE_TYPE_LABELS = {
  string: 'String',
  text: 'Text',
  image: 'Image',
  number: 'Number',
  date: 'Date',
  period: 'Period',
  boolean: 'Boolean',
  select: 'Select',
};

export const OPERATORS_BY_TYPE = {
  string: [
    { value: '=', label: '=' },
    { value: 'contains', label: 'contains' },
  ],
  text: [
    { value: '=', label: '=' },
    { value: 'contains', label: 'contains' },
  ],
  number: [
    { value: '=', label: '=' },
    { value: '>', label: '>' },
    { value: '>=', label: '>=' },
    { value: '<', label: '<' },
    { value: '<=', label: '<=' },
  ],
  date: [
    { value: '=', label: '=' },
    { value: '>', label: 'after' },
    { value: '<', label: 'before' },
  ],
  period: [],
  boolean: [
    { value: 'checked', label: 'is checked' },
  ],
  select: [
    { value: '=', label: '=' },
    { value: '!=', label: '!=' },
  ],
};

export const ROLES = ['candidate', 'recruiter', 'admin'];

export const ROLE_LABELS = {
  candidate: 'candidate',
  recruiter: 'recruiter',
  admin: 'admin',
};