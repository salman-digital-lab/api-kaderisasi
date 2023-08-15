'use strict'

const Member = use('App/Models/User')
const Crypto = require('crypto')
const Env = use('Env')

class NewsletterController {
  async unsubscribe ({ params, response }) {
    try {
      // decrypt
      const key = Env.get('NEWSLETTER_KEY')
      const algorithm = Env.get('NEWSLETTER_ENC')
      const encoded = params.id

      let iv = encoded.substr(0, 32)
      iv = Buffer.from(iv, 'hex')
      let cipherText = encoded.substring(32)
      cipherText = Buffer.from(cipherText, 'hex')
      const decipher = Crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
      let plainText = decipher.update(cipherText)
      plainText = Buffer.concat([plainText, decipher.final()])

      const email = plainText.toString()
      await Member
        .query()
        .where('email', email)
        .update({ is_subscribing: 0 })

      response.status(200).json({
        status: 'SUCCESS',
        message: 'Anda telah berhenti berlangganan publikasi program & aktivitas terbaru. Untuk dapat berlangganan kembali, Anda dapat melakukan pengaturan pada bagian profil.'
      })
    } catch (error) {
      response.status(500).json({
        status: 'FAILED',
        message: error.message
      })
    }
  }
}

module.exports = NewsletterController
