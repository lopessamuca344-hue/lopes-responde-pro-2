# Lopes Responde Pro — Projeto oficial

Assistente web em português brasileiro, com interface responsiva e API de conversa integrada ao Google Gemini.

## Estado atual

- Interface web: `index.html`
- Endpoint de conversa: `/api/chat`
- Endpoint de status: `/api/status`
- Integração Gemini no servidor: `services/ai.js`
- Configuração por variáveis de ambiente: `config.js`
- Segredos devem permanecer exclusivamente nas variáveis de ambiente da hospedagem.

## Variáveis de ambiente

Configure na Vercel, no ambiente correto, sem colocar valores secretos no código:

- `GEMINI_API_KEY`: chave privada do Google AI Studio.
- `NODE_ENV`: use `production` em produção quando aplicável.

Não compartilhe chaves em mensagens, capturas de tela ou arquivos públicos. Se uma chave for exposta, revogue-a e crie outra.

## Publicação e verificação

1. Confirme que a variável `GEMINI_API_KEY` está definida no projeto Vercel e no ambiente Production.
2. Faça uma nova implantação depois de alterar variáveis de ambiente.
3. Abra `/api/status` para verificar se a função de status responde.
4. Envie uma mensagem de teste pela página inicial e confira os logs da implantação se houver falha.

Uma resposta de status online confirma apenas que a função respondeu; não garante que a integração Gemini esteja configurada corretamente.

## Limites de segurança do produto

- O assistente não deve movimentar dinheiro, realizar pagamentos, transferências ou alterar Pix, carteira, cofre, preços, planos ou regras financeiras.
- Não coloque senhas, chaves, códigos de autenticação ou dados bancários completos no chat.
- O assistente não deve alegar ter publicado, enviado ou alterado algo em serviços externos sem uma integração autorizada e confirmação real.
- Integrações com WhatsApp, Instagram, Telegram, Facebook, X, Shopee, autenticação de usuários, assinaturas e pagamentos exigem implementação e testes próprios. Não estão habilitadas apenas por existir esta interface.

## Antes de abrir ao público

Ainda é necessário testar a implantação real, revisar autenticação e autorização, configurar limitação de uso persistente, política de privacidade, monitoramento, custos e controles de abuso. Não divulgar como produto completo até esses testes serem concluídos.
