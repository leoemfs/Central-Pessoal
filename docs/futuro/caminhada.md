# Caminhada e corrida 2.0 (M35)

> Situação: **especificado (17/11)**, aguardando aprovação. **Prévia (18/11):** https://claude.ai/artifact/UwQgWrPi55NMAUHV5MhnV2. Pedido do Leonardo: o cronômetro começa sozinho ao tocar, falta preparar (aquecimento), escolher caminhada com trote e saber quantos km foram feitos (GPS).
> **Afeta:** Núcleo › Corpo (tela da prática), hábitos ligados à caminhada (marcam sozinhos), Início ("Esta semana"), Revisão semanal, Jornada (Agilidade e XP), backup (campo novo da sessão).

## Como é hoje (`src/modules/Praticas.tsx`, função `Walk`)
- Tocar em "Caminhada e corrida" abre a tela **com o cronômetro já contando**.
- Só dá para escolher Caminhada ou Corrida (com o tempo já correndo).
- Pausar e Parar. No fim, a distância é digitada à mão (opcional).
- Não há aquecimento nem alongamento ligados à caminhada, e a tela pode apagar no meio.

## Simulação: hoje × proposta

**Cena:** você sai para caminhar, abre o app no portão, vai em Núcleo › Corpo e toca em "Caminhada".

| Momento | Hoje | Proposta |
|---|---|---|
| Tocar em Caminhada | O relógio já começa. Você ainda está guardando a chave e o fone. | Abre a tela **Preparar**, parada. Nada conta ainda. |
| Escolher | Caminhada ou Corrida, com o tempo correndo. | **Caminhada**, **Caminhada com trote** ou **Corrida**. Meta opcional: tempo (ex.: 30 min) ou distância (ex.: 3 km). |
| Antes de sair | Nada. | Cartão **"Aquecer antes? (3 min)"**: marcha no lugar, círculos de tornozelo, balanço de pernas e de braços. Botões **Aquecer** ou **Pular**. O app lembra a sua escolha da última vez. |
| Começar | (já começou) | Botão **Começar** grande → contagem **3, 2, 1** com vibração. A tela fica **acesa** enquanto você estiver na caminhada. |
| Durante | Só o tempo. | Tempo grande, **km** e **ritmo** (min por km) pelo GPS. Na **com trote**: "Caminhe 2:00" → vibra e mostra "Trote 1:00" → volta a caminhar, repetindo. |
| Pausar | Botão Pausar. | Pausar. **Parar pede segurar o botão 1 segundo** (para não parar sem querer com o celular no bolso). |
| Fim | Digita a distância. | **Resumo:** tempo, km (do GPS, dá para corrigir), ritmo médio e os trechos de trote. Convite **"Alongar agora (5 min)?"** com o alongamento "Depois da caminhada". Salvar. |
| Depois | Conta na semana. | Igual: conta na semana, marca o hábito ligado, rende Agilidade e XP na Jornada. |

## Alongar antes ou depois?
- **Antes:** o recomendado é um **aquecimento leve e em movimento** (3 a 5 min), e não segurar alongamentos parados. Alongamento parado antes de correr não ajuda e pode deixar o músculo mais "frio".
- **Depois:** é a hora do **alongamento parado** (panturrilha, quadríceps, posterior da coxa, quadril), de 20 a 30 segundos cada.
- Por isso: **Aquecer** antes (opcional, lembrado) e **Alongar** depois (convite no resumo). Os dois usam a mesma tela guiada dos alongamentos que já existe (`STRETCH` em `src/practices.ts`), com 2 rotinas novas: `aquecer-caminhada` e `depois-caminhada`.
- Quem tem limitação anotada no perfil (Você › limitações) vê o aviso "Respeite seus limites; na dúvida, fale com um profissional".

## Caminhada com trote (intervalos)
- Ciclo **caminhar + trotar**, repetido até a meta ou até você parar. Padrão para começar: **2 min caminhando + 1 min trotando**. Dá para ajustar (ex.: 3 + 1, 1 + 1).
- A troca é avisada com **vibração** e a tela mudando de cor (verde = caminhar, laranja = trotar). Som opcional.
- O resumo mostra quantos trechos de trote foram feitos.

## GPS: dá para medir os km?
**Sim, com uma condição.** O app é um site (PWA), e o navegador entrega a localização **enquanto o app está aberto e a tela acesa**.
- **Com a tela acesa** (a proposta mantém a tela ligada): km, ritmo e o desenho do caminho funcionam bem. Gasta mais bateria (cerca de 5 a 10% por hora, varia por aparelho).
- **Com a tela apagada ou trocando de app:** o navegador pausa o GPS, e o trecho fica de fora. O app avisa no resumo ("8 min sem sinal; distância estimada") e você pode corrigir os km.
- **GPS de verdade em segundo plano** (celular no bolso, tela apagada) só com o **app Android** (N4), que pode pedir "localização em segundo plano".
- **Precisão:** o app ignora pontos com sinal ruim (precisão pior que 30 m) e saltos impossíveis. Prédios e árvores atrapalham. Na esteira, o GPS não serve: use "Sem GPS" e digite os km.
- **Privacidade:** o caminho fica **só no aparelho** (e no backup). Opção "Guardar só o total de km, sem o caminho". O navegador pede permissão de localização na primeira vez.
- **Mapa:** o resumo mostra o **desenho do caminho** (a linha), sem mapa de fundo. Mapa de verdade depende de um serviço de mapas externo e fica para depois.

## Dados (rascunho)
Sessão `caminhada` ganha campos opcionais (padrões em `normalize()`):
```ts
mode: 'caminhada' | 'trote' | 'corrida';   // padrão: 'caminhada' (ou 'corrida' se sub === 'corrida')
gps: boolean;                               // padrão: false
route: [number, number][] | null;          // lat, lon simplificados; null = não guardar
intervals: { walk: number; jog: number; rounds: number } | null;
warmup: boolean; cooldown: boolean;         // padrão: false
```
Configuração: `walkPrefs` (último modo, aquecer sim/não, intervalo padrão, guardar caminho).

## Divisão (uma parte por dia)
| Parte | O que entra | Tam. |
|---|---|---|
| **M35.1** | Tela Preparar (nada conta antes de Começar), modos Caminhada · Com trote · Corrida, meta opcional, aquecimento antes e alongamento depois, contagem 3-2-1, tela acesa, Parar segurando, resumo | M |
| **M35.2** | GPS com a tela acesa: km, ritmo, desenho do caminho, aviso de trechos sem sinal, opção sem GPS e sem guardar o caminho | M |
| **M35.3** | GPS em segundo plano (celular no bolso): junto com o app Android (N4) | com o N4 |

## Testes previstos
- Regras puras (`src/walk.ts`): distância entre pontos (fórmula de Haversine), filtro de pontos ruins, ritmo, ciclos de trote, normalize das sessões antigas.
- Navegador (Pixel 7): tocar em Caminhada não começa a contar; aquecer e pular; com trote troca no tempo certo; Parar precisa segurar; GPS simulado (Playwright permite posição falsa) soma a distância certa.
