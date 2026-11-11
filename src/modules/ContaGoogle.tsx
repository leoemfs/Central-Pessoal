import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Icon } from '../ui';
import { formatDateTime } from '../utils';
import { connect, disconnect, GOOGLE_CLIENT_ID, hasUnsaved, loadGis, syncNow, useCloud } from '../cloud';

type Message = { tone: 'green' | 'red'; text: string };

/** Configurações › Conta Google (N9.1 + N9.2): sincronização automática pelo Drive (pasta escondida do app). */
export function GoogleCard({ onMessage }: { onMessage: (m: Message) => void }) {
  const { data } = useStore();
  const cloud = useCloud();
  const [working, setWorking] = useState(false);

  // Carrega o script do Google antes do toque, para a janela de login abrir na hora.
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) loadGis().catch(() => undefined);
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  async function enter() {
    setWorking(true);
    const r = await connect();
    setWorking(false);
    if (r === 'ok') onMessage({ tone: 'green', text: 'Conta Google ligada. Este aparelho agora sincroniza sozinho com os outros pelo seu Drive.' });
    else if (r === 'erro') onMessage({ tone: 'red', text: 'Não deu para ligar a conta Google agora. Confira a internet e tente de novo.' });
  }

  function leave() {
    if (!confirm('Sair da conta Google neste aparelho? Os dados continuam aqui; só para de sincronizar.')) return;
    disconnect();
    onMessage({ tone: 'green', text: 'Conta Google desligada neste aparelho.' });
  }

  if (!cloud) {
    return (
      <section className="card">
        <div className="card-head">
          <h2>Conta Google</h2>
        </div>
        <p className="muted">
          Sincronize seus dados entre o celular e o computador pelo seu Google Drive, sozinho. Fica numa pasta escondida que só o app enxerga; o app não vê o resto do seu Drive.
        </p>
        <button type="button" className="btn primary block" style={{ marginTop: 14 }} onClick={enter} disabled={working}>
          <Icon name="cloud" size={18} /> {working ? 'Entrando…' : 'Entrar com Google'}
        </button>
      </section>
    );
  }

  const pending = hasUnsaved(data, cloud);
  const statusText =
    cloud.status === 'salvando'
      ? 'Sincronizando…'
      : cloud.status === 'offline'
        ? 'Sem internet: sincroniza quando a conexão voltar.'
        : cloud.status === 'erro'
          ? 'Não deu para sincronizar da última vez. Tenta de novo sozinho.'
          : cloud.lastSavedAt
            ? `Sincronizado: ${formatDateTime(cloud.lastSavedAt)}${pending ? ' · mudanças esperando' : ''}`
            : 'Ainda não sincronizado.';

  return (
    <section className="card">
      <div className="card-head">
        <h2>Conta Google</h2>
        <span className="muted small">{cloud.email}</span>
      </div>

      {cloud.status === 'reconectar' ? (
        <div className="info-box">
          <Icon name="cloud" />
          <div>
            <strong>Toque para continuar sincronizando</strong>
            O acesso ao Google vence depois de um tempo. Um toque e o app volta a sincronizar sozinho.
          </div>
        </div>
      ) : (
        <p className="muted" role="status">
          <Icon name={cloud.status === 'ok' && !pending ? 'checkCircle' : 'cloud'} size={16} /> {statusText}
        </p>
      )}
      <p className="muted small" style={{ marginTop: 6 }}>
        Sincroniza ao abrir o app, ao voltar para ele, a cada 5 minutos e logo depois de cada mudança. O que você cria ou muda em um aparelho aparece no outro.
      </p>

      <button type="button" className="btn primary block" style={{ marginTop: 14 }} onClick={() => void syncNow(true)} disabled={cloud.status === 'salvando'}>
        <Icon name="cloud" size={18} /> {cloud.status === 'reconectar' ? 'Continuar sincronizando' : 'Sincronizar agora'}
      </button>
      <button type="button" className="btn ghost" style={{ marginTop: 10, width: '100%' }} onClick={leave}>
        Sair da conta Google
      </button>
    </section>
  );
}
