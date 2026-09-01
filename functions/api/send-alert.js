const ALERT_EMAIL = 'gr_blanca@hotmail.es';

function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

export async function onRequestPost() {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${ALERT_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Aviso de seguridad: panel de administración',
        mensaje: 'El panel de control de la página web está siendo atacado, rogamos cambie la contraseña de su panel hablando con su desarrollador (tu hermano xd).'
      })
    });
    if (!response.ok) throw new Error(`formsubmit respondió ${response.status}`);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}