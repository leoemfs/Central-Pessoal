import { useRef, useState } from 'react';
import { go } from '../../router';
import { coursePrompt, fixRequest, LEVELS, listCourses, readCourse, SIZES, type CourseLevel, type CourseSize } from '../../curso';
import { applyPack, type PackResult, type StudyPack } from '../../studyPack';
import { Field, Icon, notify, PageHeader, Sheet } from '../../ui';
import { nowISO, Path, useStudy } from './shared';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Copia para a área de transferência; se o navegador não deixar, seleciona o texto para copiar à mão. */
async function copy(text: string, fallback?: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallback) {
      fallback.focus();
      fallback.select();
    }
    return false;
  }
}

/** Cartão "Deseja importar um curso?" (Estudos e Biblioteca). */
export function CourseCta() {
  return (
    <section className="card st-course-cta">
      <div className="st-course-cta-text">
        <span className="tile-icon st-green">
          <Icon name="download" />
        </span>
        <div>
          <h2>Deseja importar um curso?</h2>
          <p className="muted small">Peça para uma IA montar o curso com o nosso prompt e importe o arquivo: trilhas, notebook, links e mapas de uma vez.</p>
        </div>
      </div>
      <div className="btn-row">
        <a className="btn primary small" href="#/estudos/importar-curso">
          Importar curso
        </a>
      </div>
    </section>
  );
}

