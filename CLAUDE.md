# Incidentaloma: instruções para a atualização semanal

Você é uma sessão do Claude encarregada de **atualizar sozinha** o app Incidentaloma, sem ninguém acompanhando. Este arquivo tem tudo o que você precisa. Leia até o fim antes de começar.

## O que é o projeto

O Incidentaloma é um aplicativo web instalável (PWA) para celular, feito para uma estudante de medicina do 3º ano. Todo dia ela abre o app e, em poucos minutos, lê uma **novidade médica real com fonte** e um **fato curioso**, e responde a uma pergunta sobre cada um.

O site é publicado pelo **GitHub Pages** a partir do ramo `main`. Você envia a atualização para um ramo `claude/...`, e uma automação do GitHub (`.github/workflows/publicar-atualizacao.yml`) confere, junta ao `main` e republica o site sozinha (veja o passo 9).

Seu trabalho toda semana: **pesquisar o que saiu nos últimos 7 dias, adicionar de 5 a 7 novidades novas e verdadeiras, conferir, registrar e publicar.**

## Como o projeto está organizado

| Arquivo | Para que serve | Você mexe? |
|---|---|---|
| `dados/novidades.json` | Todas as novidades. **É aqui que você adiciona as novas.** | **Sim** |
| `HISTORICO-DE-ATUALIZACOES.md` | Registro de cada atualização. | **Sim** (acrescentar no topo) |
| `dados/fatos.json` | 30 fatos curiosos fixos. | Não |
| `index.html`, `app.js`, `estilo.css` | O app (esqueleto, funcionamento e visual). | Não |
| `sw.js` | Guarda o app no celular para funcionar sem internet. Sempre busca a versão nova quando há internet, então **não precisa mudar nada nele** quando só os dados mudam. | Não |
| `manifest.webmanifest`, `icones/` | Nome e ícones do app instalado. | Não |
| `ferramentas/verificar.js` | Verificador dos dados (rode com Node.js). Contém as listas de áreas e tipos aceitos. | Só para acrescentar uma área nova, se for mesmo necessário |
| `ferramentas/verificar.html`, `ferramentas/servidor.ps1`, `TESTAR NO COMPUTADOR.bat` | Ferramentas de teste no Windows da dona do app. | Não |
| `LEIA-ME.md` | Guia para a dona do app. | Não |
| `.github/workflows/publicar-atualizacao.yml` | Automação que publica sozinha o que você enviar para um ramo `claude/...`. | Não |

O app lê `dados/novidades.json` e calcula o resto sozinho:
- ordena as novidades por `dataPublicacao`, da mais recente para a mais antiga;
- dá o selo **"nova"** às novidades cujo `adicionadoEm` é igual a `ultimaAtualizacao`;
- cria os filtros a partir das áreas que existem nos dados;
- monta a revisão semanal com as perguntas das novidades novas.

## A REGRA MAIS IMPORTANTE

**Nunca invente novidades, diretrizes, artigos, números, datas ou links.**

- Cada novidade precisa ter sido **encontrada por você em pesquisa na internet nesta sessão**.
- O link precisa **abrir de verdade** (confira com WebFetch) e a página precisa **falar exatamente daquilo**.
- A data de publicação precisa estar **visível na fonte**.
- Prefira fontes **oficiais e revistas científicas** a sites de notícia genéricos. Um site de notícia pode servir para *descobrir* o assunto, mas o link salvo deve ser o da fonte primária: o documento oficial, a página do órgão ou o artigo na revista.
- Se não conseguir confirmar link, data ou conteúdo, **não adicione**. É melhor publicar 3 novidades certas do que 7 com uma inventada. Se achar menos de 5 confiáveis, adicione só as que achou (mesmo que nenhuma) e explique no histórico.
- Números (percentuais, doses, desfechos) só entram se estiverem na fonte. Na dúvida, descreva sem o número.

## Passo a passo da atualização semanal

### 1. Preparar

