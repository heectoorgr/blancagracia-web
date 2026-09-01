// Guarda cambios del panel directamente en GitHub, protegido por un código de acceso.
// Variables de entorno necesarias en Netlify (Site configuration -> Environment variables):
//   ADMIN_CODE   -> el código de acceso (por ejemplo 041297)
//   GITHUB_TOKEN -> un token de acceso personal de GitHub con permiso de escritura sobre el repositorio
//   GITHUB_REPO  -> "usuario/repositorio", por ejemplo "heectoorgr/blancagracia-web"

const GITHUB_API = 'https://api.github.com';

function base64Encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `GitHub respondió ${res.status}`);
  }
  return data;
}

async function putFile(repo, branch, filePath, contentBase64, message) {
  let sha;
  try {
    const existing = await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`);
    sha = existing.sha;
  } catch (error) {
    sha = undefined; // el archivo no existe todavía
  }
  return githubRequest(`/repos/${repo}/contents/${encodeURIComponent(filePath)}`, {
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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`El traductor respondió ${res.status}`);
    const data = await res.json();
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
      bio: {
        paragraphs: await Promise.all((content.bio?.paragraphs || []).map((paragraph) => translateText(paragraph, targetLanguage)))
      },
      agenda: {
        upcoming: await translateEntries(content.agenda?.upcoming || [], targetLanguage, ['type', 'date', 'place', 'description']),
        previous: await translateEntries(content.agenda?.previous || [], targetLanguage, ['date', 'name', 'place', 'description'])
      },
      contact: {
        intro: await translateText(content.contact?.intro || '', targetLanguage)
      }
    };
  }

  return translations;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  const adminCode = process.env.ADMIN_CODE;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!adminCode || !process.env.GITHUB_TOKEN || !repo) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Faltan variables de entorno en Netlify (ADMIN_CODE, GITHUB_TOKEN, GITHUB_REPO).' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Petición inválida.' }) };
  }

  if (payload.code !== adminCode) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Código de acceso incorrecto.' }) };
  }

  try {
    // Sube las imágenes nuevas primero (si las hay). El panel ya asigna la ruta final antes de enviarlas.
    for (const image of payload.images || []) {
      await putFile(repo, branch, image.path, image.dataBase64, `Subir foto desde el panel: ${image.path}`);
    }

    payload.content.translations = await buildTranslations(payload.content);
    const contentString = JSON.stringify(payload.content, null, 2);
    await putFile(repo, branch, 'content.json', base64Encode(contentString), 'Actualizar contenido desde el panel');

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
