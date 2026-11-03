# Central Pessoal

Seu painel pessoal em um só lugar: **tarefas, finanças, hábitos, notas e agenda**.

Funciona no navegador do computador e do celular, pode ser instalado como app (PWA) e funciona offline.
**Seus dados ficam só no seu aparelho** (no armazenamento local do navegador) — sem cadastro, sem servidor.

## Módulos

| Módulo | O que faz |
| --- | --- |
| **Início** | Resumo do dia: tarefas de hoje e atrasadas, eventos, hábitos para marcar, saldo do mês e notas fixadas. |
| **Tarefas** | Prazo, prioridade, etiquetas e observações; filtros (pendentes, hoje, atrasadas, concluídas) e busca. |
| **Finanças** | Receitas e despesas por mês, categorias, saldo do mês e geral, gráfico de gastos por categoria. |
| **Hábitos** | Marcação diária nos últimos 7 dias, sequência atual (🔥) e aproveitamento no mês. |
| **Notas** | Editor com salvamento automático, busca e notas fixadas. |
| **Agenda** | Calendário mensal com eventos e prazos de tarefas, lista do dia e próximos eventos. |
| **Ajustes** | Tema claro/escuro/automático, exportar/importar backup (.json) e apagar dados. |

## Como rodar

Requer [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npm run dev       # abre em http://localhost:5173
```

Outros comandos:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a versão de produção localmente
npm run typecheck # verifica os tipos
```

## Publicar (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica o app automaticamente a cada push na branch `main`.
Para ativar: no GitHub, vá em **Settings → Pages → Build and deployment → Source** e escolha **GitHub Actions**.
O app fica em `https://<seu-usuario>.github.io/Central-Pessoal/`.

Para instalar no celular: abra o link no navegador e use **"Adicionar à tela inicial"**.

## Seus dados

- Tudo é salvo automaticamente no `localStorage` do navegador, na chave `central-pessoal:v1`.
- Cada navegador/aparelho tem seus próprios dados. Para levar tudo para outro aparelho, use
  **Ajustes → Exportar backup** e depois **Importar backup** no outro.
- Limpar os dados do site no navegador apaga as informações — exporte backups de vez em quando.

## Estrutura

```
src/
  main.tsx          ponto de entrada + registro do service worker
  App.tsx           layout, navegação (rotas por #hash) e tema
  store.tsx         estado global persistido no localStorage
  actions.ts        operações de dados (criar, editar, excluir, marcar)
  types.ts          modelos de dados
  utils.ts          datas, moeda (pt-BR / R$) e helpers
  ui.tsx            ícones e componentes reutilizáveis
  styles.css        tema claro/escuro e layout responsivo
  modules/          uma tela por módulo
public/             ícones, manifest e service worker (PWA)
```

Feito com React, TypeScript e Vite.