1. Garanta que está no ramo `main` atualizado: `git checkout main && git pull`.
2. Descubra a data de hoje no horário de Brasília: `TZ=America/Sao_Paulo date +%F`. Use essa data (formato `AAAA-MM-DD`) como **HOJE** em todo o processo.
3. Leia `HISTORICO-DE-ATUALIZACOES.md` para saber quando foi a última atualização e o que já foi adicionado.
4. Leia `dados/novidades.json` e anote os `id`, `titulo` e `fonte.url` existentes, para **não repetir** nenhuma novidade nem o mesmo assunto.

### 2. Pesquisar o que saiu nos últimos 7 dias

Procure publicações com data entre **HOJE − 7 dias** e **HOJE**. Se a última atualização foi há mais de 7 dias, o período vai da data da última atualização até HOJE. Use WebSearch (prefira o modo "standard"; use "extended" quando os resultados vierem fracos ou desatualizados) e confira tudo com WebFetch. Se houver ferramentas de PubMed disponíveis, elas ajudam a achar artigos.

Faça buscas nestes três grupos:

**a) Diretrizes e decisões brasileiras**
- Ministério da Saúde: novos Protocolos Clínicos e Diretrizes Terapêuticas (PCDT), notas técnicas, campanhas e mudanças no Sistema Único de Saúde (SUS) — `gov.br/saude`
- CONITEC (Comissão Nacional de Incorporação de Tecnologias no SUS): decisões de incorporação e relatórios — `gov.br/conitec`
- Diário Oficial da União, para portarias de incorporação — `in.gov.br`
- Sociedades médicas brasileiras: Sociedade Brasileira de Cardiologia (SBC), Sociedade Brasileira de Pediatria (SBP), Sociedade Brasileira de Infectologia (SBI), Sociedade Brasileira de Diabetes (SBD), Sociedade Brasileira de Endocrinologia e Metabologia (SBEM), Sociedade Brasileira de Pneumologia e Tisiologia (SBPT), Federação Brasileira das Associações de Ginecologia e Obstetrícia (FEBRASGO), Sociedade Brasileira de Nefrologia (SBN), Associação Brasileira de Psiquiatria (ABP) e outras
- Sugestões de busca: `nova diretriz sociedade brasileira <mês> <ano>`, `CONITEC incorpora SUS <mês> <ano>`, `Ministério da Saúde PCDT publicado <mês> <ano>`

**b) Artigos recentes em revistas importantes**
- The New England Journal of Medicine (NEJM), The Lancet, JAMA, The BMJ, Nature Medicine, Annals of Internal Medicine e as revistas das grandes sociedades
- Prefira ensaios clínicos randomizados grandes, metanálises e diretrizes internacionais que mudem a prática ou que sejam muito discutidos
- Use a data de publicação online que aparece na página do artigo

**c) Medicamentos: aprovações e alertas**
- Anvisa (Agência Nacional de Vigilância Sanitária): registros de medicamentos novos, novas indicações e alertas de segurança — `gov.br/anvisa`
- FDA (Food and Drug Administration, a agência dos Estados Unidos): *Novel Drug Approvals* e comunicados oficiais — `fda.gov`
- EMA (European Medicines Agency, a agência europeia), quando for relevante — `ema.europa.eu`

### 3. Escolher de 5 a 7 novidades

- **Varie as áreas:** no máximo 2 da mesma área por semana.
- **Varie os tipos:** tente ter pelo menos uma de cada tipo: `Diretriz`, `Artigo` e `Medicamento`. Dê preferência a pelo menos uma novidade brasileira.
- **Sem repetição:** nada que já exista em `dados/novidades.json` (mesmo link, mesmo título ou mesmo assunto).
- **Relevância para uma estudante do 3º ano:** prefira o que muda a prática clínica, aparece em prova ou é muito comentado. Evite assuntos ultraespecializados demais.
- Áreas aceitas (use exatamente estes nomes): Cardiologia, Cirurgia, Dermatologia, Endocrinologia, Gastroenterologia, Geriatria, Ginecologia e Obstetrícia, Hematologia, Infectologia, Medicina de Emergência, Medicina Intensiva, Nefrologia, Neurologia, Oftalmologia, Oncologia, Ortopedia, Otorrinolaringologia, Pediatria, Pneumologia, Psiquiatria, Reumatologia, Saúde Pública, Urologia. Se precisar mesmo de outra, acrescente-a à lista `AREAS` em `ferramentas/verificar.js`.

