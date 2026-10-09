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

const untranslatedKeys = new Set([
  'dataBase64',
  'email',
  'id',
  'image',
  'instagram',
  'link',
  'linkDisplay',
  'linkedin',
  'path',
  'photos',
  'scheduleUrl',
  'videoId',
  'youtube',
  'youtubeUrl'
]);

async function translateText(text, targetLanguage) {
  if (!text) return text || '';
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(text)) return text;
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLanguage);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`El traductor respondió ${response.status}. No se guardaron los cambios.`);
  const data = await response.json();
  if (!Array.isArray(data?.[0])) {
    throw new Error('El traductor devolvió una respuesta inválida. No se guardaron los cambios.');
  }
  return data[0].map((part) => part[0]).join('');
}

function createTextTranslator(targetLanguage) {
  const queue = [];
  const cache = new Map();
  let active = 0;

  const runNext = () => {
    while (active < 4 && queue.length) {
      const { text, resolve, reject } = queue.shift();
      active += 1;
      translateText(text, targetLanguage).then(resolve, reject).finally(() => {
        active -= 1;
        runNext();
      });
    }
  };

  return (text) => {
    if (!cache.has(text)) {
      cache.set(text, new Promise((resolve, reject) => {
        queue.push({ text, resolve, reject });
        runNext();
      }));
    }
    return cache.get(text);
  };
}

async function translateValue(value, translate, parentKey = '', parentParentKey = '') {
  if (typeof value === 'string') {
    if (untranslatedKeys.has(parentKey) || (parentKey === 'name' && parentParentKey === 'hero')) return value;
    return translate(value);
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => translateValue(item, translate, parentKey, parentParentKey)));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(await Promise.all(
      Object.entries(value)
        .filter(([key]) => key !== 'translations')
        .map(async ([key, item]) => [key, await translateValue(item, translate, key, parentKey)])
    ));
  }
  return value;
}

async function buildTranslations(content) {
  const targets = { es: 'es', en: 'en', va: 'ca' };
  const translations = {};

  for (const [language, targetLanguage] of Object.entries(targets)) {
    translations[language] = await translateValue(content, createTextTranslator(targetLanguage));
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
    payload.content.translations = await buildTranslations(payload.content);

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