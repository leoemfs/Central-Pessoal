import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyStudy, library, normalizeStudy } from './estudos.ts';
import { applyPack, mdToDoc, parsePack, PACK_FORMAT, type StudyPack } from './studyPack.ts';
import { readFileSync } from 'node:fs';

const pack: StudyPack = {
  formato: PACK_FORMAT,
  versao: 1,
  id: 'teste',
  nome: 'Pacote de teste',
  area: { nome: 'Meu app' },
  temas: [{ nome: 'Base', trilhas: [{ nome: 'Fundamentos', descricao: 'Começo', topicos: [{ nome: 'PWA', pagina: '## O que é\nUm site que **instala**.\n- item `a`', fontes: ['https://web.dev/pwa'] }, { nome: 'React' }] }] }],
  fontes: [{ titulo: 'web.dev', url: 'https://web.dev/pwa', tipo: 'site' }],
  mapas: [{ nome: 'Arquitetura', raiz: { texto: 'App', filhos: [{ texto: 'Telas' }] } }],
  ciclos: [{ nome: 'Ciclo 1', trilha: 'Fundamentos' }],
};

test('pacote: confere o arquivo e explica o problema', () => {
  assert.match(parsePack('{x') as string, /não deu para ler/);
  assert.match(parsePack({ formato: 'outro' }) as string, /não é um pacote/);
  assert.equal(typeof parsePack(JSON.stringify(pack)), 'object');
});

test('pacote: cria área, trilha, notebook com páginas, fonte, mapa e ciclo', () => {
  const r = applyPack(emptyStudy(), pack, '2026-11-16T10:00:00.000Z');
  assert.deepEqual(r.added, { trilhas: 1, topicos: 2, paginas: 3, fontes: 1, mapas: 1, ciclos: 1 });
  const nb = r.study.notebooks.find((n) => n.id === r.notebookId)!;
  const pwa = nb.pages.find((p) => p.name === 'PWA')!;
  assert.equal(pwa.parentId, nb.pages[0].id);
  assert.equal(pwa.sourceIds.length, 1);
  assert.equal(r.study.cycles[0].topics.length, 2);
  // A trilha aparece na Biblioteca como trilha da pessoa.
  const lib = library(r.study);
  assert.ok(lib.track(r.study.tracks[0].id));
  // Passa pelo normalize (backup) sem perder nada.
  assert.deepEqual(normalizeStudy(JSON.parse(JSON.stringify(r.study))).notebooks[0].pages.length, 3);
});

test('pacote: importar de novo não duplica nem sobrescreve; parte nova só acrescenta', () => {
  const now = '2026-11-16T10:00:00.000Z';
  const a = applyPack(emptyStudy(), pack, now);
  // A pessoa edita a página e exclui o ciclo.
  const edited = { ...a.study, cycles: [], notebooks: a.study.notebooks.map((n) => ({ ...n, pages: n.pages.map((p) => (p.name === 'PWA' ? { ...p, name: 'PWA (minhas notas)' } : p)) })) };
  const again = applyPack(edited, pack, now);
  assert.deepEqual(again.added, { trilhas: 0, topicos: 0, paginas: 0, fontes: 0, mapas: 0, ciclos: 1 });
  assert.ok(again.study.notebooks[0].pages.some((p) => p.name === 'PWA (minhas notas)'));
  const part2: StudyPack = { ...pack, temas: [...pack.temas, { nome: 'APIs', trilhas: [{ nome: 'Google', topicos: [{ nome: 'OAuth' }] }] }], ciclos: [] };
  const b = applyPack(again.study, part2, now);
  assert.deepEqual(b.added, { trilhas: 1, topicos: 1, paginas: 2, fontes: 0, mapas: 0, ciclos: 0 });
  assert.equal(b.study.notebooks.length, 1);
});

test('pacote: markdown simples vira o documento do editor', () => {
  const d = mdToDoc('# Título\nlinha 1\nlinha 2\n\n- a\n- b\n1. um\n> dica\n```\ncode()\n```');
  assert.deepEqual(d.content!.map((n) => n.type), ['heading', 'paragraph', 'bulletList', 'orderedList', 'blockquote', 'codeBlock']);
  assert.equal(d.content![1].content![0].text, 'linha 1 linha 2');
});

test('pacote do Central Pessoal: o arquivo publicado é válido', () => {
  const raw = readFileSync(new URL('../public/estudos/central-pessoal.json', import.meta.url), 'utf8');
  const p = parsePack(raw);
  assert.equal(typeof p, 'object', String(p));
  const r = applyPack(emptyStudy(), p as StudyPack, '2026-11-16T10:00:00.000Z');
  assert.ok(r.added.topicos >= 8);
  assert.equal(r.added.ciclos, 1);
});

test('pacote: descrição da trilha sai sem marcas e a antiga (v0.63) é limpa ao importar de novo', () => {
  const now = '2026-11-16T10:00:00.000Z';
  const md: StudyPack = { ...pack, temas: [{ nome: 'Base', trilhas: [{ ...pack.temas[0].trilhas[0], descricao: '## Sobre\nO app **por dentro**.' }] }] };
  const a = applyPack(emptyStudy(), md, now);
  assert.equal(a.study.tracks[0].desc, 'O app por dentro.');
  const old = { ...a.study, tracks: a.study.tracks.map((t) => ({ ...t, desc: '## Sobre O app **por dentro**.' })) };
  assert.equal(applyPack(old, md, now).study.tracks[0].desc, 'O app por dentro.');
});

test('pacote Curso de Claude: o arquivo publicado é válido e entra na área de IA', () => {
  const raw = readFileSync(new URL('../public/estudos/curso-claude.json', import.meta.url), 'utf8');
  const p = parsePack(raw);
  assert.equal(typeof p, 'object', String(p));
  const r = applyPack(emptyStudy(), p as StudyPack, '2026-11-16T10:00:00.000Z');
  assert.ok(r.added.topicos >= 15);
  assert.equal(r.study.areas.length, 0, 'usa a área do catálogo');
  assert.equal(r.study.themes[0].areaId, 'ia');
});
