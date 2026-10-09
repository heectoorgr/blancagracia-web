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

function decodeBase64(value) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function getExistingContent(env, repo, branch) {
  const file = await githubRequest(
    env,
    `/repos/${repo}/contents/content.json?ref=${encodeURIComponent(branch)}`
  );
  if (file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new Error('GitHub devolvió un content.json en un formato no compatible.');
  }
  return JSON.parse(decodeBase64(file.content));
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

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (!Array.isArray(data?.[0])) {
        throw new Error('El traductor devolvió una respuesta inválida. No se guardaron los cambios.');
      }
      return data[0].map((part) => part[0]).join('');
    }

    if (response.status !== 429 || attempt === 2) {
      if (response.status === 429) {
        throw new Error('El traductor está limitando temporalmente las solicitudes. Espera unos minutos y vuelve a guardar; no se guardaron los cambios.');
      }
      throw new Error(`El traductor respondió ${response.status}. No se guardaron los cambios.`);
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = Number(retryAfterHeader);
    const retryAfterDate = retryAfterHeader ? Date.parse(retryAfterHeader) : NaN;
    const retryAfter = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : Number.isFinite(retryAfterDate)
        ? Math.max(0, retryAfterDate - Date.now())
        : 0;
    if (retryAfter > 4000) {
      throw new Error(`El traductor está limitando temporalmente las solicitudes. Espera ${Math.ceil(retryAfter / 1000)} segundos y vuelve a guardar; no se guardaron los cambios.`);
    }
    const delay = Math.max(retryAfter, 500 * (2 ** attempt));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function createTextTranslator(targetLanguage) {
  const queue = [];
  const cache = new Map();
  let active = 0;
  let stoppedError;

  const runNext = () => {
    while (!stoppedError && active < 1 && queue.length) {
      const { text, resolve, reject } = queue.shift();
      active += 1;
      translateText(text, targetLanguage)
        .then(resolve)
        .catch((error) => {
          stoppedError = error;
          reject(error);
          while (queue.length) queue.shift().reject(error);
        })
        .finally(() => {
          active -= 1;
          runNext();
        });
    }
  };

  return (text) => {
    if (stoppedError) return Promise.reject(stoppedError);
    if (!cache.has(text)) {
      cache.set(text, new Promise((resolve, reject) => {
        queue.push({ text, resolve, reject });
        runNext();
      }));
    }
    return cache.get(text);
  };
}

function getValueAtPath(value, path) {
  return path.reduce((current, key) => current?.[key], value);
}

async function translateValue(
  value,
  translate,
  previousSource,
  previousTranslation,
  path = [],
  parentKey = '',
  parentParentKey = ''
) {
  if (typeof value === 'string') {
    if (untranslatedKeys.has(parentKey) || (parentKey === 'name' && parentParentKey === 'hero')) return value;
    const oldSource = getValueAtPath(previousSource, path);
    const oldTranslation = getValueAtPath(previousTranslation, path);
    if (oldSource === value && typeof oldTranslation === 'string') return oldTranslation;
    return translate(value);
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item, index) => translateValue(
      item,
      translate,
      previousSource,
      previousTranslation,
      [...path, index],
      parentKey,
      parentParentKey
    )));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(await Promise.all(
      Object.entries(value)
        .filter(([key]) => key !== 'translations')
        .map(async ([key, item]) => [key, await translateValue(
          item,
          translate,
          previousSource,
          previousTranslation,
          [...path, key],
          key,
          parentKey
        )])
    ));
  }
  return value;
}

async function buildTranslations(content, previousContent) {
  const targets = { es: 'es', en: 'en', va: 'ca' };
  const translations = {};

  for (const [language, targetLanguage] of Object.entries(targets)) {
    translations[language] = await translateValue(
      content,
      createTextTranslator(targetLanguage),
      previousContent,
      previousContent?.translations?.[language]
    );
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
    const previousContent = await getExistingContent(env, repo, branch);
    payload.content.translations = await buildTranslations(payload.content, previousContent);

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