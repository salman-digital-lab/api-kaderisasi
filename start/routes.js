'use strict'

const Route = use('Route')

require('./routes/ActivityRoutes')
require('./routes/ChecklistRoutes')
require('./routes/ClassRoutes')
require('./routes/NewsletterRoutes')
require('./routes/RegionRoutes')
require('./routes/StatisticRoutes')
require('./routes/StudentCareRoutes')
require('./routes/UniversityRoutes')

Route.get('/', ({ view }) => {
  return view.render('welcome')
})

Route.group(() => {
  Route.get('user/activities', 'AuthController.activities').middleware('auth')
  Route.get('user/studentCares', 'AuthController.studentCares').middleware('auth')
  Route.put('user/profile_pic', 'AuthController.changeProfile').middleware('auth')
  Route.put('user/change_password', 'AuthController.changePassword').middleware('auth')
  Route.post('forgot_password', 'AuthController.forgotPassword')
  Route.put('reset_password/:encrypt', 'AuthController.resetPassword')
  Route.get('user', 'AuthController.get').middleware('auth')
  Route.put('update', 'AuthController.update').middleware('auth')
  Route.post('register', 'AuthController.register')
}).prefix('/v1/account')

Route.post('/v1/auth', 'AuthController.login')
Route.get('/v1/mails', 'MailController.sample')
