# Estrutura do app (retrato de 18/11/2026, v0.133)

> Mapa de tudo o que existe, para analisar a estrutura. O detalhe de cada módulo está no `README.md`; o que falta, na `docs/CENTRAL.md`.
> **[ainda não implementado]** marca o que está só anotado ou especificado.

## Em números
| O quê | Quantidade |
|---|---|
| Módulos com casa própria | **12**: Início, Finanças, Diário, Agenda, Núcleo, Listas, Estudos, Carreira, Objetivos, Saúde, Notas, Jornada |
| Telas de apoio | 3: Você, Revisão semanal, Configurações (com páginas por tema) |
| Telas com endereço próprio (rotas) | **35** |
| Módulos com barra de baixo própria (3 ferramentas) | 9 |
| Arquivos de regras (lógica, sem tela) | 58 |
| Funções de regra | ~760 |
| Componentes de tela | ~200, em 79 arquivos |
| Testes automáticos | **380** (51 arquivos), todos passando |
| Linhas de código | ~41 mil |
| Versões publicadas | 133 (v0.1 a v0.133) |

## Como o app se organiza
- **Barra de baixo:** no Início, Início + 4 favoritos. Dentro de um módulo: Início · ferramenta · **casa do módulo (centro)** · ferramenta · ⭐ Favoritos. Puxar a barra para cima abre a gaveta (o menu) com todos os módulos e telas, e os atalhos Configurações, Como usar a barra e Guardados. Não existe tela Mais (saiu no E2, v0.139.0); o endereço antigo `#/mais` abre a gaveta.
- **Abas no topo:** partes do mesmo conteúdo (ex.: Despesas · Receitas · Cartões · Caixinhas).
- **Botão +:** tudo o que cria algo; por último, Categorias.
- **Lápis:** personalizar cartões (subir, descer, ocultar) em várias telas.
- **Dados:** tudo no aparelho; cópia e sincronização opcional pelo **Google Drive** (pasta escondida); compromissos no **Google Agenda** (opcional).

## Módulos e telas
| Módulo | Barra (esq · casa · dir) | Abas / telas | Principais funcionalidades |
|---|---|---|---|
| **Início** | 4 favoritos | — | Humor do dia, Seu dia, Estudando agora, resumo do mês, contas a vencer, compromissos, tarefas, diário, hábitos do dia, objetivos, cartão da Jornada; cartões personalizáveis |
| **Finanças** | Orçamento · **Finanças** · Relatórios | Despesas · Receitas · Cartões · Caixinhas | Despesas avulsas, fixas e parceladas; receitas avulsas e mensais; cartões com faturas e "Entra na fatura de"; **vales VR/VA**; **caixinhas** com plano e marcos; **orçamento** por categoria com previsão; **relatórios** de 6 meses; balanço do mês; categorias |
| **Diário** | Humor · **Diário** · Revisão | — | Feed privado com etiqueta, busca e histórico por ano/mês; **fotos** (até 6); **humor do dia** com etiquetas e insights; ritmo do Diário |
| **Agenda** | Hoje · **Agenda** · Próximos | Calendário · Tarefas | Calendário com tudo do dia (compromissos, tarefas, contas, cartão, hábitos, diário); tarefas (com combinados, entregas e passos de metas, cada um com selo de origem; E3); próximos 30 dias; itens automáticos de Carreira e Saúde |
| **Núcleo pessoal** | Progresso · **Núcleo** · Práticas | Rituais · Hábitos · Mente · Corpo | Rituais, hábitos a construir (até virar ritual) e a abandonar; pausar e arquivar; metas com quantidade; "não falhe duas vezes"; atributos; **Mente:** meditação, respiração, três coisas boas; **Corpo:** treino em casa (8 partes, 3 níveis, boneco animado), fichas, alongamentos, caminhada e corrida |
| **Listas** | Compras · **Listas** · Preços | Categorias em fichas | Listas de mercado (corredores, catálogo de ~300 produtos, preço por loja, "Quanto custou aqui?", concluir compra), compras, receitas (porções, mandar para o mercado) e checklist; **Preços** com categorias, lojas, comparação por unidade e histórico; **Compras** concluídas |
| **Estudos** | Ciclos · **Estudos** · Roadmaps | Biblioteca, notebooks, fontes, mapas | **Biblioteca** (5 áreas, trilhas e tópicos), ciclos de estudo, **notebooks** com páginas, subpáginas e editor de texto, **mapas mentais**, fontes, **coleções**, **importar curso por IA**, exportar em PDF |
| **Carreira** | Metas · **Carreira** · Vagas | Trabalho · Currículo | Metas abre Objetivos já filtrado em Carreira (E5); vagas por etapa com próximo passo; trabalho atual com cargos e salários; **reuniões** com combinados, repetição e adiar; **projetos** com entregas; **currículo**; tudo vai sozinho para a Agenda |
| **Objetivos** | Grandes · **Objetivos** · Concluídos | Áreas | Todas as metas do app num lugar (caixinhas, hábitos, ciclos, orçamento); metas próprias nas áreas Carreira e Você (E5: as do Você moram aqui), filtros, ações rápidas, histórico de concluídos, cartão no Início |
| **Saúde** | Rotina · **Saúde** · Histórico | Dia · Dieta · Remédios · Consultas · Medidas | Água (ligável ao hábito), sono, **dieta** com planos e receitas ligadas, compras da semana, **remédios** com doses e aviso no Google Agenda, **consultas** e check-ups (vão para a Agenda), medidas |
| **Notas** | — | — | Anotações rápidas e fixadas |
| **Jornada** (opcional) | Jornada · Arsenal · Baús · Ficha | Ficha · Títulos · Forja · Classes | Desbloqueia com 14 dias de uso; personagem e pet em pixel art, céu pela hora, XP, nível, ouro, cristais, baús, arsenal (49 itens), missões do dia e da semana, entrevista da Mestra Lume, mini game, animação de entrada |
| **Você** | — | — | "Completar o perfil" (só o que a montagem não perguntou), perfil e **sugestões** de hábitos e práticas |
| **Revisão semanal** | (no Diário) | — | Rotina, gastos, contas, agenda, autocuidado, caixinhas, vales, estudos e reflexão |
| **Configurações** | — | Lista de temas | Conta Google, Aparência (tema, 8 cores, vidro fosco), Início e módulos, Barras e navegação, Backup, Armazenamento |

