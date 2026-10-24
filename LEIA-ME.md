# Incidentaloma: guia

*Achados que você não estava procurando.* Todo dia: uma novidade médica real, com fonte, e um fato curioso, cada um com uma pergunta.

- **Endereço do app:** https://luisaprescedino-maker.github.io/Incidentaloma/
- **Repositório no GitHub:** `luisaprescedino-maker/Incidentaloma`

## Instalar no celular

### iPhone (precisa ser no Safari)
1. Abra o endereço do app no **Safari**.
2. Toque no botão **Compartilhar** (o quadrado com uma seta para cima). Em alguns iPhones, ele fica atrás do botão **⋯**.
3. Role a lista e toque em **Adicionar à Tela de Início**.
4. Se aparecer **Abrir como App Web**, deixe ligado. Toque em **Adicionar**.

### Android (Chrome)
1. Abra o endereço do app no **Chrome**.
2. Toque nos **três pontinhos** no canto superior direito.
3. Toque em **Instalar app** (ou **Adicionar à tela inicial** → **Instalar**).
4. Também dá para instalar pela aba **Arquivo** do próprio app, que mostra um botão "Instalar na tela inicial" quando o celular permite.

Depois de instalado, abra o app **uma vez com internet**. A partir daí, ele funciona mesmo sem conexão e busca as novidades sozinho sempre que houver internet.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `dados/novidades.json` | **As novidades.** É o arquivo que a atualização semanal edita. |
| `dados/fatos.json` | Os 30 fatos curiosos. |
| `HISTORICO-DE-ATUALIZACOES.md` | O registro de cada atualização: data, o que entrou e as fontes. |
| `CLAUDE.md` | As instruções que o Claude segue para atualizar o app sozinho toda semana. |
| `index.html`, `estilo.css`, `app.js` | O app: esqueleto, visual e funcionamento. |
| `sw.js` | Guarda o app no celular para funcionar sem internet. |
| `manifest.webmanifest`, `icones/` | Nome e ícones do app instalado. |
| `TESTAR NO COMPUTADOR.bat` | Abre o app no navegador para testar. |
| `ferramentas/` | O servidor de teste e o verificador dos dados. |

## Testar no computador

1. Dê **dois cliques** em `TESTAR NO COMPUTADOR.bat`.
2. Abre uma janela preta e, logo depois, o app no navegador, em `http://localhost:8081`.
   - Se o Windows mostrar um aviso azul ("O Windows protegeu o computador"), clique em **Mais informações** e depois em **Executar assim mesmo**.
3. Para ver como fica no celular: no Chrome ou no Edge, aperte **F12** e depois **Ctrl + Shift + M**.
4. Para parar, feche a janela preta.

**Testar outro dia:** coloque `?data=` e uma data no fim do endereço, por exemplo `http://localhost:8081/?data=2026-10-26`. No modo de teste, o progresso fica separado do verdadeiro.

**Conferir os dados:** com o teste aberto, entre em `http://localhost:8081/ferramentas/verificar.html`. Tem que aparecer "Tudo certo".

## Como o app escolhe o conteúdo do dia

- **Novidade do dia:** a mais recente que você ainda não viu. Quando já viu todas, elas voltam em rodízio.
- **Fato do dia:** o próximo da lista que você ainda não viu.
- **Selo "nova":** marca as novidades da última atualização semanal.
- **Revisão:** as perguntas das novidades novas e de tudo o que apareceu na tela Hoje desde segunda-feira.
- **Arquivo:** tudo o que você já viu, os dias seguidos e o seu placar.

O progresso fica guardado só no aparelho. No iPhone, o app instalado tem um progresso separado do Safari.

## Publicação

O site é publicado pelo **GitHub Pages**: cada mudança enviada ao GitHub atualiza o site sozinha em 1 ou 2 minutos. O celular recebe a novidade na próxima vez que você abrir o app com internet.
