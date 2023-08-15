'use strict'

const Factory = use('Factory')
const ActivityCategory = use('App/Models/ActivityCategory')
const ActivityCarousel = use('App/Models/ActivityCarousel')
const Activity = use('App/Models/Activity')
const Database = use('Database')

class ActivitySeeder {
  async run () {
  	const categories = await ActivityCategory.all()

    await Factory.model('App/Models/Activity').createMany(100, {
    	categories: categories
    })

    const activities = await Activity.all()

    /** Banner seeding, not separated so that we always this with Activity Seeding */
    const banners = activities.rows.map(function (activity) {
    	return [
    	{
    		activity_id: activity.id,
    		filename: 'main.jpg'

    	},
    	{
    		activity_id: activity.id,
    		filename: 'banner1.jpg'
    	},
    	{
    		activity_id: activity.id,
    		filename: 'banner2.jpg'
    	}
    	]
    })

    /** is flat available ? no */
    const reduced_banners = banners.reduce((acc, current) => {
      return acc.concat(current)
    })

    await Database.insert(reduced_banners).into(ActivityCarousel.table)
  }
}

module.exports = ActivitySeeder
