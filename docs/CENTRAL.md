# Central de melhorias

> O único lugar para registrar, classificar, priorizar e acompanhar o desenvolvimento. Substitui o antigo `docs/futuro/ROADMAP.md`.
> As especificações detalhadas ficam em `docs/futuro/` (um documento por ideia). O manual do app é o `README.md`.

## Como usar
1. **Anotar:** qualquer ideia ou problema entra na **Caixa de entrada**, em uma linha, do jeito que foi dito.
2. **Classificar:** vira um item na tabela, com frente, tamanho, prioridade e situação.
3. **Especificar:** quando for a vez dele, ganha (ou atualiza) um documento em `docs/futuro/`.
4. **Aprovar:** só com o "aprovado" do Leonardo o item entra na **Fila aprovada**.
5. **Construir:** só o que está na fila, um PR por item. Ao terminar, vai para **Feito**.

**Frentes:** `EXP` Experiência e navegação · `MOD` Melhorias nos módulos existentes · `COR` Correções e estabilidade · `NOVO` Expansão e integração.
**Tamanho** (quanto do limite de uso consome): `P` pequeno (uma conversa curta) · `M` médio (uma sessão de construção) · `G` grande (várias sessões; dividir em partes).
**Prioridade:** `alta` · `média` · `baixa`.
**Situação:** `ideia` → `especificado` → `aprovado` → `construindo` → `pronto (vX)`.

## Caixa de entrada
*Ideias e problemas ainda sem classificar. Uma linha cada, com a data.*

- (vazia)

## Itens
| ID | Item | Frente | Tam. | Prior. | Situação | Documento |
|---|---|---|---|---|---|---|
| C1 | Fatura do cartão: perguntar em qual fatura a compra entra; compra no cartão novo some da fatura (limite cai, fatura mostra R$ 0,00) | COR | P | alta | especificado | `futuro/correcao-fatura-cartao.md` |
| M1 | Hábitos: pausar e arquivar | MOD | P | alta | especificado | `futuro/habitos-pausar-arquivar.md` |
| E1 | Módulos personalizáveis: mostrar/ocultar, barra de baixo, cartões do Início e ritmo de cada módulo (Diário: todo dia, X vezes na semana, dias certos ou quando der) | EXP | M | alta | especificado | `futuro/modulos-personalizaveis.md` |
| M2 | Preços 2.0, parte 1: a lista puxa os produtos de Preços e estima com faixa de preço, sem prender a uma loja | MOD | M | média | especificado | `futuro/precos-v2.md` (itens 2 e 3) |
| M3 | Preços 2.0, parte 2: "quanto custou aqui?" ao marcar o item e histórico de compras | MOD | M | média | especificado | `futuro/precos-v2.md` (item 4) |
| M4 | Preços 2.0, parte 3: tipos de loja e filtro; editar, excluir e juntar produtos, marcas e lojas | MOD | M | média | especificado | `futuro/precos-v2.md` (itens 1 e 4) |
| M5 | Agenda: repetição (toda semana, mês, ano) e aniversários | MOD | M | média | ideia | — (especificar antes) |
| M6 | Núcleo: fichas de treino próprias (exercícios, séries, descanso) | MOD | M | média | especificado | `futuro/nucleo-mente-corpo.md` |
| M7 | Revisão semanal mais completa: autocuidado, caixinhas e vales da semana | MOD | P | baixa | especificado | `futuro/nucleo-mente-corpo.md`, `futuro/caixinhas.md` |
| N1 | Módulo Saúde (água, sono, remédios, consultas, peso) | NOVO | G | média | especificado | `futuro/modulo-saude.md` |
| N2 | Jornada completa (pixel art): missões no ritmo da pessoa, recompensas por módulo, raridades (comum a místico), Forja e Codex por coleções | NOVO | G | baixa | especificado | `futuro/modulo-rpg.md`, `futuro/jornada-recompensas.md`, `futuro/jornada-raridades.md` |
| N3 | Notificações | NOVO | M | baixa | especificado | `futuro/notificacoes.md` |
| N4 | App Android | NOVO | G | baixa | especificado | `futuro/app-android.md` |
| N5 | Código de barras, base de produtos e nota fiscal | NOVO | G | baixa | ideia | `futuro/precos-v2.md` ("Mais adiante") |

**Depende de outra coisa:** N3 fica melhor junto com N4 (notificações de verdade no Android). N2 e N5 dependem de decisões e integrações.

## Fila aprovada
*O que pode ser construído, na ordem. Vazia = nada para construir.*

- (vazia: aguardando aprovação)

**Ordem sugerida** (quando aprovar): C1 → M1 → E1 → M2 → M3 → M4 → M5 → M6 → M7 → N1.

## Feito
| Versão | O que entrou | PR |
|---|---|---|
| v0.15 | Vale (VR/VA) em Cartões: saldo, recarga mensal e pagar com vale | #13 |
| v0.14 | Listas com categorias, Preços, humor do dia, orçamento por categoria e relatórios | — |
| v0.13 | Caixinhas em Finanças | — |
| v0.12 | Você (entrevista e sugestões) e Núcleo Mente/Corpo | — |
| até v0.11 | Finanças, Agenda, Diário, Núcleo, Receitas, revisão semanal, atributos e Jornada bloqueada (14 dias) | ver PRs no GitHub |

Documentos sem código: módulos personalizáveis, pausar e arquivar, ROADMAP e Central (#14 e seguintes).

## Prévias visuais guardadas
| Prévia | Link |
|---|---|
| App: Você, Núcleo Mente/Corpo e entrevista | https://claude.ai/artifact/H2ZUAVPQtyuFoCqBAE7yRk |
| Orçamento, relatórios, listas, preços e humor | https://claude.ai/artifact/3PiFTWyQaBYrgfScRRFxsj |
| Jornada (pets, Codex, acessórios, visitas) | https://claude.ai/artifact/LDdQDmTYY3j56etqqMc9Qc |
| Jornada RPG (avatar, arsenal, forja) | https://claude.ai/artifact/62xbF4H9CfYjaz7RaX554h |
| Central Pessoal (prévia geral antiga) | https://claude.ai/artifact/WHbDkKXN4LArCQ8sjuQqVt |

## Regras para construir
- Uma versão por item (v0.15.1, v0.16…), com testes das regras, teste no navegador (celular) e documentação atualizada.
- Nada muda para quem já usa o app sem aviso: dados antigos continuam valendo, e o que for novo começa como hoje.
- Português simples nas telas. Visual igual ao do app: preto, verde e cartões.
