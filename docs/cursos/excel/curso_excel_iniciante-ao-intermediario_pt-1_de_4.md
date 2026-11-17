---
formato: central-pessoal/curso
versao: 1
id: excel-completo
nome: Excel Completo
area: Produtividade
area_descricao: Ferramentas e métodos para organizar informações, fazer cálculos e analisar dados com planilhas.
catalogo: prod
notebook: Caderno do Excel Completo
parte: 1
---

# Tema: Primeiros passos no Excel

## Trilha: A tela do Excel
Descrição: Reconheça as partes da tela e aprenda a se mover pela planilha sem se perder.

Nesta trilha você vai entender como o Excel organiza as informações: o arquivo, as abas, as linhas, as colunas e as células. Também vai aprender a se localizar e a se mover rápido, com o mouse e com o teclado.

Ao terminar, você consegue abrir uma planilha qualquer, saber onde está cada coisa e salvar o seu próprio arquivo no lugar certo.

### Tópico: Para que serve uma planilha
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
Uma planilha é uma grade de linhas e colunas onde você guarda informações e faz contas com elas. A grande vantagem sobre papel ou bloco de notas é que **as contas se refazem sozinhas**: mudou um número, o total muda junto.

O Excel serve para três coisas principais:
- **Guardar listas organizadas**: contas, compras, contatos, tarefas.
- **Calcular**: somar, tirar média, comparar com uma meta.
- **Mostrar resultados**: resumos e gráficos.

#### Exemplo
Uma lista com três colunas, **Data**, **Descrição** e **Valor**, e uma linha por gasto do mês. No fim da coluna Valor, uma fórmula soma tudo. Quando você acrescenta um gasto, o total já aparece atualizado.

#### Exercício
1. Escreva num papel três coisas da sua rotina que caberiam numa planilha.
2. Para cada uma, anote quais seriam as colunas (ex.: Data, Descrição, Valor).

> Dica: comece por algo que você já controla de outro jeito. Aprender com dados reais e pequenos é mais fácil do que com exemplos inventados.

### Tópico: Pasta de trabalho e abas
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
O arquivo do Excel se chama **pasta de trabalho**. Dentro dele podem existir várias **planilhas**, que aparecem como **abas** na parte de baixo da tela (Planilha1, Planilha2…).

Pense na pasta de trabalho como um fichário e nas abas como as divisórias. Para criar uma aba, clique no **+** ao lado das abas. Para renomear, dê dois cliques no nome dela.

#### Exemplo
Um arquivo **Contas 2026.xlsx** com uma aba para cada mês (**Jan**, **Fev**, **Mar**) e uma aba **Resumo** que junta os totais.

#### Exercício
1. Crie uma pasta de trabalho nova.
2. Crie mais duas abas e renomeie as três para **Jan**, **Fev** e **Resumo**.
3. Arraste a aba **Resumo** para ficar em primeiro lugar.

> Dica: nomes curtos nas abas cabem melhor na tela, principalmente no celular. "Jan" é melhor que "Janeiro de 2026 - gastos".

### Tópico: Linhas, colunas e células
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
As **colunas** têm letras (A, B, C…) e as **linhas** têm números (1, 2, 3…). O encontro de uma coluna com uma linha é uma **célula**, e o nome dela é a letra seguida do número: a célula da coluna B com a linha 3 é a **B3**. Esse nome também é chamado de **referência**.

Um grupo de células vizinhas é um **intervalo**, escrito com dois-pontos: **A1:A10** são as dez primeiras células da coluna A; **A1:C5** é o retângulo que vai de A1 até C5.

#### Exemplo
Em A1 escreva **Produto**, em B1 **Preço**. Em A2 escreva **Caderno** e em B2 **15**. O preço do caderno está na célula **B2**.

#### Exercício
1. Preencha A1, B1, A2 e B2 como no exemplo.
2. Clique em cada célula e confira o nome dela na caixa à esquerda da barra de fórmulas.
3. Escreva o intervalo que vai de A1 até B2.

> Dica: sempre diga primeiro a coluna e depois a linha: B2, nunca 2B. É assim que as fórmulas vão entender.

