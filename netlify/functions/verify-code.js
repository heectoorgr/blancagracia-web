// Comprueba el código de acceso del panel, sin tocar el repositorio (no dispara ningún despliegue).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  const adminCode = process.env.ADMIN_CODE;
  if (!adminCode) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Falta la variable de entorno ADMIN_CODE en Netlify.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Petición inválida.' }) };
  }

  const ok = payload.code === adminCode;
  return { statusCode: ok ? 200 : 401, body: JSON.stringify({ ok }) };
};
