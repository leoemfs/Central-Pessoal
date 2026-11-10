# Análise profunda do app (novembro de 2026)

> Feita em 10/11/2026 sobre a versão **0.25.1** (23,6 mil linhas, 136 testes). **Nada foi alterado no app**: só leitura, testes e simulações.
> Os itens de correção estão na Central (`docs/CENTRAL.md`) como C3 a C9 e M18 a M20, aguardando aprovação.

## Resumo
| Área | Situação | Comentário |
|---|---|---|
| Código quebrado | **Nenhum encontrado** | Compila sem erros, 136 testes passam, nenhuma tela dá erro com dados normais |
| Segurança | **Boa** | Sem dependências vulneráveis, sem código perigoso, nada sai do aparelho. Faltam 3 proteções (abaixo) |
| Resistência a dados ruins | **Ponto fraco nº 1** | Um único registro defeituoso deixa a **tela em branco**, sem saída pelo app |
| Velocidade | Boa hoje; **cai com anos de uso** | Com 1 ano de dados, tudo abaixo de 0,2 s. Com 5 anos, marcar um hábito leva 0,4 s num celular médio |
| Limpeza | **Boa** | 12 funções sem uso, 8 estilos sem uso, 5 arquivos grandes demais |
| Pronto para Android | **Quase** | 6 pontos precisam de adaptação (ver `futuro/app-android.md`) |

## 1. O que precisa de correção (por prioridade)

### C3. Um registro defeituoso deixa o app em branco (alta)
- **Teste:** coloquei no banco uma despesa incompleta (só com o identificador). Resultado: **Início e Finanças em branco**. O mesmo acontece com cartão, receita e nota incompletos. Tarefa, compromisso, hábito, caixinha, lista, Carreira e Estudos aguentaram.
- **Por quê:** ao abrir os dados (`normalize` em `src/data.ts`), despesas, cartões, receitas, séries, notas, diário, tarefas e compromissos são aceitos só por terem um identificador, sem conferir os campos. E o app não tem uma "rede de proteção" para erros de tela: qualquer erro derruba tudo.
- **Quando pode acontecer:** backup editado à mão, arquivo corrompido, ou um defeito de uma versão futura. É raro, mas o efeito é o pior possível: a pessoa não consegue nem chegar em Configurações para restaurar.
- **Correção proposta:**
  1. conferir os campos de cada registro ao abrir (descartar ou consertar o que estiver incompleto);
  2. tela de erro com saída: "Algo deu errado" + **Exportar backup** + **Recarregar** + **Abrir Configurações**;
  3. antes de **importar** um backup, guardar uma cópia dos dados atuais, com "Desfazer importação".

### C4. Salvamento de reserva pode perder dados em silêncio (média)
- Em `src/db.ts`, se a gravação no banco falhar (por exemplo, espaço cheio), o app grava num lugar reserva e **não avisa**. Na próxima abertura, ele lê o banco principal (antigo) e ignora a reserva: as últimas mudanças somem.
- **Correção proposta:** se a gravação principal falhar, mostrar o aviso que já existe ("Não foi possível salvar. Exporte um backup"); ao abrir, comparar as duas cópias e usar a mais nova.

### C5. Publicação sem rodar os testes (média)
- O GitHub publica o app a cada merge rodando só a compilação. Os 136 testes **não rodam** na publicação nem nos PRs.
- **Correção proposta:** rodar `npm test` antes de publicar e em todo PR. Custo zero para o uso do Claude.

### C6. Sequência de hábitos fica lenta para quem nunca falha (média)
- **Teste:** 25 hábitos sem nenhuma falha. Calcular as sequências leva 26 ms com 1 ano, 50 ms com 3 anos e **86 ms com 5 anos** (no computador; no celular, de 4 a 6 vezes mais). Esse cálculo roda toda vez que o Início ou o Núcleo é desenhado.
- É o caso curioso em que **quanto mais disciplinada a pessoa, mais lento o app**.
- **Correção proposta:** calcular com contas de dias (sem criar uma data por dia) e guardar o resultado enquanto o hábito não muda. Também tirar o teto de 3.700 dias (10 anos).