### Tópico: A faixa de opções
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
A **faixa de opções** é a barra de comandos no alto da tela. Ela é dividida em **guias**:
- **Página Inicial**: o dia a dia (fonte, cores, alinhamento, formato de número, copiar e colar).
- **Inserir**: tabelas, gráficos e imagens.
- **Fórmulas**: a biblioteca de funções.
- **Dados**: classificar, filtrar e ferramentas de dados.
- **Exibir**: congelar painéis, zoom e modos de ver a planilha.

Dentro de cada guia, os comandos ficam em **grupos** (ex.: o grupo **Número** na Página Inicial).

#### Exemplo
Para colocar um título em negrito: selecione a célula, abra **Página Inicial** e clique no **N** do grupo Fonte.

#### Exercício
1. Passe por cada guia e encontre: o botão de negrito, o botão de inserir gráfico e o botão Congelar Painéis.

> Dica: pare o ponteiro em cima de um botão por um segundo. O Excel mostra o nome e para que ele serve.

### Tópico: Barra de fórmulas e caixa de nome
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
Logo acima da grade ficam duas coisas importantes:
- A **caixa de nome**, à esquerda, mostra qual célula está selecionada (ex.: C5). Você pode digitar um endereço nela e apertar Enter para pular direto para lá.
- A **barra de fórmulas** mostra o que está **de verdade** dentro da célula.

Isso importa porque a célula mostra o **resultado**, mas a barra de fórmulas mostra a **fórmula**. Quando um número parecer estranho, olhe primeiro a barra de fórmulas.

#### Exemplo
Digite `=2+3` em A1. A célula mostra **5**, mas a barra de fórmulas mostra `=2+3`.

#### Exercício
1. Faça o exemplo acima.
2. Digite **Z100** na caixa de nome e aperte Enter. Veja para onde o Excel levou você.

> Dica: a caixa de nome é o jeito mais rápido de ir para uma célula distante numa planilha grande.

### Tópico: Mover e selecionar rápido
Fontes: https://support.microsoft.com/pt-BR/Accessibility/excel/keyboard-shortcuts-in-excel

#### Explicação
Clicar e arrastar funciona, mas em listas grandes o teclado é muito mais rápido:
- **Setas**: andam uma célula.
- **Ctrl + seta**: pula até o fim dos dados naquela direção.
- **Ctrl + Shift + seta**: seleciona até o fim dos dados.
- **Ctrl + Home**: volta para a A1.
- Clicar na **letra** da coluna seleciona a coluna inteira; clicar no **número** seleciona a linha inteira.

Para selecionar células que não estão juntas, segure **Ctrl** enquanto clica nelas.

#### Exemplo
Numa lista com 500 linhas na coluna A, clique em A1 e aperte **Ctrl + seta para baixo**: você chega na última linha preenchida na hora.

#### Exercício
1. Digite números de 1 a 30 na coluna A (use o preenchimento ou digite alguns).
2. Volte para A1, pule para o fim com Ctrl + seta para baixo e volte com Ctrl + Home.
3. Selecione A1 até o fim com Ctrl + Shift + seta para baixo.

> Dica: se o Ctrl + seta "para no meio", existe uma célula vazia ali. É um bom jeito de achar buracos na lista.

### Tópico: Salvar, abrir e onde guardar
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
O formato normal do Excel é **.xlsx**. Use **Salvar como** na primeira vez, para escolher o nome e a pasta; depois, **Salvar** só grava as mudanças.

Se o arquivo estiver no OneDrive, o Excel pode ligar o **salvamento automático** (botão no canto de cima), e cada mudança é gravada sozinha. Também existe o **Excel na web**, gratuito com uma conta Microsoft, que abre os mesmos arquivos pelo navegador.

Dê nomes que digam o que é e de quando é: **Gastos_2026.xlsx**, não **Planilha1.xlsx**.

#### Exemplo
Salve a lista de gastos como **Gastos_2026.xlsx** numa pasta **Planilhas**. Feche e abra de novo pelo menu **Arquivo › Abrir**.

#### Exercício
1. Salve o arquivo dos exercícios com um nome claro numa pasta sua.
2. Feche o Excel e abra o arquivo de novo.

> Dica: antes de uma mudança grande, salve uma cópia com outro nome (ex.: **Gastos_2026_copia.xlsx**). É o seu botão de emergência.

## Trilha: Inserir e editar dados
Descrição: Digite, corrija, copie e preencha dados do jeito certo, sem retrabalho.

