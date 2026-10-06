// Elimina definitivamente un account paziente REMOTO (auth.users + a
// cascata pazienti/sessioni, vedi la foreign key con "on delete cascade"
// in README). Esiste come funzione server-side, non come chiamata diretta
// dal browser, per un motivo di sicurezza non aggirabile: eliminare un
// account richiede i privilegi di amministratore di Supabase (la
// "service role key"), che non deve MAI comparire nel codice che gira nel
// browser — chiunque potesse leggerla potrebbe cancellare qualunque
// account. Qui la chiave resta solo come variabile d'ambiente sul server
// della funzione, mai esposta al client.
//
// Il client TracciaN (index.html) chiama questa funzione passando il
// proprio token di accesso; la funzione verifica CHI sta chiamando con
// quel token (rispettando le RLS, senza privilegi elevati) prima di
// usare i privilegi di amministratore per l'eliminazione vera e propria
// — due fasi separate, non un client "amministratore" usato per tutto.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Non autenticato.' }, 401);

    // Fase 1 — verifica CHI chiama, con le sue RLS normali (nessun
    // privilegio elevato qui): chi è, ed è davvero super-operatore?
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Sessione non valida.' }, 401);

    const { data: opRow } = await callerClient.from('operatori').select('super').eq('id', user.id).maybeSingle();
    if (!opRow || !opRow.super) return json({ error: 'Solo un super-operatore può eliminare un account paziente.' }, 403);

    const { patientId } = await req.json();
    if (!patientId || typeof patientId !== 'string') return json({ error: 'ID paziente mancante o non valido.' }, 400);

    // Controllo di sicurezza in più: il paziente deve davvero esistere
    // nella tabella pazienti, non un id qualunque — evita che la funzione
    // venga usata per eliminare un account che non è un paziente
    // TracciaN (es. un altro operatore) passando un id a caso.
    const { data: pazienteRow } = await callerClient.from('pazienti').select('id, codice_paziente').eq('id', patientId).maybeSingle();
    if (!pazienteRow) return json({ error: 'Nessun paziente trovato con questo id.' }, 404);

    // Fase 2 — solo ORA, dopo le verifiche sopra, si usano i privilegi di
    // amministratore, e solo per l'unica operazione che li richiede
    // davvero.
    const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(patientId);
    if (deleteErr) return json({ error: 'Eliminazione non riuscita: ' + deleteErr.message }, 500);

    return json({ success: true, codice_paziente: pazienteRow.codice_paziente });
  } catch (e) {
    return json({ error: 'Errore inatteso: ' + String(e) }, 500);
  }
});
