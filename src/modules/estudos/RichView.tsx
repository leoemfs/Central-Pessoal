import type { ReactNode } from 'react';
import type { RichNode } from '../../types';

/**
 * Mostra um documento do editor (texto rico) sem editar: usado na exportação (M37).
 * `shift` desce os títulos do texto (o título 1 do editor vira h4…), para não brigar com a hierarquia do documento.
 */
export function RichView({ doc, shift = 3 }: { doc: RichNode; shift?: number }) {
  return <>{(doc.content ?? []).map((n, i) => node(n, i, shift))}</>;
}

const safeUrl = (u: unknown) => (typeof u === 'string' && /^(https?:|mailto:)/i.test(u) ? u : undefined);
const safeColor = (c: unknown) => (typeof c === 'string' && /^(#[0-9a-f]{3,8}|rgb\([\d\s,./%]+\)|[a-z]+)$/i.test(c) ? c : undefined);

function text(n: RichNode, key: number): ReactNode {
  let out: ReactNode = n.text ?? '';
  for (const m of n.marks ?? []) {
    if (m.type === 'bold') out = <strong>{out}</strong>;
    else if (m.type === 'italic') out = <em>{out}</em>;
    else if (m.type === 'underline') out = <u>{out}</u>;
    else if (m.type === 'strike') out = <s>{out}</s>;
    else if (m.type === 'code') out = <code>{out}</code>;
    else if (m.type === 'highlight') out = <mark>{out}</mark>;
    else if (m.type === 'textStyle' && safeColor(m.attrs?.color)) out = <span style={{ color: safeColor(m.attrs?.color) }}>{out}</span>;
    else if (m.type === 'link' && safeUrl(m.attrs?.href))
      out = (
        <a href={safeUrl(m.attrs?.href)} target="_blank" rel="noopener noreferrer">
          {out}
        </a>
      );
  }
  return <span key={key}>{out}</span>;
}

function kids(n: RichNode, shift: number): ReactNode[] {
  return (n.content ?? []).map((c, i) => node(c, i, shift));
}

function node(n: RichNode, key: number, shift: number): ReactNode {
  switch (n.type) {
    case 'text':
      return text(n, key);
    case 'hardBreak':
      return <br key={key} />;
    case 'paragraph':
      return <p key={key}>{n.content?.length ? kids(n, shift) : ' '}</p>;
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(n.attrs?.level) || 1) + shift);
      const H = `h${level}` as 'h4';
      return <H key={key}>{kids(n, shift)}</H>;
    }
    case 'bulletList':
      return <ul key={key}>{kids(n, shift)}</ul>;
    case 'orderedList':
      return (
        <ol key={key} start={Number(n.attrs?.start) || 1}>
          {kids(n, shift)}
        </ol>
      );
    case 'listItem':
      return <li key={key}>{kids(n, shift)}</li>;
    case 'taskList':
      return (
        <ul key={key} className="pr-tasks">
          {kids(n, shift)}
        </ul>
      );
    case 'taskItem':
      return (
        <li key={key} className={n.attrs?.checked ? 'done' : undefined}>
          <span className="pr-box" aria-hidden="true">
            {n.attrs?.checked ? '☑' : '☐'}
          </span>
          <div>{kids(n, shift)}</div>
        </li>
      );
    case 'blockquote':
      return <blockquote key={key}>{kids(n, shift)}</blockquote>;
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{(n.content ?? []).map((c) => c.text ?? '').join('')}</code>
        </pre>
      );
    case 'horizontalRule':
      return <hr key={key} />;
    case 'image':
      return typeof n.attrs?.src === 'string' && /^(data:image\/|https?:)/.test(n.attrs.src) ? <img key={key} src={n.attrs.src} alt={typeof n.attrs?.alt === 'string' ? n.attrs.alt : ''} /> : null;
    // Alternante: no papel fica sempre aberto (título em destaque e o conteúdo logo abaixo).
    case 'details':
      return (
        <div key={key} className="pr-details">
          {kids(n, shift)}
        </div>
      );
    case 'detailsSummary':
      return (
        <p key={key} className="pr-summary">
          ▸ {kids(n, shift)}
        </p>
      );
    case 'detailsContent':
      return <div key={key}>{kids(n, shift)}</div>;
    default:
      return n.content ? <div key={key}>{kids(n, shift)}</div> : null;
  }
}