Uma planilha só é útil se os dados entrarem do jeito certo. Nesta trilha você vai ver como o Excel entende textos, números e datas, como corrigir sem medo e como repetir informações sem digitar tudo de novo.

O objetivo é ganhar velocidade e evitar os erros que mais atrapalham depois: número que virou texto, data que virou número e lista com buracos.

### Tópico: Texto, número e data: como o Excel entende
Fontes: https://support.microsoft.com/pt-br/Excel/enter-data-manually-in-worksheet-cells, https://support.microsoft.com/pt-br/excel/set-automatic-data-conversions

#### Explicação
Quando você digita algo e aperta Enter, o Excel decide sozinho o tipo do dado:
- **Texto** fica alinhado à **esquerda**.
- **Número** fica alinhado à **direita** e pode entrar em contas.
- **Data** também é um número por dentro (por isso também fica à direita).

Esse alinhamento é a pista mais rápida para saber se o Excel entendeu certo. Um valor como **85,50** que aparece à esquerda provavelmente virou texto, e não vai somar.

No Brasil, a vírgula separa os decimais (**85,50**) e a data é dia/mês/ano (**17/11/2026**). Isso depende da configuração de idioma do computador.

#### Exemplo
Digite **Mercado** em A1, **85,50** em B1 e **17/11/2026** em C1. O texto fica à esquerda; o valor e a data, à direita.

#### Exercício
1. Faça o exemplo.
2. Agora digite **85.50** (com ponto) em B2 e veja de que lado ele fica. Compare com B1.

> Dica: um valor colado de outro lugar à esquerda da célula costuma ser texto disfarçado de número. Corrija antes de fazer contas.

### Tópico: Datas e horas sem susto
Fontes: https://support.microsoft.com/pt-br/Excel/get-started/available-number-formats-in-excel

#### Explicação
Por dentro, o Excel guarda uma data como um **número de dias**. Por isso dá para subtrair datas e descobrir quantos dias se passaram. Horas são **frações do dia** (meio-dia é 0,5).

Se uma data aparecer como um número estranho (ex.: **46343**), ela não sumiu: só está com o formato errado. Selecione a célula e escolha o formato **Data Abreviada** em **Página Inicial › Número**.

Atalhos úteis: **Ctrl + ;** insere a data de hoje; **Ctrl + Shift + ;** insere a hora atual.

#### Exemplo
Em A1 digite **01/11/2026**, em A2 **17/11/2026**. Em A3 escreva `=A2-A1`. O resultado é **16**, os dias entre as duas datas.

#### Exercício
1. Faça o exemplo.
2. Mude o formato de A1 para **Geral** e veja o número que existe por trás da data. Depois volte para **Data Abreviada**.

> Dica: sempre digite o ano com quatro dígitos. "17/11/26" pode ser entendido de um jeito que você não esperava.

### Tópico: Corrigir, apagar e cancelar
Fontes: https://support.microsoft.com/pt-br/Excel/enter-data-manually-in-worksheet-cells

#### Explicação
Três jeitos de mexer numa célula:
- **Substituir tudo**: selecione a célula e comece a digitar. O conteúdo antigo é trocado.
- **Editar só um pedaço**: aperte **F2** (ou dê dois cliques) e o cursor entra na célula.
- **Apagar o conteúdo**: selecione e aperte **Delete**.

Enquanto está digitando, **Esc** cancela e deixa a célula como estava. **Enter** confirma e desce; **Tab** confirma e vai para a direita.

Apagar o conteúdo é diferente de **excluir a célula**: excluir puxa as outras células para ocupar o lugar e pode bagunçar a lista.

#### Exemplo
Em A1 está **Transporte**. Aperte F2, vá para o fim e acrescente **por aplicativo**. Enter. Agora A1 diz **Transporte por aplicativo**.

#### Exercício
1. Escreva três palavras em A1, A2 e A3.
2. Troque A1 inteira, edite um pedaço de A2 com F2 e apague A3 com Delete.
3. Comece a digitar em A1 e aperte Esc. Confira que nada mudou.

> Dica: use Tab para preencher uma linha da esquerda para a direita e Enter no fim. O Excel volta sozinho para a primeira coluna da próxima linha.

### Tópico: Copiar, recortar e colar valores
Fontes: https://support.microsoft.com/pt-BR/Accessibility/excel/keyboard-shortcuts-in-excel

