const Route = use('Route')

Route.post('/v1/member/studentCare', 'StudentCareController.add').middleware('auth')

