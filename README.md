# IL SISTEMA — Risveglio V3

PWA mobile-first ispirata agli RPG, dedicata a sonno, attività, umore, abitudini, obiettivi, missioni giornaliere/settimanali e dungeon.

## App

Quando GitHub Pages è attivo: https://eggimatto.github.io/Il-Sistema/

Dopo la pubblicazione, aprire Chrome su Android > menu > **Installa app** (o Aggiungi a schermata Home).

## Privacy

Il sito statico pubblico contiene soltanto codice e grafiche, non profili né dati del diario. I dati restano nel browser del dispositivo, e possono essere esportati in JSON per il backup e in Markdown per l'analisi con ChatGPT. Non condividere backup in chiaro se non desideri condividere informazioni personali.

Il cloud Supabase è opzionale e NON attivato. Usa solo un progetto dedicato separato da 4 SEMI, con Auth e RLS. Non mettere mai API secret/service-role keys nel client. L'app cifra i backup cloud localmente con una frase segreta dell'utente prima di inviarli.

Questa app non invia dati a OpenAI e non integra ChatGPT.


GitHub Pages: distribuzione tramite GitHub Actions.