#### Explicação
- **Ctrl + C** copia (o original fica).
- **Ctrl + X** recorta (o original sai quando você cola).
- **Ctrl + V** cola tudo: valor, fórmula e formatação.

Às vezes você quer colar **só o resultado**, sem a fórmula, ou só o valor sem as cores de outro arquivo. Para isso existe a **Colar Especial**: clique com o botão direito no destino e escolha **Colar Valores** (o ícone com 123), ou use **Ctrl + Alt + V** e marque **Valores**.

#### Exemplo
Em C2 existe a fórmula `=A2*B2` que mostra **30**. Copie C2 e use **Colar Valores** em D2: D2 recebe só o número 30, sem fórmula.

#### Exercício
1. Monte a fórmula do exemplo.
2. Cole em D2 normalmente e depois em E2 com Colar Valores. Compare as duas na barra de fórmulas.

> Dica: ao trazer dados de um site ou de outro arquivo, cole como valores. Você evita formatações estranhas e links escondidos.

### Tópico: Alça de preenchimento e séries
Fontes: https://support.microsoft.com/pt-br/Excel/enter-data-manually-in-worksheet-cells

#### Explicação
A **alça de preenchimento** é o quadradinho no canto de baixo à direita da célula selecionada. Arrastando por ela, o Excel:
- **repete** um texto ou número;
- **continua uma sequência** que ele reconhece: 1, 2, 3…; jan, fev, mar…; seg, ter, qua…; datas dia a dia;
- **copia uma fórmula** ajustando as referências para cada linha.

Para sequências de números, digite os dois primeiros (1 e 2, ou 5 e 10) e arraste os dois juntos: o Excel entende o passo. Dois cliques na alça preenchem até o fim da lista ao lado.

#### Exemplo
Digite **jan** em A1 e arraste a alça até A12: aparecem os doze meses.

#### Exercício
1. Crie os meses do ano em A1:A12.
2. Em B1 e B2 digite 100 e 200; arraste para gerar 100, 200, 300… até B12.

> Dica: segure **Ctrl** enquanto arrasta para trocar entre "repetir" e "continuar a série".

### Tópico: Preenchimento Relâmpago
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
O **Preenchimento Relâmpago** percebe um padrão nos exemplos que você digita e completa o resto da coluna. Ele é ótimo para separar ou juntar textos sem fórmula: tirar o primeiro nome de um nome completo, juntar nome e sobrenome, extrair o DDD de um telefone.

Como usar: digite o resultado esperado na primeira linha (às vezes na segunda também) e vá em **Dados › Preenchimento Relâmpago**. Muitas vezes o Excel já sugere o resto em cinza enquanto você digita; basta apertar Enter.

O resultado é texto fixo: se o nome original mudar, o resultado **não** muda junto.

#### Exemplo
Em A2:A6 há nomes completos (ex.: **Ana Souza Lima**). Em B2 digite **Ana**, vá em B3 e use **Dados › Preenchimento Relâmpago**: a coluna B ganha todos os primeiros nomes.

#### Exercício
1. Escreva cinco nomes completos na coluna A.
2. Use o Preenchimento Relâmpago para tirar o primeiro nome na coluna B e o último sobrenome na coluna C.

> Dica: se o resultado vier errado, dê mais um ou dois exemplos e rode de novo. Ele aprende com cada exemplo.

### Tópico: Inserir e excluir linhas e colunas
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
Para abrir espaço, clique com o botão direito no **número da linha** (ou na **letra da coluna**) e escolha **Inserir**. A linha nova entra **acima** da selecionada; a coluna nova entra **à esquerda**.

Para tirar, botão direito › **Excluir**. Cuidado: excluir uma linha apaga **tudo** o que existe nela, inclusive em colunas que você não está vendo na tela.

Fórmulas que usam aquelas células se ajustam sozinhas quando você insere ou exclui linhas e colunas.

#### Exemplo
Lista com as colunas Produto, Quantidade e Valor. Clique na letra da coluna Valor, botão direito › Inserir, e escreva **Unidade** na coluna nova.

#### Exercício
1. Monte uma lista de cinco produtos.
2. Insira uma linha no meio para um produto esquecido.
3. Insira uma coluna de teste e depois exclua.

> Dica: antes de excluir uma linha numa planilha larga, aperte Ctrl + seta para a direita nela para ver se não existe nada lá no fim.

