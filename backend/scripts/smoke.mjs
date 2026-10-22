const BASE = 'http://127.0.0.1:3000/api'

const call = async (method, path, { token, body } = {}) => {
  const options = {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, options)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`)
  }
  return data
}

const step = (name) => console.log(`\n=== ${name}`)

const main = async () => {
  step('health')
  console.log(await call('GET', '/health'))

  step('login client.approve')
  const clientLogin = await call('POST', '/auth/login', {
    body: { email: 'client.approve@demo.local', password: 'demo' },
  })
  const clientToken = clientLogin.accessToken
  console.log('user:', clientLogin.user.email, 'role:', clientLogin.user.role)

  step('profile')
  const me = await call('GET', '/auth/me', { token: clientToken })
  console.log('company:', me.company?.name, me.company?.inn)

  step('products')
  const products = await call('GET', '/products', { token: clientToken })
  console.log(products.map((p) => `${p.code}:${p.rate}%`).join(', '))

  step('create application')
  const created = await call('POST', '/applications', {
    token: clientToken,
    body: {
      productId: products[0].id,
      amount: 1500000,
      term: 24,
      purpose:
        'Закупка оборудования для расширения производства',
      purposeCode: 'EQUIPMENT',
      contactPhone: '+7 900 111-22-33',
      contactEmail: 'client.approve@demo.local',
      monthlyTurnover: 2000000,
      employeeCount: 18,
      existingLoans: 0,
      hasOverdueDebt: false,
    },
  })
  console.log('id:', created.id, 'status:', created.status)

  step('submit')
  const submitted = await call('POST', `/applications/${created.id}/submit`, { token: clientToken })
  console.log('status:', submitted.status)

  step('login underwriter')
  const bankLogin = await call('POST', '/auth/login', {
    body: { email: 'underwriter@demo.local', password: 'demo' },
  })
  const bankToken = bankLogin.accessToken

  step('credit history refresh')
  const report = await call('POST', `/applications/${created.id}/credit-history/refresh`, {
    token: bankToken,
  })
  console.log(
    'bureau:',
    report.report?.bureau,
    'score:',
    report.report?.creditScore,
    'checks:',
    report.checkStatus,
  )

  step('scoring')
  const scoring = await call('POST', `/bank/applications/${created.id}/score`, { token: bankToken })
  console.log('score:', scoring.score, 'risk:', scoring.riskLevel)
  for (const f of scoring.factors)
    console.log(` - ${f.code}: ${f.contribution}/${f.weight} — ${f.explanation}`)

  step('decision approve')
  const decision = await call('POST', `/bank/applications/${created.id}/decision`, {
    token: bankToken,
    body: {
      type: 'APPROVE',
      reason: 'Профиль соответствует продукту',
      message: 'Одобрено',
    },
  })
  console.log('decision:', decision.type, 'status:', decision.status, 'offer:', decision.offerId)

  step('client accepts offer')
  const accepted = await call('POST', `/applications/${created.id}/offer/accept`, {
    token: clientToken,
  })
  console.log('status:', accepted.status)

  step('bank signs')
  const signed = await call('POST', `/bank/applications/${created.id}/sign`, { token: bankToken })
  console.log('status:', signed.status)

  step('disburse')
  const disbursed = await call('POST', `/bank/applications/${created.id}/disburse`, {
    token: bankToken,
  })
  console.log('status:', disbursed.status)

  step('client notifications')
  const notifications = await call('GET', '/notifications', { token: clientToken })
  console.log(notifications.map((n) => `${n.type}: ${n.text}`).join('\n'))

  step('bank queue')
  const queue = await call('GET', '/applications?status=UNDER_REVIEW', { token: bankToken })
  console.log('under_review count:', queue.length ?? queue.items?.length)

  step('document upload')
  const form = new FormData()
  form.append('file', new Blob(['demo document content'], { type: 'text/plain' }), 'statement.txt')
  const uploadRes = await fetch(
    `${BASE}/applications/${created.id}/documents?kind=BANK_STATEMENT`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${clientToken}` },
      body: form,
    },
  )
  const upload = await uploadRes.json()
  if (!uploadRes.ok) throw new Error(`upload -> ${uploadRes.status} ${JSON.stringify(upload)}`)
  console.log('document:', upload.filename, upload.size, upload.kind)

  step('document download')
  const downloadRes = await fetch(`${BASE}/documents/${upload.id}`, {
    headers: { authorization: `Bearer ${clientToken}` },
  })
  console.log('download:', downloadRes.status, await downloadRes.text())

  console.log('\nSMOKE OK')
}

main().catch((error) => {
  console.error('\nSMOKE FAILED:', error.message)
  process.exitCode = 1
})
