// create-patient — crea un account paziente in modo sicuro.
//
// Perché esiste: creare un account Supabase da codice client-side
// richiederebbe o (a) la chiave segreta nel browser — mai accettabile,
// chiunque apra la pagina potrebbe leggerla e avere accesso completo al
// database — oppure (b) chiamare supabase.auth.signUp() dal client, che
// però sostituisce la sessione corrente con quella del nuovo utente,
// disconnettendo l'operatore. Questa funzione gira lato server, verifica
// che chi chiama sia davvero un operatore autenticato, e usa la chiave
// segreta solo qui, mai inviata al browser.
//
// Chiavi: usa quelle di default che Supabase fornisce automaticamente a
// ogni Edge Function — non serve creare nessun segreto personalizzato.
// Supabase ha rinominato le chiavi nel 2026 (SUPABASE_SECRET_KEYS /
// SUPABASE_PUBLISHABLE_KEYS, dizionari JSON) mantenendo per un periodo le
// vecchie (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY, stringhe
// semplici) — questo codice legge prima le nuove, e usa le vecchie solo
// se le nuove non sono disponibili, così funziona in entrambi i casi.
//
// Deploy: Dashboard → Edge Functions → "Deploy a new function" → "Via
// Editor" → nome esatto "create-patient" → incolla questo file → Deploy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Origin consentito: di default l'URL GitHub Pages dell'app. Sovrascrivibile
// con il secret ALLOWED_ORIGIN (Dashboard → Edge Functions → create-patient
// → Secrets) se l'app viene ospitata altrove o su più domini — in quel caso
// impostare una lista separata da virgola.
const DEFAULT_ALLOWED_ORIGIN = 'https://latonshriek.github.io';
function resolveAllowedOrigin(reqOrigin: string | null): string {
  const configured = Deno.env.get('ALLOWED_ORIGIN') || DEFAULT_ALLOWED_ORIGIN;
  const allowed = configured.split(',').map((s) => s.trim()).filter(Boolean);
  if (reqOrigin && allowed.includes(reqOrigin)) return reqOrigin;
  return allowed[0] || DEFAULT_ALLOWED_ORIGIN;
}
function corsHeaders(reqOrigin: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(reqOrigin),
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Caratteri leggibili: niente 0/O, 1/I/L, per ridurre errori di trascrizione.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(len = 8) {
  let out = '';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

// Legge una chiave dal nuovo formato (dizionario JSON, di solito con una
// voce "default") con ripiego sul nome legacy (stringa semplice).
function readKey(jsonVarName: string, legacyVarName: string): string {
  const jsonRaw = Deno.env.get(jsonVarName);
  if (jsonRaw) {
    try {
      const dict = JSON.parse(jsonRaw);
      const val = dict.default || Object.values(dict)[0];
      if (typeof val === 'string' && val) return val;
    } catch (_e) { /* formato inatteso, prova il legacy sotto */ }
  }
  const legacy = Deno.env.get(legacyVarName);
  if (legacy) return legacy;
  throw new Error('Chiave non trovata (' + jsonVarName + ' / ' + legacyVarName + ')');
}

Deno.serve(async (req: Request) => {
  const CORS_HEADERS = corsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'metodo non consentito' }), { status: 405, headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'non autenticato' }), { status: 401, headers: CORS_HEADERS });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const PUBLISHABLE_KEY = readKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
    const SECRET_KEY = readKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');

    // Client "come l'operatore che chiama" — serve solo per verificare
    // chi è, con i suoi permessi normali (chiave pubblica + il suo token).
    const callerClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: operatore }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !operatore) {
      return new Response(JSON.stringify({ error: 'operatore non riconosciuto' }), { status: 401, headers: CORS_HEADERS });
    }

    // Un paziente non può creare altri pazienti.
    const { data: callerIsPatient } = await callerClient.from('pazienti').select('id').eq('id', operatore.id).maybeSingle();
    if (callerIsPatient) {
      return new Response(JSON.stringify({ error: 'un account paziente non può creare altri pazienti' }), { status: 403, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const codicePaziente = (body.codicePaziente || '').trim();
    if (!codicePaziente) {
      return new Response(JSON.stringify({ error: 'codice paziente mancante' }), { status: 400, headers: CORS_HEADERS });
    }

    // Client con privilegi elevati — SOLO qui, mai esposto al browser.
    const adminClient = createClient(SUPABASE_URL, SECRET_KEY);

    const codiceAccesso = randomCode(8);
    const emailSintetica = codiceAccesso.toLowerCase() + '@paz.traccian.local';

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: emailSintetica,
      password: codiceAccesso,
      email_confirm: true, // account sintetico: nessuna vera email da confermare
    });
    if (createErr || !newUser?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || 'creazione account fallita' }), { status: 400, headers: CORS_HEADERS });
    }

    const { error: insertErr } = await adminClient.from('pazienti').insert({
      id: newUser.user.id,
      operatore_id: operatore.id,
      codice_paziente: codicePaziente,
      codice_accesso: codiceAccesso,
    });
    if (insertErr) {
      // rollback: non lasciare un account orfano senza riga pazienti
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: CORS_HEADERS });
    }

    return new Response(
      JSON.stringify({ codiceAccesso, pazienteId: newUser.user.id }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS_HEADERS });
  }
});

