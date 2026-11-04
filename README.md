# Central Pessoal

Aplicativo pessoal para organizar a vida num lugar só: **finanças, diário, agenda, tarefas, hábitos e anotações**.
O usuário registra; o app organiza, calcula e mostra o que importa no Início.

- Feito primeiro para o celular, mas funciona também no computador.
- Pode ser instalado na tela inicial (PWA) e funciona sem internet.
- **Os dados ficam só no aparelho** (IndexedDB do navegador): sem cadastro e sem servidor.

## Módulos

| Módulo | O que faz |
| --- | --- |
| **Início** | "Seu dia" (agenda, contas, diário e tarefas), acesso rápido, resumo do mês (total, já pago, em aberto), contas a vencer nos próximos 7 dias, compromissos, tarefas, últimos registros do diário e hábitos do dia. |
| **Finanças** | Despesas **avulsas**, **contas fixas** (todo mês, sem fim) e **parceladas** (01/12, 02/12…). Pagamento com data e valor reais. Editar ou excluir **somente esta / esta e as próximas / todas**. Categorias com ícone e cor, criadas sem sair do formulário. |
| **Cartões** | Cadastro com fechamento, vencimento, limite e cor. Cada compra cai sozinha na fatura certa. Faturas com total, situação e pagamento; limite disponível. |
| **Diário** | Feed privado: o registro mais novo no topo, os anteriores recolhidos, data e hora automáticas, etiqueta opcional, busca e histórico por ano e mês. |
| **Agenda** | Calendário com pontos para compromissos, tarefas e contas. Ao tocar num dia, abre tudo daquele dia: compromissos, tarefas, contas que vencem, compras no cartão, pagamentos feitos, rituais/hábitos (marcáveis) e registros do diário. Aba de tarefas. |
| **Núcleo pessoal** | **Rituais** (rotinas fixas, por dias da semana, período e horário, com gatilho "depois de…"), **hábitos a construir** (progresso até virar ritual — meta padrão de 66 dias) e **hábitos a abandonar** (dias sem, recorde e recaídas). Metas com quantidade (ex.: 2.000 ml, com anel de progresso e +incremento), aviso de **"não falhe duas vezes"**, sequência que não quebra em dias fora da rotina, consistência de 30 dias e mapa das últimas 12 semanas. |
| **Revisão semanal** | Semana de segunda a domingo: rotina (% feito e o que precisa de atenção), gastos e onde mais gastou, contas da semana seguinte, agenda, diário — e uma reflexão (o que funcionou, o que não, o que ajustar) salva no diário. Aparece no Início aos domingos e segundas. |
| **Jornada** | **Bloqueada até 14 dias de uso dentro de 3 semanas** (um dia conta quando você registra algo; faltar não zera). Ao desbloquear, mostra o XP, o nível e o ouro que você teria ganhado com os seus dados reais — e pergunta se a Jornada completa vale a pena ou fica para depois. Especificação completa em [docs/futuro/modulo-rpg.md](docs/futuro/modulo-rpg.md). |
| **Mais** | Núcleo pessoal (hábitos), Arquivo geral (anotações) e Configurações (tema claro/escuro/automático, categorias, backup e dados). |

**Navegação:** barra superior com o nome da aba atual (no Início, a data) e a 🔍 (no Diário, busca no diário), que some ao rolar para baixo e volta ao rolar para cima; atalhos inferiores (Início, Finanças, Diário, Agenda, Mais); menu ☰ com todos os módulos agrupados (Geral, Organização pessoal, Financeiro, Bem-estar, Planejamento); 🔍 **busca em tudo** (diário, despesas, agenda e anotações); botão **+** que adiciona na aba aberta (no Início, pergunta o quê); o **voltar** do celular fecha a janela ou o menu aberto antes de sair da página. Lembretes, Metas, Relatórios, Saúde, Estudos, Foco e Banco de ideias aparecem como "em breve".

## Regras financeiras

- **Fatura do cartão:** compra feita **antes** do dia de fechamento entra na fatura que está fechando. Compra feita **no dia do fechamento ou depois** entra na fatura seguinte. Datas que não existem no mês (ex.: dia 31 em fevereiro) usam o último dia do mês.
- **Resumo do mês:** cada fatura entra como **uma** conta (pelo vencimento). As compras do cartão contam nos gastos por categoria.
- **Parcelas:** quando o valor é informado pelo total, os centavos que sobram vão para a última parcela (R$ 100 em 3x = 33,33 + 33,33 + 33,34).
- **Editar "todas":** descrição e categoria mudam em todas. Valor e vencimento mudam só nas que ainda não foram pagas.
- **Conta fixa de valor variável:** ao pagar com outro valor (ex.: conta de luz), esse valor vira a previsão dos próximos meses.
- **Contas fixas:** ficam geradas até 2 meses à frente, e o app gera as seguintes conforme o tempo passa.
- **Limite do cartão:** desconta as compras em faturas não pagas, inclusive as parcelas futuras. Mensalidades futuras só contam depois de cobradas.

Tudo isso está em `src/finance.ts`, testado em `src/finance.test.ts`.

## Como rodar

Requer [Node.js](https://nodejs.org) 22 ou superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes das regras financeiras
npm run build      # versão de produção em dist/
```

## Publicar (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica o app a cada push na branch `main`.
Para ativar: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
O endereço fica `https://<usuario>.github.io/Central-Pessoal/`. Para instalar no celular, abra o endereço e escolha **Adicionar à tela inicial**.

## Dados e backup

- Os dados ficam no IndexedDB do navegador. O app pede ao navegador armazenamento persistente.
- Cada aparelho tem os seus próprios dados. Use **Ajustes → Exportar / Importar** para backup ou para levar os dados a outro aparelho. O Início avisa quando o último backup tem mais de 30 dias.
- Os registros guardam a data de criação, e as exclusões ficam marcadas (`deleted`). Isso prepara uma futura sincronização entre aparelhos.
- Dados do primeiro protótipo (localStorage) são migrados automaticamente.

## Estrutura

```
src/
  finance.ts         regras financeiras (faturas, parcelas, séries, resumo)
  finance.test.ts    testes das regras
  habits.ts          regras do Núcleo pessoal (sequência, consistência, dias sem)
  habits.test.ts     testes do Núcleo
  review.ts          revisão semanal (junta todos os módulos)
  review.test.ts     testes da revisão
  journey.ts         desbloqueio da Jornada e XP/nível/ouro a partir dos dados
  journey.test.ts    testes da Jornada
  data.ts            formato dos dados, categorias padrão e migração
  db.ts              IndexedDB
  store.tsx          estado global e salvamento automático
  router.ts          navegação por #endereço
  ui.tsx             ícones e componentes (janelas, campo de valor, status…)
  nav.ts             menu agrupado de módulos
  Search.tsx         busca em todos os módulos
  App.tsx            barra inferior, barra lateral e botão +
  modules/
    Dashboard.tsx    Início
    financas/        Finanças, cartões, faturas e formulários
    Diario.tsx       Diário
    Agenda.tsx       Agenda (+ Tarefas.tsx)
    Habitos.tsx      Núcleo pessoal
    Notas.tsx        Arquivo geral
    Ajustes.tsx, Mais.tsx
```

## Implementações futuras

Documentos de funcionalidades planejadas, ainda **sem desenvolvimento**:

- [Módulo RPG — Gamificação da Vida Pessoal](docs/futuro/modulo-rpg.md): Jornada com personagem em pixel art, XP, níveis, Gold, loja, inventário e conquistas, consumindo os dados dos módulos existentes. Decisão pendente sobre o tom do app.

Feito com React, TypeScript e Vite.