### C7. O banco inteiro é regravado a cada mudança (média, cresce com o tempo)
- Cada toque que muda algo regrava **todos** os dados (despesas, diário, notas…). Com 1 ano (1 MB), não se nota. Com 5 anos (4,6 MB), cada gravação custa uns 30 ms no computador e de 150 a 250 ms no celular.
- **Correção proposta:** gravar por coleção (despesas, diário, hábitos… cada uma na sua gaveta) e só a que mudou. O app já sabe o que mudou, então a mudança é pequena e segura. Ajuda também o app Android e a futura sincronização (N9).

### C8. Faturas recalculadas do zero (baixa)
- Início, Agenda e Próximos percorrem **todas as compras do cartão para cada mês de fatura**. Com 5 anos e 1 cartão: 6 ms; com 10 anos: 24 ms; multiplica por cartão.
- **Correção proposta:** agrupar as compras por fatura numa passada só.

### C9. Proteções de segurança que faltam (baixa hoje; necessárias no Android)
| Proteção | Para quê |
|---|---|
| **Política de conteúdo (CSP)** no `index.html` | Impede que qualquer código de fora rode dentro do app, mesmo se um dia entrar um link ou texto malicioso |
| **Conferir links** digitados (Estudos, Carreira) | Aceitar só `http` e `https` ao abrir um link salvo |
| **Bloqueio do app** (PIN ou digital) | Finanças e Diário ficam abertos para quem pegar o celular desbloqueado. No Android dá para usar a digital |
| **Backup com senha** (opcional) | O arquivo de backup é texto puro: quem abrir lê tudo. Opção de exportar protegido por senha |

## 2. Testes de gargalo

### Regras (no computador, em milissegundos)
| Medida | 1 ano | 3 anos | 5 anos | 10 anos |
|---|---|---|---|---|
| Registros (despesas / diário / tarefas) | 973 / 250 / 600 | 2.883 / 738 / 1.800 | 4.765 / 1.224 / 3.000 | 9.516 / 2.442 / 6.000 |
| Tamanho do backup | 0,95 MB | 2,8 MB | 4,6 MB | 9,3 MB |
| Abrir (ler e conferir os dados) | 6,5 | 13,7 | 26,2 | 52,7 |
| Salvar (cópia inteira) | 6,0 | 18,7 | 31,7 | 77,7 |
| Finanças do mês | 0,2 | 0,4 | 0,2 | 0,8 |
| Contas a vencer do Início | 0,7 | 2,2 | 5,7 | 23,8 |
| Próximos (Agenda) | 0,6 | 2,4 | 6,9 | 24,6 |
| Núcleo (sequências e risco) | 3,2 | 5,1 | 12,7 | 16,8 |
| Revisão semanal | 1,6 | 7,5 | 15,3 | 55,6 |
| Relatórios | 2,5 | 1,9 | 3,0 | 6,4 |

Dados simulados de uso pesado: 2,6 despesas por dia, diário 2 dias em cada 3, 25 hábitos com 80% dos dias marcados.

### App no navegador (tempo até a tela responder, em milissegundos)
| Ação | 1 ano, celular médio | 5 anos, computador | 5 anos, celular médio |
|---|---|---|---|
| Abrir o app | 582 | 401 | **1.664** |
| Marcar hábito no Início | 42 | 69 | **406** |
| Ir para Finanças | 201 | 111 | **579** |
| Ir para Núcleo | 88 | 80 | 434 |
| Marcar ritual no Núcleo | 20 | 43 | 223 |
| Ir para Agenda | 90 | 38 | 153 |
| Ir para Próximos | 117 | 66 | 405 |
| Ir para Diário | 106 | 33 | 98 |
| Voltar ao Início | 168 | 164 | **749** |

"Celular médio" = processador 4 vezes mais lento que o computador de teste. Acima de 100 ms um toque já parece lento; acima de 300 ms, travado.

**Leitura:** hoje e no próximo ano o app está rápido. O limite aparece entre 3 e 5 anos de uso. As correções C6, C7 e C8, mais dividir o Início (abaixo), resolvem com folga.

### Outros pontos de velocidade
- **O Início redesenha tudo a cada toque:** qualquer mudança em qualquer dado redesenha todas as telas abertas, porque todos os dados vivem num bloco só. Melhoria (M18): cada cartão do Início só recalcula quando o seu pedaço dos dados muda.
- **Tamanho do app:** 738 KB de código (202 KB compactado) carregados de uma vez. Estudos (catálogo de 45 trilhas), Carreira e a Jornada entram mesmo para quem não usa. Melhoria (M19): carregar cada módulo só ao abrir. No Android isso pesa menos (os arquivos ficam no aparelho).
- **Notas e Diário** mostram todos os registros de uma vez (1.523 elementos com 300 notas). Aceitável; se passar de ~1.000 notas, mostrar por partes.
- **Voltar ao app sem mudar nada não regrava nem redesenha** (conferido: as 6 rotinas de abertura devolvem os mesmos dados). Certo como está.

