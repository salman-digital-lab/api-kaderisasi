'use strict'

const Crypto = require('crypto')
const Env = use('Env')
const User = use('App/Models/User')

const { test, trait, before, after } = use('Test/Suite')('Newsletter')

trait('DatabaseTransactions')
trait('Test/ApiClient')

before(async () => {
  await User.create({
    email: '123@example.net',
    password: 'Example',
    name: 'Example Name',
    is_subscribing: 1,
    role_id: 4
  })
})

after(async () => {
  await User
    .query()
    .where('email', '123@example.net')
    .delete()
})

// encrypt function
// todo : moves to User model
function encrypt (plainText) {
  const key = Env.get('NEWSLETTER_KEY')
  const algorithm = Env.get('NEWSLETTER_ENC')
  const iv = Crypto.randomBytes(16)

  const cipher = Crypto.createCipheriv(algorithm, Buffer.from(key), iv)
  let encrypted = cipher.update(plainText)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  const encoded = encrypted.toString('hex')
  const encodedIv = iv.toString('hex')
  const cipherText = encodedIv + encoded
  return cipherText
}

test('make sure user can unsubscribe', async ({ assert, client }) => {
  const cipherText = encrypt('123@example.net')
  const response = await client
    	.get(`v1/unsubscribe/${cipherText}`)
    	.end()

  response.assertStatus(200)
  response.assertJSONSubset({
    	status: 'SUCCESS',
    	message: 'Anda telah berhenti berlangganan publikasi program & aktivitas terbaru. Untuk dapat berlangganan kembali, Anda dapat melakukan pengaturan pada bagian profil.'
  })

  const user = await User.findByOrFail('email', '123@example.net')
  assert.equal(user.is_subscribing, 0)
})
