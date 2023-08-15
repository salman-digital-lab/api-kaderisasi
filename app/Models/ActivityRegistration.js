'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ActivityRegistration extends Model {
  static get table () {
    return 'activity_registrations'
  }

  static registrationStatus () {
    return ['REGISTERED', 'JOINED', 'PASSED', 'FAILED', 'REJECTED']
  }

  activity () {
    return this.hasOne('App/Models/Activity', 'activity_id', 'id')
  }
}

module.exports = ActivityRegistration