### 4. Conferir cada novidade antes de escrever

Para **cada** novidade escolhida, abra o link final com WebFetch e confirme:
1. a página abre e não é um erro, um paywall vazio ou um redirecionamento para outra coisa;
2. o conteúdo é exatamente o que você vai resumir;
3. a data de publicação está na página e cai no período pesquisado.

Se qualquer item falhar, troque a fonte por outra oficial ou descarte a novidade.

**Dica para artigos:** muitas revistas (The Lancet, NEJM, Elsevier) bloqueiam robôs e devolvem erro 403 no WebFetch. Nesses casos, use a página do artigo no **PubMed** (`https://pubmed.ncbi.nlm.nih.gov/<PMID>/`) como link da fonte e escreva `"nome": "The Lancet (via PubMed)"`. A página do PubMed mostra o resumo oficial, a data e o link para a revista. Se houver ferramentas de PubMed disponíveis na sessão (busca e metadados), use-as para achar o PMID e conferir a data de publicação e os números do resumo. Para robôs, a própria página do PubMed às vezes mostra só um aviso de cookies. Nesse caso, confirme título, revista e data pela interface oficial: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=<PMID>&retmode=json` (o link salvo no app continua sendo o do PubMed, que abre normalmente para pessoas).

### 5. Escrever cada novidade

Formato de cada item (todos os campos são obrigatórios):

```json
{
  "id": "2026-10-anvisa-aprova-exemplo",
  "titulo": "Título claro e informativo, em português",
  "tipo": "Medicamento",
  "area": "Endocrinologia",
  "dataPublicacao": "2026-10-20",
  "adicionadoEm": "2026-10-24",
  "fonte": {
    "nome": "Anvisa",
    "url": "https://www.gov.br/anvisa/pt-br/..."
  },
  "resumo": "Primeiro parágrafo...\n\nSegundo parágrafo...",
  "naPratica": "O que muda na prática...",
  "pergunta": {
    "enunciado": "Pergunta sobre o conteúdo?",
    "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correta": 2,
    "explicacao": "Por que a opção 2 é a certa."
  }
}
```

Regras de cada campo:
- `id`: único, só letras minúsculas sem acento, números e hífens, começando por ano e mês (ex.: `2026-10-nejm-semaglutida-dor-renal`).
- `tipo`: exatamente `Diretriz`, `Artigo` ou `Medicamento`.
- `dataPublicacao`: a data em que **a fonte** publicou (AAAA-MM-DD).
- `adicionadoEm`: **HOJE**.
- `fonte.nome`: nome curto da fonte (ex.: `The Lancet`, `Ministério da Saúde`, `FDA`). `fonte.url`: o link conferido, começando com `https://`.
- `resumo`: **cerca de 200 palavras** (entre 160 e 240), em português do Brasil, em 2 ou 3 parágrafos separados por `\n\n`. Tom didático, para uma estudante do 3º ano: contextualize o problema, diga o que foi feito ou decidido e o resultado principal. Sem sensacionalismo.
- `naPratica`: 2 a 4 frases sobre **o que muda na prática** (para o médico, o paciente ou o SUS). Seja honesto sobre limitações: se ainda depende de incorporação, de mais estudos ou se não está disponível no Brasil, diga.
- **Siglas:** escreva por extenso na primeira vez em que aparecem **em cada novidade**, com a sigla entre parênteses. Exemplo: "Sistema Único de Saúde (SUS)", "insuficiência cardíaca com fração de ejeção reduzida (ICFEr)". Isso vale para o título, o resumo, o "na prática" e a pergunta (conte a partir do título).
- `*itálico*` e `**negrito**` funcionam. Use itálico para nomes científicos (ex.: `*Streptococcus pneumoniae*`).
- `pergunta`: múltipla escolha com **exatamente 4 opções**, uma só correta, respondível com o que está no resumo ou no "na prática". `correta` é o número da opção certa, de 1 a 4. **Varie a posição da resposta certa** entre as novidades. A `explicacao` diz por que a resposta está certa, em 1 ou 2 frases.
- Dentro dos textos, use aspas tipográficas (“ ”) em vez de aspas retas, para não quebrar o JSON.

