# App Android

> **Status: IDEIA PARA IMPLEMENTAÇÃO FUTURA.** Sem desenvolvimento no app.

## Objetivo
**Uso pessoal (só do Leonardo):** sem Play Store; instalação direta do APK no celular.

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

## Sincronização (item N8, depois do N4)
- **Conta Google:** cópia dos dados numa pasta escondida do Google Drive (só o app enxerga). Sem servidor próprio e sem custo.
- Os dados já ficam num único pacote (o mesmo do backup), então basta enviar e receber esse pacote: baixa ao abrir e envia ao salvar.
- Regra inicial: a mudança mais recente vence. Editar no celular e no site ao mesmo tempo, sem internet, pode perder uma das mudanças.
- Precisa de um projeto gratuito no Google Cloud para liberar o login com Google.
- **Conta Apple: fora.** O iCloud não funciona bem no Android, e usar a conta Apple exigiria um servidor próprio (custo e manutenção).

## Etapas sugeridas
1. Projeto Capacitor + ícone e tela de abertura. Gerar APK de teste (instalação direta no celular).
2. Notificações locais com as regras de `notificacoes.md` + Configurações › Notificações.
3. Tela ligada nas práticas, vibração e backup em arquivo.
4. Build automático do APK no GitHub Actions. (Play Store não é necessária: o app é de uso pessoal.)
5. Widget e atalhos.

## Cuidados
- Android 13+ pede permissão para notificações: pedir na hora certa (ao ligar o primeiro aviso), nunca na primeira abertura.
- Alarmes exatos (Android 12+) exigem a permissão de "alarmes e lembretes"; sem ela, os avisos podem atrasar alguns minutos.
- O app não precisa de internet nem de conta.
