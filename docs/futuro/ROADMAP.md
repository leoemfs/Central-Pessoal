# Próximas melhorias (ordem de construção)

> Lista viva do que está anotado e ainda não foi construído, na ordem combinada. Atualizada em nov/2026.
> Cada item tem a especificação no documento indicado. Ao terminar um item, marque-o aqui como feito, com a versão.

| # | Item | Documento | Tamanho | Situação |
|---|---|---|---|---|
| 0 | **Correção:** perguntar em qual fatura a compra entra; compra no cartão novo some da fatura (limite cai, fatura mostra R$ 0,00) | `correcao-fatura-cartao.md` | pequeno | a fazer (primeiro) |
| 1 | Hábitos: **pausar e arquivar** | `habitos-pausar-arquivar.md` | pequeno | a fazer |
| 2 | **Módulos personalizáveis**: mostrar/ocultar, escolher a barra de baixo, cartões do Início | `modulos-personalizaveis.md` | médio | a fazer |
| 3 | Preços 2.0, parte 1: **a lista puxa os produtos de Preços** (sugestões enquanto digita) e **estimativa com faixa de preço** sem prender a lista a uma loja | `precos-v2.md` (itens 2 e 3) | médio | a fazer |
| 4 | Preços 2.0, parte 2: **"quanto custou aqui?"** ao marcar o item na compra e histórico de compras | `precos-v2.md` (item 4) | médio | a fazer |
| 5 | Preços 2.0, parte 3: **tipos de loja** e filtro; editar, excluir e juntar produtos, marcas e lojas | `precos-v2.md` (itens 1 e 4) | médio | a fazer |
| 6 | **Repetição na Agenda** (toda semana, todo mês, todo ano) e aniversários | — (a especificar no começo do trabalho) | médio | a fazer |
| 7 | **Fichas de treino próprias** (criar e editar fichas, exercícios, séries, descanso) | `nucleo-mente-corpo.md` | médio | a fazer |
| 8 | Revisão semanal mais completa: **autocuidado, caixinhas e vales** da semana | `nucleo-mente-corpo.md`, `caixinhas.md` | pequeno | a fazer |
| 9 | Módulo **Saúde** (água, sono, remédios, consultas, peso) | `modulo-saude.md` | grande | a fazer |

**Fica para depois** (depende de outras decisões ou de integrações):
- **Jornada completa**, o jogo em pixel art. É grande e já está toda especificada em `modulo-rpg.md`.
- **Notificações** e **app Android**: `notificacoes.md` e `app-android.md`.
- **Código de barras, base de produtos e nota fiscal**: `precos-v2.md`, "Mais adiante".

## Regras para construir
- Uma versão por item (v0.16, v0.17…), cada uma com testes das regras, teste no navegador (celular) e documentação atualizada.
- Nada muda para quem já usa o app sem aviso: dados antigos continuam valendo, e o que for novo começa como hoje.
- Português simples nas telas. Visual igual ao do app: preto, verde e cartões.
