'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class StudentCare extends Model {
    static get table () {
        return 'student_care'
      }
}

module.exports = StudentCare