### Tópico: Desfazer, refazer, localizar e substituir
Fontes: https://support.microsoft.com/pt-BR/Accessibility/excel/keyboard-shortcuts-in-excel

#### Explicação
- **Ctrl + Z** desfaz a última ação (pode apertar várias vezes).
- **Ctrl + Y** refaz o que você desfez.

Para achar algo numa planilha grande, use **Localizar** (Página Inicial › **Localizar e Selecionar**). **Substituir** troca um texto por outro em todas as células de uma vez, por exemplo "Mercado" por "Supermercado".

Os atalhos de Localizar e Substituir mudam conforme o idioma do Excel; o caminho pela Página Inicial funciona em todos.

#### Exemplo
Numa lista de gastos, use Substituir para trocar **Uber** por **Transporte** na coluna de categoria.

#### Exercício
1. Faça três mudanças numa planilha e desfaça as três com Ctrl + Z. Refaça uma com Ctrl + Y.
2. Use Localizar para achar uma palavra e Substituir para trocar uma categoria inteira.

> Dica: antes de um "Substituir tudo", marque **Coincidir conteúdo da célula inteira** nas opções. Assim "Mercado" não vira "Supersupermercado" em células que já tinham a palavra dentro.

## Trilha: Organizar e formatar
Descrição: Deixe a planilha fácil de ler, com formatos certos para cada tipo de dado.

Formatar não é enfeitar: é fazer a informação certa saltar aos olhos e evitar erros de leitura. Nesta trilha você vai ajustar tamanhos, escolher formatos de número, usar cores com moderação e travar o cabeçalho para ele não sumir quando a lista cresce.

No fim, você terá uma planilha de gastos limpa, com valores em reais, datas certas e cabeçalho sempre à vista.

### Tópico: Largura de coluna e altura de linha
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
Quando o conteúdo não cabe, o Excel corta o texto ou mostra **#####** no lugar de um número ou data. O **#####** não é erro: só falta espaço.

Para ajustar, arraste a divisa entre as letras das colunas. **Dois cliques** nessa divisa ajustam a largura ao maior conteúdo da coluna (**AutoAjuste**). Para várias colunas de uma vez, selecione todas e dê dois cliques numa das divisas.

#### Exemplo
Digite **1500000** em A1 e formate como moeda: provavelmente aparece **#####**. Dois cliques na divisa entre A e B e o valor aparece.

#### Exercício
1. Escreva descrições curtas e longas numa coluna.
2. Ajuste a largura com dois cliques na divisa.
3. Selecione as colunas A até D e ajuste todas juntas.

> Dica: viu **#####**? Não apague nada. Só alargue a coluna.

### Tópico: Fonte, alinhamento e quebra de texto
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
Na **Página Inicial** ficam fonte, tamanho, **negrito**, cor e alinhamento. Um padrão simples funciona bem:
- cabeçalho em **negrito**;
- textos alinhados à esquerda, números à direita (o padrão do Excel);
- uma fonte só no arquivo todo.

**Quebrar Texto Automaticamente** faz um texto longo ocupar várias linhas dentro da mesma célula, sem alargar a coluna.

No Excel em português, o atalho do negrito é **Ctrl + N** (no Excel em inglês, Ctrl + B).

#### Exemplo
Selecione a linha 1 com os cabeçalhos, aplique negrito e centralize. Numa célula de observação longa, ligue **Quebrar Texto Automaticamente**.

#### Exercício
1. Formate os cabeçalhos da sua lista com negrito.
2. Escreva uma observação longa e use a quebra de texto.

> Dica: resista à vontade de usar muitas fontes e cores. Planilha boa parece calma; o que importa são os números.

### Tópico: Formatos de número: moeda, porcentagem e decimais
Fontes: https://support.microsoft.com/pt-br/Excel/get-started/available-number-formats-in-excel, https://support.microsoft.com/pt-BR/Excel/format-numbers-as-percentages-in-excel

#### Explicação
O **formato** muda como o número aparece, não o valor guardado. Os mais usados ficam em **Página Inicial › Número**:
- **Moeda** ou **Contábil**: mostram **R$** e duas casas decimais. O Contábil alinha o R$ na borda da célula.
- **Porcentagem**: mostra o número vezes 100 com **%**. Por isso **0,15** vira **15%**. Se você digitar **15** e formatar, aparece **1500%**.
- **Aumentar** e **Diminuir Casas Decimais**: mais ou menos dígitos depois da vírgula.

