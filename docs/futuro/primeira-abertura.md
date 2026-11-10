# Primeira abertura: entrevista, montagem do app e tutorial da barra

> **Status: ESPECIFICADO, prévia feita, aguardando aprovação.** Item E14 da Central, **implementação número 1** (pedido em 10/11/2026).
> Prévia: https://claude.ai/artifact/Ky4NT9oh9tZQKv9FksYYCz

## Por quê
A barra de baixo é modular (muda dentro de cada módulo). Sem orientação, quem chega se perde. E o app tem muitos módulos: a pessoa precisa escolher logo o que quer ver.

## Caminho (tudo com toques grandes, dá para pular a qualquer momento)
1. **Boas-vindas:** "Vamos montar o app do seu jeito" · Começar.
2. **Nome** (opcional), para o "Bom dia" do Início.
3. **O que você quer organizar?** Cartões grandes com várias escolhas: Dinheiro, Rotina e hábitos, Mente e corpo, Compromissos, Registrar o dia, Casa e compras, Estudos, Trabalho e carreira.
4. **Seus módulos:**
   - já vêm marcados pelas escolhas (Dinheiro → Finanças; Rotina e Mente → Núcleo; Casa → Listas…);
   - toque para ligar ou desligar, com pelo menos 3;
   - os desligados **ficam guardados no Mais**, sem apagar nada (E1).
5. **3 favoritos**, na ordem dos toques, com a barra de baixo mostrada ao vivo.
6. **Ritmo do Diário** (só se o Diário está ligado): todo dia, 3x, 2x, dias certos ou quando der (E1).
7. **Barra e cor:** o jeito da barra (favorito no mesmo lugar, ao lado do Início ou no centro), com prévia na Agenda, e a cor de destaque.
8. **Jornada (opcional):** um cartão explica o modo jogo:
   - cada hábito cumprido, conta paga no prazo ou registro no Diário vira XP e ouro;
   - o personagem sobe de nível, ganha itens e pets e enfrenta chefes semanais;
   - **nunca tira pontos**, e libera depois de **14 dias de uso**.

   Duas escolhas:
   - **"Quero a Jornada":** mostra quantos dias faltam e avisa quando liberar;
   - **"Agora não":** o app fica sem jogo, o módulo Jornada fica oculto no Mais, e dá para ligar depois em Personalização.
9. **Tutorial da barra**, interativo, em 6 passos. A pessoa toca de verdade:
   1. "Estes são seus 3 favoritos" → tocar num;
   2. "A barra virou a do módulo" (o contorno marca a casa) → tocar numa ferramenta;
   3. "Voltar leva ao módulo" → voltar;
   4. "Trocar de módulo direto" → tocar de novo na casa e escolher outro;
   5. "Segure para ver o nome" → segurar um ícone;
   6. "Tudo o mais fica no Mais" (e Configurações › Personalização).
10. **Pronto:** resumo do que foi montado (inclui a escolha da Jornada) e "Ir para o Início".

## Regras
- **Pular:** usa o padrão (Finanças, Diário e Agenda; tudo à vista). O tutorial pode ser pulado sozinho.
- **Rever o tutorial:** Mais › **Como usar a barra**.
- **Quem já usa o app** não vê a entrevista sozinho: aparece um convite no Início ("Conheça a nova barra · 1 minuto") que abre só o tutorial.
- **A entrevista do Você** (rotina, metas, dinheiro) continua separada, para quando a pessoa quiser se aprofundar. Os primeiros passos dela (nome e áreas) passam a vir daqui.
- Tudo o que foi escolhido muda depois em **Configurações › Personalização**.

## Depende de / junta com
- **E1** (ocultar módulos e ritmo do Diário): entra junto, porque o passo 4 precisa de "módulo oculto".
- E10 e E13 (jeito da barra, Personalização): já prontos.

## Dados (rascunho)
```ts
settings: {
  hiddenModules: string[];            // módulos desligados (ficam no Mais)
  onboarding: { done: boolean; tutorialSeen: boolean; areas: string[] };
  journeyWanted: boolean | null;     // escolha da entrevista; null = não perguntado (quem já usa)
  journalRhythm: 'todo' | '3x' | '2x' | 'dias' | 'livre';
}
```
