# Jornada: raridades, bônus, formas de liberar e Codex que cresce

> **Status: RASCUNHO PARA O FUTURO.** Junta e organiza o que já está em `modulo-rpg.md` (Anexos B e F) e acrescenta os bônus por raridade e as regras para o Codex crescer com o tempo.

## As 5 raridades
Valem para **tudo** o que se coleciona: armaduras, elmos, botas, armas, artefatos (colar, anel, item mágico), pets, pelagens, moradas e títulos.

| Raridade | Cor da moldura | Como vem | Bônus | Rotina até conseguir (média) |
|---|---|---|---|---|
| **Comum** | cinza | inicial ou loja, com ouro | nenhum (só visual) | alguns dias |
| **Raro** | azul | loja, baús, conquistas simples | nenhum (só visual) | 2 a 3 semanas |
| **Épico** | roxo | baús melhores, atributo alto, chefes, missões especiais | **pequeno** | 1 a 3 meses |
| **Lendário** | laranja, com brilho | as missões, chefes e conquistas mais difíceis | **médio** | 3 a 6 meses |
| **Místico** | dourado, com brilho animado e partículas | **só pela Forja** | **grande**, com efeito especial | vários meses |

- **Regra de ouro:** missão, chefe, conquista, baú, nível ou visitas dão no máximo **Lendário**. **Místico só sai da Forja**, e todo item da Forja é Místico.
- **Comum e raro não têm bônus**, são aparência e coleção. Os bônus começam no **épico**.
- **Proporção no catálogo**, para a coleção ter graça: perto de 35% comuns, 30% raros, 20% épicos, 10% lendários e 5% místicos.
- Lendários e místicos vêm com uma história curta no Codex e uma animação própria ao serem conquistados.

## Bônus por raridade
| Raridade | Bônus (escolher um por item) | Exemplos |
|---|---|---|
| **Épico** | **+10% de XP** nas ações de **um** atributo | Grimório: +10% de XP em INT (leitura, estudo) |
| | ou **+5% de ouro** em um módulo | Bracelete do mercador: +5% de ouro em Finanças |
| **Lendário** | **+15% de XP** em **dois** atributos | Lâmina da ordem: +15% em DIS e FOR |
| | ou **+10% de XP e ouro** em um módulo | Coruja (pet): +10% no Diário |
| | ou **+1 ponto extra de atributo** por ação de um atributo | Unicórnio: +1 em todos os atributos por dia completo |
| **Místico** | **+25% de XP** em um atributo **e** um **efeito especial** | Coroa de cristal: +25% em DIS e +1 cristal por mês com todas as contas pagas no prazo |
| | ou **+10% de XP e ouro em tudo** **e** um efeito especial | Estrela polar: +10% em tudo e uma constelação no céu |

**Efeitos especiais (só místicos):** escudo semanal (um dia perdido não quebra a sequência da Jornada), XP em dobro na semana depois de uma recaída, cristal extra por revisão semanal, baú extra ao subir de nível, e outros já listados na Forja (`modulo-rpg.md`, B.5).

**Regras dos bônus:**
- **Só vale o que está equipado.** Pet conta como equipado quando é o pet ativo.
- **Os bônus se somam, com teto:** no máximo **+50% de XP** e **+30% de ouro** no total, para não desequilibrar.
- **Atributos aumentam com bônus, mas nunca diminuem** ao tirar o item. Tirar o item só para de dar o bônus dali em diante.
- **Tudo fica dentro da Jornada.** Nenhum bônus mexe nos dados reais do app (sequência, consistência, finanças).
- No item, o bônus aparece em verde: "+10% XP em Inteligência". No perfil do avatar, um resumo: "Bônus ativos: +25% DIS, +10% INT".

**O que muda no que já existe:**
- Os 6 artefatos que já dão +10% de XP (Pena do vento, Bracelete do titã, Grimório, Amuleto da gota, Lanterna da sabedoria, Ampulheta) passam de raros para **épicos**, e liberam com o atributo em 60 (antes 40) ou em baús.
- Os pets que eram "místicos" mas vêm de conquista (Dragãozinho, Grifo, Unicórnio) passam a **lendários**, assim como a Lâmina da ordem, que é prêmio da campanha.
- Os itens da Forja continuam **místicos** e ganham o bônus de +25% (além do efeito que já tinham).
- No código (`src/jornada/catalog.ts`): entra a raridade `lendario` e os bônus por raridade; `mistico` continua sendo a raridade da Forja.