Como o valor guardado não muda, uma célula que mostra **R$ 10,33** pode ter **10,3333** por dentro. As contas usam o valor completo.

#### Exemplo
Digite **25** em A1 e aplique Moeda: **R$ 25,00**. Digite **0,15** em A2 e aplique Porcentagem: **15%**.

#### Exercício
1. Faça uma coluna de preços e formate como Moeda.
2. Faça uma coluna de descontos (0,1; 0,05; 0,2) e formate como Porcentagem.

> Dica: para digitar porcentagem direto, digite o número já com o sinal: **15%**. O Excel guarda 0,15 e já formata.

### Tópico: Bordas e cores de preenchimento
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
**Bordas** desenham linhas em volta das células; **preenchimento** pinta o fundo. Os dois ficam no grupo Fonte da Página Inicial.

Use com propósito:
- uma cor suave no cabeçalho;
- uma borda embaixo do cabeçalho ou em volta do total;
- uma cor de destaque só para o que precisa de atenção.

As linhas cinzas da grade não aparecem na impressão; se precisar das linhas no papel, use bordas.

#### Exemplo
Na lista de gastos, pinte a linha de cabeçalho de verde-claro e coloque **Bordas › Borda Inferior Espessa** na linha do total.

#### Exercício
1. Aplique uma cor suave no cabeçalho.
2. Coloque bordas em volta de toda a lista com **Todas as Bordas**.

> Dica: cor sozinha não explica nada. Se vermelho significa "atrasado", escreva isso numa legenda ou numa coluna de status.

### Tópico: Mesclar só nos títulos
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
**Mesclar e Centralizar** junta várias células numa só. Fica bonito num título em cima da tabela, mas **atrapalha** dentro da lista: classificar, filtrar, copiar e selecionar colunas passam a dar erro ou resultado estranho.

Alternativa melhor para centralizar um título sobre várias colunas sem mesclar: selecione as células, abra **Formatar Células** (Ctrl + 1) › **Alinhamento** › Horizontal: **Centralizar seleção**.

#### Exemplo
Título **Gastos de novembro** em A1, centralizado sobre A1:C1 com **Centralizar seleção**. A lista começa na linha 3, sem nenhuma célula mesclada.

#### Exercício
1. Crie um título centralizado sobre três colunas com Centralizar seleção.
2. Teste mesclar duas células dentro de uma lista e tente classificar. Depois desfaça.

> Dica: regra de bolso: mesclar só fora da lista, nunca dentro dela.

### Tópico: Pincel de Formatação
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
O **Pincel de Formatação** (ícone de pincel na Página Inicial, grupo Área de Transferência) copia só a **aparência** de uma célula: fonte, cor, borda, formato de número. O conteúdo não muda.

Um clique no pincel aplica uma vez. **Dois cliques** deixam o pincel ligado para aplicar em vários lugares; aperte **Esc** para desligar.

#### Exemplo
A coluna B já está em Moeda com negrito. Selecione B2, clique no pincel e passe em D2:D10: a coluna D fica com o mesmo formato.

#### Exercício
1. Formate uma célula com cor, borda e moeda.
2. Use o pincel com dois cliques para aplicar o mesmo formato em três lugares diferentes.

> Dica: o pincel também copia o formato de uma linha inteira. Selecione a linha modelo pelo número dela e passe o pincel no número da outra.

### Tópico: Congelar painéis
Fontes: https://www.hashtagtreinamentos.com/congelar-paineis-excel

#### Explicação
Numa lista comprida, o cabeçalho some quando você rola para baixo. **Congelar Painéis** prende linhas ou colunas na tela. Fica em **Exibir › Congelar Painéis**, com três opções:
- **Congelar Linha Superior**: prende a linha 1.
- **Congelar Primeira Coluna**: prende a coluna A.
- **Congelar Painéis**: prende tudo o que está **acima e à esquerda** da célula selecionada.

Para soltar, volte em Exibir › Congelar Painéis › **Descongelar Painéis**.

#### Exemplo
Lista com cabeçalho na linha 1 e nomes na coluna A. Selecione **B2** e use **Congelar Painéis**: a linha 1 e a coluna A ficam paradas enquanto o resto rola.

