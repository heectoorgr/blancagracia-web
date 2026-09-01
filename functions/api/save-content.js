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
    throw new Error(data.message || `GitHub respondió ${response.status}`);
  }
  return data;
}

async function putFile(env, repo, branch, filePath, contentBase64, message) {
  let sha;
  try {
    const existing = await githubRequest(env, `/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`);
    sha = existing.sha;
  } catch (error) {
    sha = undefined;
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

async function translateText(text, targetLanguage) {
  if (!text) return text || '';
  try {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', 'es');
    url.searchParams.set('tl', targetLanguage);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`El traductor respondió ${response.status}`);
    const data = await response.json();
    return Array.isArray(data?.[0]) ? data[0].map((part) => part[0]).join('') : text;
  } catch (error) {
    return text;
  }
}

async function translateEntries(entries, targetLanguage, fields) {
  const translatedEntries = [];
  for (const entry of entries || []) {
    const translatedEntry = { ...entry };
    for (const field of fields) {
      translatedEntry[field] = await translateText(entry[field], targetLanguage);
    }
    translatedEntries.push(translatedEntry);
  }
  return translatedEntries;
}

async function buildTranslations(content) {
  const targets = { en: 'en', va: 'ca' };
  const translations = {};

  for (const [language, targetLanguage] of Object.entries(targets)) {
    translations[language] = {
      hero: {
        name: content.hero?.name || '',
        role: await translateText(content.hero?.role || '', targetLanguage)
      },
      bio: {
        paragraphs: await Promise.all((content.bio?.paragraphs || []).map((paragraph) => translateText(paragraph, targetLanguage)))
      },
      agenda: {
        upcoming: await translateEntries(content.agenda?.upcoming || [], targetLanguage, ['linkText', 'type', 'date', 'place', 'description']),
        previous: await translateEntries(content.agenda?.previous || [], targetLanguage, ['linkText', 'date', 'name', 'place', 'description'])
      },
      contact: {
        intro: await translateText(content.contact?.intro || '', targetLanguage)
      }
    };
  }

  return translations;
}

export async function onRequestPost({ request, env }) {
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';

  if (!env.ADMIN_CODE || !env.GITHUB_TOKEN || !repo) {
    return jsonResponse({ error: 'Faltan variables de entorno en Cloudflare (ADMIN_CODE, GITHUB_TOKEN, GITHUB_REPO).' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Petición inválida.' }, 400);
  }

  if (payload.code !== env.ADMIN_CODE) {
    return jsonResponse({ error: 'Código de acceso incorrecto.' }, 401);
  }

  try {
    for (const image of payload.images || []) {
      await putFile(env, repo, branch, image.path, image.dataBase64, `Subir foto desde el panel: ${image.path}`);
    }

    payload.content.translations = await buildTranslations(payload.content);
    const contentString = JSON.stringify(payload.content, null, 2);
    await putFile(env, repo, branch, 'content.json', base64Encode(contentString), 'Actualizar contenido desde el panel');

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}