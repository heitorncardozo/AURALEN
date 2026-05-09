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

    // ── 7. Envia Notificação por Email (Resend) 
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;

    if (RESEND_API_KEY && NOTIFICATION_EMAIL) {
      try {
        const emailHtml = `
          <div style="font-family: sans-serif; color: #121830; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2C97E; border-radius: 8px;">
            <h2 style="color: #C9A84C;">Novo Lead Recebido! 🎬</h2>
            <p>Você acabou de receber um novo lead pela Landing Page da AURALEN.</p>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 8px;"><strong>👤 Nome:</strong> ${nome}</li>
              <li style="margin-bottom: 8px;"><strong>🏢 Empresa:</strong> ${empresa || 'Não informado'}</li>
              <li style="margin-bottom: 8px;"><strong>📱 WhatsApp:</strong> ${whatsapp}</li>
              <li style="margin-bottom: 8px;"><strong>✉️ Email:</strong> ${email}</li>
              <li style="margin-bottom: 8px;"><strong>🎯 Segmento:</strong> ${segmento || 'Não informado'}</li>
              <li style="margin-bottom: 8px;"><strong>🎥 Serviço:</strong> ${servico || 'Não informado'}</li>
              <li style="margin-bottom: 8px;"><strong>💰 Investimento:</strong> ${investimento || 'Não informado'}</li>
            </ul>
            <p style="margin-top: 20px; font-size: 14px; color: #8A8FA3;">O lead já foi salvo automaticamente no seu Notion.</p>
          </div>
        `;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'AURALEN Leads <onboarding@resend.dev>',
            to: NOTIFICATION_EMAIL,
            subject: `Novo Lead: ${nome} - AURALEN`,
            html: emailHtml
          })
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Não quebramos a resposta se o email falhar, o lead já está no Notion!
      }
    }

    // ── 8. Sucesso! ───────────────────────────
    return res.status(200).json({ ok: true, message: 'Lead salvo e notificado com sucesso' });

  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
