import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { Details, DetailsContent, DetailsSummary } from '@tiptap/extension-details';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import type { RichNode } from '../../types';
import { Field, Icon, notify, Sheet, type IconName } from '../../ui';

/**
 * Editor de texto rico das páginas dos notebooks (N11.2).
 * - O conteúdo é sempre o mesmo documento (JSON), no computador e no celular.
 * - No celular a barra mostra o essencial; "Mais" abre o resto. No computador (900px+) tudo aparece.
 * - Salva sozinho, pouco depois de parar de digitar.
 */

const COLORS: { name: string; value: string | null }[] = [
  { name: 'Padrão', value: null },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#a855f7' },
];

type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'task' | 'quote';
const TYPES: { value: BlockType; label: string }[] = [
  { value: 'p', label: 'Texto' },
  { value: 'h1', label: 'Título 1' },
  { value: 'h2', label: 'Título 2' },
  { value: 'h3', label: 'Título 3' },
  { value: 'ul', label: 'Lista' },
  { value: 'ol', label: 'Lista numerada' },
  { value: 'task', label: 'Checklist' },
  { value: 'quote', label: 'Citação' },
];

function currentType(e: Editor): BlockType {
  if (e.isActive('heading', { level: 1 })) return 'h1';
  if (e.isActive('heading', { level: 2 })) return 'h2';
  if (e.isActive('heading', { level: 3 })) return 'h3';
  if (e.isActive('taskList')) return 'task';
  if (e.isActive('bulletList')) return 'ul';
  if (e.isActive('orderedList')) return 'ol';
  if (e.isActive('blockquote')) return 'quote';
  return 'p';
}

/** Transforma o bloco onde está o cursor em outro tipo (sem apagar o texto). */
function setType(e: Editor, t: BlockType) {
  const cur = currentType(e);
  if (cur === t) return;
  let c = e.chain().focus();
  // Sai da lista ou citação atual antes de virar outra coisa.
  if (cur === 'ul') c = c.toggleBulletList();
  else if (cur === 'ol') c = c.toggleOrderedList();
  else if (cur === 'task') c = c.toggleTaskList();
  else if (cur === 'quote') c = c.toggleBlockquote();
  if (t === 'p') c = c.setParagraph();
  else if (t === 'h1' || t === 'h2' || t === 'h3') c = c.setHeading({ level: Number(t[1]) as 1 | 2 | 3 });
  else if (t === 'ul') c = c.setParagraph().toggleBulletList();
  else if (t === 'ol') c = c.setParagraph().toggleOrderedList();
  else if (t === 'task') c = c.setParagraph().toggleTaskList();
  else if (t === 'quote') c = c.toggleBlockquote();
  c.run();
}

/** Sobe ou desce o bloco inteiro onde está o cursor (parágrafo, lista, alternante, imagem…). */
function moveBlock(e: Editor, dir: -1 | 1) {
  const { state, view } = e;
  const { $from } = state.selection;
  const index = $from.index(0);
  const target = index + dir;
  if (target < 0 || target >= state.doc.childCount) return;
  const node = state.doc.child(index);
  const other = state.doc.child(target);
  const start = $from.depth === 0 ? $from.pos : $from.before(1);
  const to = dir < 0 ? start - other.nodeSize : start + other.nodeSize;
  const tr = state.tr.delete(start, start + node.nodeSize).insert(to, node);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(to + 1, tr.doc.content.size))));
  view.dispatch(tr.scrollIntoView());
  view.focus();
}

/**
 * Transforma o bloco atual em alternante: o texto do bloco vira o título e o cursor vai para dentro,
 * já aberto. (Em listas e outros blocos compostos, envolve o bloco inteiro.)
 */
function makeToggle(e: Editor) {
  const { $from } = e.state.selection;
  const node = $from.depth === 1 ? $from.parent : null;
  if (!node || !node.isTextblock || node.type.name === 'codeBlock') {
    e.chain().focus().setDetails().updateAttributes('details', { open: true }).run();
    return;
  }
  const start = $from.before(1);
  const summary = node.content.toJSON() as RichNode[] | null;
  e.chain()
    .focus()
    .insertContentAt(
      { from: start, to: start + node.nodeSize },
      { type: 'details', attrs: { open: true }, content: [{ type: 'detailsSummary', ...(summary ? { content: summary } : {}) }, { type: 'detailsContent', content: [{ type: 'paragraph' }] }] },
    )
    .setTextSelection(start + 2 + node.content.size + 3)
    .run();
}

