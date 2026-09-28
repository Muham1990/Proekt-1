'use strict';

async function apiRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка сервера');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function apiGet(path) {
  return apiRequest(path);
}

function apiPost(path, body) {
  return apiRequest(path, { method: 'POST', body });
}

function apiPatch(path, body) {
  return apiRequest(path, { method: 'PATCH', body });
}
