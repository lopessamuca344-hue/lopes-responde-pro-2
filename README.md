# Lopes Responde Pro — Projeto oficial

Assistente web em português brasileiro, com interface responsiva e API de conversa integrada ao Google Gemini.

## Estado atual

- Interface web: `index.html`
- Endpoint de conversa: `/api/chat`
- Endpoint de status: `/api/status`
- Integração de IA: `services/ai.js`
- Autenticação/cadastro: Supabase Auth, quando configurado
- Controles Master: tabela `public.lopes_admin_controls`
- Códigos de teste: tabela `public.trial_access_codes`
- Verificação de sintaxe: `npm run check`

O projeto ainda precisa de configuração de serviços externos e testes funcionais antes de ser considerado pronto para clientes pagantes.

## Variáveis de ambiente na Vercel

Configure somente as variáveis necessárias para as funções que deseja habilitar. Nunca coloque valores secretos no GitHub, em arquivos públicos ou no chat.

### IA — necessário para o chat responder

- `GEMINI_API_KEY`: chave privada do Google AI Studio.
- `GEMINI_MODEL`: opcional; o padrão do código é `gemini-2.5-flash`.

Alternativa, se optar por OpenAI:
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opcional; padrão `gpt-4.1-mini`)

Use um único provedor por vez. Depois de alterar variáveis, faça uma nova implantação para que entrem em vigor.

### Cadastro, login e Administrador Master

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_ANON_KEY`: chave pública/anon do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave secreta de serviço; somente no servidor/Vercel, nunca no navegador ou GitHub.
- `MASTER_ADMIN_EMAIL`: opcional; e-mail do Administrador Master. O padrão no código é `lopessamuca344@gmail.com`.

Execute `supabase/profile-security.sql` e `supabase/admin-controls.sql` no SQL Editor do Supabase. O primeiro protege a tabela `perfil_usuario`; o segundo mantém a tabela de controles Master inacessível diretamente a usuários. Execute cada arquivo uma vez e confira se o Supabase retorna sucesso. A estrutura de registros financeiros está separada em `supabase/financial-ledger.sql`; revise e execute somente quando for iniciar a etapa financeira.
Para gerar, validar e revogar códigos de teste, execute também `supabase/trial-access.sql`.

### Códigos de teste e envio de e-mail (opcional)

- `TRIAL_DAYS`: opcional, dias de validade (padrão 14; permitido de 1 a 90).
- `TRIAL_CODE_PEPPER`: opcional, segredo adicional para gerar hashes dos códigos.
- `RESEND_API_KEY` e `TRIAL_FROM_EMAIL`: opcionais; habilitam envio de e-mails por Resend. O remetente precisa estar autorizado no serviço.

Sem as variáveis de e-mail, os códigos podem ser gerados, mas precisam ser enviados manualmente pelo administrador.

## Passos de configuração

1. Configure `GEMINI_API_KEY` no ambiente Production da Vercel.
2. Configure as variáveis Supabase acima se quiser cadastro/login e funções Master.
3. No Supabase, execute os dois arquivos SQL mencionados.
4. Faça uma nova implantação na Vercel após alterar as variáveis.
5. Abra `/api/status`. Isso confirma apenas que o endpoint de status respondeu; não comprova que a IA, login, banco ou cobrança funcionam.
6. Teste chat, cadastro, login e funções Master separadamente, consultando os logs da implantação se houver erro.

## Monetização e integrações

- Não existe cobrança por assinatura, checkout ou provedor de pagamento conectado apenas por haver planos desenhados na interface.
- Não existe rede de anúncios conectada apenas por haver um espaço publicitário na interface.
- Os atalhos para WhatsApp, Telegram, Instagram, Facebook, X, Shopee e ChatGPT abrem sites oficiais; não dão ao aplicativo acesso às contas.
- Cobrança, anúncios e integrações com plataformas precisam de implementação oficial, configuração de conta e testes separados.
- A receita não é garantida. Antes de anunciar o produto como pronto, teste custos da IA/hospedagem e confirme que os pagamentos, quando implementados, funcionam.

## Limites de segurança

- A IA não deve movimentar dinheiro, realizar pagamentos ou transferências, nem alterar Pix, carteira/cofre, preços, planos ou regras financeiras.
- Não envie senhas, chaves, códigos de autenticação ou dados bancários completos ao chat.
- O sistema não deve alegar ter executado ações externas sem uma integração autorizada e confirmação real.
- O Administrador Master deve usar conta confirmada e credenciais privadas. Nunca compartilhe a chave service role.


### Política financeira do Administrador Ajudante

A regra de produto está documentada em `docs/politica-financeira-ajudante.md`. A estrutura inicial de livro-razão está em `supabase/financial-ledger.sql`.

- A participação prevista é de 10% do lucro líquido elegível, nunca do faturamento bruto.
- O cofre Master e a carteira do Ajudante devem permanecer separados.
- O Ajudante não pode mudar preços, planos, percentual, fórmula de lucro, regras de pagamento nem acessar o cofre Master.
- **Ainda não há repasse automático ativo.** Antes de ativá-lo, é necessário revisar e executar o SQL no Supabase, implementar o cálculo no servidor, integrar um provedor de pagamentos e testar os estados de repasse sem duplicidade.