/** Reduz a foto (lado maior até 1280px, JPEG) para não pesar no aparelho nem no backup. */
function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('imagem'));
    };
    img.src = url;
  });
}

function Btn({ icon, label, on, onClick, disabled, children, className = '' }: { icon?: IconName; label: string; on?: boolean; onClick: () => void; disabled?: boolean; children?: ReactNode; className?: string }) {
  return (
    // onMouseDown: não tira o cursor do texto ao tocar no botão.
    <button type="button" className={`ed-btn${on ? ' on' : ''} ${className}`} aria-label={label} title={label} aria-pressed={on} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {icon ? <Icon name={icon} size={18} /> : children}
    </button>
  );
}

export default function RichEditor({ doc, onChange, placeholder = 'Escreva aqui o que aprendeu…' }: { doc: RichNode; onChange: (doc: RichNode) => void; placeholder?: string }) {
  const [more, setMore] = useState(false);
  const [colors, setColors] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(onChange);
  latest.current = onChange;
  const pending = useRef<Editor | null>(null);
  const flush = () => {
    window.clearTimeout(timer.current);
    if (pending.current) latest.current(pending.current.getJSON() as RichNode);
    pending.current = null;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } } }),
      Highlight,
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Details.configure({ persist: true, HTMLAttributes: { class: 'ed-details' } }),
      DetailsSummary,
      DetailsContent,
      Placeholder.configure({ placeholder: ({ node }) => (node.type.name === 'detailsSummary' ? 'Título do alternante' : node.type.name === 'heading' ? 'Título' : placeholder), includeChildren: true }),
    ],
    content: doc,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: 'ed-content', 'aria-label': 'Conteúdo da página', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: e }) => {
      pending.current = e;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 500);
    },
    onBlur: flush,
  });

  // Ao sair da página (ou fechar o app), salva o que ainda estava esperando.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      flush();
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;
  const e = editor;
  const inDetails = e.isActive('details');
  const index = e.state.selection.$from.index(0);

  async function addImage(f: File | undefined) {
    if (!f) return;
    try {
      const src = await shrinkImage(f);
      if (src.length > 900_000) notify('Imagem grande', 'Ela foi guardada, mas muitas imagens grandes deixam o backup pesado.');
      e.chain().focus().setImage({ src, alt: f.name }).run();
    } catch {
      notify('Não foi possível usar esta imagem');
    }
  }

  return (
    <div className={`ed${more ? ' more' : ''}`}>
      {/* Barra e cores juntas num bloco preso no topo: as cores acompanham a barra ao rolar. */}
      <div className="ed-bar">
      <div className="ed-toolbar" role="toolbar" aria-label="Formatação">
        <select className="ed-type" aria-label="Tipo do bloco" value={currentType(e)} onChange={(ev) => setType(e, ev.target.value as BlockType)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Btn label="Negrito" on={e.isActive('bold')} onClick={() => e.chain().focus().toggleBold().run()}>
          <b>N</b>
        </Btn>
        <Btn label="Itálico" on={e.isActive('italic')} onClick={() => e.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn label="Destaque" on={e.isActive('highlight')} onClick={() => e.chain().focus().toggleHighlight().run()}>
          <span className="ed-hl">A</span>
        </Btn>
        <Btn icon="list" label="Lista" on={e.isActive('bulletList')} onClick={() => setType(e, e.isActive('bulletList') ? 'p' : 'ul')} />
        <Btn icon="tasks" label="Checklist" on={e.isActive('taskList')} onClick={() => setType(e, e.isActive('taskList') ? 'p' : 'task')} />
        <Btn icon="up" label="Subir o bloco" disabled={index === 0} onClick={() => moveBlock(e, -1)} />
        <Btn icon="down" label="Descer o bloco" disabled={index >= e.state.doc.childCount - 1} onClick={() => moveBlock(e, 1)} />

        {/* Ferramentas completas: sempre no computador; no celular, atrás do "Mais". */}
        <span className="ed-extra">
          <Btn label="Sublinhado" on={e.isActive('underline')} onClick={() => e.chain().focus().toggleUnderline().run()}>
            <u>S</u>
          </Btn>
          <Btn label="Lista numerada" on={e.isActive('orderedList')} onClick={() => setType(e, e.isActive('orderedList') ? 'p' : 'ol')}>
            <span className="ed-txt">1.</span>
          </Btn>
          <Btn label="Citação" on={e.isActive('blockquote')} onClick={() => setType(e, e.isActive('blockquote') ? 'p' : 'quote')}>
            <span className="ed-txt">“”</span>
          </Btn>
          <Btn label={inDetails ? 'Desfazer o alternante' : 'Alternante (recolher e expandir)'} on={inDetails} onClick={() => (inDetails ? e.chain().focus().unsetDetails().run() : makeToggle(e))}>
            <span className="ed-txt">▸</span>
          </Btn>
          <Btn label="Divisor" onClick={() => e.chain().focus().setHorizontalRule().run()}>
            <span className="ed-txt">—</span>
          </Btn>
          <Btn icon="link" label="Link" on={e.isActive('link')} onClick={() => setLink((e.getAttributes('link').href as string | undefined) ?? '')} />
          <Btn icon="palette" label="Cor do texto" on={colors} onClick={() => setColors((v) => !v)} />
          <Btn icon="image" label="Imagem" onClick={() => file.current?.click()} />
          <Btn icon="undo" label="Desfazer" disabled={!e.can().undo()} onClick={() => e.chain().focus().undo().run()} />
        </span>
        <Btn label={more ? 'Menos ferramentas' : 'Mais ferramentas'} className="ed-more" on={more} onClick={() => setMore((v) => !v)}>
          <span className="ed-txt">{more ? 'Menos' : 'Mais'}</span>
        </Btn>
      </div>
      {colors && (
        <div className="ed-colors" role="group" aria-label="Cor do texto">
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              className="ed-swatch"
              aria-label={c.name}
              title={c.name}
              style={c.value ? { background: c.value } : undefined}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                if (c.value) e.chain().focus().setColor(c.value).run();
                else e.chain().focus().unsetColor().run();
                setColors(false);
              }}
            >
              {!c.value && 'A'}
            </button>
          ))}
        </div>
      )}
      </div>
      <EditorContent editor={e} />
      <input ref={file} type="file" accept="image/*" hidden onChange={(ev) => (addImage(ev.target.files?.[0]), (ev.target.value = ''))} />
      {link !== null && (
        <LinkSheet
          href={link}
          onClose={() => setLink(null)}
          onSave={(href) => {
            if (!href) e.chain().focus().extendMarkRange('link').unsetLink().run();
            else if (e.state.selection.empty && !e.isActive('link')) e.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
            else e.chain().focus().extendMarkRange('link').setLink({ href }).run();
          }}
        />
      )}
    </div>
  );
}

function LinkSheet({ href, onClose, onSave }: { href: string; onClose: () => void; onSave: (href: string) => void }) {
  const [url, setUrl] = useState(href);
  const done = (v: string) => {
    let link = v.trim();
    if (link && !/^(https?:|mailto:)/i.test(link)) link = `https://${link}`;
    onSave(link);
    onClose();
  };
  return (
    <Sheet
      title="Link"
      onClose={onClose}
      footer={
        <div className="btn-row">
          {href && (
            <button type="button" className="btn danger" onClick={() => done('')}>
              Tirar o link
            </button>
          )}
          <button type="button" className="btn primary" onClick={() => done(url)}>
            Salvar
          </button>
        </div>
      }
    >
      <Field label="Endereço" hint="Selecione um texto antes para transformá-lo em link. Sem seleção, o próprio endereço entra no texto.">
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" autoFocus />
      </Field>
    </Sheet>
  );
}