## Formas de liberar
Cada item tem **uma forma principal** de liberar e, se for difícil demais, **um caminho alternativo**, para nada ficar impossível.

| Forma | Exemplo | Raridades |
|---|---|---|
| **Loja** (ouro) | Elmo de ferro: 600 ouro | comum, raro |
| **Nível** | Casinha no nível 5; 2º anel no nível 10 | comum a lendário |
| **Atributo** | Chapéu de mago com INT 50 | raro, épico |
| **Missão ou chefe** da campanha | Lobo filhote ao vencer o Lobo da Preguiça | épico, lendário |
| **Conquista** de um módulo do app | Coruja com 80 registros no Diário | raro a lendário |
| **Baú** | baú de cristal garante um épico | comum a épico |
| **Sequência de visitas** | pelagem rara com 30 dias; Grifo com 365 | raro a lendário |
| **Forja** (atributos + cristais) | Coroa de cristal: DIS 100 + 3 cristais | **só místico** |

- **Forja:** os místicos aparecem com 🔒, as barras de cada requisito e, quando tudo está pronto, "Pronto para forjar". Forjar gasta cristais, nunca atributos.
- **Itens da campanha** são exclusivos: não saem em baú nem na loja.
- **Pode juntar formas:** ex.: "nível 15 **e** vencer o Lobo", ou "nível 12 **ou** Agilidade 50".
- **Nunca se perde o que foi liberado**, mesmo se o hábito parar ou o módulo for ocultado.

## Codex que cresce
O Codex mostra tudo o que existe, por categoria (Armaduras 4/9, Pets 7/16…). O que você tem aparece colorido; o que falta aparece em silhueta com a dica de como liberar.

Para poder ampliar no futuro sem bagunçar:
- **Coleções:** o catálogo é dividido em coleções, cada uma com seus itens. A primeira é **"Coleção 1: O Começo"** (tudo o que já está especificado). As próximas chegam com atualizações, por exemplo "Coleção 2: Mares do Sul" ou "Coleção de inverno". Cada coleção nova traz itens de todas as raridades, incluindo místicos novos na Forja.
- **Item novo não tira nada:** os marcos de descoberta (25%, 50%, 75% e 100%) contam **por coleção**. Quem já completou uma coleção mantém o baú e o título dela, e a nova coleção começa do zero, com os seus próprios marcos.
- **Título geral:** "Lenda do Codex" para quem completa todas as coleções que existirem. Quando chega uma nova, o título fica, e a nova vale um selo a mais ("Lenda do Codex ★★").
- **Novidades marcadas:** itens de uma coleção nova aparecem com "Novo" até a primeira visita ao Codex.
- **Filtros no Codex:** por raridade, por forma de liberar (loja, nível, missão, forja…), "com bônus" e "só o que falta".
- **Sem itens de tempo limitado** que somem para sempre: um item de evento (ex.: Natal) volta todo ano, ou ganha outro caminho depois.

## Dados (rascunho)
```ts
type Rarity = 'comum' | 'raro' | 'epico' | 'lendario' | 'mistico';   // mistico = só Forja

interface CatalogItem {
  id: string;                 // nunca muda, mesmo se o nome mudar
  kind: 'elmo' | 'armadura' | 'botas' | 'arma' | 'colar' | 'anel' | 'magico' | 'pet' | 'pelagem' | 'morada' | 'titulo';
  name: string;
  rarity: Rarity;
  collection: string;         // 'c1-comeco', 'c2-mares'…
  unlock: Unlock[];           // forma principal primeiro; alternativas depois (vale qualquer uma)
  bonus?: Bonus[];            // só épico, lendário e místico
  effect?: string;            // efeito especial, só místico
  story?: string;             // frase do Codex
}

type Bonus =
  | { type: 'xp'; attr: string | 'todos'; pct: number }        // +10% de XP em INT
  | { type: 'ouro'; module: string | 'todos'; pct: number }     // +5% de ouro em Finanças
  | { type: 'ponto'; attr: string | 'todos'; extra: number };   // +1 ponto de atributo por ação

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
- **Testes de regra:**
  - todo item tem uma forma de liberar possível;
  - todo item com `forja` é místico, e todo místico vem só da Forja;
  - comum e raro não têm bônus;
  - o total de bônus respeita o teto (+50% XP, +30% ouro);
  - os marcos do Codex contam por coleção.
