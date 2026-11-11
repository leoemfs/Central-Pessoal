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

## PDFs (resposta de 11/11: "PDFs de currículo, por exemplo")
- **Gerar PDF** a partir do que já está no app. O primeiro é o **currículo** (Carreira › Currículo › "Gerar PDF"): baixar, compartilhar ou, com a conta Google ligada, salvar na pasta "Central Pessoal". Esse é o item **M22**, que não depende do Google e pode vir antes.
- **Anexar PDF** que veio de fora (ex.: o currículo enviado numa vaga, slides de reunião, material de estudo): parte N9.3.
- Depois, outros PDFs do mesmo jeito (relatório do mês de Finanças, Revisão semanal), anotados quando ele pedir.

## Regras
- **Junta por item, não por arquivo inteiro.** Cada despesa, registro, hábito etc. tem um id e uma data de alteração. Se o mesmo item mudou nos dois aparelhos, **fica a mudança mais recente**.
- **Exclusões são registradas** para o item apagado num aparelho não "ressuscitar" pelo outro. O registro é limpo depois de 90 dias.
- **Imagens e PDFs** ficam em arquivos separados (não dentro dos dados), para o app continuar leve. No aparelho fica uma cópia para abrir sem internet. Fotos são reduzidas antes de subir (lado maior com 1600 px).
- O **backup em arquivo** (Configurações) continua existindo, igual hoje.

## Partes (fazer nesta ordem)
| Parte | O que é | Tam. |
|---|---|---|
| **N9.0 Preparar os dados** (absorve o N11.6) ✅ v0.39 | Data de alteração e registro de exclusões em **todos** os módulos, feitos num lugar só (`src/sync.ts`, chamado pela loja). Ids estáveis para o que o app gera. Não muda nada na tela. | M |
| **N9.1 Conta Google e cópia na nuvem** | Botão "Entrar com Google"; cópia automática dos dados na pasta escondida; "Restaurar da nuvem" num aparelho novo | M |
| **N9.2 Sincronizar entre aparelhos** | Junta por item (regra acima), sincroniza sozinho nos momentos acima, aviso de situação | M |
| **N9.3 Imagens e PDFs** | Fotos nos registros do Diário (novo) e anexos PDF/imagem em Estudos (M14), nas reuniões de Carreira (caixa de entrada de 08/11) e nas vagas (o currículo enviado em cada candidatura), guardados no Drive | M |
| **N9.4 Exportar para o Drive** | Botão "Exportar para o Drive": backup e PDFs gerados pelo app (começando pelo **currículo em PDF**, M22) na pasta visível "Central Pessoal" | P |

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

## Como ficou o N9.0 (v0.39)
- `trackChanges(antes, depois)` roda em toda alteração (loja: `update`, abertura do app, volta ao app e restaurar backup). Compara só as partes que mudaram (rápido: ~6 ms com 5.000 despesas).
- `stamps[id]` = última alteração do item; `stamps['@parte']` = última alteração da parte (para o que não tem id: humor por dia, orçamentos, configurações, cargas, vídeos).
- `deleted[id]` = quando foi apagado; sai de lá se o item voltar; esquecido após 90 dias (`pruneDeleted`, ao abrir).
- Ids estáveis (`stableId` em `utils.ts`): ocorrência de série = `série~número`; receita mensal = `série~número`; recarga = `vale~recarga~mês`; categoria padrão = `categoria~nome`; fonte padrão = `fonte~nome`.

## Para lembrar no N9.2
- Dados de antes da v0.39 não têm `stamps`: tratar item sem data como "antigo" (vale a data de `updatedAt`/`createdAt`, se tiver).
- Parcelas e receitas geradas antes da v0.39 têm ids aleatórios: na primeira junção, tratar como o mesmo item quando `seriesId` + `installment` forem iguais. Categorias e fontes padrão antigas: juntar pelo nome.
- **Apagar tudo** (Configurações) hoje registra tudo como excluído: com a sincronização ligada, perguntar "Só neste aparelho" ou "Em todos".
- Restaurar um backup também conta como alteração (o que não está no backup vira excluído). Avisar isso na tela quando a sincronização estiver ligada.
