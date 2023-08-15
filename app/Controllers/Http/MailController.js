'use strict'

const Database = use('Database')
const Mail = use('Mail')

class MailController {
  async sample ({ response }) {
    await Mail.raw('Text email....', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    return response.status(200).json({
      status: 'SUCCESS',
      message: 'Email terkirim'
    })
  }
}

module.exports = MailController
