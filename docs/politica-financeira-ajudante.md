# Política financeira — Lopes Responde Pro

## 1. Cofres separados
- O Cofre Master pertence exclusivamente ao Administrador Master.
- O Administrador Ajudante não pode consultar saldo, extrato, destinatários, chaves, credenciais ou operações do Cofre Master.
- O Ajudante terá uma conta/ carteira própria, separada e identificada pelo seu próprio beneficiário.
- A separação deve ser aplicada no servidor e no banco de dados; ocultar elementos na interface não é controle de segurança suficiente.

## 2. Participação do Administrador Ajudante
- Apenas 1 pessoa, escolhida pelo Administrador Master entre até 10 candidatos, poderá receber o papel de Administrador Ajudante.
- A participação é de 10% do lucro líquido elegível do aplicativo, não de 10% do faturamento bruto.
- Antes de calcular a participação, a regra financeira deve descontar os itens definidos pela operação, incluindo taxas de processamento, reembolsos, estornos/chargebacks, impostos e custos operacionais elegíveis.
- Se o lucro líquido elegível do período for zero ou negativo, a participação daquele período será zero.
- O percentual de 10% é fixo e só pode ser alterado pelo Administrador Master mediante mudança explícita e auditável das regras.

## 3. Permissões limitadas
- O Ajudante só recebe permissões individuais concedidas expressamente pelo Administrador Master.
- Não pode alterar preços, planos, percentual de participação, fórmula de lucro, regras de pagamento, dados do beneficiário, Cofre Master, credenciais ou configurações financeiras críticas.
- Todas as concessões, alterações e revogações de permissões devem gerar registro de auditoria.

## 4. Repasse e prevenção de duplicidade
- O repasse automático de 10% só pode ser ativado depois de integrar e testar um provedor de pagamentos com cadastro seguro do beneficiário.
- O sistema deve calcular cada período uma única vez e manter um livro-razão auditável com período, base de cálculo, deduções, lucro elegível, percentual, valor devido, beneficiário e estado do repasse.
- Estados mínimos: pendente, processando, pago e falhou. Uma nova tentativa não pode duplicar um repasse já confirmado.
- Webhooks do provedor devem ser autenticados e verificados antes de marcar um repasse como pago.
- Não registrar números de conta completos, senhas, tokens ou chaves secretas em logs nem enviar esses dados para a IA.
- A IA não movimenta dinheiro por conta própria. O repasse previsto nesta política é uma regra específica do produto, executada somente por uma integração de pagamentos autorizada, com limites e trilha de auditoria.

## 5. Estado atual
Este documento registra a regra desejada do produto. Ele não significa que carteiras reais, cálculo de lucro ou repasses automáticos já estejam implementados ou ativos. Isso exige implementação no servidor e no banco de dados, configuração segura do provedor e testes antes da ativação em produção.
