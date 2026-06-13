import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialize Google Gen AI safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // API endpoint for chatbot
  app.post('/api/ai-chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensagens inválido.' });
    }

    if (!ai) {
      return res.json({
        text: 'Olá! Sou o assistente virtual do Severinu Service. O chatbot está em modo de demonstração local de respostas, pois nenhuma chave de API do Gemini foi adicionada. Conosco, os clientes descrevem o problema e escolhem a categoria; então os profissionais daquela categoria enviam propostas de preços e prazos e você decide quem quer contratar com base no menor valor ou nas avaliações!'
      });
    }

    try {
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const systemInstruction = `Você é o assistente virtual inteligente do Severinu Service (SaaS Marketplace de Prestação de Serviços).
Sua missão é tirar todas as dúvidas dos usuários sobre o funcionamento do sistema e guiar clientes e prestadores de serviços.

REGRAS DE FUNCIONAMENTO DO SEVERINU SERVICE:
1. Modo Orçamento / Cotação Aberta:
   - Clientes NÃO sugerem valores. Eles descrevem as necessidades do serviço e escolhem a Categoria.
   - O pedido é enviado (broadcasting) a todos os prestadores aprovados daquela categoria.
   - Prestadores aprovados visualizam os pedidos abertos na área "Oportunidades de Trabalho" em seu painel e enviam suas propostas de valor (R$) e mensagem explicativa.
   - O cliente analisa as propostas de volta na sua tela, podendo ordenar por "Menor Preço" ou "Melhor Avaliação".
   - O cliente escolhe quem contratar com 1 clique pressionando "Aceitar e Contratar".
2. Contratação e Chat:
   - Ao aceitar uma proposta, o prestador é contratado oficialmente e o sistema abre um chat privado exclusivo automaticamente para que ambos combinem detalhes finos e horário.
3. Pagamento por PIX:
   - Quando o serviço for concluído pelo prestador, o cliente efetua o pagamento de forma 100% segura usando PIX (QRCode ou Copia e Cola) diretamente na plataforma.
4. Planos Premium para Prestadores:
   - Prestadores podem aderir aos planos Bronze, Prata ou Ouro para ganhar exposição destacada no topo da busca, selos premium no perfil e prioridade. O pagamento do upgrade também é via PIX.
5. Painel Admin:
   - O administrador do sistema gerencia todos os clientes, visualiza e aprova prestadores de serviços instantaneamente com 1 clique, e acompanha todas as transações financeiras geradas por PIX no sistema.

Instruções para você, assistente:
- Responda em português brasileiro de forma extremamente amigável, clara e concisa.
- Use divisórias ou listas com marcadores se explicar etapas passo a passo.
- Se o usuário perguntar algo que não é de serviços ou do Severinu, mostre carisma e conduza-o de volta aos serviços.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ text: response.text || 'Desculpe, não consegui raciocinar no momento. Pode tentar de novo?' });
    } catch (error: any) {
      console.error('Erro na API do Gemini:', error);
      res.status(550).json({ error: error.message || 'Erro ao processar sua dúvida.' });
    }
  });

  // Serve Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
