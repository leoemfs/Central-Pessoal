# Navegação 2.0, personalização de cartões, temas e Finanças

> **Status: ESPECIFICADO, aguardando aprovação.** Itens E1 a E6, M9 e M10 da Central (`docs/CENTRAL.md`). Decisões tomadas com o Leonardo em 08/11/2026.

## Barra de baixo (E1 e E2)
- **Fixos:** Início (esquerda) e Mais (direita).
- **No Início:** os 3 do meio são os **módulos favoritos**, escolhidos pela pessoa (padrão: Finanças, Diário, Agenda).
- **Dentro de um módulo:** os 3 do meio passam a ser **do próprio módulo**, com a "casa" do módulo no centro:

| Módulo | Esquerda | Centro | Direita |
|---|---|---|---|
| Finanças | Orçamento | Finanças | Relatórios |
| Diário | Humor | Diário | Revisão |
| Agenda | Tarefas | Agenda | Hoje |
| Núcleo | Mente | Núcleo | Corpo |
| Listas | Receitas | Listas | Preços |

- **Entre módulos:** pelo Início (favoritos), pelo Mais (todos os módulos) e pelo menu lateral ☰.
- **Só ícones**, um pouco maiores, em toda a barra (também no Início). Os nomes não mudam.
  - Ícone ativo na cor de destaque, com um fundinho.
  - Segurar o dedo num ícone mostra o nome.
- **Topo mostra onde você está:** "Finanças" na casa do módulo; "Finanças / Orçamento" numa aba do módulo.
- **Orçamento e Relatórios saem do Mais** (ficam na barra de Finanças).
- O resto do E1 continua como em `modulos-personalizaveis.md`: ocultar módulos, ordem no Mais e ritmo de cada módulo.

## Personalizar cartões (E3)
- **Lápis ao lado da lupa**, no topo do Início e da maioria dos módulos.
- Ao tocar, a tela entra no **modo de edição**:
  - cada cartão ganha ↑ ↓ (ou arrastar) e um olho para ocultar;
  - cartões ocultos aparecem no fim, para mostrar de novo;
  - botão **Pronto** para sair e **Restaurar padrão**.
- **Cartões fixos (🔒):** o principal de cada módulo não sai do lugar e não pode ser ocultado. Exemplos: o calendário na Agenda e o resumo do mês em Finanças.
- **No Início:**
  - **Humor** sempre no topo;
  - **avisos importantes** (conta vencendo, vale com saldo baixo) e **Seu dia** nunca ficam ocultos, mas podem subir ou descer;
  - os outros cartões podem ser ocultados e reordenados, como widgets.
- Substitui os "cartões do Início" que estavam em `modulos-personalizaveis.md`.

## Abas internas (E5)
- **Deslizar o dedo** para o lado troca de aba (ex.: Despesas ↔ Receitas ↔ Cartões ↔ Caixinhas).
- **Abas presas no topo** ao rolar a tela, para não precisar subir tudo.
- Vale para todos os módulos com abas.

## Temas (E4)
- **Configurações › Temas:**
  - **Tema:** escuro, claro ou automático (segue o celular);
  - **Cor de destaque:** paleta com bom contraste nos dois temas. Vale para o tema ativo.
- **Padrões:** escuro = preto com verde (o de hoje); claro = branco com azul escuro.
- Os ícones não mudam, só a cor de destaque.

## Busca por módulo (E6, mais adiante)
- A lupa pesquisa **dentro do módulo aberto**. Em Finanças, por exemplo, procura nos nomes das despesas, receitas, cartões e caixinhas.
- No Início, continua sendo a busca geral.

## Finanças (M9 e M10)
- **Botão +** abre um menu:
  - Nova despesa
  - Nova receita
  - Novo cartão
  - Nova caixinha
  - *(separado)* Categorias
- As **categorias** passam a morar dentro de Finanças. Em Configurações fica só um atalho.
- **"Já pago" e "Em aberto" clicáveis:** tocar abre a lista só com essas contas.

## Pacotes de construção
- **B, Finanças:** M9 + M10 + E5 (pequeno).
- **A, Navegação:** E2 + E1 + E3 (médio a grande). Prévia visual antes.
- **D, Temas:** E4.
- **Depois:** E6.

## Dados (rascunho)
```ts
settings: {
  favorites: [string, string, string];        // módulos do Início
  cards: Record<string, { order: string[]; hidden: string[] }>;  // por tela: 'inicio', 'financas'…
  theme: { mode: 'escuro' | 'claro' | 'auto'; accent: string | null };  // null = padrão do tema
}
```