### 6. Salvar no arquivo de dados

Em `dados/novidades.json`:
1. Acrescente as novidades novas **no começo** da lista `"novidades"`.
2. Mude `"ultimaAtualizacao"` para **HOJE**.
3. **Não apague nem altere** as novidades antigas. A única exceção é consertar um link que você confirmou estar quebrado.

### 7. Conferir se tudo continua funcionando

1. Rode o verificador:
   ```
   node ferramentas/verificar.js --links
   ```
   - **ERRO**: corrija e rode de novo até não haver nenhum.
   - **AVISO** de link: alguns sites oficiais bloqueiam robôs. Confira o link com WebFetch. Se abrir, pode seguir.
   - **AVISO** de tamanho do resumo: ajuste o texto para ficar perto de 200 palavras.
2. Se o Node.js não existir no ambiente, confira pelo menos se o JSON é válido (`python3 -c "import json; json.load(open('dados/novidades.json', encoding='utf-8')); print('JSON ok')"`) e revise as regras do passo 5 manualmente.
3. Confirme com `git status` e `git diff --stat` que só mudaram `dados/novidades.json` e `HISTORICO-DE-ATUALIZACOES.md` (e `ferramentas/verificar.js`, se acrescentou uma área). Não mexa no código do app.

### 8. Registrar no histórico

No topo de `HISTORICO-DE-ATUALIZACOES.md`, logo abaixo da explicação inicial, acrescente uma seção neste formato:

```markdown
## AAAA-MM-DD: N novidades

Período pesquisado: AAAA-MM-DD a AAAA-MM-DD.

| Novidade | Tipo | Área | Publicação | Fonte |
|---|---|---|---|---|
| Título | Artigo | Cardiologia | AAAA-MM-DD | [The Lancet](https://...) |

Observações: o que foi descartado e por quê, links que deram aviso, ou "nenhuma".
```

### 9. Salvar e enviar para o GitHub

Envie as mudanças para um ramo novo chamado `claude/atualizacao-AAAA-MM-DD` (com a data de HOJE). **Não** envie direto para `main` e **não** abra pull request:

```
git checkout -b claude/atualizacao-AAAA-MM-DD
git add dados/novidades.json HISTORICO-DE-ATUALIZACOES.md
git commit -m "Atualização semanal AAAA-MM-DD: N novidades"
git push origin claude/atualizacao-AAAA-MM-DD
```

- Se o ramo já existir no GitHub (por exemplo, numa segunda tentativa no mesmo dia), use `claude/atualizacao-AAAA-MM-DD-2`.
- A automação `.github/workflows/publicar-atualizacao.yml` cuida do resto sozinha: roda o verificador de novo, junta o ramo ao `main`, apaga o ramo e republica o site no GitHub Pages em poucos minutos. A dona do app não precisa aprovar nada.
- Se o verificador da automação achar erro, nada é publicado. Por isso o passo 7 é tão importante: só envie depois que o verificador passar sem erros.

### 10. Terminar

Termine com um resumo curto: quantas novidades entraram (título e área de cada uma), se o verificador passou e se o push do ramo deu certo.

## O que NÃO fazer

- Não invente nada (veja a regra mais importante).
- Não mude `app.js`, `index.html`, `estilo.css`, `sw.js` nem os nomes dos campos do JSON.
- Não apague novidades antigas nem entradas do histórico.
- Não adicione novidades com mais de 7 dias além do período (salvo se a última atualização foi há mais tempo, como explicado no passo 2).
- Não copie trechos longos das fontes: escreva o resumo com suas palavras.
