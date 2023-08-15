const Route = use('Route')

Route.group(() => {
  Route.get('/section/:id_section/video', 'ClassSectionVideoController.index')
  Route.get('/section/video/:id', 'ClassSectionVideoController.show')
  Route.get('/:id_class/section', 'ClassSectionController.index')
  Route.get('/section/:id', 'ClassSectionController.show')
  Route.get('/', 'ClassController.index')
  Route.get('/:id', 'ClassController.show')
}).prefix('v1/class')