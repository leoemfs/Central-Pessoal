# Módulo Listas

> **Status: IDEIA PARA IMPLEMENTAÇÃO FUTURA.** Sem desenvolvimento.

Um lugar para listas que se usam e reusam: compras, listas gerais (mala de viagem, filmes, presentes) e receitas de cozinha.

## Módulo próprio ou dentro de outro?

| Opção | Prós | Contras |
|---|---|---|
| Dentro de **Notas** (nota do tipo checklist) | Nada novo no menu | Notas são texto livre; marcar itens, quantidade e "desmarcar tudo para reusar" ficam escondidos |
| Dentro de **Tarefas** | Já tem marcar/concluir | Tarefas têm data e somem quando feitas; uma lista de compras volta toda semana |
| **Módulo Listas** (recomendado) | Feito para reusar, com tipos (compras, geral, receita) e ligação com Preços e Finanças | Mais um item no menu (fica em "Organização pessoal", ao lado de Notas) |

**Recomendação:** módulo próprio, **Listas**, no grupo Organização pessoal. A Busca inclui as listas. Uma tarefa pode apontar para uma lista (ex.: "Fazer mercado" → lista Mercado do mês).

**Atenção ao nome:** o app já usa **Receitas** para dinheiro que entra (Finanças). Para não confundir, as receitas de cozinha se chamam **"Receitas de cozinha"** ou ficam com o ícone de panela e o rótulo **"Cozinha"**.

## Tipos de lista

### Compras
- Item, quantidade e unidade (2 kg, 1 un, 3 L), categoria/corredor (hortifrúti, limpeza, carnes…) e observação.
- Tela de compra: itens agrupados por corredor, toque para marcar, marcados descem para o fim.
- **Concluir compra:** pergunta o total e o mercado, e oferece lançar como despesa em Finanças (categoria Mercado), já com a data.
- **Reusar:** "desmarcar tudo" ou "repetir lista" (copiar a lista do mês passado).
- Com o módulo **Preços**: cada item mostra o menor preço conhecido e onde, e a lista mostra o **total estimado por mercado** ("No Mercado A sai R$ 182; no B, R$ 169").

### Geral
- Checklist simples, com itens reordenáveis. Exemplos: mala de viagem, filmes para ver, presentes, documentos.
- Pode ser fixada no Início.

### Receitas de cozinha
- Ingredientes (com quantidade), modo de preparo em passos, tempo, porções, foto opcional e etiquetas (doce, rápido, almoço).
- **"Mandar ingredientes para a lista de compras"**: escolhe quais faltam e adiciona à lista de compras.
- Porções ajustáveis: a quantidade dos ingredientes recalcula.

## Dados

```ts
interface ShoppingList { id; name; kind: 'compras' | 'geral' | 'receita'; items: ListItem[]; pinned?: boolean; createdAt; deleted? }
interface ListItem { id; text; qty?: number; unit?: string; aisle?: string; done: boolean; productId?: string /* liga com Preços */ }
interface RecipeExtra { servings: number; minutes?: number; steps: string[]; tags: string[] }
```

## Integrações
- **Finanças:** concluir compra → despesa.
- **Preços:** item de compra ligado a um produto → melhor preço e total por mercado.
- **Agenda/Tarefas:** tarefa com lista anexada.
- **Jornada:** concluir uma lista de compras pode contar como tarefa concluída.
