import client from './client.js';

export class AuthApi {
  static register(data) { return client.post('/auth/register', data); }
  static login(data) { return client.post('/auth/login', data); }
  static me() { return client.get('/auth/me'); }
  static oauthUrl(provider) { return `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/${provider}`; }
}

export class AttributesApi {
  static list(params) { return client.get('/attributes', params); }
  static my() { return client.get('/attributes/my'); }
  static categories() { return client.get('/attributes/categories'); }
  static create(data) { return client.post('/attributes', data); }
  static update(id, data) { return client.put(`/attributes/${id}`, data); }
  static remove(id) { return client.delete(`/attributes/${id}`); }
}

export class PositionsApi {
  static list() { return client.get('/positions'); }
  static latest() { return client.get('/positions/latest'); }
  static popular() { return client.get('/positions/popular'); }
  static get(id) { return client.get(`/positions/${id}`); }
  static create(data) { return client.post('/positions', data); }
  static duplicate(id) { return client.post(`/positions/${id}/duplicate`); }
  static update(id, data) { return client.put(`/positions/${id}`, data); }
  static remove(id) { return client.delete(`/positions/${id}`); }
  static cvs(id) { return client.get(`/positions/${id}/cvs`); }
}

export class UsersApi {
  static get(id) { return client.get(`/users/${id}`); }
  static update(id, data) {
    return client.put(`/users/${id}`, data);
  }
  static addAttribute(id, attributeId) {
    return client.post(`/users/${id}/attributes`, { attributeId });
  }
  static removeAttribute(id, attributeId) {
    return client.delete(`/users/${id}/attributes/${attributeId}`);
  }
  static setAttributeValue(id, attributeId, data) {
    return client.put(`/users/${id}/attributes/${attributeId}`, data);
  }
  static projects(id) { return client.get(`/users/${id}/projects`); }
  static positions(id) { return client.get(`/users/${id}/positions`); }
  static createProject(id, data) { return client.post(`/users/${id}/projects`, data); }
  static updateProject(id, projectId, data) { return client.put(`/users/${id}/projects/${projectId}`, data); }
  static deleteProject(id, projectId) { return client.delete(`/users/${id}/projects/${projectId}`); }
  static tags() { return client.get('/users/tags'); }
  static listAll() { return client.get('/users'); }
  static setRole(id, role) { return client.put(`/users/${id}/role`, { role }); }
  static setBlocked(id, isBlocked) { return client.put(`/users/${id}/blocked`, { isBlocked }); }
  static remove(id) { return client.delete(`/users/${id}`); }
}

export class CvsApi {
  static mine() { return client.get('/cvs'); }
  static create(positionId) { return client.post('/cvs', { positionId }); }
  static get(id) { return client.get(`/cvs/${id}`); }
  static addAttribute(id, attributeId) {
    return client.post(`/cvs/${id}/attributes`, { attributeId });
  }
  static removeAttribute(id, attributeId) {
    return client.delete(`/cvs/${id}/attributes/${attributeId}`);
  }
  static updateAttribute(id, attributeId, data) {
    return client.put(`/cvs/${id}/attributes/${attributeId}`, data);
  }
  static updateProjects(id, projectIds) {
    return client.put(`/cvs/${id}/projects`, { projectIds });
  }
  static updateAbout(id, about) {
    return client.put(`/cvs/${id}/about`, { about });
  }
  static publish(id) {
    return client.post(`/cvs/${id}/publish`);
  }
  static remove(id) { return client.delete(`/cvs/${id}`); }
  static like(id) { return client.post(`/cvs/${id}/like`); }
  static unlike(id) { return client.delete(`/cvs/${id}/like`); }
  static updateAbout(id, about) {
    return client.put(`/cvs/${id}/about`, { about });
  }
}

export class DiscussionsApi {
  static list(positionId) { return client.get(`/discussions/${positionId}`); }
  static create(positionId, content) { return client.post(`/discussions/${positionId}`, { content }); }
}

export class StatsApi {
  static summary() { return client.get('/stats/summary'); }
  static tagCloud() { return client.get('/stats/tag-cloud'); }
}

export class SearchApi {
  static search(q) {
    return client.get('/search', { q });
  }
}