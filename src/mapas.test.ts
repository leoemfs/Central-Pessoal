import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addChild, addSibling, countNodes, depthOf, findNode, fromBranches, layoutMap, MAX_DEPTH, moveSibling, normalizeMapNode, normalizeMapRoot, parentOf, removeNode, reparent, updateNode, validParents } from './mapas.ts';
import { normalizeStudy } from './estudos.ts';
import type { MapNode } from './types.ts';

const base = () => fromBranches('to be', [{ label: 'Afirmativa', leaves: ['I am', 'You are'] }, { label: 'Negativa', leaves: ["isn't"] }, { label: 'Pergunta', leaves: [] }]);
const texts = (n: MapNode): unknown => (n.children.length ? [n.text, n.children.map(texts)] : n.text);

test('criar ramos e sub-ramos, editar e excluir', () => {
  let root = base();
  assert.equal(countNodes(root), 7);
  const afirm = root.children[0];
  const a = addChild(root, afirm.children[0].id, 'I am happy');
  root = a.root;
  assert.equal(depthOf(root, a.id!), 3);
  assert.equal(parentOf(root, a.id!)!.text, 'I am');
  // Ao lado: entra logo abaixo da ideia escolhida.
  const s = addSibling(root, afirm.children[0].id, 'He is');
  root = s.root;
  assert.deepEqual(root.children[0].children.map((c) => c.text), ['I am', 'He is', 'You are']);
  // Na ideia central, "ao lado" vira um ramo novo.
  assert.equal(addSibling(root, root.id, 'Usos').root.children.at(-1)!.text, 'Usos');
  root = updateNode(root, s.id!, { text: 'She is', color: '#ef4444' });
  assert.equal(findNode(root, s.id!)!.text, 'She is');
  // Excluir leva o que está dentro; a ideia central não sai.
  root = removeNode(root, afirm.children[0].id);
  assert.equal(findNode(root, a.id!), undefined);
  assert.equal(removeNode(root, root.id), root);
  // Quem não mudou continua o mesmo objeto (o desenho não refaz o que não precisa).
  const before = root.children[2];
  assert.equal(updateNode(root, root.children[0].id, { text: 'x' }).children[2], before);
});

test('reorganizar: subir, descer e mudar de ramo', () => {
  let root = base();
  const [afirm, neg, perg] = root.children;
  root = moveSibling(root, perg.id, -1);
  assert.deepEqual(root.children.map((c) => c.text), ['Afirmativa', 'Pergunta', 'Negativa']);
  assert.equal(moveSibling(root, afirm.id, -1), root);
  // Não pode ir para dentro de si mesma, nem de um descendente, nem para onde já está.
  const alvos = validParents(root, afirm.id).map((p) => p.text);
  assert.deepEqual(alvos, ['Pergunta', 'Negativa', "isn't"]);
  assert.equal(reparent(root, afirm.id, afirm.children[0].id), root);
  assert.equal(reparent(root, afirm.id, root.id), root);
  root = reparent(updateNode(root, neg.id, { collapsed: true }), afirm.id, neg.id);
  assert.deepEqual(texts(root), ['to be', ['Pergunta', ['Negativa', ["isn't", ['Afirmativa', ['I am', 'You are']]]]]]);
  assert.equal(findNode(root, neg.id)!.collapsed, false);
  assert.deepEqual(validParents(root, root.id), []);
});

test('profundidade tem limite', () => {
  let root = base();
  let id = root.children[2].id;
  for (let d = 1; d < MAX_DEPTH; d++) {
    const r = addChild(root, id, `nível ${d + 1}`);
    root = r.root;
    id = r.id!;
  }
  assert.equal(depthOf(root, id), MAX_DEPTH);
  assert.equal(addChild(root, id).id, null);
  // Um ramo com filhos não pode ir para um lugar onde o fundo dele passaria do limite.
  assert.ok(!validParents(root, root.children[0].id).some((p) => p.depth >= MAX_DEPTH - 1));
});

test('desenho: nada se sobrepõe, dois lados, recolher esconde', () => {
  let root = base();
  for (let i = 0; i < 6; i++) root = addChild(root, root.children[i % 3].id, `Ideia com um texto bem comprido número ${i}`).root;
  root = addChild(root, root.children[0].children[0].id, 'neto').root;
  const lay = layoutMap(root);
  assert.equal(lay.nodes.length, countNodes(root));
  for (let i = 0; i < lay.nodes.length; i++)
    for (let j = i + 1; j < lay.nodes.length; j++) {
      const a = lay.nodes[i];
      const b = lay.nodes[j];
      const apart = Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2;
      assert.ok(apart, `${a.label} × ${b.label}`);
    }
  const byText = (t: string) => lay.nodes.find((n) => n.text === t)!;
  assert.equal(byText('to be').side, 0);
  assert.equal(byText('Afirmativa').side, 1);
  assert.equal(byText('Pergunta').side, -1);
  assert.ok(byText('Pergunta').x < 0 && byText('Afirmativa').x > 0);
  // Sub-ramos ficam do mesmo lado e mais longe do centro; herdam a cor do ramo.
  assert.ok(byText('I am').x > byText('Afirmativa').x);
  assert.equal(byText('neto').color, byText('Afirmativa').color);
  assert.notEqual(byText('Negativa').color, byText('Afirmativa').color);
  assert.ok(byText(root.children[0].children[2].text).label.endsWith('…'));
  assert.ok(lay.minX < 0 && lay.maxX > 0 && lay.minY < 0 && lay.maxY > 0);
  // Recolhido: os de dentro somem do desenho e o ramo diz quantos guarda.
  const closed = layoutMap(updateNode(root, root.children[0].id, { collapsed: true }));
  const afirm = closed.nodes.find((n) => n.text === 'Afirmativa')!;
  assert.equal(afirm.hidden, countNodes(root.children[0]) - 1);
  assert.equal(closed.nodes.some((n) => n.text === 'I am'), false);
  assert.ok(closed.maxY - closed.minY <= lay.maxY - lay.minY);
});

test('mapas antigos e backups: centro e ramos viram árvore; lixo é corrigido', () => {
  const old = normalizeStudy({ maps: [{ id: 'm', name: 'Verbo to be', center: 'to be', notebookId: 'n', branches: [{ id: 'b', label: 'Usos', leaves: ['Idade', 'Lugar', 3] }] }] }).maps[0];
  assert.deepEqual(texts(old.root), ['to be', [['Usos', ['Idade', 'Lugar']]]]);
  assert.equal(old.notebookId, 'n');
  assert.equal(old.pageId, null);
  const novo = normalizeStudy({ maps: [{ id: 'm', name: 'X', pageId: 'p', root: { id: 'r', text: 'Centro', children: [{ id: 'a', text: 'A', color: '#22c55e', collapsed: true, children: [{ text: 'B' }] }, 'lixo', { id: 'c', collapsed: true }] } }] }).maps[0];
  assert.deepEqual(texts(novo.root), ['Centro', [['A', ['B']], 'Ideia']]);
  assert.equal(novo.root.children[0].color, '#22c55e');
  assert.equal(novo.root.children[0].collapsed, true);
  assert.equal(novo.root.children[1].collapsed, false);
  assert.ok(novo.root.children[0].children[0].id);
  assert.equal(novo.pageId, 'p');
  assert.equal(normalizeMapNode({ color: 'red' }).color, null);
  assert.equal(normalizeMapRoot({ name: 'Sem centro' }).text, 'Sem centro');
});
