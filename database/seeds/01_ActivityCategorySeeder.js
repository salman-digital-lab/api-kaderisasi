'use strict'

const Factory = use('Factory')

class ActivityCategorySeeder {
  async run () {
    await Factory.model('App/Models/ActivityCategory').createMany(5)
  }
}

module.exports = ActivityCategorySeeder
