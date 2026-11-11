# Navegação 2.0, personalização de cartões, temas e Finanças

> **Status:** E5, M9 e M10 **feitos na v0.16** (pacote B); E4 **feito na v0.17** (pacote D); E2 e os favoritos do E1 **feitos na v0.18** (A1). E3 **feito na v0.20** no Início e em Finanças (falta Agenda, Núcleo e Listas). O resto do E1 e o E6 aguardando aprovação. Itens E1 a E6, M9 e M10 da Central (`docs/CENTRAL.md`). Decisões tomadas com o Leonardo em 08/11/2026.

## Barra de baixo (E1 e E2)
- **Fixos:** Início (esquerda) e Mais (direita).
- **No Início:** os 3 do meio são os **módulos favoritos**, escolhidos pela pessoa (padrão: Finanças, Diário, Agenda).
- **Dentro de um módulo:** os 3 do meio passam a ser **do próprio módulo**, com a "casa" do módulo no centro:

| Módulo | Esquerda | Centro | Direita |
|---|---|---|---|
| Finanças | Orçamento | Finanças | Relatórios |
| Diário | Humor | Diário | Revisão |
| Agenda | Hoje | Agenda | Próximos |
| Núcleo | Progresso | Núcleo | Histórico |
| Listas | Compras | Listas | Preços |

> **v0.25 (E10, E11, E12, E13):** o jeito da barra é escolhido em Configurações › Personalização (favorito no mesmo lugar, ao lado do Início ou no centro). O voltar do celular vai da ferramenta para a casa do módulo e depois para o Início; trocar de módulo pelos favoritos não empilha telas.

> **v0.20.1 (E9):** o módulo favorito não muda de posição ao entrar nele; as ferramentas ocupam os outros dois espaços, na ordem (esquerda, direita). Módulo que não é favorito fica no centro.

> Atualizado na v0.19 (E8): a barra não repete abas. Regra completa no `CLAUDE.md` ("Regra de navegação").

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

## Busca por módulo (E6, pronto na v0.35)
- A lupa pesquisa **dentro do módulo aberto**. Em Finanças, por exemplo, procura nos nomes das despesas, receitas, cartões e caixinhas.
- No Início, continua sendo a busca geral.
- Como ficou: `SearchSheet` (`src/Search.tsx`) recebe o módulo da tela (`moduleOf` em `src/setup.ts`) e mostra os chips "Em Finanças" · "Em tudo". O Diário mantém a busca própria dele.

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


## Lápis nos outros módulos (v0.34)
Agenda (calendário fixo + Próximos compromissos), Núcleo › Rituais (Hoje fixo, um cartão por período, Em outros dias, Pausados e arquivados), Listas (um cartão por categoria, na visão "Todas"), Estudos (bloco principal fixo, Estudando agora, Continuar, Como funciona, Sugestões) e Carreira (Trabalho atual fixo e as demais seções). Mesmo componente `CardScreen` (`src/Cards.tsx`); a ordem fica em `settings.cards[tela]`.
