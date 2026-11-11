import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { normalize } from '../data';
import { Icon } from '../ui';
import { formatDateTime } from '../utils';
import { connect, disconnect, fetchCloud, GOOGLE_CLIENT_ID, hasUnsaved, keepThisDevice, loadGis, saveNow, useCloud } from '../cloud';

type Message = { tone: 'green' | 'red'; text: string };

/** Configurações › Conta Google (N9.1): cópia automática dos dados na pasta escondida do Drive. */
export function GoogleCard({ keepCopy, onMessage }: { keepCopy: () => Promise<boolean>; onMessage: (m: Message) => void }) {
  const { data, replace } = useStore();
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
    if (r === 'ok') onMessage({ tone: 'green', text: 'Conta Google ligada. Seus dados agora têm uma cópia no seu Drive, salva sozinha.' });
    else if (r === 'erro') onMessage({ tone: 'red', text: 'Não deu para ligar a conta Google agora. Confira a internet e tente de novo.' });
  }

  async function useCloudCopy() {
    const when = cloud?.cloud?.modifiedTime ? ` (salva em ${formatDateTime(cloud.cloud.modifiedTime)})` : '';
    if (!confirm(`Trocar os dados deste aparelho pela cópia da nuvem${when}? Dá para desfazer depois, em Backup.`)) return;
    if (!(await keepCopy()) && !confirm('Não foi possível guardar uma cópia dos dados atuais para desfazer. Continuar mesmo assim?')) return;
    setWorking(true);
    const raw = await fetchCloud();
    setWorking(false);
    if (!raw) return onMessage({ tone: 'red', text: 'Não deu para trazer a cópia da nuvem agora. Tente de novo.' });
    replace(normalize(raw));
    onMessage({ tone: 'green', text: 'Pronto: este aparelho está com os dados da nuvem.' });
  }

  async function keepMine() {
    if (!confirm('Salvar os dados deste aparelho por cima da cópia da nuvem? A cópia que está lá agora deixa de existir.')) return;
    setWorking(true);
    await keepThisDevice();
    setWorking(false);
  }

  function leave() {
    if (!confirm('Sair da conta Google? Os dados continuam neste aparelho; só para de salvar a cópia no Drive.')) return;
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
          Guarde uma cópia dos seus dados no seu Google Drive, salva sozinha a cada mudança. Fica numa pasta escondida que só o app enxerga; o app não vê o resto do seu Drive.
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
      ? 'Salvando…'
      : cloud.status === 'offline'
        ? 'Sem internet: salva quando a conexão voltar.'
        : cloud.status === 'erro'
          ? 'Não deu para salvar da última vez. Tenta de novo sozinho na próxima mudança.'
          : cloud.lastSavedAt
            ? `Cópia na nuvem: ${formatDateTime(cloud.lastSavedAt)}${pending ? ' · mudanças esperando' : ''}`
            : 'Ainda sem cópia na nuvem.';

  return (
    <section className="card">
      <div className="card-head">
        <h2>Conta Google</h2>
        <span className="muted small">{cloud.email}</span>
      </div>

      {cloud.status === 'escolher' ? (
        <div className="info-box">
          <Icon name="info" />
          <div>
            <strong>Já existe uma cópia na nuvem</strong>
            {cloud.cloud?.modifiedTime ? `Salva em ${formatDateTime(cloud.cloud.modifiedTime)}` : 'Salva antes'}, por outro aparelho ou antes de você entrar aqui. Qual fica? (A junção automática das duas chega na próxima parte.)
          </div>
        </div>
      ) : cloud.status === 'reconectar' ? (
        <div className="info-box">
          <Icon name="cloud" />
          <div>
            <strong>Toque para continuar salvando</strong>
            O acesso ao Google vence depois de um tempo. Um toque e a cópia volta a ser salva sozinha.
          </div>
        </div>
      ) : (
        <p className="muted" role="status">
          <Icon name={cloud.status === 'ok' && !pending ? 'checkCircle' : 'cloud'} size={16} /> {statusText}
        </p>
      )}

      <div className="btn-row" style={{ marginTop: 14 }}>
        {cloud.status === 'escolher' ? (
          <>
            <button type="button" className="btn" onClick={useCloudCopy} disabled={working}>
              <Icon name="download" size={18} /> Usar a da nuvem
            </button>
            <button type="button" className="btn primary" onClick={keepMine} disabled={working}>
              <Icon name="upload" size={18} /> Manter a deste aparelho
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary" onClick={() => void saveNow(true)} disabled={working || cloud.status === 'salvando'}>
              <Icon name="cloud" size={18} /> {cloud.status === 'reconectar' ? 'Continuar salvando' : 'Salvar agora'}
            </button>
            <button type="button" className="btn" onClick={useCloudCopy} disabled={working}>
              <Icon name="download" size={18} /> Trazer da nuvem
            </button>
          </>
        )}
      </div>
      <button type="button" className="btn ghost" style={{ marginTop: 10, width: '100%' }} onClick={leave}>
        Sair da conta Google
      </button>
    </section>
  );
}
