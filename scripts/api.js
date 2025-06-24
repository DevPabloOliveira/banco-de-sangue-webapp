/* scripts/api.js
 * Pequenina “fachada” para fetch:
 *  – aplica /api prefix (caso mude depois);
 *  – já converte para JSON e lança Error em HTTP ≠ 200 ou success:false.
 */
export async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  const data = await res.json();
  if (data.success === false) throw new Error(data.message || 'Erro');
  return data;
}

export async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
  const data = await res.json();
  if (data.success === false) throw new Error(data.message || 'Erro');
  return data;
}
