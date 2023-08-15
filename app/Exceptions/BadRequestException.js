'use strict'

const { LogicalException } = require('@adonisjs/generic-exceptions')

/** Just a wrapper */

const default_status = 400
const default_code = ''

class BadRequestException extends LogicalException {
  /**
   * Handle this exception by itself
   */
  // handle () {}

  constructor (message, status) {
    super(message, status, default_code)
  }
}

module.exports = BadRequestException
