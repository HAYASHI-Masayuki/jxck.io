console.info('worker')

function headers(r) {
  return Array.from(r.headers.entries()).map(([k,v]) => {
    return `${k}: ${v}`
  }).join("\n")
}

function print_req(req) {
  console.log(`
${req.method} ${req.url}
${headers(req)}
`)
}

function print_res(res) {
  console.log(`
${res.status} ${res.statusText}
${headers(res)}
`)
}

self.addEventListener('install', (e) => {
  console.info(e.type, e)
  e.waitUntil(skipWaiting())
})

self.addEventListener('activate', (e) => {
  console.info(e.type, e)
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (e) => {
  console.info(e.type, e)
  e.respondWith((async () => {
    const req = e.request
    print_req(req)
    const res = await fetch(req)
    print_res(res)
    return res
  })())
})
