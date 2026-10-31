// Tezkor sinov: node smoke-test.js  (server ishlab turganda). Port: PORT yoki 5055
const B = `http://localhost:${process.env.PORT || 5055}`;
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });

(async () => {
  const out = [];
  const log = (name, ok, extra = '') => out.push(`${ok ? 'OK  ' : 'FAIL'} ${name} ${extra}`);

  let r = await j(await fetch(`${B}/health`));
  log('health', r.status === 200);

  r = await j(await fetch(`${B}/api/v1/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tester', email: 'T@x.com', password: 'secret1' }),
  }));
  log('register', r.status === 201);

  r = await j(await fetch(`${B}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tester', email: 't@x.com', password: 'secret1' }),
  }));
  log('register duplicate -> 409', r.status === 409);

  r = await j(await fetch(`${B}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 't@x.com', password: 'secret1' }),
  }));
  const token = r.body && r.body.token;
  log('login', r.status === 200 && !!token);

  r = await j(await fetch(`${B}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 't@x.com', password: 'wrong' }),
  }));
  log('login wrong -> 401', r.status === 401);

  r = await j(await fetch(`${B}/users`));
  log('users', r.status === 200 && r.body.total === 1 && !r.body.data[0].email);

  const auth = { Authorization: `Bearer ${token}` };

  let fd = new FormData();
  fd.append('title', 'no token');
  fd.append('videoFile', new Blob(['x'], { type: 'video/mp4' }), 'a.mp4');
  r = await j(await fetch(`${B}/files`, { method: 'POST', body: fd }));
  log('upload without token -> 401', r.status === 401);

  fd = new FormData();
  fd.append('title', 'Birinchi video');
  fd.append('description', 'test');
  fd.append('videoFile', new Blob(['FAKEVIDEODATA'], { type: 'video/mp4' }), 'a.mp4');
  fd.append('thumbnail', new Blob(['PNGDATA'], { type: 'image/png' }), 't.png');
  r = await j(await fetch(`${B}/files`, { method: 'POST', headers: auth, body: fd }));
  const f = r.body && r.body.file;
  log('upload', r.status === 201 && !!f, f ? f.videoUrl : JSON.stringify(r.body));

  fd = new FormData();
  fd.append('title', 'bad');
  fd.append('videoFile', new Blob(['x'], { type: 'text/plain' }), 'a.txt');
  r = await j(await fetch(`${B}/files`, { method: 'POST', headers: auth, body: fd }));
  log('upload non-video -> 400', r.status === 400, r.body && r.body.message);

  r = await j(await fetch(`${B}/files?search=birinchi`));
  log('list+search', r.status === 200 && r.body.total === 1);

  r = await j(await fetch(`${B}/files/my`, { headers: auth }));
  log('files/my', r.status === 200 && r.body.total === 1);

  r = await j(await fetch(`${B}/files?id=${f.id}`, {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Yangilandi' }),
  }));
  log('update', r.status === 200 && r.body.file.title === 'Yangilandi');

  let dl = await fetch(`${B}/download/${f.fileName}`);
  const txt = await dl.text();
  log('download', dl.status === 200 && txt === 'FAKEVIDEODATA');

  dl = await fetch(`${B}/download/${f.fileName}?inline=1`);
  log('download inline', dl.status === 200);

  r = await j(await fetch(`${B}/files?id=${f.id}`, { method: 'DELETE', headers: auth }));
  log('delete', r.status === 200);

  r = await j(await fetch(`${B}/files`));
  log('list empty after delete', r.body.total === 0);

  r = await j(await fetch(`${B}/api-docs/`).then(async (x) => ({ json: async () => ({ s: x.status }) })));
  log('swagger ui', r.body.s === 200);

  console.log(out.join('\n'));
})().catch((e) => { console.error('TEST CRASH', e); process.exit(1); });
