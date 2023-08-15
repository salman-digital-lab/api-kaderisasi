const Route = use('Route')

Route.group(() => {

    Route.get(
        '/',
        'UniversityController.getUniversities'
    );

}).prefix('/v1/universities');
