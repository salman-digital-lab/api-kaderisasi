'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
const Crypto = require('crypto')
const Env = use('Env')

const MD5 = require('crypto-js/md5')

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await MD5(userInstance.password).toString()
      }
    })
  }

  verifyPassword (password) {
    return this.password === MD5(password).toString()
  }

  static get hidden () {
    return ['salt', 'password', 'is_active', 'created_at', 'updated_at']
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  static get table () {
    return 'members'
  }

  // Encrypt user as email
  AESEncrypt () {
    const plainText = this.email
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

  // decrypt to an User instance or fail
  static async decryptOrFail (encoded) {
    // decrypt
    const key = Env.get('NEWSLETTER_KEY')
    const algorithm = Env.get('NEWSLETTER_ENC')

    let iv = encoded.substr(0, 32)
    iv = Buffer.from(iv, 'hex')
    let cipherText = encoded.substring(32)
    cipherText = Buffer.from(cipherText, 'hex')
    const decipher = Crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
    let plainText = decipher.update(cipherText)
    plainText = Buffer.concat([plainText, decipher.final()])

    const email = plainText.toString()

    return await this.findByOrFail('email', email)
  }
}

module.exports = User
