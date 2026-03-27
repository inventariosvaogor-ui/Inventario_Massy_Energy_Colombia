// Vercel Serverless Function — proxy para subir fotos a Google Drive
// Ubicar en: /api/upload.js en el repositorio de GitHub
// Esto elimina el problema de CORS — el servidor llama a Apps Script, no el navegador
 
export default async function handler(req, res) {
  // Allow CORS from the app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, err: 'Method not allowed' });
  }
 
  try {
    const { base64, name, folder, scriptUrl } = req.body;
 
    if (!base64 || !name || !folder || !scriptUrl) {
      return res.status(400).json({ ok: false, err: 'Faltan campos requeridos' });
    }
 
    // Validate it's a Google Apps Script URL
    if (!scriptUrl.includes('script.google.com')) {
      return res.status(400).json({ ok: false, err: 'URL inválida' });
    }
 
    // Server-to-server call — no CORS issues
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ base64, name, folder }),
      redirect: 'follow'
    });
 
    const text = await response.text();
 
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      // Apps Script returned non-JSON but responded OK
      if (response.ok) {
        return res.status(200).json({ ok: true, url: null, raw: text.substring(0, 100) });
      }
      return res.status(500).json({ ok: false, err: text.substring(0, 200) });
    }
 
  } catch (error) {
    console.error('Upload proxy error:', error);
    return res.status(500).json({ ok: false, err: error.message });
  }
}
