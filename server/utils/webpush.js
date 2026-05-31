export async function sendPush(subscription, payloadText, vapidAuth) {
  const { endpoint, keys } = subscription
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid subscription')
  }

  const p256dh = urlBase64ToUint8Array(keys.p256dh)
  const auth = urlBase64ToUint8Array(keys.auth)
  const payload = new TextEncoder().encode(JSON.stringify(payloadText))

  const salt = crypto.getRandomValues(new Uint8Array(16))

  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )

  const subPubKey = await crypto.subtle.importKey(
    'raw', p256dh, { name: 'ECDH', namedCurve: 'P-256' }, true, []
  )

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subPubKey },
    ephemeral.privateKey,
    256
  )

  const sharedSecretBytes = new Uint8Array(sharedSecret)

  const ikm = await hmacSha256(auth, sharedSecretBytes)

  const cek = await hkdfExpand(ikm, salt, textEncoder.encode('Content-Encoding: aes128gcm\x00'), 16)
  const nonce = await hkdfExpand(ikm, salt, textEncoder.encode('Content-Encoding: nonce\x00'), 12)

  const plaintext = new Uint8Array([0, ...payload])
  const encrypted = await aesGcmEncrypt(cek, nonce, plaintext)

  const ephemPub = new Uint8Array(await crypto.subtle.exportKey('raw', ephemeral.publicKey))

  const body = new Uint8Array(16 + 4 + 1 + 65 + encrypted.length)
  body.set(salt, 0)
  body.set([0, 0, 16, 0], 16)
  body.set([65], 20)
  body.set(ephemPub, 21)
  body.set(encrypted, 86)

  const headers = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    TTL: '86400',
  }
  if (vapidAuth) {
    headers['Authorization'] = vapidAuth.authorization
    headers['Crypto-Key'] = vapidAuth.cryptoKey
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body,
      headers,
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    return { ok: false, status: 0, error: e?.message || String(e) }
  }
  clearTimeout(timeout)

  return { ok: response.ok, status: response.status }
}

export async function createVapidAuth(vapidPrivateKeyB64, vapidPublicKeyB64, audience) {
  const privateKeyBytes = urlBase64ToUint8Array(vapidPrivateKeyB64)
  const publicKeyBytes = urlBase64ToUint8Array(vapidPublicKeyB64)

  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33))
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65))
  const d = uint8ArrayToBase64Url(privateKeyBytes)

  const jwk = { kty: 'EC', crv: 'P-256', x, y, d }

  const privateKey = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 86400,
    sub: 'mailto:admin@example.com',
  }

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))

  const toSign = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    toSign
  ))

  const sigB64 = uint8ArrayToBase64Url(signature)

  return {
    authorization: `WebPush ${headerB64}.${payloadB64}.${sigB64}`,
    cryptoKey: `p256ecdsa=${vapidPublicKeyB64}`,
  }
}

function uint8ArrayToBase64Url(arr) {
  const binary = Array.from(arr).map(b => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const textEncoder = new TextEncoder()

async function hmacSha256(keyBytes, data) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
}

async function hkdfExpand(ikm, salt, info, length) {
  const prk = await hmacSha256(salt, ikm)
  const result = new Uint8Array(length)
  let prev = new Uint8Array(0)
  let offset = 0
  let i = 1

  while (offset < length) {
    const input = new Uint8Array(prev.length + info.length + 1)
    input.set(prev, 0)
    input.set(info, prev.length)
    input[input.length - 1] = i
    const block = await hmacSha256(prk, input)
    const take = Math.min(block.length, length - offset)
    result.set(block.slice(0, take), offset)
    offset += take
    prev = block
    i++
  }

  return result
}

async function aesGcmEncrypt(keyBytes, nonce, plaintext) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']
  )
  return new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, plaintext
  ))
}

function urlBase64ToUint8Array(str) {
  const padding = '='.repeat((4 - str.length % 4) % 4)
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
