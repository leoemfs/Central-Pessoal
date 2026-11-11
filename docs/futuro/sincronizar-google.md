# N9: Sincronizar com o Google Drive

Pedido de 11/11: guardar os dados no Google Drive (pasta escondida do app, `appDataFolder`), guardar e exportar dados e PDFs, guardar imagens do Diário, sincronizar tudo sozinho e ter os mesmos dados no computador e no celular.

## Como vai funcionar (para o Leonardo)
- Em **Configurações › Conta Google**: botão **"Entrar com Google"**. Depois disso o app sincroniza sozinho.
- **Quando sincroniza:** ao abrir o app, ao voltar para ele, alguns segundos depois de cada mudança e a cada poucos minutos com o app aberto. Sem internet o app funciona igual e manda tudo quando a internet voltar.
- **Aviso discreto** no topo das Configurações: "Sincronizado às 14:32" ou "Sem internet: 3 mudanças esperando".
- **Computador e celular:** entrar com a mesma conta Google nos dois. O primeiro aparelho sobe os dados; o segundo pergunta "Juntar com os dados deste aparelho?" (ou "Usar só os da nuvem").
- **Pasta escondida:** os arquivos do app ficam no Drive, mas **você não os vê** na lista do Drive. Só o app lê. Ocupa espaço dos 15 GB grátis do Google.
- **Exportar:** o que você quiser ver ou mandar para alguém (backup legível, PDFs) vai para uma **pasta visível "Central Pessoal"** no seu Drive.
- **Sair da conta:** os dados continuam no aparelho; só para de sincronizar.

## Regras
- **Junta por item, não por arquivo inteiro.** Cada despesa, registro, hábito etc. tem um id e uma data de alteração. Se o mesmo item mudou nos dois aparelhos, **fica a mudança mais recente**.
- **Exclusões são registradas** para o item apagado num aparelho não "ressuscitar" pelo outro. O registro é limpo depois de 90 dias.
- **Imagens e PDFs** ficam em arquivos separados (não dentro dos dados), para o app continuar leve. No aparelho fica uma cópia para abrir sem internet. Fotos são reduzidas antes de subir (lado maior com 1600 px).
- O **backup em arquivo** (Configurações) continua existindo, igual hoje.

## Partes (fazer nesta ordem)
| Parte | O que é | Tam. |
|---|---|---|
| **N9.0 Preparar os dados** (absorve o N11.6) | Data de alteração e registro de exclusões em **todos** os módulos. Hoje só Finanças e Receitas registram exclusões, e só 8 dos tipos de dados têm data de alteração. Não muda nada na tela. | M |
| **N9.1 Conta Google e cópia na nuvem** | Botão "Entrar com Google"; cópia automática dos dados na pasta escondida; "Restaurar da nuvem" num aparelho novo | M |
| **N9.2 Sincronizar entre aparelhos** | Junta por item (regra acima), sincroniza sozinho nos momentos acima, aviso de situação | M |
| **N9.3 Imagens e PDFs** | Fotos nos registros do Diário (novo) e anexos PDF/imagem em Estudos (M14) e nas reuniões de Carreira (caixa de entrada de 08/11), guardados no Drive | M |
| **N9.4 Exportar para o Drive** | Botão "Exportar para o Drive": backup e PDFs na pasta visível "Central Pessoal" | P |

Cada parte vira uma versão e um PR. N9.0 e N9.1 já dão segurança (cópia na nuvem) mesmo antes da sincronização.

## O que o Leonardo precisa fazer (uma vez, ~10 min)
Criar um projeto grátis no **Google Cloud Console** e um "ID do cliente OAuth" para o endereço `https://leoemfs.github.io`. Eu passo o passo a passo na hora do N9.1. As permissões usadas (`drive.appdata` e `drive.file`) só dão acesso à pasta do app e aos arquivos que o app criou, **não ao resto do seu Drive**, e não precisam de revisão do Google.

## Notas técnicas
- Sem servidor: login pelo **Google Identity Services** (token no navegador) e chamadas diretas à **API do Drive v3** (`spaces=appDataFolder`).
- O acesso do Google dura cerca de 1 hora; o app renova sozinho enquanto a conta Google estiver ativa no navegador. De vez em quando pode pedir um toque em "Entrar".
- Arquivos na pasta escondida: `dados.json` (todos os dados, com data de alteração por item) e `arquivos/<id>` (imagens e PDFs). Ler a data do arquivo antes de baixar, para não baixar à toa.
- No aparelho, imagens e PDFs ficam no IndexedDB, num depósito separado dos dados.
- O **N4 (Android)** depois usa o mesmo formato; lá o login Google precisa de um plugin nativo. Por isso o N9 **não depende mais** do N4: dá para fazer antes, no site (computador e celular).
- Testes `node:test` para a junção por item e as exclusões (`src/sync.ts`); no navegador, simular dois aparelhos com dois perfis do Playwright.
