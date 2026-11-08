# Módulo Carreira (N8)

> Situação: **N8.1 Vagas (v0.22) e N8.2 Trabalho e Reuniões (v0.23) prontas (08/11)**; faltam N8.3 e N8.4, pedido do Leonardo: um módulo **próprio**, separado de Estudos.
> **Prévia N8.0 (08/11):** https://claude.ai/artifact/3DxpiHU7f6merD3dk6Hqmp
> Partes escolhidas: vagas e candidaturas, metas de carreira, currículo e conquistas, trabalho atual.

## Para que serve
Um lugar para acompanhar a vida profissional: onde estou (trabalho atual), onde quero chegar (metas), o que já fiz (currículo e conquistas) e para onde estou tentando ir (vagas).
**Não é** rede social, site de vagas nem gerador automático de currículo. O app só anota e organiza.

## As peças
| Peça | O que guarda |
|---|---|
| **Trabalho atual** | Empresa, cargo, desde quando; histórico de cargos e salários (aumentos, promoções); feedbacks, reuniões 1:1 e avaliações, com data e anotação. |
| **Metas de carreira** | Onde quero chegar (cargo, área, salário), com prazo e passos. Um passo pode apontar para uma trilha ou ciclo de **Estudos** ou para uma vaga. |
| **Currículo e conquistas** | Experiências, formação, cursos, certificados, idiomas, habilidades e conquistas (com data e resultado, ex.: "reduzi o tempo X em 30%"). Ciclos concluídos em Estudos podem virar curso/certificado com um toque. |
| **Vagas e candidaturas** | Cada vaga com empresa, cargo, link, salário oferecido e **etapa**: interesse → enviei → entrevista → proposta → contratado, ou não passou / desisti. Datas, anotações e "próximo passo" (ex.: entrevista dia 12). |

## Regras (propostas)
- **Dinheiro:** o salário do Trabalho atual **não lança nada em Finanças sozinho**. Ao registrar um aumento, o app pode perguntar "Atualizar a receita mensal de salário em Finanças?" (só se a pessoa aceitar).
- **Estudos:** a área **Carreira** da Biblioteca continua em Estudos (é conteúdo para estudar: entrevistas, LinkedIn, transição). O módulo Carreira só **liga** com ela, sem copiar.
- **Entrevista marcada** em uma vaga pode aparecer na Agenda (pergunta antes de criar o compromisso).
- Vagas encerradas (contratado, não passou, desisti) saem da lista principal e ficam no histórico.
- Dados novos em `AppData.career`, com padrão vazio em `normalize()`; entram no backup. Quem já usa o app não vê mudança até abrir o módulo.

## Navegação (proposta, decidir na prévia)
- **Casa no centro: Carreira**, com abas **Trabalho · Currículo** (partes do mesmo conteúdo: quem eu sou profissionalmente).
- **Esquerda: Metas** (planejar). **Direita: Vagas** (acompanhar candidaturas, com as etapas).
- **Botão +:** nova vaga, nova meta, nova conquista, novo feedback/1:1, novo item no currículo; por último, separado, **Categorias** (tipos de conquista e de habilidade).
- Cartão no Início (opcional, pelo lápis): "Próximo passo" de uma vaga ou meta.

## Decidido
- **Nome do módulo de Estudos:** passou a ser só **"Estudos"** (v0.22); a área Carreira continua na Biblioteca.
- **Vagas em lista** com o contador de etapas no topo (pergunta 2), como na prévia.
- **Salário escondido**, toque para mostrar (pergunta 3).
- **Reuniões entram na N8.2** (pedido do Leonardo: apresenta avanços do setor de repasse e gestão de contratos de prestadores sexta sim, sexta não). Por enquanto a casa não tem abas; Trabalho fica na casa e as abas Trabalho · Currículo entram com a N8.3.

## O que foi construído (v0.23, N8.2)
- **Trabalho atual** na casa: cargo, empresa, "há X anos e Y meses", salário escondido até tocar.
- **Registrar mudança** (entrada, promoção, aumento, novo emprego): data, cargo, empresa, salário (mostra a variação) e observação. Se existe receita mensal de Salário em Finanças, pergunta (já marcado) se atualiza o valor a partir da data, só nas ainda não recebidas.
- **Cargos e salários**: histórico com a variação em %, e excluir registro.
- **Reuniões**: tipo (reunião, 1:1, apresentação, feedback, avaliação), assunto, com quem, dia e hora, repetição (toda semana, a cada 2 ou 4 semanas), pauta e anotações, link dos slides, combinados com check, "Pôr na Agenda" (ou atualizar). "Marcar a próxima" cria a seguinte da série com os combinados não feitos.
- **Combinados em aberto** de todas as reuniões na casa, com check direto.
- Botão + na casa: nova vaga, nova reunião, mudança de cargo ou salário.
- **Depois:** anexar os slides dentro do app (hoje só o link).

## O que foi construído (v0.22, N8.1)
- Casa **Carreira**: próximos passos (até 3), contador por etapa (leva a Vagas já filtrada) e o que vem em breve.
- **Vagas**: contador por etapa que filtra a lista; vagas com passo datado primeiro; atrasadas em laranja; "sem resposta há X dias" (Enviei há 7+ dias sem passo).
- **Ficha da vaga** (salva sozinha): cargo, empresa, salário, link, etapas tocáveis, Avançar etapa, Encerrar (contratado, não passei, desisti), próximo passo com data/hora e "Pôr na Agenda" (ou "Atualizar na Agenda" se a data mudou), anotações, histórico, excluir. Vaga sem cargo e sem empresa some ao fechar.
- **Encerradas**: recolhidas, com o resultado; dá para reabrir.
- **Metas** na barra mostra "em breve" até a N8.4. Botão + em todas as telas: nova vaga.
- Dados em `AppData.career` (padrão em `normalize()`; entra no backup). Regras em `src/carreira.ts` (6 testes), tela em `src/modules/Carreira.tsx`.

## Perguntas da prévia (responder antes da N8.1)
1. A casa abre em Trabalho ou em Currículo?
2. ~~Vagas: lista ou colunas?~~ Lista (decidido na v0.22).
3. ~~Salário?~~ Escondido, toque para mostrar (decidido).
4. Cartão "Próximo passo" no Início já ligado ou desligado no lápis?

## Tamanho e divisão
Total: **G**. Dividir em partes, uma versão cada:
| Parte | O que entra | Tam. |
|---|---|---|
| N8.0 | Prévia visual navegável (Artifact) para decidir telas e barra | M · feito |
| N8.1 | Módulo base + **Vagas e candidaturas** (etapas, próximo passo, histórico) | M · feito (v0.22) |
| N8.2 | **Trabalho atual** (cargos, salários; pergunta sobre Finanças) e **Reuniões** (1:1, apresentações, feedbacks, combinados) | M · feito (v0.23) |
| N8.3 | **Currículo e conquistas** (+ trazer ciclos concluídos de Estudos) | M |
| N8.4 | **Metas de carreira** (passos ligados a Estudos e Vagas) + cartão no Início | P |

Ordem recomendada: N8.0 → N8.1 → N8.2 → N8.3 → N8.4 (vagas primeiro porque é o que tem data e cobra ação).

## Fora do escopo
Buscar vagas na internet, importar do LinkedIn, gerar PDF de currículo (fica para depois), integração com serviços externos.
