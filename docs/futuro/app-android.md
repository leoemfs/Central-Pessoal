# App Android

> **Status: ESPECIFICADO, com preparo conferido em 10/11/2026** (ver "Preparo" abaixo). Sem desenvolvimento no app.

## Objetivo
Transformar a Central Pessoal num app Android instalável (APK e, se quiser, Play Store), **sem reescrever o app**. O mesmo código continua servindo o site.

## Como
- **Capacitor** (Ionic) empacota o app web atual (React + Vite) dentro de um app Android nativo. As telas, as regras e os testes continuam os mesmos.
- O build web (`npm run build`) vira o conteúdo do app. Um projeto `android/` fica no repositório e é aberto no Android Studio, ou gerado pelo GitHub Actions.
- O site em `leoemfs.github.io/Central-Pessoal` continua existindo para quem usa pelo navegador.

## O que o app Android ganha
| Recurso | Plugin | Uso |
|---|---|---|
| **Notificações locais** | `@capacitor/local-notifications` | Todos os avisos de `notificacoes.md`, na hora exata e sem servidor |
| Botões no aviso | o mesmo, com "actions" | "Feito" num ritual, "Guardei" no dia de guardar |
| Vibração leve | `@capacitor/haptics` | Ao marcar hábitos e no fim das práticas |
| Tela ligada nas práticas | keep-awake | Meditação, respiração, treino e alongamento não apagam a tela |
| Backup em arquivo | `@capacitor/filesystem` + share | Exportar o backup direto para o Drive ou o WhatsApp |
| Câmera | `@capacitor/camera` / leitor de código de barras | Módulo de preços (etiquetas e código de barras) |
| Widget na tela inicial (depois) | código nativo | "Hoje": rituais, conta do dia e dia de guardar |
| Atalhos no ícone | app shortcuts | "Nova despesa", "Meditar", "Diário" |

## Dados
- Continuam **só no aparelho**. O IndexedDB do app Android é separado do navegador, por isso a primeira abertura oferece **"Importar backup"** para trazer os dados do site.
- O formato do backup é o mesmo do site (JSON, versão 2).

## Etapas sugeridas
1. Projeto Capacitor + ícone e tela de abertura. Gerar APK de teste (instalação direta no celular).
2. Notificações locais com as regras de `notificacoes.md` + Configurações › Notificações.
3. Tela ligada nas práticas, vibração e backup em arquivo.
4. Publicação na Play Store (conta de desenvolvedor do Google, taxa única) e build automático no GitHub Actions.
5. Widget e atalhos.

## Cuidados
- Android 13+ pede permissão para notificações: pedir na hora certa (ao ligar o primeiro aviso), nunca na primeira abertura.
- Alarmes exatos (Android 12+) exigem a permissão de "alarmes e lembretes"; sem ela, os avisos podem atrasar alguns minutos.
- O app não precisa de internet nem de conta.

## Preparo: o que foi conferido no app de hoje (10/11/2026, v0.25.1)
Conferi o código atual contra o que muda quando o app roda dentro do Android (Capacitor). **O app já está perto**: usa endereços relativos, não depende de servidor, guarda tudo no aparelho e trata as bordas da tela. Estes são os pontos que **quebram ou mudam** e precisam ser feitos antes ou durante a troca.

### O que precisa de adaptação
| # | Ponto | Hoje | No Android | O que fazer |
|---|---|---|---|---|
| A1 | **Exportar backup** | Baixa um arquivo pelo navegador (`a.download`) | **Não funciona** dentro do app (o botão não faz nada) | Salvar com o plugin de arquivos e abrir o "Compartilhar" (Drive, WhatsApp, pasta) |
| A2 | **Trazer os dados do site** | Dados no navegador | O app tem um banco **separado**: começa vazio | Primeira abertura oferece "Importar backup". Antes da troca: exportar no site. Ver "Passo a passo da mudança" |
| A3 | **Botão voltar do celular** | O navegador cuida | No Início, sem telas para voltar, o botão não faz nada | No Início, voltar **minimiza** o app. Nas outras telas, segue a regra atual (ferramenta → módulo → Início) |
| A4 | **Barra de cima sob o relógio** | O navegador reserva o espaço | O Android 15 desenha o app de ponta a ponta: a barra de cima ficaria **embaixo** do relógio e da bateria | Somar a área segura do topo na barra de cima (hoje só as bordas de baixo estão tratadas) |
| A5 | **Funcionar offline** | Um "service worker" guarda os arquivos | Desnecessário (os arquivos já estão no aparelho) e pode servir versão velha | Não registrar o service worker quando estiver no app |
| A6 | **Práticas com a tela apagada** | Os temporizadores param quando a tela apaga | Igual, e o sino pode não tocar | Manter a tela ligada durante a prática e calcular o tempo pelo relógio, não por contagem |
| A7 | **Confirmações ("Excluir…?")** | Janela do navegador (22 lugares) | Funcionam, mas com cara de sistema | Trocar por confirmação com o visual do app |
| A8 | **Links externos** (Estudos, Carreira) | Abrem em nova aba | Abrem no navegador do celular; precisa testar a volta | Usar o plugin de navegador (abre por cima e volta para o app) |
| A9 | **Tema e cor** antes de abrir | Guardados no navegador | Funciona igual | Só testar |
| A10 | **Atualização** | Automática ao publicar | **Só com APK novo** (ou pela Play Store) | Ver "Como o app se atualiza" |