## 3. Segurança: o que foi conferido
| Verificação | Resultado |
|---|---|
| Dependências com falha conhecida (`npm audit`) | 0 |
| Código que executa texto como programa (`eval`, `innerHTML`…) | Nenhum |
| Dados enviados para fora do aparelho | Nenhum (o app não faz nenhuma chamada de rede) |
| Backup malicioso tentando alterar o funcionamento do app ("poluição de protótipo") | Testado: sem efeito |
| Links externos | Abrem em nova aba, isolados (`noopener noreferrer`) |
| Dependências do app | Só 2 (React). Superfície de ataque mínima |
| Rede de proteção para erros de tela | **Não tem** (C3) |
| Política de conteúdo (CSP) | **Não tem** (C9) |
| Bloqueio do app e backup com senha | **Não tem** (C9) |

Testei 19 formatos de dados ruins (nulo, texto, listas, versões desconhecidas, registros incompletos, datas inválidas, categorias apagadas, protótipo). 15 passaram; os 4 que falharam são os do item C3.

## 4. Limpeza de código
- **Funções exportadas sem nenhum uso (12):** `toggleHabit` (actions), `parseMoney` (utils), `daysLeftInMonth` (vouchers), `Card` (ui), `areaIcon` e `openNotebook` (Estudos), `RARITY`, `homeIcon`, `treeIcon`, `avatarIcon`, `ARTIFACT_ROWS` e `recentAttributes` (Jornada). As da Jornada esperam a Jornada completa; as outras 6 podem sair.
- **Estilos sem uso (8 de 496 classes):** `balance-rows`, `count-badge`, `ev-origin`, `feed-head`, `fin-links`, `new-entry`, `quick-grid`, `stat-value`.
- **Arquivo de estilos:** 5.372 linhas num arquivo só, com blocos acrescentados por versão ("v0.16", "v0.17"…). Funciona, mas regras antigas são sobrescritas mais abaixo. Melhoria (M20): dividir por módulo.
- **Arquivos grandes demais:** `Listas.tsx` (1.470 linhas), `Carreira.tsx` (991), `Habitos.tsx` (850), `Praticas.tsx` (688), `Voce.tsx` (634). Dividir em arquivos menores facilita manutenção e gasta menos uso do Claude a cada mudança (ele lê menos).
- **Confirmações do navegador:** 22 usos de `confirm()` ("Excluir…?"). Funcionam, mas têm a cara do sistema, não do app. Trocar por uma confirmação com o visual do app (necessário também para o Android ficar com boa aparência).
- **Pontos positivos:** nenhum `any`, nenhum `console.log` esquecido, nenhum "TODO" pendente, tipagem estrita ligada, regras separadas das telas e cobertas por testes.

## 5. Ressalvas (não são defeitos, mas é bom saber)
- **Duas abas abertas ao mesmo tempo:** vale a última que salvar. Sem risco no celular; no computador, evitar editar em duas abas.
- **Atualização do app:** a versão nova só aparece ao fechar e abrir. Não há aviso "nova versão disponível". Os arquivos de versões antigas ficam guardados no aparelho até uma troca maior (ocupam alguns MB com o tempo).
- **Dados só neste aparelho:** se o navegador limpar os dados do site (ou o celular for trocado) sem backup, perde-se tudo. O aviso de backup a cada 30 dias existe; no Android, backup automático numa pasta resolve.
- **Testes de tela:** as regras têm 136 testes, mas os testes de navegador são feitos à mão a cada versão e não ficam guardados no projeto. Guardar um roteiro automático das telas principais evitaria regressões.
- **A primeira abertura regrava os dados uma vez** mesmo sem mudança. Inofensivo.

## 6. Como reproduzir
Os roteiros ficaram fora do projeto (pasta temporária da sessão). Se for útil, viram a pasta `tools/auditoria/`:
- gerador de dados de 1 a 10 anos e medição das regras;
- pior caso de sequências;
- 19 casos de dados ruins;
- medição no navegador com processador mais lento;
- simulação das notificações (em `futuro/notificacoes.md`).
