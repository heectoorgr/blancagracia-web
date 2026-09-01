// Envía un aviso por email cuando se detectan varios intentos fallidos seguidos de entrar al panel.
// Reutiliza formsubmit.co (el mismo servicio que ya usa el formulario de contacto de la web),
// así que no hace falta ninguna cuenta ni clave nueva.
const ALERT_EMAIL = 'gr_blanca@hotmail.es';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${ALERT_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Aviso de seguridad: panel de administración',
        mensaje: 'El panel de control de la página web está siendo atacado, rogamos cambie la contraseña de su panel hablando con su desarrollador (tu hermano xd).'
      })
    });
    if (!res.ok) throw new Error(`formsubmit respondió ${res.status}`);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
