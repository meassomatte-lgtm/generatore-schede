export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { eta, sesso, livello, obiettivo, giorni, durata, attrezzatura, limitazioni } = req.body;

  // Validazione base
  if (!eta || !sesso || !livello || !obiettivo || !giorni || !durata || !attrezzatura) {
    return res.status(400).json({ error: 'Parametri mancanti.' });
  }

  const prompt = `Crea una scheda di allenamento personalizzata per:
- Età: ${eta} anni
- Sesso: ${sesso}
- Livello: ${livello}
- Obiettivo: ${obiettivo}
- Giorni a settimana: ${giorni}
- Durata sessione: ${durata}
- Attrezzatura: ${attrezzatura}
${limitazioni ? '- Limitazioni/note: ' + limitazioni : ''}

Crea una scheda dettagliata e strutturata con:
1. Una breve introduzione personalizzata (2-3 righe)
2. Il piano settimanale con i giorni di allenamento e riposo
3. Per ogni giorno di allenamento: nome della seduta, lista degli esercizi con serie, ripetizioni/tempo, e recupero
4. Consigli pratici finali (riscaldamento, progressione, alimentazione base)

Usa un formato chiaro e leggibile con sezioni ben separate.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', // ← corretto
        max_tokens: 3500,           // ← aumentato
        system: 'Sei un personal trainer esperto. Crei schede di allenamento dettagliate, sicure e personalizzate.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'Errore API Anthropic.' });
    }

    const data = await response.json();
    const testo = data.content?.[0]?.text || 'Errore nella generazione.';
    res.status(200).json({ scheda: testo });

  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
}