/** #/estudos/importar-curso: 1) copiar o prompt, 2) trazer o arquivo da IA, 3) conferir e importar. */
export function ImportCoursePage() {
  const { study, set } = useStudy();
  const [tema, setTema] = useState('');
  const [nivel, setNivel] = useState<CourseLevel>('iniciante');
  const [tamanho, setTamanho] = useState<CourseSize>('medio');
  const [showPrompt, setShowPrompt] = useState(false);
  const [pasted, setPasted] = useState('');
  const [paste, setPaste] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState<PackResult | null>(null);
  const prompt = coursePrompt(tema, nivel, tamanho);
  const promptBox = useRef<HTMLTextAreaElement>(null);

  const read = (text: string, name = '') => {
    setFileName(name);
    const r = readCourse(text);
    if (typeof r === 'string') {
      setPack(null);
      setError(r);
    } else {
      setError('');
      setPack(r);
    }
  };
  const existing = pack ? listCourses(study).find((c) => c.id === pack.id.toLowerCase() || `pk-${c.id}-nb` === `pk-${pack.id}-nb`) : undefined;
  const count = pack
    ? {
        temas: pack.temas.length,
        trilhas: pack.temas.flatMap((t) => t.trilhas).length,
        topicos: pack.temas.flatMap((t) => t.trilhas.flatMap((x) => x.topicos)).length,
        fontes: pack.fontes?.length ?? 0,
        mapas: pack.mapas?.length ?? 0,
      }
    : null;

  if (done) {
    const a = done.added;
    const nothing = a.trilhas + a.topicos + a.paginas + a.fontes + a.mapas + a.ciclos === 0;
    return (
      <>
        <Path items={[{ label: 'Biblioteca', to: 'estudos/biblioteca' }, { label: 'Importar curso' }]} />
        <PageHeader title="Curso importado" />
        <section className="card">
          {nothing ? (
            <p className="muted" style={{ margin: 0 }}>
              Tudo deste curso já estava no seu Estudos. Nada mudou.
            </p>
          ) : (
            <ul className="list">
              {a.trilhas > 0 && <li className="row">{plural(a.trilhas, 'trilha nova', 'trilhas novas')} na Biblioteca</li>}
              {a.topicos > 0 && <li className="row">{plural(a.topicos, 'tópico', 'tópicos')}</li>}
              {a.paginas > 0 && <li className="row">{plural(a.paginas, 'página', 'páginas')} no notebook</li>}
              {a.fontes > 0 && <li className="row">{plural(a.fontes, 'fonte', 'fontes')}</li>}
              {a.mapas > 0 && <li className="row">{plural(a.mapas, 'mapa mental', 'mapas mentais')}</li>}
              {a.ciclos > 0 && <li className="row">{plural(a.ciclos, 'ciclo pronto', 'ciclos prontos')} para começar</li>}
            </ul>
          )}
        </section>
        <div className="btn-row">
          <a className="btn soft" href="#/estudos/biblioteca">
            Ver na Biblioteca
          </a>
          <button type="button" className="btn primary" onClick={() => done.notebookId && go(`estudos/notebook/${done.notebookId}`)}>
            Abrir o notebook
          </button>
        </div>
        <p className="muted small">Curso grande em partes? Peça a próxima parte para a IA (com o mesmo id) e importe aqui de novo: só entra o que for novo.</p>
      </>
    );
  }

  return (
    <>
      <Path items={[{ label: 'Biblioteca', to: 'estudos/biblioteca' }, { label: 'Importar curso' }]} />
      <PageHeader title="Importar um curso" subtitle="Uma IA monta o curso; o app transforma em trilhas, notebook, links e mapas." />

      <section className="card st-step">
        <div className="card-head">
          <h2>
            <span className="st-step-n">1</span> Peça o curso para uma IA
          </h2>
        </div>
        <div className="form">
          <Field label="Sobre o que é o curso?">
            <input className="input" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: Excel do básico ao avançado" />
          </Field>
          <div className="field">
            <span className="field-label">Nível</span>
            <div className="chips" role="radiogroup" aria-label="Nível">
              {LEVELS.map((l) => (
                <button key={l.value} type="button" role="radio" aria-checked={nivel === l.value} className={`chip-btn${nivel === l.value ? ' on' : ''}`} onClick={() => setNivel(l.value)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Tamanho</span>
            <div className="chips" role="radiogroup" aria-label="Tamanho">
              {SIZES.map((s) => (
                <button key={s.value} type="button" role="radio" aria-checked={tamanho === s.value} className={`chip-btn${tamanho === s.value ? ' on' : ''}`} onClick={() => setTamanho(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
            <span className="field-hint">{SIZES.find((s) => s.value === tamanho)!.rule}.</span>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn primary"
              disabled={!tema.trim()}
              onClick={async () => {
                if (await copy(prompt, promptBox.current)) notify('Prompt copiado', 'Cole numa IA (Claude, ChatGPT, Gemini…) e baixe o arquivo curso.md que ela criar.');
                else {
                  setShowPrompt(true);
                  notify('Selecione e copie o texto do prompt');
                }
              }}
            >
              <Icon name="note" size={16} /> Copiar prompt
            </button>
            <button type="button" className="btn soft" onClick={() => setShowPrompt((v) => !v)}>
              {showPrompt ? 'Esconder' : 'Ver prompt'}
            </button>
          </div>
          {showPrompt && <textarea ref={promptBox} className="input st-prompt" readOnly value={prompt} rows={12} onFocus={(e) => e.target.select()} aria-label="Prompt para a IA" />}
          <p className="muted small" style={{ margin: 0 }}>
            A IA vai criar um arquivo <b>curso.md</b> para baixar. Se ela não conseguir criar arquivo, mostra o curso num bloco de texto: aí use "Colar o texto".
          </p>
        </div>
      </section>

      <section className="card st-step">
        <div className="card-head">
          <h2>
            <span className="st-step-n">2</span> Traga o arquivo da IA
          </h2>
        </div>
        <div className="btn-row">
          <label className="btn primary">
            <Icon name="download" size={16} /> Escolher arquivo
            <input
              type="file"
              accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) f.text().then((t) => read(t, f.name));
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className="btn soft" onClick={() => setPaste((v) => !v)}>
            Colar o texto
          </button>
        </div>
        {paste && (
          <div className="form" style={{ marginTop: 12 }}>
            <textarea className="input" rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Cole aqui a resposta inteira da IA (o app acha o curso sozinho)." aria-label="Texto do curso" />
            <button type="button" className="btn soft small" disabled={!pasted.trim()} onClick={() => read(pasted)}>
              Conferir o texto colado
            </button>
          </div>
        )}
        {fileName && !error && pack && <p className="muted small">Arquivo: {fileName}</p>}
      </section>

      {(error || pack) && (
        <section className={`card st-step${error ? ' st-step-error' : ''}`}>
          <div className="card-head">
            <h2>
              <span className="st-step-n">3</span> {error ? 'Não deu para importar' : 'Conferir e importar'}
            </h2>
          </div>
          {error ? (
            <>
              <p style={{ marginTop: 0 }}>{error}</p>
              <button
                type="button"
                className="btn soft"
                onClick={async () => {
                  if (await copy(fixRequest(error))) notify('Pedido de correção copiado', 'Cole na mesma conversa com a IA.');
                  else notify('Não deu para copiar', fixRequest(error));
                }}
              >
                Copiar pedido de correção para a IA
              </button>
            </>
          ) : (
            pack &&
            count && (
              <>
                <p style={{ marginTop: 0 }}>
                  <b>{pack.nome}</b>
                  <br />
                  <span className="muted small">
                    Área: {pack.area.nome} · {plural(count.temas, 'tema', 'temas')}, {plural(count.trilhas, 'trilha', 'trilhas')}, {plural(count.topicos, 'tópico', 'tópicos')}, {plural(count.fontes, 'fonte', 'fontes')} e {plural(count.mapas, 'mapa', 'mapas')}.
                  </span>
                </p>
                <ul className="st-course-tree">
                  {pack.temas.map((t) => (
                    <li key={t.nome}>
                      <b>{t.nome}</b>
                      <ul>
                        {t.trilhas.map((tr) => (
                          <li key={tr.nome}>
                            {tr.nome} <span className="muted">({plural(tr.topicos.length, 'tópico', 'tópicos')})</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                {existing && <p className="muted small">Você já tem este curso. Importar de novo só acrescenta o que for novo (bom para a Parte 2); nada do que você editou muda.</p>}
                <button
                  type="button"
                  className="btn primary block"
                  onClick={() => {
                    const r = applyPack(study, pack, nowISO());
                    set(() => r.study);
                    setDone(r);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Importar "{pack.nome}"
                </button>
              </>
            )
          )}
        </section>
      )}
    </>
  );
}

/**
 * Confirmação de excluir (M38), para curso importado ou para área, tema e trilha da pessoa.
 * "Só …" mantém os notebooks; "Tudo" também apaga os notebooks e pede um segundo toque quando há páginas escritas.
 */
export function DeleteSheet({ name, what, keep, all, pages, onClose, onConfirm }: { name: string; what: string; keep: string | null; all: string | null; pages: number; onClose: () => void; onConfirm: (tudo: boolean) => void }) {
  const [tudo, setTudo] = useState(keep === null);
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet
      title={`Excluir "${name}"`}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn danger block"
          onClick={() => {
            if (tudo && all && pages > 0 && !confirm) return setConfirm(true);
            onConfirm(tudo);
          }}
        >
          {tudo && all && confirm ? `Confirmar: apagar ${plural(pages, 'página', 'páginas')} de notebook` : 'Excluir'}
        </button>
      }
    >
      {all ? (
        <div className="st-choice" role="radiogroup" aria-label="O que excluir">
          {keep && (
            <button type="button" role="radio" aria-checked={!tudo} className={`st-choice-opt${!tudo ? ' on' : ''}`} onClick={() => (setTudo(false), setConfirm(false))}>
              <b>Só {what}</b>
              <span className="muted small">{keep}</span>
            </button>
          )}
          <button type="button" role="radio" aria-checked={tudo} className={`st-choice-opt${tudo ? ' on' : ''}`} onClick={() => setTudo(true)}>
            <b>Tudo, inclusive o notebook</b>
            <span className="muted small">{all}</span>
          </button>
        </div>
      ) : (
        <p className="muted">{keep}</p>
      )}
    </Sheet>
  );
}
