// create-operator — crea un account operatore, riservato al super-operatore.
//
// Perché esiste: stesso motivo di create-patient — creare un account
// Supabase da codice client-side richiederebbe la chiave segreta nel
// browser (mai accettabile) oppure supabase.auth.signUp() dal client, che
// però disconnetterebbe l'operatore che sta creando l'account sostituendo
// la sua sessione con quella del nuovo utente. Questa funzione gira lato
// server, verifica che chi chiama sia davvero un super-operatore, e usa la
// chiave segreta solo qui.
//
// A differenza di create-patient: qui l'email è reale (quella della persona
// che deve accedere), non sintetica, e la password è generata e restituita
// una sola volta al super-operatore, che la comunica alla persona fuori
// dall'app (di persona, telefono, ecc. — mai via canali non sicuri).
//
// Deploy: Dashboard → Edge Functions → "Deploy a new function" → "Via
// Editor" → nome esatto "create-operator" → incolla questo file → Deploy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Leggibile: niente 0/O, 1/I/L — stesso criterio di create-patient.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz23456789';
function randomPassword(len = 12) {
  let out = '';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

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

    // Fase 1 — verifica CHI chiama, con le sue RLS normali (nessun
    // privilegio elevato qui): è davvero un super-operatore?
    const callerClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: chiamante }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !chiamante) {
      return new Response(JSON.stringify({ error: 'sessione non valida' }), { status: 401, headers: CORS_HEADERS });
    }
    const { data: opRow } = await callerClient.from('operatori').select('super').eq('id', chiamante.id).maybeSingle();
    if (!opRow || !opRow.super) {
      return new Response(JSON.stringify({ error: 'solo un super-operatore può creare nuovi account operatore' }), { status: 403, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const nome = (body.nome || '').trim();
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'email mancante o non valida' }), { status: 400, headers: CORS_HEADERS });
    }

    // Fase 2 — solo ORA si usano i privilegi di amministratore.
    const adminClient = createClient(SUPABASE_URL, SECRET_KEY);

    const password = randomPassword(12);
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // creato da un super-operatore: non serve conferma via email
    });
    if (createErr || !newUser?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || 'creazione account fallita' }), { status: 400, headers: CORS_HEADERS });
    }

    const { error: insertErr } = await adminClient.from('operatori').insert({
      id: newUser.user.id,
      nome: nome || null,
      attivo: true,
      super: false, // un super-operatore si promuove solo manualmente via SQL — azione rara e sensibile, mai da un modulo
    });
    if (insertErr) {
      // rollback: non lasciare un account orfano senza riga operatori
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: CORS_HEADERS });
    }

    return new Response(
      JSON.stringify({ email, password, operatoreId: newUser.user.id }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS_HEADERS });
  }
});
