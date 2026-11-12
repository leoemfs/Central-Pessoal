# Preços 2.0: lojas por tipo e listas ligadas aos preços

> **Status: EM ANDAMENTO.** Anotado a partir do primeiro uso real no mercado (nov/2026). **Parte 1 pronta na v0.49 (M2 + M23):** itens 2, 3, 5 e 6, menos o que está em "Ficou para depois" abaixo. Próximo: M3 e M4.

### Como ficou na v0.49
- Todo item da lista de mercado se liga sozinho a um produto de Preços pelo nome (sem acento, sem plural). Os itens antigos são ligados na primeira abertura. Nome genérico ("Arroz") aproveita o parecido do catálogo ("Arroz branco": corredor, unidade e tamanhos), mas mantém o nome escrito.
- O produto ganha um id fixo pelo nome, para dois aparelhos não criarem duplicados.
- Catálogo pronto: 311 produtos em `src/precosCatalogo.ts`.
- "Quanto vai sair": cada loja soma os itens com preço ali + faixa dos que faltam ("≈ R$ 197–201"); melhor combinação e quanto economiza; itens sem preço nenhum à parte, fora da soma. Tocar numa loja abre o **Dar preço** já com aquela loja.
- Item com preço de mais de 60 dias mostra a data.
- **Ficou para depois (M3/M4):** escolher marca específica no item (hoje vale "qualquer marca", a mais barata); "Cadastrar em Preços" e "Ligar a um produto" deixaram de ser necessários (tudo já é ligado); editar nome, corredor e unidade do produto.

## O que o uso real mostrou
1. **Cadastrar é fácil, mas manual.** Isso continua por um tempo, até integrarmos a leitura de código de barras ou uma base de produtos (ver "Mais adiante").
2. **Tudo fica misturado.** Supermercado, loja de departamento e loja de roupas aparecem na mesma lista de mercados e de produtos.
3. **A lista não puxa os produtos cadastrados.** Ao montar a lista de mercado em casa, é preciso digitar cada item de novo. Os 20 itens anotados no mercado ficam só para comparar. Hoje o item só se liga ao produto quando o nome é digitado exatamente igual.
4. **A estimativa fica presa aos mercados.** Se um item não tem preço num mercado, ele sai da soma daquele mercado. Não aparece quanto ele custaria em outros lugares.

## 1. Tipos de loja
- Cada loja ganha um **tipo**:
  - prontos: Mercado, Atacado, Hortifrúti e feira, Farmácia, Loja de departamento, Roupas e calçados, Casa e construção, Eletrônicos, Pet;
  - personalizáveis, como as categorias de lista: nome, ícone e cor.
- **A aba Preços filtra por tipo**, com botões no topo ("Mercados", "Departamento", "Roupas"…), no mesmo estilo das categorias de Listas.
- **"Mercado de hoje" vira "Loja de hoje"**, com o tipo já escolhido.
- **O produto sabe em que tipos de loja aparece.** Um mesmo produto pode estar em mais de um tipo, por exemplo detergente no mercado e na farmácia.
- **A comparação de um produto mostra todas as lojas onde ele tem preço**, agrupadas por tipo.

## 2. A lista puxa os produtos de Preços
- **Ao digitar no campo da lista**, aparecem sugestões dos produtos já cadastrados em Preços e dos itens já usados em outras listas.
  - A busca não liga para acentos, maiúsculas e plural ("bananas" acha "Banana").
  - Cada sugestão mostra a marca e o tamanho, e a **faixa de preço** ("Arroz branco · R$ 4,98–6,38/kg").
- **Escolher a sugestão liga o item ao produto.** Dá para escolher uma marca específica ou **"qualquer marca"** (vale a mais barata).
- **Item que não existe em Preços** entra como item livre, com a opção **"Cadastrar em Preços"**.
- **Itens livres já existentes** ganham **"Ligar a um produto"** quando o nome parece com um produto cadastrado.
- **Exemplo do dia a dia:** anotei 20 preços no mercado; em casa, crio a lista, digito "arr" e escolho "Arroz branco"; o item já entra com o preço e a lista já sabe quanto vai custar.

## 3. Estimativa sem prender a lista a uma loja
A lista não pertence a nenhuma loja. O cartão "Quanto vai sair" mostra:
- **Por loja:** o total com os itens que têm preço ali, mais os itens sem preço naquela loja, estimados pela faixa das outras lojas.
  - Por exemplo: "Atacadão: R$ 182 + 2 itens sem preço aqui (em outras lojas, uns R$ 15–19) ≈ R$ 197–201".
