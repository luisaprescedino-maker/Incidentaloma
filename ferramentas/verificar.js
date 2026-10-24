/* =========================================================
   VERIFICADOR DOS DADOS DO INCIDENTALOMA

   Confere se dados/novidades.json e dados/fatos.json estão no formato
   certo, para o app não quebrar depois de uma atualização.

   Como usar:
   - Com Node.js:   node ferramentas/verificar.js
                    node ferramentas/verificar.js --links   (também testa se os links abrem)
   - Sem Node.js:   abra ferramentas/verificar.html pelo TESTAR NO COMPUTADOR.bat
                    (endereço http://localhost:8081/ferramentas/verificar.html)
   ========================================================= */
"use strict";

// Áreas aceitas no filtro do app. Para criar uma área nova, acrescente aqui.
const AREAS = [
  "Cardiologia", "Cirurgia", "Dermatologia", "Endocrinologia", "Gastroenterologia",
  "Geriatria", "Ginecologia e Obstetrícia", "Hematologia", "Infectologia",
  "Medicina de Emergência", "Medicina Intensiva", "Nefrologia", "Neurologia",
  "Oftalmologia", "Oncologia", "Ortopedia", "Otorrinolaringologia", "Pediatria",
  "Pneumologia", "Psiquiatria", "Reumatologia", "Saúde Pública", "Urologia",
];

const TIPOS = ["Diretriz", "Artigo", "Medicamento"];

