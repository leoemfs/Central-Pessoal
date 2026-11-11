import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Icon, Toggle } from '../ui';
import { formatDateTime } from '../utils';
import { connect, disableCalendar, disconnect, enableCalendar, GOOGLE_CLIENT_ID, hasUnsaved, loadGis, syncNow, useCloud } from '../cloud';

type Message = { tone: 'green' | 'red'; text: string };

/** Configurações › Conta Google (N9.1 + N9.2): sincronização automática pelo Drive (pasta escondida do app). */
export function GoogleCard({ onMessage }: { onMessage: (m: Message) => void }) {
  const { data, update } = useStore();
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

      <CalendarSection
        settings={data.settings.googleCalendar}
        status={cloud.calendar}
        at={cloud.calendarAt ?? null}
        onPart={(part, v) => update((d) => ({ ...d, settings: { ...d.settings, googleCalendar: { ...d.settings.googleCalendar, [part]: v } } }))}
        onMessage={onMessage}
      />

      <button type="button" className="btn primary block" style={{ marginTop: 14 }} onClick={() => void syncNow(true)} disabled={cloud.status === 'salvando'}>
        <Icon name="cloud" size={18} /> {cloud.status === 'reconectar' ? 'Continuar sincronizando' : 'Sincronizar agora'}
      </button>
      <button type="button" className="btn ghost" style={{ marginTop: 10, width: '100%' }} onClick={leave}>
        Sair da conta Google
      </button>
    </section>
  );
}

type CalendarPart = 'events' | 'bills' | 'tasks';
const PARTS: { id: CalendarPart; label: string; hint: string }[] = [
  { id: 'events', label: 'Compromissos', hint: 'Da Agenda e de Carreira. Aviso 30 min antes; sem hora, às 9h.' },
  { id: 'bills', label: 'Contas a pagar', hint: 'No dia do vencimento, com o valor. Aviso às 9h.' },
  { id: 'tasks', label: 'Tarefas com data', hint: 'No dia do prazo. Aviso às 9h.' },
];

/** N9.5: lembretes pelo Google Agenda (agenda "Central Pessoal", só de ida). */
function CalendarSection({
  settings,
  status,
  at,
  onPart,
  onMessage,
}: {
  settings: { on: boolean; events: boolean; bills: boolean; tasks: boolean };
  status: 'ok' | 'permissao' | 'erro' | undefined;
  at: string | null;
  onPart: (part: CalendarPart, v: boolean) => void;
  onMessage: (m: Message) => void;
}) {
  const [working, setWorking] = useState(false);

  async function turnOn() {
    setWorking(true);
    const r = await enableCalendar();
    setWorking(false);
    if (r === 'ok') onMessage({ tone: 'green', text: 'Lembretes ligados: veja a agenda "Central Pessoal" no seu Google Agenda. O celular avisa pelo app Google Agenda.' });
    else if (r === 'cancelado') onMessage({ tone: 'red', text: 'Sem a permissão da agenda, os lembretes não podem ser ligados. Na janela do Google, deixe marcada a opção da agenda.' });
    else onMessage({ tone: 'red', text: 'Não deu para ligar os lembretes agora. Tente de novo.' });
  }

  async function turnOff() {
    if (!confirm('Desligar os lembretes no Google Agenda?')) return;
    const remove = confirm('Apagar também a agenda "Central Pessoal" do seu Google Agenda? (Cancelar mantém os eventos que já estão lá.)');
    setWorking(true);
    await disableCalendar(remove);
    setWorking(false);
    onMessage({ tone: 'green', text: remove ? 'Lembretes desligados e agenda "Central Pessoal" apagada.' : 'Lembretes desligados.' });
  }

  return (
    <div className="google-calendar">
      <div className="toggle-row">
        <div>
          <strong>Lembretes no Google Agenda</strong>
          <span className="muted small">O app põe compromissos, contas e tarefas numa agenda "Central Pessoal" do seu Google Agenda, e o celular avisa pelo app Google Agenda. Mudou aqui, muda lá (só de ida).</span>
        </div>
        <Toggle checked={settings.on} onChange={(v) => void (v ? turnOn() : turnOff())} label="Lembretes no Google Agenda" />
      </div>
      {settings.on && (
        <>
          {status === 'permissao' ? (
            <button type="button" className="btn block" style={{ marginTop: 10 }} onClick={() => void turnOn()} disabled={working}>
              <Icon name="calendar" size={18} /> Dar acesso à agenda neste aparelho
            </button>
          ) : (
            <p className="muted small" role="status" style={{ marginTop: 6 }}>
              {status === 'erro' ? 'Não deu para atualizar a agenda da última vez. Tenta de novo sozinho.' : at ? `Agenda atualizada: ${formatDateTime(at)}` : 'A agenda é atualizada junto com a sincronização.'}
            </p>
          )}
          {PARTS.map((p) => (
            <div className="toggle-row" key={p.id}>
              <div>
                <strong>{p.label}</strong>
                <span className="muted small">{p.hint}</span>
              </div>
              <Toggle checked={settings[p.id]} onChange={(v) => onPart(p.id, v)} label={p.label} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
