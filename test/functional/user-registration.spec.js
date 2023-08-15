'use strict'

const { test, trait } = use('Test/Suite')('User Registration')
const User = use('App/Models/User')

trait('DatabaseTransactions')
trait('Test/ApiClient')

// Register user successfull
test('register user', async ({ client }) => {
  const response = await client
      	.post('v1/account/register')
      	.send({
      		email: '123@example.net',
      		password: 'Example',
      		name: 'Example Name',
      		is_subscribing: 1
      	}).end()

  	// Assert Response
  	response.assertStatus(200)
  	response.assertJSONSubset({
    status: 'SUCCESS',
  		  data_profile: {
      		email: '123@example.net',
      		name: 'Example Name',
      		is_subscribing: 1,
      role_id: 4
  	}
  })

  	// Assert data in database
})

test('register user missing field', async ({ client }) => {
  const response = await client
    .post('v1/account/register')
    .send({
      email: '123@example.net',
      name: 'Example Name',
      is_subscribing: 1
    }).end()

  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'FAILED'
  })
})

// Assert we cannot enter duplicate email
test('register user duplicate email', async ({ client }) => {
  const user_data = {
    email: '123@example.net',
    password: 'Example',
    is_subscribing: 1,
    name: 'Example Name'
  }

  await User.create(user_data)

  const response = await client
    .post('v1/account/register')
    .send(user_data)
    .end()

  response.assertStatus(409)
})
