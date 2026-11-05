# Módulo Comparação de preços

> **Status: IMPLEMENTADO na v0.14** (dentro de Listas, na aba Preços). Diferenças em relação a este texto:
> - "Anotar preço" sugere o produto enquanto você digita, mostra o último preço daquele mercado e avisa quando está mais de 5% acima do menor registro (ou quando é o menor já anotado);
> - o produto mostra o menor preço por unidade, a tabela marcas × mercados (preços com mais de 60 dias aparecem esmaecidos), a comparação entre marcas e a evolução do preço;
> - ainda não há: cesta comparada por mercado (fora da lista), categorias editáveis de produtos, código de barras e nota fiscal;
> - código: `src/lists.ts` e `src/modules/Listas.tsx`.

Anotar preços no mercado de forma rápida e, com o tempo, ter uma base própria de preços que mostra **onde está mais barato**, **qual marca compensa** e **como o preço mudou**, sempre comparando **por unidade** (R$/kg, R$/L, R$/un).

## Princípios
- **Rápido no corredor:** registrar um preço em 3 toques e com uma mão. O app lembra o mercado de hoje.
- **Comparar o comparável:** produtos parecidos ficam juntos (ex.: "Arroz branco"), e as marcas e tamanhos viram variações.
- **Sem exagero:** nada de cadastro longo. Categoria, marca e tamanho são opcionais e podem ser completados depois.
- Os dados ficam no aparelho, como no resto do app.

## Como os dados se organizam

| Conceito | Exemplo | Para que serve |
|---|---|---|
| **Produto** (genérico) | Arroz branco · categoria Mercearia | Agrupa marcas e tamanhos para comparar |
| **Variação** | Tio João 5 kg · Camil 1 kg | Marca + tamanho (quantidade + unidade) |
| **Mercado** | Atacadão Centro | Onde foi visto |
| **Preço** | R$ 27,90 em 04/11 no Atacadão, promoção? | O registro em si |

**Preço por unidade:** calculado sozinho a partir do tamanho. R$ 27,90 / 5 kg = **R$ 5,58/kg**. Unidades: g/kg, ml/L, un, e "pacote com N" (ex.: papel higiênico 12 rolos → R$/rolo).

```ts
interface Product { id; name; category: string; unit: 'kg' | 'L' | 'un' }   // unidade de comparação
interface Variant { id; productId; brand?: string; size: number; sizeUnit: 'g' | 'kg' | 'ml' | 'L' | 'un'; barcode?: string }
interface Store { id; name; area?: string }
interface PriceEntry { id; variantId; storeId; price: number; date: string; promo?: boolean; note?: string }
```

## Fluxo para registrar no mercado
1. **+ Preço** → escolhe o mercado (o de hoje já vem marcado).
2. Digita o produto: o app sugere enquanto você digita ("arr…" → Arroz branco · Tio João 5 kg). Se for novo, cria ali mesmo com marca e tamanho.
3. Digita o preço → **Salvar e próximo**. Na tela fica o último preço visto daquele item ("da última vez: R$ 29,50 no Assaí, 12/10").

## O que o módulo mostra
- **Produto:** o mais barato por unidade agora (mercado + marca), uma tabela de mercados × último preço e um gráfico da evolução do preço.
- **Marcas:** a mesma comparação por marca, por exemplo "Camil sai R$ 0,40/kg mais barato que Tio João".
- **Mercado:** a cesta comparada, ou seja, quanto custariam os seus 20 itens mais comprados em cada mercado.
- **Categorias:** Mercearia, Hortifrúti, Carnes, Limpeza, Higiene, Bebidas, Padaria, Pet etc., editáveis como as categorias de despesa.
- **Avisos simples:** "este preço está 18% acima do seu menor registro".
- **Preço antigo:** um registro com mais de 60 dias aparece esmaecido, com a data.

## Integrações
- **Listas de compras:** cada item mostra o melhor preço e onde comprar, e a lista mostra o total estimado por mercado.
- **Finanças:** ao concluir uma compra, o valor pode virar despesa (categoria Mercado). Os relatórios futuros podem cruzar os gastos com a inflação da sua própria cesta.

## Futuro (bem mais adiante)
- **Código de barras:** o navegador do Android já tem leitura de código de barras pela câmera (BarcodeDetector), sem servidor. É o primeiro passo natural e o mais barato: lê o EAN e acha a variação já cadastrada.
- **Etiqueta de preço por foto:** reconhecimento de texto no próprio aparelho (OCR) para sugerir nome e preço. Você só confirma.
- **Nota fiscal (QR code da NFC-e):** ler o QR do cupom e importar todos os itens e preços de uma vez. Depende do site da Secretaria da Fazenda de cada estado, então precisa de testes.
- Compartilhar a base de preços com a família exigiria sincronização, que hoje o app não tem.
