'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Village extends Model {
  static boot () {
    super.boot()
    this.addTrait('NoTimestamp')
  }

  static get table () {
    return 'region_villages'
  }
}

module.exports = Village
