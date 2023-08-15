'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ActivityCategory extends Model {
  static boot () {
    super.boot()
    this.addTrait('NoTimestamp')
  }

  static get table () {
    return 'activity_categories'
  }
}

module.exports = ActivityCategory
