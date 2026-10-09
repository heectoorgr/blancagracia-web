const GITHUB_API = 'https://api.github.com';

function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

function base64Encode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function githubRequest(env, path, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `GitHub respondió ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function putFile(env, repo, branch, filePath, contentBase64, message) {
  let sha;
  try {
    const existing = await githubRequest(env, `/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`);
    sha = existing.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  return githubRequest(env, `/repos/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {})
    })
  });
}

export async function onRequestPost({ request, env }) {
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';

  if (!env.ADMIN_CODE || !env.GITHUB_TOKEN || !repo) {
    return jsonResponse({ error: 'Faltan variables de entorno del servidor (ADMIN_CODE, GITHUB_TOKEN, GITHUB_REPO).' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Petición inválida.' }, 400);
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonResponse({ error: 'Petición inválida.' }, 400);
  }
  if (payload.code !== env.ADMIN_CODE) {
    return jsonResponse({ error: 'Código de acceso incorrecto.' }, 401);
  }
  const translations = payload.content?.translations;
  if (!payload.content || typeof payload.content !== 'object' || Array.isArray(payload.content)
      || !translations || typeof translations !== 'object' || Array.isArray(translations)
      || !translations.en || typeof translations.en !== 'object' || Array.isArray(translations.en)
      || !translations.va || typeof translations.va !== 'object' || Array.isArray(translations.va)) {
    return jsonResponse({ error: 'Falta el contenido o sus traducciones manuales.' }, 400);
  }
  if (payload.images !== undefined && !Array.isArray(payload.images)) {
    return jsonResponse({ error: 'La lista de imágenes no es válida.' }, 400);
  }

  try {
    for (const image of payload.images || []) {
      await putFile(env, repo, branch, image.path, image.dataBase64, `Subir foto desde el panel: ${image.path}`);
    }

    const contentString = JSON.stringify(payload.content, null, 2);
    await putFile(env, repo, branch, 'content.json', base64Encode(contentString), 'Actualizar contenido desde el panel');

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}