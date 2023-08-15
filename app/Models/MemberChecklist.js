'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class MemberChecklist extends Model {
  static get table () {
    return 'member_checklists'
  }

  checklists () {
    return this.belongsTo('App/Models/Checklist')
  }
}

module.exports = MemberChecklist
