/**
 * Catálogo pronto de produtos de mercado (M23): nome, corredor, unidade de comparação e tamanhos comuns.
 * Sem preço (o preço muda com a cidade e a loja). Vem com o app e não precisa de internet.
 * Formato compacto por corredor: "Nome:unidade:tamanhos", separados por "|"; tamanhos separados por vírgula.
 */
import type { ProductVariant } from './types.ts';

export interface CatalogProduct {
  name: string;
  aisle: string;
  unit: 'kg' | 'L' | 'un';
  sizes: { size: number; sizeUnit: ProductVariant['sizeUnit'] }[];
}

const RAW: Record<string, string> = {
  Hortifrúti:
    'Banana:kg:1kg|Maçã:kg:1kg|Laranja:kg:1kg|Limão:kg:1kg|Mamão:kg:1kg|Melancia:kg:1kg|Melão:kg:1kg|Abacaxi:un:1un|Uva:kg:500g|Morango:un:250g|Manga:kg:1kg|Pera:kg:1kg|Abacate:kg:1kg|Maracujá:kg:1kg|Kiwi:kg:1kg|Tangerina:kg:1kg|' +
    'Tomate:kg:1kg|Cebola:kg:1kg|Alho:kg:100g,1kg|Batata:kg:1kg|Batata-doce:kg:1kg|Cenoura:kg:1kg|Beterraba:kg:1kg|Abobrinha:kg:1kg|Abóbora:kg:1kg|Chuchu:kg:1kg|Pepino:kg:1kg|Pimentão:kg:1kg|Berinjela:kg:1kg|Mandioca:kg:1kg|Inhame:kg:1kg|Quiabo:kg:1kg|Vagem:kg:1kg|Milho verde:un:1un|' +
    'Alface:un:1un|Rúcula:un:1un|Agrião:un:1un|Couve:un:1un|Repolho:kg:1kg|Brócolis:un:1un|Couve-flor:un:1un|Espinafre:un:1un|Cheiro-verde:un:1un|Coentro:un:1un|Hortelã:un:1un|Manjericão:un:1un|Gengibre:kg:1kg|Cogumelo:kg:200g|Ovos:un:12un,20un,30un',
  Mercearia:
    'Arroz branco:kg:1kg,5kg|Arroz integral:kg:1kg|Feijão carioca:kg:1kg|Feijão preto:kg:1kg|Lentilha:kg:500g|Grão-de-bico:kg:500g|Macarrão espaguete:kg:500g|Macarrão parafuso:kg:500g|Macarrão instantâneo:un:1un|Farinha de trigo:kg:1kg,5kg|Farinha de mandioca:kg:500g,1kg|Farofa pronta:kg:250g|Fubá:kg:1kg|Amido de milho:kg:500g|Aveia:kg:200g,500g|Polvilho:kg:500g|' +
    'Açúcar refinado:kg:1kg,5kg|Açúcar cristal:kg:2kg,5kg|Açúcar mascavo:kg:1kg|Adoçante:L:100ml|Sal:kg:1kg|Sal grosso:kg:1kg|Óleo de soja:L:900ml|Azeite de oliva:L:500ml|Vinagre:L:750ml|Café em pó:kg:250g,500g|Café solúvel:kg:100g|Achocolatado em pó:kg:400g,800g|Chá:un:10un|Leite em pó:kg:400g|Leite condensado:kg:395g|Creme de leite:kg:200g|' +
    'Molho de tomate:kg:300g|Extrato de tomate:kg:140g,340g|Maionese:kg:500g|Ketchup:kg:400g|Mostarda:kg:200g|Shoyu:L:150ml|Tempero pronto:kg:60g|Caldo de galinha:un:6un|Pimenta-do-reino:kg:50g|Orégano:kg:10g|Colorau:kg:100g|Canela:kg:30g|Fermento em pó:kg:100g|Fermento biológico:kg:10g|Gelatina:kg:20g|Pudim em pó:kg:50g|' +
    'Milho em conserva:kg:170g|Ervilha em conserva:kg:170g|Seleta de legumes:kg:170g|Atum em lata:kg:170g|Sardinha em lata:kg:125g|Azeitona:kg:200g|Palmito:kg:300g|Biscoito cream cracker:kg:200g,400g|Biscoito recheado:kg:130g|Biscoito maisena:kg:200g|Bolacha de água e sal:kg:200g|Torrada:kg:160g|Cereal matinal:kg:300g|Granola:kg:1kg|' +
    'Chocolate em barra:kg:90g|Bombom:kg:250g|Pipoca de micro-ondas:un:1un|Milho de pipoca:kg:500g|Batata chips:kg:100g|Amendoim:kg:500g|Castanha de caju:kg:100g|Mel:kg:300g|Geleia:kg:300g|Doce de leite:kg:400g|Goiabada:kg:300g|Pasta de amendoim:kg:500g|Leite de coco:L:200ml|Coco ralado:kg:100g',
  Carnes:
    'Peito de frango:kg:1kg|Coxa e sobrecoxa:kg:1kg|Filé de frango:kg:1kg|Frango inteiro:kg:1kg|Asa de frango:kg:1kg|Carne moída:kg:500g,1kg|Patinho:kg:1kg|Acém:kg:1kg|Alcatra:kg:1kg|Contrafilé:kg:1kg|Picanha:kg:1kg|Maminha:kg:1kg|Fraldinha:kg:1kg|Costela bovina:kg:1kg|Músculo:kg:1kg|Fígado:kg:1kg|' +
    'Lombo suíno:kg:1kg|Bisteca suína:kg:1kg|Costelinha suína:kg:1kg|Linguiça toscana:kg:1kg|Linguiça calabresa:kg:500g|Salsicha:kg:500g,1kg|Bacon:kg:250g|Filé de tilápia:kg:500g,1kg|Peixe (filé):kg:1kg|Camarão:kg:400g|Hambúrguer:un:4un|Almôndega:kg:500g',
  Laticínios:
    'Leite integral:L:1L|Leite desnatado:L:1L|Leite semidesnatado:L:1L|Leite sem lactose:L:1L|Bebida vegetal:L:1L|Iogurte natural:kg:170g|Iogurte de frutas:kg:170g,900g|Bebida láctea:L:900ml|Queijo muçarela:kg:150g,1kg|Queijo prato:kg:150g|Queijo minas frescal:kg:500g|Queijo parmesão:kg:100g|Queijo coalho:kg:500g|Requeijão:kg:200g|Cream cheese:kg:150g|' +
    'Manteiga:kg:200g|Margarina:kg:500g|Creme de leite fresco:L:200ml|Nata:kg:200g|Presunto:kg:150g,1kg|Peito de peru:kg:150g|Mortadela:kg:200g|Salame:kg:100g|Ricota:kg:250g|Petit suisse:un:6un|Leite fermentado:un:6un',
  Padaria:
    'Pão francês:kg:1kg|Pão de forma:kg:500g|Pão integral:kg:500g|Pão de hambúrguer:un:4un|Pão de hot dog:un:6un|Pão de queijo:kg:400g,1kg|Bisnaguinha:kg:300g|Torrada pronta:kg:140g|Bolo pronto:kg:300g|Rosca:kg:400g|Sonho:un:1un|Tortilha (wrap):un:6un|Croissant:un:1un|Biscoito de polvilho:kg:100g',
  Bebidas:
    'Água mineral:L:500ml,1.5L,5L|Água com gás:L:500ml|Refrigerante:L:2L,350ml|Refrigerante zero:L:2L,350ml|Suco de caixinha:L:1L|Suco concentrado:L:500ml|Suco em pó:un:1un|Néctar de fruta:L:1L|Água de coco:L:1L|Chá gelado:L:1.5L|Energético:L:250ml|Isotônico:L:500ml|' +
    'Cerveja lata:L:350ml|Cerveja long neck:L:330ml|Cerveja litrão:L:1L|Vinho tinto:L:750ml|Vinho branco:L:750ml|Espumante:L:750ml|Cachaça:L:1L|Vodka:L:1L|Whisky:L:1L|Gin:L:750ml|Gelo:kg:2kg,5kg|Xarope de guaraná:L:1L',
  Limpeza:
    'Detergente:L:500ml|Sabão em pó:kg:800g,1.6kg|Sabão líquido:L:1L,3L|Amaciante:L:2L|Água sanitária:L:1L,2L|Desinfetante:L:2L|Limpador multiuso:L:500ml|Limpa-vidros:L:500ml|Álcool 70%:L:1L|Álcool em gel:L:500ml|Sabão em barra:un:5un|Lustra-móveis:L:200ml|Tira-manchas:kg:450g|Limpador de piso:L:1L|' +
    'Esponja:un:3un|Palha de aço:un:8un|Pano de chão:un:1un|Pano de prato:un:1un|Flanela:un:1un|Saco de lixo:un:30un,50un|Papel-toalha:un:2un|Guardanapo:un:50un|Papel-alumínio:un:1un|Filme plástico:un:1un|Filtro de café:un:30un|Fósforo:un:10un|Vela:un:1un|' +
    'Inseticida:L:300ml|Repelente:L:100ml|Pedra sanitária:un:1un|Luva de limpeza:un:1un|Vassoura:un:1un|Rodo:un:1un|Pilha:un:2un,4un|Lâmpada:un:1un|Prendedor de roupa:un:12un',
  Higiene:
    'Papel higiênico:un:4un,12un|Sabonete:un:1un,6un|Sabonete líquido:L:250ml|Shampoo:L:350ml|Condicionador:L:350ml|Creme para pentear:kg:300g|Creme dental:kg:90g|Escova de dente:un:1un|Fio dental:un:1un|Enxaguante bucal:L:500ml|Desodorante:un:1un|Desodorante roll-on:un:1un|' +
    'Aparelho de barbear:un:2un|Espuma de barbear:L:200ml|Absorvente:un:8un|Protetor diário:un:15un|Fralda:un:30un|Lenço umedecido:un:50un|Algodão:kg:50g|Hastes flexíveis:un:75un|Hidratante:L:400ml|Protetor solar:L:120ml|Lenço de papel:un:1un|Curativo:un:10un|' +
    'Esmalte:un:1un|Removedor de esmalte:L:100ml|Gel de cabelo:kg:300g|Tintura de cabelo:un:1un|Talco:kg:100g|Pomada para assaduras:kg:45g|Preservativo:un:3un|Antisséptico:L:100ml|Soro fisiológico:L:500ml|Vitamina C:un:10un|Analgésico:un:20un',
  Congelados:
    'Pizza congelada:un:1un|Lasanha congelada:kg:600g|Batata frita congelada:kg:400g,2kg|Nuggets:kg:300g|Empanado de frango:kg:1kg|Hambúrguer congelado:un:12un|Legumes congelados:kg:300g|Polpa de fruta:kg:100g,1kg|Sorvete:L:1.5L|Picolé:un:1un|Açaí:L:1L|Pão de alho:kg:300g|Lasanha de massa fresca:kg:500g|Peixe empanado:kg:300g|Mandioca congelada:kg:1kg',
  Pet:
    'Ração para cachorro:kg:1kg,10kg|Ração para gato:kg:1kg,3kg|Sachê para gato:un:1un|Sachê para cachorro:un:1un|Petisco para cachorro:kg:65g|Areia para gato:kg:4kg|Tapete higiênico:un:7un,30un|Antipulgas:un:1un',
};

function parseSize(t: string): CatalogProduct['sizes'][number] {
  const m = t.match(/^([\d.]+)\s*(g|kg|ml|L|un)$/);
  return m ? { size: Number(m[1]), sizeUnit: m[2] as ProductVariant['sizeUnit'] } : { size: 1, sizeUnit: 'un' };
}

export const CATALOG: CatalogProduct[] = Object.entries(RAW).flatMap(([aisle, s]) =>
  s.split('|').map((e) => {
    const [name, unit, sizes] = e.split(':');
    return { name, aisle, unit: unit as CatalogProduct['unit'], sizes: (sizes ?? '').split(',').filter(Boolean).map(parseSize) };
  }),
);
