const Route = use('Route')

Route.get(
  'v1/unsubscribe/:id',
  'NewsletterController.unsubscribe'
)