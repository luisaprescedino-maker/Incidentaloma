/* =========================================================
   FUNCIONAMENTO DO INCIDENTALOMA
   Você não precisa mexer aqui para adicionar conteúdos:
   eles ficam na pasta dados/ (novidades.json e fatos.json).
   ========================================================= */
"use strict";

/* ---------- Conteúdos (vêm da pasta dados/) ---------- */

let NOVIDADES = [];
let FATOS = [];
let ULTIMA_ATUALIZACAO = null;

// Da publicação mais recente para a mais antiga.
function maisRecentePrimeiro(a, b) {
  return b.dataPublicacao.localeCompare(a.dataPublicacao) || b.adicionadoEm.localeCompare(a.adicionadoEm);
}

async function carregarDados() {
  const [n, f] = await Promise.all([
    fetch("dados/novidades.json", { cache: "no-cache" }).then(r => r.json()),
    fetch("dados/fatos.json", { cache: "no-cache" }).then(r => r.json()),
  ]);
  NOVIDADES = (n.novidades || []).slice().sort(maisRecentePrimeiro);
  FATOS = f.fatos || [];
  ULTIMA_ATUALIZACAO = n.ultimaAtualizacao || null;
}

const novidadePorId = id => NOVIDADES.find(n => n.id === id) || null;
const fatoPorId = id => FATOS.find(f => f.id === id) || null;

// "Nova" = chegou na última atualização semanal.
const ehNova = n => n.adicionadoEm === ULTIMA_ATUALIZACAO;

/* ---------- Datas ---------- */

const UM_DIA = 86400000;

// Para testar outro dia, abra o app com ?data=2026-10-26 no fim do endereço.
const DATA_DE_TESTE = (() => {
  const p = new URLSearchParams(location.search).get("data");
  return p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null;
})();

function deChave(chave) {
  const [a, m, d] = chave.split("-").map(Number);
  return new Date(a, m - 1, d);
}

function chaveData(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

function hoje() {
  if (DATA_DE_TESTE) return deChave(DATA_DE_TESTE);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Número do dia contado desde 1970: facilita fazer contas com datas.
function numeroDoDia(d) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / UM_DIA);
}

function chaveDoNumero(n) {
  const d = new Date(n * UM_DIA);
  return chaveData(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function somarDias(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function segundaDaSemana(d) {
  return somarDias(d, -((d.getDay() + 6) % 7));
}

const formatoLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const formatoCurto = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });
const dataCurta = chave => formatoCurto.format(deChave(chave));
const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Progresso salvo no aparelho ---------- */

// No modo de teste (?data=...), o progresso fica separado do verdadeiro.
const CHAVE_SALVA = DATA_DE_TESTE ? "incidentaloma-teste" : "incidentaloma";

function estadoVazio() {
  return { visitas: [], doDia: {}, vistos: {}, respostas: {}, revisoes: {} };
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_SALVA));
    if (salvo) return Object.assign(estadoVazio(), salvo);
  } catch (e) { /* sem acesso ao armazenamento: segue sem salvar */ }
  return estadoVazio();
}

function salvar() {
  try { localStorage.setItem(CHAVE_SALVA, JSON.stringify(estado)); } catch (e) { /* idem */ }
}

let estado = carregar();
let diaAberto = null;

function registrarVisita() {
  const chave = chaveData(hoje());
  diaAberto = chave;
  if (!estado.visitas.includes(chave)) estado.visitas.push(chave);
  salvar();
}

function marcarVisto(id) {
  if (id && !estado.vistos[id]) { estado.vistos[id] = chaveData(hoje()); salvar(); }
}

function sequenciaAtual() {
  const dias = new Set(estado.visitas);
  let n = numeroDoDia(hoje());
  let total = 0;
  while (dias.has(chaveDoNumero(n))) { total++; n--; }
  return total;
}

function maiorSequencia() {
  const numeros = [...new Set(estado.visitas)].map(c => numeroDoDia(deChave(c))).sort((a, b) => a - b);
  let maior = 0, atual = 0, anterior = null;
  for (const n of numeros) {
    atual = anterior !== null && n === anterior + 1 ? atual + 1 : 1;
    maior = Math.max(maior, atual);
    anterior = n;
  }
  return maior;
}

/* ---------- Escolha da novidade e do fato do dia ---------- */

// Cada dia recebe uma novidade e um fato, que ficam fixos naquele dia.
// A novidade é a mais recente que você ainda não viu; o fato é o próximo da lista.
// Quando tudo já foi visto, eles recomeçam em rodízio.
function escolher(lista, usados, chave) {
  if (!lista.length) return null;
  const livre = lista.find(i => !usados.has(i.id) && !estado.vistos[i.id]);
  if (livre) return livre.id;
  return lista[numeroDoDia(deChave(chave)) % lista.length].id;
}

