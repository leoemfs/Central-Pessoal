import { Component, type ErrorInfo, type ReactNode } from 'react';
import { dbGet } from './db';

/** Baixa os dados guardados no aparelho do jeito que estão, sem passar pelas telas (funciona mesmo com erro). */
export async function exportRawBackup(): Promise<boolean> {
  try {
    const raw = await dbGet<unknown>('data');
    if (raw === undefined) return false;
    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cp-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

interface Props {
  children: ReactNode;
  /** "app" = tela inteira (nada abriu); "tela" = só a parte do meio (a barra continua funcionando). */
  scope: 'app' | 'tela';
  /** Muda quando a pessoa troca de tela: o erro é esquecido e a nova tela tenta abrir. */
  resetKey?: string;
}

interface State {
  error: Error | null;
  key?: string;
  exported: 'sim' | 'nao' | null;
}

/** Rede de proteção (C3): um erro numa tela mostra uma saída em vez de deixar o app em branco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey, exported: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey, exported: null };
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Central Pessoal: erro na tela', error, info.componentStack);
  }

  private async exportar() {
    const ok = await exportRawBackup();
    this.setState({ exported: ok ? 'sim' : 'nao' });
  }

  private abrirAjustes() {
    if (location.hash === '#/ajustes') this.setState({ error: null });
    else location.hash = '#/ajustes';
    if (this.props.scope === 'app') location.reload();
  }

  render() {
    const { error, exported } = this.state;
    if (!error) return this.props.children;
    return (
      <div className={`error-screen${this.props.scope === 'app' ? ' full' : ''}`} role="alert">
        <div className="error-icon" aria-hidden="true">
          !
        </div>
        <h1>Algo deu errado</h1>
        <p className="muted">
          {this.props.scope === 'app'
            ? 'O app não conseguiu abrir os seus dados. Eles continuam guardados neste aparelho.'
            : 'Esta tela não conseguiu abrir. Seus dados continuam guardados; as outras telas funcionam normalmente.'}
        </p>
        <div className="error-actions">
          <button type="button" className="btn primary" onClick={() => this.exportar()}>
            Exportar backup
          </button>
          <button type="button" className="btn" onClick={() => location.reload()}>
            Recarregar
          </button>
          <button type="button" className="btn" onClick={() => this.abrirAjustes()}>
            Abrir Configurações
          </button>
        </div>
        {exported === 'sim' && <p className="small">Backup baixado. Guarde o arquivo em um lugar seguro.</p>}
        {exported === 'nao' && <p className="small">Não foi possível exportar. Tente recarregar.</p>}
        <p className="muted small">
          Em Configurações › Backup dá para importar um backup ou desfazer a última importação.
        </p>
        <details className="small muted">
          <summary>Detalhe do erro</summary>
          <code>{error.message || String(error)}</code>
        </details>
      </div>
    );
  }
}
