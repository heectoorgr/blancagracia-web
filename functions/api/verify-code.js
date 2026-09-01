function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_CODE) {
    return jsonResponse({ error: 'Falta la variable de entorno ADMIN_CODE en Cloudflare.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Petición inválida.' }, 400);
  }

  const ok = payload.code === env.ADMIN_CODE;
  return jsonResponse({ ok }, ok ? 200 : 401);
}