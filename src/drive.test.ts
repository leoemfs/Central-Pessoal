import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadData, DriveError, findData, isAuthError, uploadData, whoAmI } from './drive.ts';

/** Drive de mentira, na memória: entende as chamadas que o app faz. */
function fakeDrive(token = 'tok') {
  const files = new Map<string, { name: string; body: string; modifiedTime: string; device: string; parents: string[] }>();
  let clock = 0;
  const calls: string[] = [];
  const f = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    calls.push(`${method} ${url.pathname}`);
    const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'Content-Type': 'application/json' } });
    if ((init.headers as Record<string, string>)?.Authorization !== `Bearer ${token}`) return json({ error: 'auth' }, 401);
    const meta = (id: string) => { const x = files.get(id)!; return { id, modifiedTime: x.modifiedTime, size: String(x.body.length), appProperties: { device: x.device } }; };
    if (url.pathname.endsWith('/about')) return json({ user: { emailAddress: 'eu@exemplo.com', displayName: 'Eu' } });
    if (url.pathname === '/drive/v3/files' && method === 'GET') {
      assert.equal(url.searchParams.get('spaces'), 'appDataFolder');
      const list = [...files.entries()].filter(([, x]) => url.searchParams.get('q')!.includes(`'${x.name}'`)).map(([id]) => meta(id));
      return json({ files: list });
    }
    const m = url.pathname.match(/\/files\/([^/]+)$/);
    if (m && url.searchParams.get('alt') === 'media') return new Response(files.get(m[1])!.body);
    if (url.pathname.startsWith('/upload/drive/v3/files')) {
      assert.equal(url.searchParams.get('uploadType'), 'multipart');
      const body = String(init.body);
      const boundary = String((init.headers as Record<string, string>)['Content-Type']).split('boundary=')[1];
      const parts = body.split(`--${boundary}`).slice(1, 3).map((p) => p.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''));
      const md = JSON.parse(parts[0]) as { name?: string; parents?: string[]; appProperties: { device: string } };
      const modifiedTime = `2026-11-11T10:00:0${++clock}.000Z`;
      const id = m ? m[1] : `f${files.size + 1}`;
      const old = files.get(id);
      files.set(id, { name: md.name ?? old!.name, parents: md.parents ?? old!.parents, body: parts[1], modifiedTime, device: md.appProperties.device });
      return json(meta(id));
    }
    return json({ error: 'não esperado' }, 404);
  }) as typeof fetch;
  return { f, files, calls };
}

test('primeira cópia: cria dados.json na pasta escondida do app; depois substitui o mesmo arquivo', async () => {
  const drive = fakeDrive();
  assert.equal(await findData('tok', drive.f), null);
  const a = await uploadData('tok', JSON.stringify({ n: 1 }), 'celular', null, drive.f);
  assert.equal(a.device, 'celular');
  assert.deepEqual([...drive.files.values()][0].parents, ['appDataFolder']);
  const found = await findData('tok', drive.f);
  assert.equal(found?.id, a.id);
  const b = await uploadData('tok', JSON.stringify({ n: 2 }), 'pc', a.id, drive.f);
  assert.equal(b.id, a.id);
  assert.equal(drive.files.size, 1);
  assert.deepEqual(await downloadData('tok', a.id, drive.f), { n: 2 });
  assert.equal((await findData('tok', drive.f))?.device, 'pc');
});

test('conta: nome e e-mail', async () => {
  assert.deepEqual(await whoAmI('tok', fakeDrive().f), { email: 'eu@exemplo.com', name: 'Eu' });
});

test('acesso vencido vira erro de login (401)', async () => {
  await assert.rejects(findData('vencido', fakeDrive().f), (e) => isAuthError(e));
  assert.equal(isAuthError(new DriveError(500, 'x')), false);
});
