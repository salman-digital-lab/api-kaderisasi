const Route = use('Route')

Route.group(() => {
    Route.get('categories', 'ActivityController.getActivityCategories').as('activity.getAllCategories')
    Route.get('', 'ActivityController.getPublishedActivities').as('activity.getAll')
    Route.get(':slug/details', 'ActivityController.getActivityBySlug').as('activity.getBySlug')
    Route.get(':slug/register', 'ActivityController.getFormTemplate').as('activity.getQuestionnaire').middleware('auth')
    Route.post(':slug/register/submit', 'ActivityController.submitForm').as('activity.Registration').middleware('auth')
    Route.get(':slug/form-edit', 'ActivityController.getFormAnswers').middleware('auth')
    Route.put(':slug/form-edit/save', 'ActivityController.saveFormAnswers').middleware('auth')
  }).prefix('v1/activity')