## Recursos que atravessam o app
- **Montagem do app** na primeira abertura + **tutorial da barra** (6 passos).
- **Busca** em tudo e por módulo.
- **Personalizar cartões** (lápis) no Início, Finanças, Núcleo, Listas, Estudos e Carreira.
- **Temas** escuro, claro e automático, cor de destaque.
- **Backup** em arquivo e **sincronização com o Google Drive** entre aparelhos.
- **Google Agenda** (opcional) para compromissos e doses de remédio.
- Funciona **offline** e pode ser instalado como app (PWA).

## Ainda não implementado
### Aprovado, na fila
| Item | O quê | Tam. |
|---|---|---|
| M44 | **Diário v2**: fichas de etiqueta, cartões "Esta semana" e "Neste dia", pergunta do dia, calendário na Revisão | M |
| N2 | **Jornada completa**: redesenho com o dobro de pixels, campanha com regiões e chefes, Forja, Codex por coleções, mais mini games | G |
| N9.3b / N9.4 | Anexar PDF em Estudos, reuniões e vagas; exportar para pasta visível do Drive | M |
| M4 | Preços 2.0, parte 3: tipos de loja, editar e juntar produtos | M |
| N10.2 | **Objetivos grandes** (juntar várias metas, ex.: "Viajar em julho") | M |
| M6 | Fichas de treino próprias | M |
| M5 | Agenda com repetição e aniversários | M |

### Anotado ou especificado (aguardando aprovação)
- **Android:** N4 app Android (preparo conferido), N3/N3.3 **notificações** com níveis baixa/média/alta, N3.1 lembrar no celular, N3.2 resumo do dia.
- **Listas e Preços:** M34 Filmes e séries, M42 juntar produtos duplicados, M43 Roupas e Casa ligadas a Preços, M25 aviso de preço fora do normal, M26 caixa de adicionar no topo em todas as listas, N5 código de barras e nota fiscal.
- **Estudos:** N11.4 a N11.7 (resto do Estudos 2.0), M37b exportar em Word, M38 excluir e arquivar no próprio curso, M32 e M33 cursos de Claude e GitHub (partes prontas), N7 Estudos × Jornada.
- **Núcleo e Saúde:** M35 Caminhada e corrida 2.0 (prévia feita), M16 Foco (temporizador).
- **Agenda e Notas:** M27 escrever do seu jeito ("dentista sexta 15h"), M17 Banco de ideias, E42 histórico por ano e mês em outros módulos.
- **Carreira:** M22 currículo em PDF.
- **Robustez e segurança:** C9 bloqueio do app (PIN/digital) e backup com senha; C6, C7, C8, M18, M19 velocidade com anos de uso; M20 limpeza do código.
