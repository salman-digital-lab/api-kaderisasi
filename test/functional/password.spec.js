'use strict'

const { before, test, trait, after } = use('Test/Suite')('User Password')

trait('DatabaseTransactions')
trait('Test/ApiClient')
trait('Auth/Client')

const User = use('App/Models/User')

// Data will be used accross test in this suite
trait((suite) => {
  suite.Context.macro('getExampleUser', async function () {
    return await User.first()
  })
})

// Only test response.
// timeout 0 -> no timeout.
test('make sure registered user can reset password', async ({ client, getExampleUser }) => {
  const user = await getExampleUser()

  const response = await client
    .post('v1/account/forgot_password')
    .send({ email: user.email })
    .end()

  response.assertStatus(200)
})

test('make sure unregistered user cannot reset password', async ({ client }) => {
  const response = await client
    .post('v1/account/forgot_password')
    .send({ email: '12345678@example.net' })
    .end()

  response.assertStatus(404)
})

// TODO
test('make sure that we can reset password with a given token', async ({ assert, getExampleUser, client }) => {
  const user = await getExampleUser()

  // get encryption
  const enc_text = user.AESEncrypt()

  const response = await client
    .put(`v1/account/reset_password/${enc_text}`)
    .send({ new_password: 'example2', password_confirmation: 'example2' })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 'SUCCESS',
    message: 'Password has succesfully updated'
  })

  /** assert we can login with new password */
  const loginResponse = await client
    .post('v1/auth')
    .send({
      email: user.email,
      password: 'example2'
    }).end()

  loginResponse.assertStatus(200)
})

// TODO
test('make sure that we cannot reset password if confirmation is wrong', async ({ assert, getExampleUser, client }) => {
  const user = await getExampleUser()

  // get encryption
  const enc_text = user.AESEncrypt()

  const response = await client
    .put(`v1/account/reset_password/${enc_text}`)
    .send({ new_password: 'example2', password_confirmation: 'qwerty' })
    .end()

  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'FAILED',
    message: 'Konfirmasi password salah'
  })

  /** assert we cannot login with new password */
  const loginResponse = await client
    .post('v1/auth')
    .send({
      email: user.email,
      password: 'example2'
    }).end()

  loginResponse.assertStatus(401)
})

// TODO
test('make sure that we cannot reset password for unknown encryption', async ({ assert, getExampleUser, client }) => {
  const user = await getExampleUser()

  // get encryption + gibberish
  const enc_text = user.AESEncrypt() + 'dnjn2jdn2md'

  const response = await client
    .put(`v1/account/reset_password/${enc_text}`)
    .send({ new_password: 'example2', password_confirmation: 'qwerty' })
    .end()

  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'FAILED',
    message: 'Konfirmasi password salah'
  })

  /** assert we cannot login with new password */
  const loginResponse = await client
    .post('v1/auth')
    .send({
      email: user.email,
      password: 'example2'
    }).end()

  loginResponse.assertStatus(401)
})

test('make sure user can change password', async ({ client, getExampleUser }) => {
  const user = await getExampleUser()

  const response = await client
    .put('v1/account/user/change_password')
    .send({
    	old_password: 'example',
    	new_password: 'example2'
    })
    .loginVia(user)
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
  	status: 'SUCCESS',
  	message: 'Password berhasil diupdate'
  })

  const loginResponse = await client
    .post('v1/auth')
    .send({
      email: user.email,
      password: 'example2'
    }).end()

  loginResponse.assertStatus(200)
})

test('make sure user cannot change password if old password is wrong', async ({ client, getExampleUser }) => {
  const user = await getExampleUser()

  const response = await client
    .put('v1/account/user/change_password')
    .send({
    	old_password: 'example3',
    	new_password: 'example2'
    })
    .loginVia(user)
    .end()

  response.assertStatus(401)
  response.assertJSONSubset({
    status: 'FAILED',
    message: 'Password lama salah'
  })
})