const CATEGORIAS_FATOS = ["História da medicina", "Epônimos", "Casos inusitados", "Curiosidades de fisiologia"];

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(s) {
  if (!DATA.test(s || "")) return false;
  const [a, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const palavras = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;

function verificarPergunta(p, onde, erros) {
  if (!p || typeof p !== "object") { erros.push(`${onde}: falta "pergunta"`); return; }
  if (!p.enunciado) erros.push(`${onde}: pergunta sem "enunciado"`);
  if (!Array.isArray(p.opcoes) || p.opcoes.length !== 4 || p.opcoes.some(o => !String(o || "").trim())) {
    erros.push(`${onde}: a pergunta precisa de exatamente 4 "opcoes" preenchidas`);
  } else if (new Set(p.opcoes).size !== 4) {
    erros.push(`${onde}: há opções repetidas na pergunta`);
  }
  if (![1, 2, 3, 4].includes(p.correta)) erros.push(`${onde}: "correta" deve ser um número de 1 a 4`);
  if (!p.explicacao) erros.push(`${onde}: pergunta sem "explicacao"`);
}

// Recebe os dois arquivos já lidos (como objetos) e devolve { erros, avisos }.
function verificarDados(novidadesArq, fatosArq, hojeChave) {
  const erros = [];
  const avisos = [];
  const hoje = hojeChave || new Date().toISOString().slice(0, 10);

  /* ----- novidades.json ----- */
  if (!novidadesArq || typeof novidadesArq !== "object") {
    erros.push("novidades.json: o arquivo não é um objeto JSON");
  } else {
    const ultima = novidadesArq.ultimaAtualizacao;
    if (!dataValida(ultima)) erros.push(`novidades.json: "ultimaAtualizacao" deve ser uma data AAAA-MM-DD (está "${ultima}")`);
    else if (ultima > hoje) erros.push(`novidades.json: "ultimaAtualizacao" (${ultima}) está no futuro`);

    const lista = novidadesArq.novidades;
    if (!Array.isArray(lista)) {
      erros.push('novidades.json: falta a lista "novidades"');
    } else {
      const ids = new Set(), urls = new Set(), titulos = new Set();
      lista.forEach((n, i) => {
        const onde = `novidade nº ${i + 1} (${n && n.id ? n.id : "sem id"})`;
        if (!n || typeof n !== "object") { erros.push(`${onde}: não é um objeto`); return; }
        for (const campo of ["id", "titulo", "tipo", "area", "dataPublicacao", "adicionadoEm", "resumo", "naPratica"]) {
          if (!String(n[campo] || "").trim()) erros.push(`${onde}: falta "${campo}"`);
        }
        if (n.id && !/^[a-z0-9-]+$/.test(n.id)) erros.push(`${onde}: o "id" só pode ter letras minúsculas sem acento, números e hífens`);
        if (n.id && ids.has(n.id)) erros.push(`${onde}: "id" repetido`);
        ids.add(n.id);
        if (n.tipo && !TIPOS.includes(n.tipo)) erros.push(`${onde}: "tipo" deve ser um destes: ${TIPOS.join(", ")}`);
        if (n.area && !AREAS.includes(n.area)) erros.push(`${onde}: área "${n.area}" não está na lista AREAS de ferramentas/verificar.js`);
        if (n.dataPublicacao && !dataValida(n.dataPublicacao)) erros.push(`${onde}: "dataPublicacao" inválida (use AAAA-MM-DD)`);
        else if (n.dataPublicacao > hoje) erros.push(`${onde}: "dataPublicacao" está no futuro`);
        if (n.adicionadoEm && !dataValida(n.adicionadoEm)) erros.push(`${onde}: "adicionadoEm" inválida (use AAAA-MM-DD)`);
        else if (dataValida(ultima) && n.adicionadoEm > ultima) erros.push(`${onde}: "adicionadoEm" é depois de "ultimaAtualizacao"`);
        if (dataValida(n.dataPublicacao) && dataValida(n.adicionadoEm) && n.dataPublicacao > n.adicionadoEm) {
          erros.push(`${onde}: "dataPublicacao" é depois de "adicionadoEm"`);
        }
        if (!n.fonte || !n.fonte.nome || !n.fonte.url) erros.push(`${onde}: falta "fonte" com "nome" e "url"`);
        else {
          if (!/^https:\/\/[^\s]+$/.test(n.fonte.url)) erros.push(`${onde}: o link da fonte deve começar com https:// e não ter espaços`);
          if (urls.has(n.fonte.url)) erros.push(`${onde}: link da fonte repetido (a novidade já existe?)`);
          urls.add(n.fonte.url);
        }
        const t = String(n.titulo || "").trim().toLowerCase();
        if (t && titulos.has(t)) erros.push(`${onde}: título repetido`);
        titulos.add(t);
        const pr = palavras(n.resumo);
        if (n.resumo && (pr < 140 || pr > 280)) avisos.push(`${onde}: o resumo tem ${pr} palavras (o ideal é perto de 200)`);
        verificarPergunta(n.pergunta, onde, erros);
      });
      if (dataValida(ultima) && lista.length && !lista.some(n => n.adicionadoEm === ultima)) {
        avisos.push('novidades.json: nenhuma novidade tem "adicionadoEm" igual a "ultimaAtualizacao", então nenhuma vai ganhar o selo "nova"');
      }
    }
  }

  /* ----- fatos.json ----- */
  if (!fatosArq || !Array.isArray(fatosArq.fatos)) {
    erros.push('fatos.json: falta a lista "fatos"');
  } else {
    const ids = new Set();
    fatosArq.fatos.forEach((f, i) => {
      const onde = `fato nº ${i + 1} (${f && f.id ? f.id : "sem id"})`;
      for (const campo of ["id", "categoria", "titulo", "texto"]) {
        if (!String((f || {})[campo] || "").trim()) erros.push(`${onde}: falta "${campo}"`);
      }
      if (f.id && ids.has(f.id)) erros.push(`${onde}: "id" repetido`);
      ids.add(f.id);
      if (f.categoria && !CATEGORIAS_FATOS.includes(f.categoria)) erros.push(`${onde}: categoria desconhecida "${f.categoria}"`);
      verificarPergunta(f.pergunta, onde, erros);
    });
  }

  return { erros, avisos };
}

/* ---------- Quando roda pelo Node.js ---------- */

if (typeof module !== "undefined" && require.main === module) {
  const fs = require("fs");
  const path = require("path");
  const raiz = path.join(__dirname, "..");
  const ler = nome => {
    try { return JSON.parse(fs.readFileSync(path.join(raiz, "dados", nome), "utf8")); }
    catch (e) { console.error(`ERRO: dados/${nome} não é um JSON válido: ${e.message}`); process.exit(1); }
  };
  const novidades = ler("novidades.json");
  const fatos = ler("fatos.json");
  const { erros, avisos } = verificarDados(novidades, fatos);

  (async () => {
    if (process.argv.includes("--links")) {
      for (const n of novidades.novidades || []) {
        try {
          const r = await fetch(n.fonte.url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (verificador Incidentaloma)" } });
          if (r.status >= 400) avisos.push(`link de "${n.id}" respondeu ${r.status}: ${n.fonte.url} (confira manualmente; alguns sites bloqueiam robôs)`);
        } catch (e) {
          avisos.push(`link de "${n.id}" não abriu: ${n.fonte.url} (${e.message})`);
        }
      }
    }
    avisos.forEach(a => console.log("AVISO: " + a));
    erros.forEach(e => console.log("ERRO:  " + e));
    const total = (novidades.novidades || []).length;
    console.log(erros.length
      ? `\n${erros.length} erro(s). Corrija antes de publicar.`
      : `\nTudo certo: ${total} novidades e ${(fatos.fatos || []).length} fatos válidos.`);
    process.exit(erros.length ? 1 : 0);
  })();
}
