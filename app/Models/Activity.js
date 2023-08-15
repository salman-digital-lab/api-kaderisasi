'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Activity extends Model {
  static boot () {
    super.boot()
    this.addTrait('NoTimestamp')
  }

  static get table () {
    return 'activities'
  }

  activityCategory () {
    return this.hasOne('App/Models/ActivityCategory', 'category_id', 'id')
  }

  minimumRole () {
    return this.hasOne('App/Models/MemberRole', 'minimum_role_id', 'id')
  }

  maximumRole () {
    return this.hasOne('App/Models/MemberRole', 'maximum_role_id', 'id')
  }

  carousel () {
    return this.hasMany('App/Models/ActivityCarousel', 'id', 'activity_id')
  }
}

module.exports = Activity