#### Exercício
1. Crie uma lista com pelo menos 40 linhas.
2. Congele a linha superior e role até o fim.
3. Descongele e teste congelar a partir de B2.

> Dica: o título da planilha não precisa ficar congelado. Congele só a linha do cabeçalho, para sobrar mais espaço para os dados.

### Tópico: Ocultar e reexibir
Fontes: https://support.microsoft.com/pt-br/excel

#### Explicação
Dá para **ocultar** linhas, colunas e abas que atrapalham a visão, sem apagar nada: botão direito no número da linha, na letra da coluna ou na aba › **Ocultar**.

Para trazer de volta: selecione as colunas (ou linhas) dos dois lados da que sumiu, botão direito › **Reexibir**. Para abas, botão direito em qualquer aba › **Reexibir**.

A pista de que algo está oculto é a **letra ou número pulado** (ex.: de C para E) e uma linha dupla entre eles.

#### Exemplo
Uma coluna de cálculos auxiliares em D. Oculte D para a planilha ficar limpa; as fórmulas que usam D continuam funcionando.

#### Exercício
1. Oculte uma coluna e veja a letra pulada.
2. Reexiba selecionando as colunas vizinhas.
3. Oculte e reexiba uma aba.

> Dica: ocultar não protege nada. Qualquer pessoa reexibe em dois cliques, então não use para esconder dados sensíveis.

# Fontes
- [Suporte do Excel (Microsoft)](https://support.microsoft.com/pt-br/excel) | doc | Ajuda oficial da Microsoft em português, com tutoriais de todos os recursos.
- [Inserir dados manualmente nas células](https://support.microsoft.com/pt-br/Excel/enter-data-manually-in-worksheet-cells) | doc | Oficial: digitar, editar e preencher células.
- [Atalhos de teclado no Excel](https://support.microsoft.com/pt-BR/Accessibility/excel/keyboard-shortcuts-in-excel) | doc | Oficial: lista completa de atalhos, por tarefa.
- [Formatos de número disponíveis no Excel](https://support.microsoft.com/pt-br/Excel/get-started/available-number-formats-in-excel) | doc | Oficial: moeda, contábil, data, porcentagem e personalizado.
- [Formatar números como percentuais](https://support.microsoft.com/pt-BR/Excel/format-numbers-as-percentages-in-excel) | doc | Oficial: por que 15 vira 1500% e como evitar.
- [Definir conversões automáticas de dados](https://support.microsoft.com/pt-br/excel/set-automatic-data-conversions) | doc | Oficial: quando o Excel transforma o que você digita em data ou número.
- [Congelar painéis no Excel (Hashtag Treinamentos)](https://www.hashtagtreinamentos.com/congelar-paineis-excel) | artigo | Passo a passo em português, com imagens.
- [Dicas básicas de Excel (Hashtag Treinamentos)](https://www.hashtagtreinamentos.com/dicas-basicas-de-excel) | artigo | Atalhos e truques do dia a dia para ganhar velocidade.
- [Curso gratuito de Excel básico (Cursa)](https://cursa.app/pt/curso-gratuito/excel-basico-dihb) | curso | Aulas em vídeo, gratuitas, para rever os primeiros passos.

# Mapa: Excel: onde fica e como fazer
- Excel: onde fica e como fazer
  - Mover e selecionar
    - Ctrl + seta: pula até o fim dos dados
    - Ctrl + Shift + seta: seleciona até o fim
    - Ctrl + Home: volta para A1
    - Caixa de nome: vai direto para a célula
  - Editar
    - F2: edita um pedaço da célula
    - Esc: cancela o que está digitando
    - Ctrl + Z desfaz, Ctrl + Y refaz
    - Ctrl + ; insere a data de hoje
  - Colar
    - Ctrl + V: cola tudo
    - Colar Valores: só o resultado
    - Pincel: só a aparência
  - Página Inicial
    - Fonte, cor e bordas
    - Número: moeda, %, data
    - Quebrar texto automaticamente
  - Exibir e Dados
    - Exibir: Congelar Painéis
    - Dados: Preenchimento Relâmpago
  - Deu problema?
    - ##### : falta largura na coluna
    - Número à esquerda: virou texto
    - Data virou número: mude o formato
    - Letra pulada: coluna oculta

# Ciclo: Ciclo 1: a tela do Excel | A tela do Excel

<!-- fim do curso -->
