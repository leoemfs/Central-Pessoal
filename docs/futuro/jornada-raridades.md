# Jornada: raridades, formas de liberar e Codex que cresce

> **Status: RASCUNHO PARA O FUTURO.** Junta e organiza o que já está em `modulo-rpg.md` (Anexos B e F) e acrescenta as regras para o Codex crescer com o tempo.

## As 4 raridades
Valem para **tudo** o que se coleciona: armaduras, elmos, botas, armas, artefatos (colar, anel, item mágico), pets, pelagens, moradas e títulos.

| Raridade | Cor da moldura | Como costuma vir | Quanto custa em rotina (média) |
|---|---|---|---|
| **Comum** | cinza | inicial ou loja, com ouro | alguns dias |
| **Raro** | azul | loja, baús, conquistas simples, atributo em 40–50 | 2 a 3 semanas |
| **Épico** | roxo | baús melhores, chefes da campanha, atributo alto (80+), missões especiais | 1 a 3 meses |
| **Lendário** | dourado, com brilho animado | **só pela Forja** ou pelas conquistas mais difíceis (nível 50, 365 dias, todos os atributos em 100) | vários meses |

- **"Místico" passa a se chamar "Lendário"** em todos os documentos e telas. No código, a raridade `mistico` (`src/jornada/catalog.ts`) muda só o rótulo para "Lendário"; os dados salvos continuam valendo.
- **Proporção no catálogo**, para a coleção ter graça: perto de 40% comuns, 30% raros, 20% épicos e 10% lendários.
- **Raridade é aparência e prestígio.** O efeito, quando existe, é pequeno (até +10% de XP ou ouro num atributo) e nunca mexe nos dados reais do app.
- **Lendários vêm com uma história curta** no Codex e uma animação própria ao ser conquistados.

## Formas de liberar
Cada item tem **uma forma principal** de liberar e, se for difícil demais, **um caminho alternativo**, para nada ficar impossível.

| Forma | Exemplo | Raridades |
|---|---|---|
| **Loja** (ouro) | Elmo de ferro: 600 ouro | comum, raro |
| **Nível** | Casinha no nível 5; 2º anel no nível 10 | todas |
| **Atributo** | Chapéu de mago com INT 50 | raro, épico |
| **Missão ou chefe** da campanha | Lobo filhote ao vencer o Lobo da Preguiça | épico, lendário |
| **Conquista** de um módulo do app | Coruja com 80 registros no Diário | raro, épico |
| **Baú** | baú de cristal garante um épico | comum a épico |
| **Sequência de visitas** | pelagem rara com 30, 100 e 365 dias | raro a lendário |
| **Forja** (atributos + cristais) | Coroa de cristal: DIS 100 + 3 cristais | **só lendário** |

- **Itens só da Forja:** a Forja é o único lugar onde se faz um lendário de equipamento. Lá aparecem com 🔒, as barras de cada requisito e, quando tudo está pronto, "Pronto para forjar". Forjar gasta cristais, nunca atributos.
- **Itens da campanha** são exclusivos: não saem em baú nem na loja.
- **Pode juntar formas:** ex.: "nível 15 **e** vencer o Lobo", ou "nível 12 **ou** Agilidade 50".
- **Nunca se perde o que foi liberado**, mesmo se o hábito parar ou o módulo for ocultado.

## Codex que cresce
O Codex mostra tudo o que existe, por categoria (Armaduras 4/9, Pets 7/16…). O que você tem aparece colorido; o que falta aparece em silhueta com a dica de como liberar.

Para poder ampliar no futuro sem bagunçar:
- **Coleções:** o catálogo é dividido em coleções, cada uma com seus itens. A primeira é **"Coleção 1: O Começo"** (tudo o que já está especificado). As próximas chegam com atualizações, por exemplo "Coleção 2: Mares do Sul" ou "Coleção de inverno".
- **Item novo não tira nada:** os marcos de descoberta (25%, 50%, 75% e 100%) contam **por coleção**. Quem já completou uma coleção mantém o baú e o título dela, e a nova coleção começa do zero, com os seus próprios marcos.
- **Título geral:** "Lenda do Codex" para quem completa todas as coleções que existirem; quando chega uma nova, o título fica, e a nova vale um selo a mais ("Lenda do Codex ★★").
- **Novidades marcadas:** itens de uma coleção nova aparecem com "Novo" até a primeira visita ao Codex.
- **Filtros no Codex:** por raridade (comum, raro, épico, lendário), por forma de liberar (loja, nível, missão, forja…) e "só o que falta".
- **Sem itens de tempo limitado** que somem para sempre: um item de evento (ex.: Natal) volta todo ano, ou ganha outro caminho depois.

## Dados (rascunho)
```ts
type Rarity = 'comum' | 'raro' | 'epico' | 'lendario';   // 'mistico' antigo = 'lendario'

interface CatalogItem {
  id: string;                 // nunca muda, mesmo se o nome mudar
  kind: 'elmo' | 'armadura' | 'botas' | 'arma' | 'colar' | 'anel' | 'magico' | 'pet' | 'pelagem' | 'morada' | 'titulo';
  name: string;
  rarity: Rarity;
  collection: string;         // 'c1-comeco', 'c2-mares'…
  unlock: Unlock[];           // forma principal primeiro; alternativas depois (vale qualquer uma)
  story?: string;             // frase do Codex
  effect?: string;            // efeito pequeno, só na Jornada
}

type Unlock =
  | { type: 'loja'; gold: number }
  | { type: 'nivel'; level: number }
  | { type: 'atributo'; attrs: Record<string, number> }
  | { type: 'missao'; missionId: string }          // missão ou chefe da campanha
  | { type: 'conquista'; achievementId: string }
  | { type: 'bau'; chest: 'bronze' | 'prata' | 'dourado' | 'cristal' }
  | { type: 'visitas'; days: number }
  | { type: 'forja'; attrs: Record<string, number>; crystals: number; extra?: string }
  | { type: 'todos'; of: Unlock[] };               // juntar condições ("nível 15 e vencer o Lobo")
```
- O que a pessoa tem fica em `jornada.owned: { id, at, via }[]` (quando e como ganhou). O resto é calculado.
- Teste de regra: todo item tem uma forma de liberar possível; todo lendário de equipamento vem da Forja ou de uma conquista máxima; os marcos do Codex contam por coleção.
