'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

// Require the helper
const QuestionnaireSeedingHelper = require('./helpers/QuestionnaireSeedingHelper')

Factory.blueprint('App/Models/University', (faker) => {
  return {
    name: 'University of '.concat(faker.city())
  }
})

Factory.blueprint('App/Models/User', (faker, index, data) => {
  const birthday_year = faker.integer({ min: 1990, max: 1999 })
  const birthday_month = faker.integer({ min: 1, max: 12 })
  const birthday_day = faker.integer({ min: 1, max: 20 })
  const university = faker.pickone(data.universities.rows)
  const village = faker.pickone(data.villages.rows)

  // Note : Very LUCKILY we can infer the province, regency, district id solely from village id
  // We need to fix this
  return {
    name: faker.name(),
    phone: '+1 234 567 89',
    gender: faker.pickone(['M', 'F']),
    email: faker.email(),
    line_id: '@' + faker.string({ alpha: true, numeric: true }),
    date_of_birthday: birthday_year + '-' + birthday_month + '-' + birthday_day,
    city_of_birth: faker.city(),
    from_address: faker.address(),
    current_address: faker.address(),
    faculty: faker.pickone(['Medicine', 'Humanitarian Studies', 'Engineering']),
    major: faker.pickone(['Mathematics, Politics, Law']),
    student_id: faker.string({ numeric: true, length: 12 }),
    intake_year: faker.pickone([2016, 2017, 2018, 2019, 2020]),
    role_id: faker.pickone([4, 5, 6, 7]),
    password: 'example',
    university_id: university.id,
    province_id: village.id.substring(0, 2),
    regency_id: village.id.substring(0, 4),
    district_id: village.id.substring(0, 7),
    village_id: village.id
  }
})

Factory.blueprint('App/Models/Activity', (faker, index, data) => {
  const year = faker.integer({ min: 2018, max: 2020 })
  const begin_day = faker.integer({ min: 5, max: 12 })
  const begin_month = faker.integer({ min: 5, max: 8 })
  const end_day = faker.integer({ min: 13, max: 20 })
  const end_month = faker.integer({ min: 9, max: 12 })

  const reg_day = faker.integer({ min: 1, max: 20 })
  const begin_reg_month = 3
  const end_reg_month = 4

  const form_object = QuestionnaireSeedingHelper.formObject

  return {
    name: faker.sentence(),
    slug: faker.word({ length: 10 }),
    description: faker.paragraph(),
    begin_date: year + '-' + begin_month + '-' + begin_day,
    end_date: year + '-' + end_month + '-' + end_day,
    register_begin_date: year + '-' + begin_reg_month + '-' + reg_day,
    register_end_date: year + '-' + end_reg_month + '-' + reg_day,
    minimum_role_id: faker.pickone([4, 5, 6, 7]),
    category_id: faker.pickone(data.categories.rows).id,
    form_data: JSON.stringify(form_object)
  }
})

Factory.blueprint('App/Models/ActivityCategory', (faker) => {
  return {
    name: faker.word()
  }
})