### O que já está pronto (conferido)
- Endereços relativos (`base: './'`) e rotas por `#`: funcionam sem servidor.
- Nenhuma chamada de rede: o app não precisa da permissão de internet.
- Banco local (IndexedDB) funciona igual; no app ele **não é apagado** pelo sistema como pode acontecer no navegador.
- Bordas de baixo e laterais já respeitam a área segura.
- Importar backup por arquivo funciona no app.
- O sino das práticas usa áudio do próprio navegador, que existe no Android.

### Correções do app que devem vir antes (da análise de novembro)
Não são do Android, mas a mudança fica mais segura com elas (`docs/auditoria-2026-11.md`):
- **C3:** conferir os registros ao abrir + tela de erro com saída + desfazer importação. É o que protege a **importação do backup** na troca.
- **C7:** gravar por coleção. Deixa o app mais leve e prepara a sincronização.
- **C5:** rodar os testes em todo PR e antes de publicar.

### Passo a passo da mudança (para sair sem erro)
1. **Antes:** C3, C5 e C7 prontos no site. Exportar um backup no site e guardar.
2. **Projeto Android** (Capacitor) com A3, A4 e A5. Gerar um APK de teste.
3. **Teste de troca com dados reais:** instalar o APK, importar o backup do site e conferir os totais de Finanças do mês, as sequências do Núcleo, o Diário e a Agenda contra o site, lado a lado.
4. **Backup no app** (A1) e teste de ida e volta: exportar no app → importar no site → conferir.
5. **Notificações** (`notificacoes.md`), primeiro só "contas" e "compromissos", depois os outros tipos.
6. **Uma semana usando os dois** (site e app) sem apagar o site. Só depois tratar o app como principal.
7. O site continua no ar como reserva e para o computador.

### Como o app se atualiza
| Caminho | Como | Prós | Contras |
|---|---|---|---|
| **APK direto** | O GitHub gera o APK a cada versão; você baixa e instala por cima | Grátis, imediato | Instalar à mão; o Android avisa "fonte desconhecida" |
| **Play Store (teste fechado)** | Publica para uma lista de e-mails (você e amigos) | Atualiza sozinho, link fácil | Conta de desenvolvedor (taxa única de US$ 25) e revisão do Google |
| **Play Store (público)** | Aberto a todos | Alcance | Política de privacidade, ficha da loja, revisões mais lentas |

Recomendação: começar por **APK direto** e passar para o **teste fechado** quando for mandar para os amigos.

### Requisitos do sistema
- Android mínimo: **8.0** (canais de notificação). Alvo: a versão exigida pela Play Store no ano.
- Permissões: **notificações** (Android 13+, pedida ao ligar o primeiro aviso), **alarmes exatos** (opcional, ver `notificacoes.md`), **vibração**, **iniciar após reiniciar o celular** (para reprogramar os avisos). **Sem** internet, contatos, localização ou armazenamento geral.
- **Fabricantes que matam apps em segundo plano** (Xiaomi, Samsung, Motorola): os avisos podem atrasar ou não chegar. O app precisa de uma tela "Os avisos não estão chegando?" com o passo a passo para liberar ("início automático", "sem restrição de bateria").

### Lista de testes no aparelho (antes de considerar pronto)
- [ ] Abrir sem internet (modo avião).
- [ ] Importar o backup do site e conferir os totais.
- [ ] Exportar backup e abrir o arquivo no Drive.
- [ ] Voltar: ferramenta → módulo → Início → minimiza.
- [ ] Barra de cima e de baixo sem ficar sob o relógio nem sob os botões do sistema; tema claro e escuro.
- [ ] Girar a tela e abrir o teclado em formulários longos (despesa, hábito).
- [ ] Prática de 10 min com a tela ligada; sino no fim.
- [ ] Aviso com o app fechado, depois de reiniciar o celular e com economia de bateria ligada.
- [ ] Tocar no aviso abre a tela certa; "Feito" marca o hábito sem abrir o app.
- [ ] Instalar uma versão nova por cima: os dados continuam.
- [ ] Ficar 3 dias sem abrir: os avisos continuam chegando.
