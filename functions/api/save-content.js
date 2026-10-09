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

function getRetryDelay(response) {
  const retryAfterMs = Number(response.headers.get('Retry-After-Ms'));
  if (Number.isFinite(retryAfterMs) && retryAfterMs > 0) return retryAfterMs;

  const retryAfter = response.headers.get('Retry-After');
  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) return retryAfterSeconds * 1000;
  if (retryAfter) {
    const retryAfterDate = Date.parse(retryAfter);
    if (Number.isFinite(retryAfterDate)) return Math.max(0, retryAfterDate - Date.now());
  }
  return 500;
}

async function translateBatch(texts, targetLanguage, env) {
  const endpoint = (env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com')
    .replace(/\/+$/, '');
  const url = new URL(`${endpoint}/translate`);
  url.searchParams.set('api-version', '3.0');
  url.searchParams.set('to', targetLanguage);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Ocp-Apim-Subscription-Key': env.AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': env.AZURE_TRANSLATOR_REGION
      },
      body: JSON.stringify(texts.map((text) => ({ Text: text })))
    });

    if (response.ok) {
      const data = await response.json();
      if (!Array.isArray(data) || data.length !== texts.length
        || data.some((item) => typeof item?.translations?.[0]?.text !== 'string')) {
        throw new Error('Azure Translator devolvió una respuesta inválida. No se guardaron los cambios.');
      }
      return data.map((item) => item.translations[0].text);
    }

    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Azure Translator respondió ${response.status}. Comprueba la clave y la región configuradas; no se guardaron los cambios.`);
    }
    if (attempt === 2) {
      if (response.status === 429) {
        throw new Error('Azure Translator está limitando temporalmente las solicitudes. Espera un momento y vuelve a guardar; no se guardaron los cambios.');
      }
      throw new Error(`Azure Translator respondió ${response.status}. No se guardaron los cambios.`);
    }

    const delay = getRetryDelay(response);
    if (delay > 2000) {
      throw new Error(`Azure Translator pide esperar ${Math.ceil(delay / 1000)} segundos antes de reintentar. Vuelve a guardar más tarde; no se guardaron los cambios.`);
    }
    await new Promise((resolve) => setTimeout(resolve, Math.max(delay, 500 * (attempt + 1))));
  }

  throw new Error('No se pudo completar la traducción. No se guardaron los cambios.');
}

async function translateTexts(texts, targetLanguage, env) {
  const translated = new Map();
  const pending = [...new Set(texts)].filter((text) => (
    text && !/^(?:https?:\/\/|mailto:|tel:)/i.test(text)
  ));
  const batches = [];
  let batch = [];
  let batchLength = 0;

  for (const text of pending) {
    if (text.length > 45000) {
      throw new Error('Hay un texto demasiado largo para traducir de una vez. Acórtalo y vuelve a guardar; no se guardaron los cambios.');
    }
    if (batch.length === 100 || batchLength + text.length > 45000) {
      batches.push(batch);
      batch = [];
      batchLength = 0;
    }
    batch.push(text);
    batchLength += text.length;
  }
  if (batch.length) batches.push(batch);

  for (const textsInBatch of batches) {
    const results = await translateBatch(textsInBatch, targetLanguage, env);
    textsInBatch.forEach((text, index) => translated.set(text, results[index]));
  }

  for (const text of texts) {
    if (!translated.has(text)) translated.set(text, text);
  }
  return translated;
}

function getValueAtPath(value, path) {
  return path.reduce((current, key) => current?.[key], value);
}

function collectTextsToTranslate(
  value,
  previousSource,
  previousTranslation,
  path = [],
  parentKey = '',
  parentParentKey = '',
  texts = new Set()
) {
  if (typeof value === 'string') {
    if (untranslatedKeys.has(parentKey) || (parentKey === 'name' && parentParentKey === 'hero')) return texts;
    const oldSource = getValueAtPath(previousSource, path);
    const oldTranslation = getValueAtPath(previousTranslation, path);
    if (!(oldSource === value && typeof oldTranslation === 'string')) texts.add(value);
    return texts;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectTextsToTranslate(
      item,
      previousSource,
      previousTranslation,
      [...path, index],
      parentKey,
      parentParentKey,
      texts
    ));
    return texts;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key !== 'translations') {
        collectTextsToTranslate(
          item,
          previousSource,
          previousTranslation,
          [...path, key],
          key,
          parentKey,
          texts
        );
      }
    }
  }
  return texts;
}

function applyTranslations(
  value,
  translatedTexts,
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
    return translatedTexts.get(value) || value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => applyTranslations(
      item,
      translatedTexts,
      previousSource,
      previousTranslation,
      [...path, index],
      parentKey,
      parentParentKey
    ));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'translations')
        .map(([key, item]) => [key, applyTranslations(
          item,
          translatedTexts,
          previousSource,
          previousTranslation,
          [...path, key],
          key,
          parentKey
        )])
    );
  }
  return value;
}

async function buildTranslations(content, previousContent, env) {
  const targets = { es: 'es', en: 'en', va: 'ca' };
  const translations = {};

  for (const [language, targetLanguage] of Object.entries(targets)) {
    const previousTranslation = previousContent?.translations?.[language];
    const texts = collectTextsToTranslate(
      content,
      previousContent,
      previousTranslation
    );
    const translatedTexts = await translateTexts([...texts], targetLanguage, env);
    translations[language] = applyTranslations(
      content,
      translatedTexts,
      previousContent,
      previousTranslation
    );
  }

  return translations;
}

export async function onRequestPost({ request, env }) {
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';

  if (!env.ADMIN_CODE || !env.GITHUB_TOKEN || !repo
    || !env.AZURE_TRANSLATOR_KEY || !env.AZURE_TRANSLATOR_REGION) {
    return jsonResponse({ error: 'Faltan variables de entorno (ADMIN_CODE, GITHUB_TOKEN, GITHUB_REPO, AZURE_TRANSLATOR_KEY o AZURE_TRANSLATOR_REGION).' }, 500);
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
    payload.content.translations = await buildTranslations(payload.content, previousContent, env);

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