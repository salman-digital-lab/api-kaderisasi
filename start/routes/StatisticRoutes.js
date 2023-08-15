const Route = use('Route')

Route.group(() => {

    Route.get(
        '/homepage',
        'StatisticController.getHomepageStatistic'
    );

}).prefix('/v1/statistics');