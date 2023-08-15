'use strict'

const { before, test, trait, after } = use('Test/Suite')('User Login')

trait('DatabaseTransactions')
trait('Test/ApiClient')

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

test('test user login', async ({ client }) => {
  const response = await client
    .post('v1/auth')
    .send({
      email: '123@example.net',
      password: 'Example'
    }).end()

  // Assert Response
  response.assertStatus(200)
})

test('test user invalid login request', async ({ client }) => {
  const response = await client
    .post('v1/auth')
    .send({
      email: '123@example.net'
    }).end()

  response.assertStatus(401)
  response.assertJSONSubset({
    status: 'FAILED',
    message: 'required validation failed on password'
  })
})

test('test user login email not registered', async ({ client }) => {
  const response = await client
    .post('v1/auth')
    .send({
      email: '123.456@example.net',
      password: 'Example'
    }).end()

  response.assertStatus(401)
  response.assertJSONSubset({
    status: 'FAILED',
    message: 'Email is not registered'
  })
})

test('test user invalid password', async ({ client }) => {
  const response = await client
    .post('v1/auth')
    .send({
      email: '123@example.net',
      password: 'Examples'
    }).end()

  response.assertStatus(401)
  response.assertJSONSubset({
    status: 'FAILED',
    message: 'Invalid password'
  })
})
