/**
 * StationCheck Pro — API client
 * Toutes les communications avec le backend Express/PostgreSQL passent ici.
 */

const BASE = "/api"; // proxied by Vite to http://localhost:3001

// ── Token management ──────────────────────────────────────────────────
export const getToken  = () => localStorage.getItem("sc_token");
export const setToken  = (t) => localStorage.setItem("sc_token", t);
export const clearToken = () => {
  localStorage.removeItem("sc_token");
  localStorage.removeItem("sc_user");
};

// ── Core fetch helper ─────────────────────────────────────────────────
async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export const apiGet    = (path)        => request("GET",    path);
export const apiPost   = (path, body)  => request("POST",   path, body);
export const apiPut    = (path, body)  => request("PUT",    path, body);
export const apiDelete = (path)        => request("DELETE", path);

// ── Auth ──────────────────────────────────────────────────────────────
export async function apiLogin(username, password) {
  const data = await request("POST", "/auth/login", { username, password });
  setToken(data.token);
  localStorage.setItem("sc_user", JSON.stringify(data.user));
  return data;
}

// ── Helpers par entité ────────────────────────────────────────────────

// Cities
export const fetchCities      = ()       => apiGet("/cities");
export const createCity       = (c)      => apiPost("/cities", c);
export const updateCity       = (id, c)  => apiPut(`/cities/${id}`, c);
export const deleteCity       = (id)     => apiDelete(`/cities/${id}`);

// Sites
export const fetchSites       = ()       => apiGet("/sites");
export const createSite       = (s)      => apiPost("/sites", s);
export const updateSite       = (id, s)  => apiPut(`/sites/${id}`, s);
export const deleteSite       = (id)     => apiDelete(`/sites/${id}`);

// Inspecteurs
export const fetchInspecteurs = ()       => apiGet("/inspecteurs");
export const createInspecteur = (i)      => apiPost("/inspecteurs", i);
export const updateInspecteur = (id, i)  => apiPut(`/inspecteurs/${id}`, i);
export const deleteInspecteur = (id)     => apiDelete(`/inspecteurs/${id}`);

// Catégories
export const fetchCategories  = ()       => apiGet("/categories");
export const createCategorie  = (c)      => apiPost("/categories", c);
export const updateCategorie  = (id, c)  => apiPut(`/categories/${id}`, c);
export const deleteCategorie  = (id)     => apiDelete(`/categories/${id}`);
export const bulkCategories   = (cats)   => apiPut("/categories", cats);

// Questions
export const fetchQuestions   = ()       => apiGet("/questions");
export const createQuestion   = (q)      => apiPost("/questions", q);
export const updateQuestion   = (id, q)  => apiPut(`/questions/${id}`, q);
export const deleteQuestion   = (id)     => apiDelete(`/questions/${id}`);

// Inspections
export const fetchInspections = ()       => apiGet("/inspections");
export const createInspection = (r)      => apiPost("/inspections", r);
export const deleteInspection = (id)     => apiDelete(`/inspections/${id}`);

// Actifs
export const fetchActifs      = ()       => apiGet("/actifs");
export const createActif      = (a)      => apiPost("/actifs", a);
export const updateActif      = (id, a)  => apiPut(`/actifs/${id}`, a);
export const deleteActif      = (id)     => apiDelete(`/actifs/${id}`);

// Produits
export const fetchProduits    = ()       => apiGet("/produits");
export const createProduit    = (p)      => apiPost("/produits", p);
export const updateProduit    = (id, p)  => apiPut(`/produits/${id}`, p);
export const deleteProduit    = (id)     => apiDelete(`/produits/${id}`);

// Contrôles de stock
export const fetchControles   = ()       => apiGet("/controles");
export const createControle   = (c)      => apiPost("/controles", c);
export const updateControle   = (id, c)  => apiPut(`/controles/${id}`, c);
export const deleteControle   = (id)     => apiDelete(`/controles/${id}`);

// Utilisateurs
export const fetchUsers       = ()       => apiGet("/users");
export const createUser       = (u)      => apiPost("/users", u);
export const updateUser       = (id, u)  => apiPut(`/users/${id}`, u);
export const deleteUser       = (id)     => apiDelete(`/users/${id}`);

// Permissions
export const fetchPermissions = ()       => apiGet("/permissions");
export const savePermissions  = (p)      => apiPut("/permissions", p);
