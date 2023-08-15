'use strict'

const { before, test, trait, after } = use('Test/Suite')('User functionalities')

trait('DatabaseTransactions')
trait('Test/ApiClient')
trait('Auth/Client')

const User = use('App/Models/User')

// Data will be used accross test in this suite
before(async () => {
  await User.create({
    email: '123@example.net',
    password: 'Example',
    name: 'Example Name',
    is_subscribing: 1,
    role_id: 3
  })
})

after(async () => {
  await User
    .query()
    .where('email', '123@example.net')
    .delete()
})

trait((suite) => {
  suite.Context.macro('getAnUser', async function () {
    return await User.first()
  })
})

test('test get user', async ({ client }) => {
  const user = await User
    .query()
    .where('email', '123@example.net')
    .first()

  const response = await client
    .get('v1/account/user')
    .loginVia(user)
    .end()

  response.assertStatus(200)
})

test('test valid user update', async ({ assert, client }) => {
  const user = await User
    .query()
    .where('email', '123@example.net')
    .first()

  const data = {
    name: 'Example Name',
    gender: 'M',
    email: '123@example.net',
    phone: '01488115',
    line_id: 'fakelineid',
    date_of_birthday: '1999-01-01',
    city_of_birth: 'Newark',
    province_id: '11',
    regency_id: '1102',
    district_id: '1102020',
    village_id: '1101020023',
    from_address: '1 Elm Street',
    current_address: '3 Oak Drive',
    university_id: 5,
    intake_year: 2017,
    faculty: 'Science',
    major: 'Biology',
    student_id: '541859115',
    is_subscribing: 1,
    role_id: 3
  }

  const response = await client
    .put('v1/account/update')
    .send(data)
    .loginVia(user)
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 'SUCCESS',
    message: 'User data updated',
    data: data
  })

  // Issue : Also assert that we don't instead add new user
  const user_count = await User
    .query()
    .where('email', '123@example.net')
    .getCount()

  assert.equal(user_count, 1)
})

// We took out date_of_birthday
// Should be random ??
test('test missing field user update', async ({ client }) => {
  const user = await User
    .query()
    .where('email', '123@example.net')
    .first()

  const data = {
    name: 'Example Name',
    gender: 'M',
    email: '123@example.net',
    phone: '01488115',
    line_id: 'fakelineid',
    city_of_birth: 'Newark',
    province_id: '11',
    regency_id: '1102',
    district_id: '1102020',
    village_id: '1101020023',
    from_address: '1 Elm Street',
    current_address: '3 Oak Drive',
    university_id: 5,
    intake_year: 2017,
    faculty: 'Science',
    major: 'Biology',
    student_id: '541859115',
    is_subscribing: 1,
    role_id: 3
  }

  const response = await client
    .put('v1/account/update')
    .send(data)
    .loginVia(user)
    .end()

  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'FAILED',
    message: [{
      message: 'required validation failed on date_of_birthday',
      field: 'date_of_birthday',
      validation: 'required'
    }]
  })
})

// Return 500, which is like not really good
test('test invalid value update', async ({ client }) => {
  const user = await User
    .query()
    .where('email', '123@example.net')
    .first()

  // Use unknown province ID
  const data = {
    name: 'Example Name',
    gender: 'M',
    email: '123@example.net',
    phone: '01488115',
    line_id: 'fakelineid',
    date_of_birthday: '1999-01-01',
    city_of_birth: 'Newark',
    province_id: '51511',
    regency_id: '1102',
    district_id: '1102020',
    village_id: '1101020023',
    from_address: '1 Elm Street',
    current_address: '3 Oak Drive',
    university_id: 5,
    intake_year: 2017,
    faculty: 'Science',
    major: 'Biology',
    student_id: '541859115',
    is_subscribing: 1,
    role_id: 3
  }

  const response = await client
    .put('v1/account/update')
    .send(data)
    .loginVia(user)
    .end()

  response.assertStatus(500)
})

/** Test for registered activites endpoint */
test('test registered activites comply with specification', async ({ assert, client, getAnUser }) => {
  const user = await getAnUser()

  const expectedFields = [
    'name',
    'slug',
    'begin_date',
    'end_date',
    'register_begin_date',
    'register_end_date',
    'status',
    'category_id',
    'created_at',
    'viewer',
    'category',
    'activity_registration',
    'minimum_role',
    'banner_image',
  ]

  const response = await client
    .get('/v1/account/user/activities')
    .loginVia(user)
    .end()

  response.assertStatus(200)
  const data = response.body.data.data

  for (let i = 0; i < data.length; i++) {
    assert.hasAllKeys(data[i], expectedFields)
  }
})
