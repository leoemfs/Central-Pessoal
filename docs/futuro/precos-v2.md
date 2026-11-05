# Preços 2.0: lojas por tipo e listas ligadas aos preços

> **Status: OBJETIVO PARA O FUTURO.** Anotado a partir do primeiro uso real no mercado (nov/2026). Sem desenvolvimento. Hoje (v0.14) está em uso a versão descrita em `modulo-precos.md`.

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
1. A lista puxa os produtos de Preços, e a estimativa usa a faixa de preço (itens 2 e 3). É o que mais ajuda no dia a dia.
2. "Quanto custou aqui?" ao marcar o item na compra (item 4).
3. Tipos de loja e o filtro na aba Preços (item 1).
4. Editar, juntar duplicados e histórico de compras (item 4).
5. Código de barras e nota fiscal, junto com o app Android.
