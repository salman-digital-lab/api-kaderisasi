const Route = use('Route')

Route.group(() => {
  Route.get('', 'ChecklistController.index')
  Route.get('/member', 'ChecklistController.member')
  Route.post('/tick/:checklist_id', 'ChecklistController.tick')
  Route.delete('/untick/:checklist_id', 'ChecklistController.untick')
}).prefix('v1/checklist').middleware('auth')