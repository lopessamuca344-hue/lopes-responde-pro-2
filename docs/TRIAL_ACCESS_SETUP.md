# Configuração dos códigos de teste

Este recurso cria 10 códigos individuais por e-mail, valida o código contra o e-mail confirmado da conta autenticada e permite revogação administrativa.

## Dependências obrigatórias

1. Crie um projeto Supabase e confirme o domínio de autenticação por e-mail.
2. Execute `database/trial-access.sql` no SQL Editor do Supabase.
3. Cadastre estas variáveis no projeto Vercel, em Production e Preview conforme necessário:
   - `SUPABASE_URL`: URL do projeto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave secreta de servidor do Supabase; nunca coloque no navegador.
   - `SUPABASE_ANON_KEY`: chave pública do Supabase usada para validar a sessão (recomendado).
   - `ADMIN_API_KEY`: segredo longo e aleatório para proteger endpoints administrativos.
   - `TRIAL_CODE_PEPPER`: segredo aleatório adicional para hash dos códigos.
   - `TRIAL_DAYS`: duração do teste em dias (padrão 14; permitido de 1 a 90).
4. Faça novo deploy depois de configurar as variáveis.

## Rotas

- `POST /api/trial-access/admin/codes`: cabeçalho `x-admin-key: <ADMIN_API_KEY>` e JSON `{"emails":["... 10 e-mails distintos ..."]}`. Cria 10 códigos únicos. Sem serviço de e-mail configurado, a resposta administrativa mostra os códigos uma única vez para envio manual.
- `POST /api/trial-access/redeem`: cabeçalho `Authorization: Bearer <token de sessão Supabase>` e JSON `{"code":"CODIGO-RECEBIDO"}`. Exige conta autenticada, e-mail confirmado e correspondência exata do e-mail destinatário.
- `GET /api/trial-access/me`: retorna os planos de teste ativos para a conta autenticada.
- `POST /api/trial-access/admin/revoke`: cabeçalho `x-admin-key` e JSON com `id` ou `email` para revogar.

## Limitações importantes

- A interface atual ainda usa login demonstrativo no navegador. As rotas de resgate exigem uma sessão real do Supabase; é necessário integrar a autenticação Supabase à interface antes de os usuários conseguirem resgatar códigos.
- O envio automático de e-mail ainda não está integrado. Até integrar um provedor e configurar domínio remetente, o administrador deve enviar os códigos manualmente em canal seguro.
- O chat e os recursos visuais dos planos ainda não consultam este direito de acesso. Portanto, este commit implementa a base do mecanismo, mas não significa que todos os planos estejam liberados na interface ou que o sistema esteja pronto para produção.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` nem `ADMIN_API_KEY` no HTML, JavaScript do navegador ou mensagens públicas.