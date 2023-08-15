'use strict'

const { test, trait } = use('Test/Suite')('Activity')
const Activity = use('App/Models/Activity')

trait('DatabaseTransactions')
trait('Test/ApiClient')

test('activity paging test', async ({ assert, client }) => {
  let n_activities = await Activity
    .query()
    .where({ is_published: 1 })
    .getCount()

  // use awkward number
  const limit = 9

  let page = 1

  while (n_activities > 0) {
    const n_item_this_page = n_activities < limit ? n_activities : limit
    const response = await client
      .get('v1/activity')
      .query({ perPage: limit, page: page })
      .end()

    response.assertStatus(200)

    const data = response.body.data.data
    assert.lengthOf(data, n_item_this_page)

    const expected_fields = [
      'name',
      'slug',
      'begin_date',
      'end_date',
      'register_begin_date',
      'register_end_date',
      'status',
      'category_id',
      'created_at',
      'viewer',
      'maximum_role_id',
      'activityCategory',
      'role',
      'banner_url',
      'banner_file',
    ]

    for (let i = 0; i < data.length; i++) {
      assert.hasAllKeys(data[i], expected_fields)
    }

    page += 1
    n_activities -= n_item_this_page
  }
})

// Inject an activity and check details
test('activity detail test', async ({ client, assert }) => {
  const activity_data = {
    name: 'Test Activity',
    slug: 'test-activity',
    description: 'Test Activity',
    begin_date: '2020-03-22',
    end_date: '2020-03-24',
    register_begin_date: '2020-02-19',
    register_end_date: '2020-02-23',
    minimum_role_id: 4,
    category_id: 3
  }

  const validation_data = [{
    name: 'Test Activity',
    slug: 'test-activity',
    description: 'Test Activity'
  }]

  const activity = await Activity.create(activity_data)

  const response = await client
    .get(`v1/activity/${activity_data.slug}/details`)
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 'SUCCESS',
    data: validation_data
  })

  const expected_fields = [
    'id',
    'name',
    'slug',
    'description',
    'begin_date',
    'end_date',
    'register_begin_date',
    'register_end_date',
    'status',
    'category_id',
    'maximum_role_id',
    'role_name',
    'images'
  ]

  assert.hasAllKeys(response.body.data[0], expected_fields)
})