- **Melhor loja única:** onde a lista inteira sai mais barata, contando os itens estimados.
- **Melhor combinação:** quanto sairia comprando cada item onde é mais barato, e quanto isso economiza em relação à melhor loja única.
- **Em cada item:**
  - "Não tem preço no Assaí · em outras lojas: R$ 7,99–9,49";
  - preço antigo (mais de 60 dias) aparece esmaecido, com a data.
- **Itens sem nenhum preço** aparecem à parte ("3 itens sem preço: tomate, alface, pão"), e não entram na soma.

## 4. Mais consistência no uso
- **Anotar o preço direto da lista:**
  - ao marcar um item durante a compra, o app pergunta, de forma opcional, "Quanto custou aqui?";
  - a resposta vira um preço em Preços (na loja de hoje) e entra no **total real da compra**, que depois vai para Finanças;
  - assim a base de preços cresce sozinha, sem passo extra.
- **Editar e organizar:** renomear e excluir produtos, marcas, tamanhos e lojas; **juntar produtos duplicados** ("Arroz" e "Arroz branco"); corrigir ou apagar um preço anotado errado.
- **Unidades padronizadas:** sugestão de unidade pelo produto (kg, L, un), para não misturar "pct" e "pacote".
- **Histórico da compra:** cada compra concluída guarda a loja, o total e os itens com preço. Isso permite comparar "a mesma lista no mês passado".

## 5. Preencher os preços a partir da lista (pedido de 12/11)
**O problema no uso real:** a lista de mercado ficou grande (64 itens sem preço no Muffato), mas os itens digitados na lista não existem em Preços. Por isso não dá para entrar em Preços e dar valor a eles.

**Como fica:**
- **Todo item da lista vira (ou se liga a) um produto de Preços**, sozinho, pelo nome. Os 64 itens que já existem também são ligados na primeira abertura.
- **Em Preços, um cartão "Sem preço"** mostra os produtos que estão nas listas e ainda não têm valor. O "64 itens sem preço aqui" da lista também abre essa tela, já com a loja escolhida.
- **Preencher em sequência:** escolhe a loja uma vez e vai item por item (marca, tamanho ou peso, quantidade da embalagem e preço), com "Próximo" e "Pular". Volta para a lista com os totais já atualizados.
- **Editar depois:** tocar no produto em Preços permite ajustar nome, corredor, unidade, marcas, tamanhos e preços (junto com o item 4).

## 6. Catálogo pronto de produtos (pedido de 12/11)
Para quem começa não precisar digitar tudo:
- **Uma base de uns 300 produtos comuns de mercado** que já vem no app, como a Biblioteca de Estudos: nome, corredor, unidade (kg, L, un) e tamanhos comuns (ex.: arroz 1 kg e 5 kg; leite 1 L).
- **Sem preço:** o preço muda com a cidade e a loja, então só a pessoa anota.
- Ao digitar na lista, o catálogo aparece nas sugestões junto com os produtos da pessoa. O produto só passa a ser "seu" quando entra numa lista ou ganha um preço.
- Não precisa de internet. A base pela câmera e código de barras continua no N5.

## Mais adiante (depende de integração)
- **Código de barras pela câmera:** ler o EAN e achar a marca e o tamanho já cadastrados. No app Android, a câmera é mais confiável (ver `app-android.md`).
- **Base pública de produtos pelo código de barras:** preencher nome, marca e tamanho sozinho. Precisa avaliar a cobertura de produtos brasileiros.
- **Nota fiscal (QR code da NFC-e):** importar todos os itens e preços da compra de uma vez. Depende do site da Secretaria da Fazenda de cada estado.

## Dados (rascunho)
```ts
interface StoreType { id: string; name: string; icon: string; color: string }   // Mercado, Departamento, Roupas…
interface Store { id: string; name: string; typeId: string }
interface Product { id: string; name: string; aisle: string; unit: 'kg' | 'L' | 'un'; storeTypeIds: string[] }
interface ListItem { /* … */ productId: string | null; variantId: string | null /* null = qualquer marca */ }
interface Purchase { id: string; listId: string; storeId: string; date: string; total: number; items: { productId: string | null; text: string; price: number | null }[] }
```

## Ordem sugerida
0. Itens 5 e 6 entram junto com a parte 1 (M2 + M23): é o que trava o uso hoje.
1. A lista puxa os produtos de Preços, e a estimativa usa a faixa de preço (itens 2 e 3). É o que mais ajuda no dia a dia.
2. "Quanto custou aqui?" ao marcar o item na compra (item 4).
3. Tipos de loja e o filtro na aba Preços (item 1).
4. Editar, juntar duplicados e histórico de compras (item 4).
5. Código de barras e nota fiscal, junto com o app Android.