function conteudoDoDia(chave) {
  const reg = estado.doDia[chave] || (estado.doDia[chave] = {});
  const usados = new Set();
  for (const [k, v] of Object.entries(estado.doDia)) {
    if (k !== chave) { usados.add(v.novidade); usados.add(v.fato); }
  }
  if (!novidadePorId(reg.novidade)) reg.novidade = escolher(NOVIDADES, usados, chave);
  if (!fatoPorId(reg.fato)) reg.fato = escolher(FATOS, usados, chave);
  salvar();
  return { novidade: novidadePorId(reg.novidade), fato: fatoPorId(reg.fato) };
}

/* ---------- Pequenas ajudas para montar o texto ---------- */

function escapar(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// *assim* vira itálico e **assim** vira negrito.
function formatar(s) {
  return escapar(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function paragrafos(s) {
  return String(s ?? "").trim().split(/\n\s*\n/)
    .filter(p => p.trim())
    .map(p => `<p>${formatar(p.replace(/\s*\n\s*/g, " ").trim())}</p>`)
    .join("");
}

// Só aceita links seguros (https) vindos do arquivo de dados.
const urlSegura = u => /^https:\/\//i.test(String(u || "")) ? escapar(u) : "#";

const ICONE = {
  pulso: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>',
  direita: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  externo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};

/* ---------- Partes da tela ---------- */

function htmlNovidade(n, nivel = "h2") {
  return `
    <article class="materia">
      <p class="chapeu"><span class="tipo">${escapar(n.tipo)}</span><span>·</span><span>${escapar(n.area)}</span>${ehNova(n) ? `<span class="selo">nova</span>` : ""}</p>
      <${nivel}>${formatar(n.titulo)}</${nivel}>
      <p class="meta">Publicado em ${dataCurta(n.dataPublicacao)} · ${escapar(n.fonte.nome)}</p>
      <div class="texto">${paragrafos(n.resumo)}</div>
      <aside class="pratica">
        <p class="rotulo">O que muda na prática</p>
        ${paragrafos(n.naPratica)}
      </aside>
      <a class="botao largo" href="${urlSegura(n.fonte.url)}" target="_blank" rel="noopener">Ler na fonte original ${ICONE.externo}</a>
      <section class="pergunta" data-pergunta="${escapar(n.id)}"></section>
    </article>`;
}

function htmlFato(f, nivel = "h2") {
  return `
    <article class="materia">
      <p class="chapeu"><span class="tipo">Fato curioso</span><span>·</span><span>${escapar(f.categoria)}</span></p>
      <${nivel}>${formatar(f.titulo)}</${nivel}>
      <div class="texto">${paragrafos(f.texto)}</div>
      <section class="pergunta" data-pergunta="${escapar(f.id)}"></section>
    </article>`;
}

// Monta uma pergunta de múltipla escolha dentro de "el".
// "salvo" é a resposta já dada antes (ou nada). "aoResponder" guarda a resposta.
function montarPergunta(el, p, salvo, aoResponder, rotulo = "Teste rápido") {
  const certa = Number(p.correta) - 1;
  el.innerHTML = `
    <p class="rotulo">${rotulo}</p>
    <p class="enunciado">${formatar(p.enunciado)}</p>
    <div class="opcoes">
      ${p.opcoes.map((o, i) => `<button class="opcao" type="button" data-i="${i}">${formatar(o)}</button>`).join("")}
    </div>
    <div data-resultado></div>`;

  const mostrar = escolha => {
    el.querySelectorAll(".opcao").forEach(b => {
      const i = Number(b.dataset.i);
      b.disabled = true;
      if (i === certa) b.classList.add("certa");
      else if (i === escolha) b.classList.add("errada");
      else b.classList.add("apagada");
    });
    const acertou = escolha === certa;
    el.querySelector("[data-resultado]").innerHTML = `
      <div class="resultado" role="status">
        <p class="veredito ${acertou ? "sim" : "nao"}">${acertou ? "Você acertou!" : `Não foi dessa vez. A resposta é: ${formatar(p.opcoes[certa])}`}</p>
        ${p.explicacao ? `<p>${formatar(p.explicacao)}</p>` : ""}
      </div>`;
    return acertou;
  };

  if (salvo) { mostrar(salvo.escolha); return; }
  el.querySelectorAll(".opcao").forEach(b => b.addEventListener("click", () => {
    const escolha = Number(b.dataset.i);
    aoResponder(escolha, mostrar(escolha));
  }));
}

// Ativa todas as perguntas principais que estiverem na tela.
function ativarPerguntas(raiz) {
  raiz.querySelectorAll("[data-pergunta]").forEach(el => {
    const id = el.dataset.pergunta;
    const item = novidadePorId(id) || fatoPorId(id);
    if (!item || !item.pergunta) return;
    montarPergunta(el, item.pergunta, estado.respostas[id], (escolha, acertou) => {
      estado.respostas[id] = { escolha, acertou, data: chaveData(hoje()) };
      salvar();
    });
  });
}

/* ---------- Tela: Hoje ---------- */

function telaHoje(tela) {
  const d = hoje();
  const { novidade, fato } = conteudoDoDia(chaveData(d));
  const seq = sequenciaAtual();
  marcarVisto(novidade && novidade.id);
  marcarVisto(fato && fato.id);

  tela.innerHTML = `
    <header class="cabeca">
      <div class="linha-topo">
        <span>${maiuscula(formatoLongo.format(d))}${DATA_DE_TESTE ? " (teste)" : ""}</span>
        <span class="sequencia" title="Dias seguidos">${ICONE.pulso} ${seq} ${seq === 1 ? "dia" : "dias"}</span>
      </div>
      <h1 class="titulo-revista">Incidentaloma</h1>
      <p class="lema">Achados que você não estava procurando</p>
      <p class="edicao">Edição nº ${estado.visitas.length}${ULTIMA_ATUALIZACAO ? ` · atualizado em ${dataCurta(ULTIMA_ATUALIZACAO)}` : ""}</p>
    </header>

    <p class="secao-rotulo">Novidade do dia</p>
    ${novidade ? htmlNovidade(novidade) : `<p class="vazio">Ainda não há novidades. Elas chegam na atualização semanal.</p>`}

    <p class="secao-rotulo">Fato curioso do dia</p>
    ${fato ? htmlFato(fato) : `<p class="vazio">Nenhum fato curioso encontrado.</p>`}

    <p class="rodape-info">Quer mais? Veja todas as novidades na aba <a href="#novidades">Novidades</a>.</p>`;

  ativarPerguntas(tela);
}

/* ---------- Tela: Novidades ---------- */

function telaNovidades(tela, areaEscolhida) {
  const area = areaEscolhida ? decodeURIComponent(areaEscolhida) : null;
  const areas = [...new Set(NOVIDADES.map(n => n.area))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const lista = area ? NOVIDADES.filter(n => n.area === area) : NOVIDADES;
  const novas = NOVIDADES.filter(ehNova).length;

  tela.innerHTML = `
    <header class="cabecalho-pagina">
      <p class="chapeu">Novidades</p>
      <h1>O que mudou na medicina</h1>
      <p>${NOVIDADES.length} ${NOVIDADES.length === 1 ? "novidade" : "novidades"}${novas ? `, ${novas} da última atualização` : ""}. Todas com fonte original.</p>
    </header>

    <nav class="filtros" aria-label="Filtrar por área">
      <a class="filtro" href="#novidades" ${!area ? 'aria-current="true"' : ""}>Todas</a>
      ${areas.map(a => `<a class="filtro" href="#novidades/${encodeURIComponent(a)}" ${a === area ? 'aria-current="true"' : ""}>${escapar(a)}</a>`).join("")}
    </nav>

    ${lista.length ? lista.map(n => `
      <a class="cartao-lista" href="#novidade/${encodeURIComponent(n.id)}">
        <p class="chapeu"><span class="tipo">${escapar(n.tipo)}</span><span>·</span><span>${escapar(n.area)}</span>${ehNova(n) ? `<span class="selo">nova</span>` : ""}</p>
        <h2>${formatar(n.titulo)}</h2>
        <p>${dataCurta(n.dataPublicacao)} · ${escapar(n.fonte.nome)}${estado.vistos[n.id] ? " · lida" : ""}</p>
      </a>`).join("") : `<p class="vazio">Nenhuma novidade nesta área ainda.</p>`}`;
}

function telaLerNovidade(tela, id) {
  const n = novidadePorId(decodeURIComponent(id || ""));
  if (!n) { location.hash = "#novidades"; return; }
  marcarVisto(n.id);
  tela.innerHTML = `<a class="voltar" href="#novidades">${ICONE.voltar} Novidades</a>` + htmlNovidade(n, "h1");
  ativarPerguntas(tela);
}

function telaLerFato(tela, id) {
  const f = fatoPorId(decodeURIComponent(id || ""));
  if (!f) { location.hash = "#arquivo"; return; }
  tela.innerHTML = `<a class="voltar" href="#arquivo">${ICONE.voltar} Arquivo</a>` + htmlFato(f, "h1");
  ativarPerguntas(tela);
}

/* ---------- Tela: Revisão da semana ---------- */

// As perguntas da semana: as novidades da última atualização
// e tudo o que apareceu na tela Hoje desde segunda-feira.
function itensDaSemana(d) {
  const ids = new Set(NOVIDADES.filter(ehNova).map(n => n.id));
  const segunda = segundaDaSemana(d);
  for (let i = 0; i < 7; i++) {
    const dia = somarDias(segunda, i);
    if (dia > d) break;
    const reg = estado.doDia[chaveData(dia)];
    if (reg) { ids.add(reg.novidade); ids.add(reg.fato); }
  }
  return [...ids].map(id => novidadePorId(id) || fatoPorId(id)).filter(i => i && i.pergunta);
}

function telaRevisao(tela) {
  const d = hoje();
  const chaveSemana = "semana-" + chaveData(segundaDaSemana(d));
  const respostas = estado.revisoes[chaveSemana] = estado.revisoes[chaveSemana] || {};
  const itens = itensDaSemana(d);

  tela.innerHTML = `
    <header class="cabecalho-pagina">
      <p class="chapeu">Revisão semanal</p>
      <h1>Você se lembra?</h1>
      <p>As perguntas das novidades desta semana e de tudo o que apareceu para você desde segunda. Ótima para fazer no domingo.</p>
    </header>
    ${itens.length ? `<div class="placar" data-placar></div>` : `<p class="vazio">Ainda não há perguntas nesta semana. Volte depois de ler a tela Hoje.</p>`}
    <div data-lista></div>`;

  const lista = tela.querySelector("[data-lista]");
  const placar = tela.querySelector("[data-placar]");

  const atualizarPlacar = () => {
    if (!placar) return;
    const feitas = itens.filter(i => respostas[i.id]);
    const acertos = feitas.filter(i => respostas[i.id].acertou).length;
    placar.textContent = feitas.length === itens.length
      ? `Você acertou ${acertos} de ${itens.length} nesta semana!`
      : `${feitas.length} de ${itens.length} respondidas · ${acertos} ${acertos === 1 ? "acerto" : "acertos"}`;
  };

  for (const item of itens) {
    const bloco = document.createElement("section");
    bloco.className = "revisao-item";
    bloco.innerHTML = `<div class="pergunta"></div>`;
    lista.appendChild(bloco);
    const origem = item.area ? `${escapar(item.area)} · ${formatar(item.titulo)}` : `Fato curioso · ${formatar(item.titulo)}`;
    montarPergunta(bloco.firstChild, item.pergunta, respostas[item.id], (escolha, acertou) => {
      respostas[item.id] = { escolha, acertou };
      salvar();
      atualizarPlacar();
    }, origem);
  }
  atualizarPlacar();
}

/* ---------- Tela: Arquivo ---------- */

let pedidoDeInstalacao = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  pedidoDeInstalacao = e;
  if ((location.hash || "#hoje").startsWith("#arquivo")) rotear();
});

function jaInstalado() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function htmlInstalar() {
  if (jaInstalado()) return `<p>O app já está instalado neste aparelho. 🎉</p>`;
  if (pedidoDeInstalacao) return `<p>Coloque o app na tela inicial para abrir com um toque, em tela cheia e sem internet.</p><button class="botao cheio largo" type="button" data-instalar>Instalar na tela inicial</button>`;
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    return `<ol><li>Abra este endereço no <b>Safari</b>.</li><li>Toque no botão <b>Compartilhar</b> (o quadrado com uma seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e toque em <b>Adicionar</b>.</li></ol>`;
  }
  return `<p>No Chrome do Android, toque nos <b>três pontinhos</b> no canto de cima e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>`;
}

function telaArquivo(tela) {
  const seq = sequenciaAtual();
  const respostas = Object.values(estado.respostas);
  const acertos = respostas.filter(r => r.acertou).length;
  const porData = (a, b) => estado.vistos[b.id].localeCompare(estado.vistos[a.id]);
  const novidadesVistas = NOVIDADES.filter(n => estado.vistos[n.id]).sort(porData);
  const fatosVistos = FATOS.filter(f => estado.vistos[f.id]).sort(porData);
  const total = novidadesVistas.length + fatosVistos.length;

  const linha = (item, href) => {
    const r = estado.respostas[item.id];
    return `
      <a class="item" href="${href}">
        <div>
          <strong>${formatar(item.titulo)}</strong>
          <span>Visto em ${dataCurta(estado.vistos[item.id])}${r ? (r.acertou ? " · acertou" : " · errou") : ""}</span>
        </div>
        ${ICONE.direita}
      </a>`;
  };

  tela.innerHTML = `
    <header class="cabecalho-pagina">
      <p class="chapeu">Arquivo</p>
      <h1>Tudo o que você já viu</h1>
    </header>

    <div class="numeros">
      <div class="numero grande"><b>${seq}</b><span>${seq === 1 ? "dia seguido" : "dias seguidos"} abrindo o app</span></div>
      <div class="numero"><b>${maiorSequencia()}</b><span>maior sequência</span></div>
      <div class="numero"><b>${new Set(estado.visitas).size}</b><span>dias de leitura</span></div>
      <div class="numero"><b>${total}</b><span>conteúdos vistos</span></div>
      <div class="numero"><b>${acertos}<small style="font-size:.5em"> / ${respostas.length}</small></b><span>perguntas certas</span></div>
    </div>

    ${total === 0 ? `<p class="vazio">O que você ler vai aparecer aqui, para reler quando quiser.</p>` : ""}
    ${novidadesVistas.length ? `<section class="grupo"><h2>Novidades</h2>${novidadesVistas.map(n => linha(n, `#novidade/${encodeURIComponent(n.id)}`)).join("")}</section>` : ""}
    ${fatosVistos.length ? `<section class="grupo"><h2>Fatos curiosos</h2>${fatosVistos.map(f => linha(f, `#fato/${encodeURIComponent(f.id)}`)).join("")}</section>` : ""}

    <section class="secao">
      <h2>Instalar</h2>
      ${htmlInstalar()}
    </section>

    <section class="secao">
      <h2>Sobre</h2>
      <p>As novidades são atualizadas toda semana, sempre com link para a fonte original. Os resumos são didáticos e não substituem a leitura da fonte nem orientação clínica.</p>
    </section>

    <section class="secao">
      <h2>Seus dados</h2>
      <p>Seu progresso fica guardado só neste aparelho, sem conta.</p>
      <button class="botao" type="button" data-apagar>Apagar meu progresso</button>
    </section>`;

  const instalar = tela.querySelector("[data-instalar]");
  if (instalar) instalar.addEventListener("click", async () => {
    pedidoDeInstalacao.prompt();
    await pedidoDeInstalacao.userChoice;
    pedidoDeInstalacao = null;
    rotear();
  });

  tela.querySelector("[data-apagar]").addEventListener("click", () => {
    if (!confirm("Apagar os dias seguidos, as respostas e o arquivo? Isso não pode ser desfeito.")) return;
    estado = estadoVazio();
    registrarVisita();
    rotear();
  });
}

/* ---------- Navegação entre as telas ---------- */

const tela = document.getElementById("tela");

function rotear() {
  const [rota, arg] = (location.hash.slice(1) || "hoje").split("/");
  const aba = { novidade: "novidades", fato: "arquivo" }[rota] || rota;

  document.querySelectorAll(".barra a").forEach(a => {
    if (a.dataset.aba === aba) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  if (rota === "novidades") telaNovidades(tela, arg);
  else if (rota === "novidade") telaLerNovidade(tela, arg);
  else if (rota === "fato") telaLerFato(tela, arg);
  else if (rota === "revisao") telaRevisao(tela);
  else if (rota === "arquivo") telaArquivo(tela);
  else telaHoje(tela);

  // Reinicia a animação suave de entrada e volta para o topo.
  tela.style.animation = "none";
  void tela.offsetHeight;
  tela.style.animation = "";
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", rotear);

// Ao voltar para o app: se virou o dia ou se chegaram novidades, atualiza a tela.
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") return;
  const antes = ULTIMA_ATUALIZACAO;
  try { await carregarDados(); } catch (e) { /* sem internet: segue com o que tem */ }
  if (chaveData(hoje()) !== diaAberto || ULTIMA_ATUALIZACAO !== antes) {
    registrarVisita();
    rotear();
  }
});

(async () => {
  try {
    await carregarDados();
  } catch (e) {
    tela.innerHTML = `<p class="vazio">Não foi possível carregar os conteúdos. Se estiver testando no computador, abra pelo arquivo <b>TESTAR NO COMPUTADOR.bat</b>. Se o problema continuar, confira se os arquivos da pasta dados/ estão corretos.</p>`;
    console.error(e);
    return;
  }
  registrarVisita();
  rotear();
})();

/* ---------- Funcionar sem internet ---------- */

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
