export default async function handler(req, res) {
  // ── 1. Só aceita POST ──────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // ── 2. Pega os dados do formulário ─────────
  const {
    nome,
    empresa,
    whatsapp,
    email,
    cidade,
    instagram,
    segmento,
    servico,
    momento,
    prazo,
    investimento,
    origem,
    descricao
  } = req.body;

  // ── 3. Valida os campos obrigatórios ───────
  if (!nome || !whatsapp || !email) {
    return res.status(400).json({ error: 'Nome, WhatsApp e Email são obrigatórios' });
  }

  // ── 4. Pega o token e o database ID ────────
  const NOTION_TOKEN       = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  // ── 5. Monta e envia para a API do Notion ──
  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization':   `Bearer ${NOTION_TOKEN}`,
        'Notion-Version':  '2022-06-28',
        'Content-Type':    'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          'Nome': { title: [{ text: { content: nome || '' } }] },
          'Empresa': { rich_text: [{ text: { content: empresa || '' } }] },
          'WhatsApp': { phone_number: whatsapp || '' },
          
          // Adiciona os campos opcionais dinamicamente para evitar erros na API do Notion
          ...(email && { 'Email': { email: email } }),
          'Cidade': { rich_text: [{ text: { content: cidade || '' } }] },
          'Instagram/Site': { rich_text: [{ text: { content: instagram || '' } }] },
          
          // Selects (certifique-se de que essas opções exatas existem no Notion ou crie com o mesmo nome lá)
          ...(segmento && { 'Segmento': { select: { name: segmento } } }),
          ...(servico && { 'Serviço': { select: { name: servico } } }),
          ...(momento && { 'Momento': { select: { name: momento } } }),
          ...(prazo && { 'Prazo': { select: { name: prazo } } }),
          ...(investimento && { 'Investimento': { select: { name: investimento } } }),
          ...(origem && { 'Origem': { select: { name: origem } } }),
          
          'Descrição': { rich_text: [{ text: { content: descricao || '' } }] },
          
          // "Status Lead" deve ser uma propriedade do tipo "Status" (não Select) no Notion
          'Status Lead': { status: { name: 'Novo Lead' } },
          
          'Data Entrada': {
            date: { start: new Date().toISOString().split('T')[0] }
          }
        },
      }),
    });

    // ── 6. Verifica se o Notion aceitou ───────
    if (!notionRes.ok) {
      const errorData = await notionRes.json();
      console.error('Erro do Notion:', errorData);
      return res.status(500).json({
        error: 'Falha ao salvar no Notion',
        detail: errorData.message,
      });
    }

    // ── 7. Sucesso! ───────────────────────────
    return res.status(200).json({ ok: true, message: 'Lead salvo com sucesso' });

  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
