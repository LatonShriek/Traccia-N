// Elimina definitivamente un account — PAZIENTE o OPERATORE (unica
// funzione per entrambi, non due separate: la logica di verifica e di
// registrazione nel log è identica, cambia solo quale tabella controllare
// e quali vincoli aspettarsi). Esiste come funzione server-side, non come
// chiamata diretta dal browser, per un motivo di sicurezza non
// aggirabile: eliminare un account richiede i privilegi di amministratore
// di Supabase (la "service role key"), che non deve MAI comparire nel
// codice che gira nel browser — chiunque potesse leggerla potrebbe
// cancellare qualunque account. Qui la chiave resta solo come variabile
// d'ambiente sul server della funzione, mai esposta al client.
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

    const { data: opRow } = await callerClient.from('operatori').select('super, nome').eq('id', user.id).maybeSingle();
    if (!opRow || !opRow.super) return json({ error: 'Solo un super-operatore può eliminare un account.' }, 403);

    const { accountType, accountId } = await req.json();
    if (!accountId || typeof accountId !== 'string') return json({ error: 'ID account mancante o non valido.' }, 400);
    if (accountType !== 'paziente' && accountType !== 'operatore') return json({ error: 'Tipo di account non valido — deve essere "paziente" o "operatore".' }, 400);

    if (accountType === 'operatore' && accountId === user.id) {
      return json({ error: 'Non puoi eliminare il tuo stesso account da qui.' }, 400);
    }

    // Controllo di sicurezza in più: il bersaglio deve davvero esistere
    // nella tabella dichiarata, non un id qualunque — evita che la
    // funzione venga usata per eliminare un account passando un id a
    // caso o del tipo sbagliato.
    const table = accountType === 'paziente' ? 'pazienti' : 'operatori';
    const labelCol = accountType === 'paziente' ? 'codice_paziente' : 'nome';
    const { data: targetRow } = await callerClient.from(table).select('id, ' + labelCol).eq('id', accountId).maybeSingle();
    if (!targetRow) return json({ error: 'Nessun ' + accountType + ' trovato con questo id.' }, 404);
    const targetLabel = targetRow[labelCol] || accountId;

    // Fase 2 — solo ORA, dopo le verifiche sopra, si usano i privilegi di
    // amministratore, e solo per l'unica operazione che li richiede
    // davvero.
    const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(accountId);
    if (deleteErr) {
      // Un operatore con pazienti ancora assegnati (o sedute proprie
      // registrate) non si può eliminare per costruzione — le tabelle
      // 'pazienti'/'sessioni' referenziano operatore_id senza cascata
      // (vedi README), quindi Postgres rifiuta l'eliminazione invece di
      // trascinarsi dietro dati clinici altrui. Messaggio comprensibile
      // invece dell'errore grezzo del database.
      const looksLikeForeignKey = /foreign key|violat/i.test(deleteErr.message || '');
      const friendly = accountType === 'operatore' && looksLikeForeignKey
        ? 'Questo operatore ha ancora pazienti assegnati o sedute proprie registrate — riassegna i pazienti a un altro operatore prima di eliminarlo. Se vuoi solo bloccargli l\'accesso, usa "Archivia" invece di eliminare.'
        : 'Eliminazione non riuscita: ' + deleteErr.message;
      return json({ error: friendly }, 500);
    }

    // Registrato SOLO dopo il successo — un tentativo fallito (bloccato
    // dal vincolo sopra, o da un id inesistente) non produce una riga nel
    // registro azioni, coerente con "azione" nel nome della tabella: qui
    // vive solo quello che è davvero successo.
    await adminClient.from('audit_log').insert({
      azione: 'elimina_' + accountType,
      eseguita_da: user.id,
      eseguita_da_etichetta: opRow.nome || user.email,
      bersaglio_tipo: accountType,
      bersaglio_id: accountId,
      bersaglio_etichetta: targetLabel,
    });

    return json({ success: true, label: targetLabel });
  } catch (e) {
    return json({ error: 'Errore inatteso: ' + String(e) }, 500);
  }
});
