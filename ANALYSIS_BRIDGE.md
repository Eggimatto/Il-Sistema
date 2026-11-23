# IL SISTEMA — Ponte di analisi temporaneo

## Accesso consensuale ai dati

L'utente apre **Report → Analisi e piani con ChatGPT**, seleziona i dati, accetta la condivisione e preme **Condividi per analisi**.

Il browser crea un codice casuale di 12 caratteri (ad esempio `ABC234...XYZ`). Il riepilogo autorizzato viene salvato per 24 ore in `public.sistema_analysis_shares` sul progetto Supabase dedicato a IL SISTEMA (`ispowqxiddovsewfokht`). I dati non sono mai pubblicati sul repository GitHub. Non viene divulgata la frase segreta usata per cifrare il backup.

**Il riepilogo di analisi non ha cifratura AES lato client ed è accessibile agli amministratori autorizzati del progetto.** È necessario il consenso esplicito ogni volta. La rimozione avviene su revoca o tramite un job periodico dopo la scadenza. Il backup cifrato normale rimane separato.

## Per un assistente ChatGPT con accesso a Supabase

Chiedere **solo il codice di analisi** all'utente. Non chiedere password, link di accesso o frasi segrete.

Leggere esclusivamente il riepilogo identificato dal codice e non scaduto:

```sql
select snapshot, created_at, expires_at
from public.sistema_analysis_shares
where share_code = 'CODICE_UTENTE'
  and expires_at > now()
limit 1;
```

Non ricercare altri utenti o altri codici. Il riepilogo contiene gli ultimi 30 giorni di pasti esplicitamente registrati, i prossimi 30 giorni di menu, le valutazioni, le sessioni di allenamento e la scheda impostata; sonno, peso e umore **solo** se l'utente li ha inclusi volontariamente.

## Scrivere una proposta, mai alterare il backup

Per suggerimenti in-app, inserire una riga nella tabella `public.sistema_plan_proposals`, selezionando l'utente dal codice valido:

```sql
insert into public.sistema_plan_proposals
    (user_id, share_code, title, rationale, proposal)
select user_id, share_code,
       'Proposta di menu e allenamento',
       'Breve motivazione basata sulle registrazioni',
       '{
         "meal_edits": [
           {"day":"2026-12-01","kind":"dinner",
            "name":"Riso e pollo","ingredients":"Riso, pollo, olio",
            "how":"Cuocere e servire","shop":["riso","pollo"]}
         ],
         "workout_edits": [
           {"day":"2026-12-01","title":"Seduta leggera","minutes":20,
            "exercises":[["Squat alla sedia","2 x 8","Controlla il movimento"]]}
         ],
         "fitness":{"days":[1,4],"maxDailyMinutes":25}
       }'::jsonb
from public.sistema_analysis_shares
where share_code = 'CODICE_UTENTE'
  and expires_at > now();
```

I campi opzionali sono `meal_edits`, `workout_edits`, `fitness`. I quattro tipi di pasto sono `snack1`, `lunch`, `snack2`, `dinner`. Non creare proposte cliniche o prescrizioni mediche.

Le proposte rimangono in attesa finché l'utente non apre **Report → Controlla proposte → Approva e applica**. L'app applica solo i campi consentiti, salva nel profilo locale e usa la normale sincronizzazione cloud cifrata. L'utente può rifiutare ogni proposta.

Il codice di condivisione non è una password: non consente accesso pubblico al database. La query richiede il collegamento amministrativo autorizzato a Supabase. I dati non vengono inviati automaticamente a ChatGPT senza una richiesta dell'utente.
