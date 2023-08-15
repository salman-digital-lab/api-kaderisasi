'use strict'

/*
|--------------------------------------------------------------------------
| UniversitySeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

class UniversitySeeder {
  async run () {
  	await Factory.model('App/Models/University').createMany(20)
  }
}

module.exports = UniversitySeeder
