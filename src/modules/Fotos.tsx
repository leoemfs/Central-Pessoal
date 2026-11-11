import { useEffect, useRef, useState } from 'react';
import type { Photo } from '../types';
import { useFileUrl } from '../files';
import { Fullscreen, Icon } from '../ui';

/** Miniatura de uma foto (N9.3). Sem o arquivo no aparelho ainda: "Baixando…". */
export function PhotoThumb({ photo, src, onClick, onRemove }: { photo: Photo; src?: string; onClick?: () => void; onRemove?: () => void }) {
  const stored = useFileUrl(photo.id);
  const url = src ?? stored;
  return (
    <div className="photo-thumb">
      {url ? (
        <button type="button" onClick={onClick} aria-label="Ver foto">
          <img src={url} alt="" loading="lazy" />
        </button>
      ) : (
        <span className="photo-wait">{url === null ? 'Baixando…' : ''}</span>
      )}
      {onRemove && (
        <button type="button" className="photo-remove" onClick={onRemove} aria-label="Tirar foto">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

/** Foto em tela cheia, com anterior e próxima. */
export function PhotoViewer({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const url = useFileUrl(photos[i].id);
  const touch = useRef<number | null>(null);
  const go = (d: number) => setI((x) => (x + d + photos.length) % photos.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === 'ArrowRight' ? go(1) : e.key === 'ArrowLeft' ? go(-1) : undefined);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <Fullscreen onClose={onClose} label="Foto" className="photo-viewer">
      <div
        className="photo-stage"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {url ? <img src={url} alt="" /> : <span className="photo-wait">Baixando…</span>}
      </div>
      <div className="photo-bar">
        {photos.length > 1 ? (
          <>
            <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Foto anterior">
              <Icon name="left" size={20} />
            </button>
            <span className="muted small">
              {i + 1} de {photos.length}
            </span>
            <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Próxima foto">
              <Icon name="right" size={20} />
            </button>
          </>
        ) : (
          <span />
        )}
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar foto">
          <Icon name="x" size={20} />
        </button>
      </div>
    </Fullscreen>
  );
}
