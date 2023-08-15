'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Village = use('App/Models/Region/Village')
const Universities = use('App/Models/University')

class UserSeeder {
  async run () {
    const villages = await Village.all()

    const universities = await Universities.all()

    await Factory.model('App/Models/User').createMany(20, {
      universities: universities,
      villages: villages
    })
  }
}

module.exports = UserSeeder
