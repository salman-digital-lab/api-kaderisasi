'use strict'

const ActivityRegistration = require('../../Models/ActivityRegistration')

const Database = use('Database')
const ActivityCategory_m = use('App/Models/ActivityCategory')
const Activity_m = use('App/Models/Activity')
const ActivityRegistration_m = use('App/Models/ActivityRegistration')
const Member_m = use('App/Models/User')
const SaveQuestionnaire_m = use('App/Models/SaveQuestionnaire')
const MemberRole_m = use('App/Models/MemberRole')
const Env = use('Env')
const Logger = use('Logger')

const FormValidator = require('../../Validator/FormValidator')
const BadRequestException = use('App/Exceptions/BadRequestException')

class ActivityController {
  async getActivityCategories ({ response }) {
    try {
      const categories = await ActivityCategory_m
        .query()
        .select('id', 'name')
        .where('is_active', 1)
        .fetch()

      response.status(200).json({
        status: 'SUCCESS',
        message: 'Data berhasil dimuat.',
        data: categories
      })
    } catch (err) {
      response.status(500).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  async getPublishedActivities ({ request, response }) {
    try {
      const query = request.get()
      const where = {}

      if (query.category) {
        const category_name = await Database
          .select('id')
          .from('activity_categories')
          .where('name', query.category)
          .where('is_active', 1)  

        if (!category_name[0]) {
          throw new Error('Filter Nama Kategori Aktivitas tidak ditemukan')
        }

        where.category_id = category_name[0].id
      }

      if (query.minimum_role_id) {
        where.minimum_role_id = query.minimum_role_id
      }

      where.is_published = 1

      const keyword = (query.keyword) ? query.keyword : ''
      const page = (query.page) ? query.page : 1
      const perPage = (query.perPage) ? query.perPage : 10

      const activities = await Activity_m
        .query()
        .select('activities.*')
        .join('activity_categories', 'activity_categories.id', 'activities.category_id')
        .where(where)
        .where('activity_categories.is_active', 1)
        .where('activities.name', 'LIKE', `%${keyword}%`)
        .orWhere('activities.description', 'LIKE', `%${keyword}%`)
        .where(where)
        .where('activity_categories.is_active', 1)
        .orderBy('activities.id', 'desc')
        .with('activityCategory', (category) => {
          category.select('id', 'name') 
        })
        .with('minimumRoles')
        .with('carousel', (images) => {
          images.orderBy('id', 'ASC')
        })
        .paginate(page, perPage)

      const url = Env.get('CAROUSEL_URL')

      const activity = activities.toJSON()

      if (activity.data.length !== 0) {
        activity.data.forEach(item => {
          item.role = item.minimumRole
          item.banner_url = url
          item.banner_file = item.carousel[0]
          delete item.id
          delete item.form_data
          delete item.description
          delete item.minimum_role_id
          delete item.is_published
          delete item.is_deleted
          delete item.minimumRole
          delete item.carousel
        })

        return response.status(200).json({
          status: 'SUCCESS',
          message: 'Data berhasil dimuat.',
          data: activity
        })
      } else {
        return response.status(404).json({
          status: 'FAILED',
          message: 'Data tidak ditemukan.'
        })
      }
    } catch (err) {
      return response.status(500).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  async getActivityBySlug ({ params, response }) {
    try {
      const activity_detail = await Activity_m
        .query()
        .select('activities.*')
        .where('slug', params.slug)
        .where('is_published', 1)
        .join('activity_categories', 'activity_categories.id', 'activities.category_id')
        .where('activity_categories.is_active', 1)
        .with('activityCategory', (category) => {
          category.select('id', 'name') 
        })
        .with('minimumRole')
        .with('maximumRole')
        .with('carousel', (images) => {
          images.orderBy('id', 'ASC')
        })
        .fetch()
        
      if (!activity_detail.rows[0]) {
        return response.status(404).json({
          status: 'FAILED',
          message: 'Data tidak ditemukan.'
        })
      }

      const details = activity_detail.toJSON()
      delete details[0].form_data
      delete details[0].created_at
      delete details[0].is_published
      delete details[0].is_deleted
      delete details[0].viewer
      delete details[0].minimum_role_id
      delete details[0].maximum_role_id

      details[0].role_name = details[0].minimumRole.name
      details[0].max_role_name = details[0].maximumRole.name

      delete details[0].minimumRole
      delete details[0].maximumRole
      delete details[0].activityCategory

      const images_temp = details[0].carousel
      const images = []
      const url = Env.get('CAROUSEL_URL')

      if (activity_detail) {
        if (images_temp) {
          images_temp.forEach(item => {
            images.push(url + item.filename)
          })

          details[0].images = images
          delete details[0].carousel
        }

        response.status(200).json({
          status: 'SUCCESS',
          message: 'Data berhasil dimuat.',
          data: details
        })
      } else {
        response.status(404).json({
          status: 'FAILED',
          message: 'Data tidak ditemukan.'
        })
      }
    } catch (err) {
      response.status(500).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  async getFormTemplate ({ auth, params, response }) {
    const user = auth.user
    try {
      const member = await Member_m.find(user.id)
      const memberRoles = await MemberRole_m.all()
      const activity = await Activity_m
        .query()
        .select('activities.*')
        .join('activity_categories', 'activity_categories.id', 'activities.category_id')
        .where('activity_categories.is_active', 1)
        .where('slug', params.slug)
        .first()

      if (!activity) {
        return response.status(404).json({
          status: 'FAILED',
          message: 'Data tidak ditemukan.'
        })
      }
      
      if (activity.status == 'CLOSED') {
        return response.status(400).json({
          status: 'FAILED',
          message: 'Pendaftaran sudah ditutup.'
        })
      }

      const registered = await ActivityRegistration_m.findBy({ member_id: user.id, activity_id: activity.id })

      this.validateFormEndpointRequest(activity, member, registered, memberRoles)

      const form_data = JSON.parse(activity.form_data)

      if (form_data.length != 0) {
        return response.status(200).json({
          status: 'SUCCESS',
          message: 'Form berhasil dimuat.',
          data: form_data
        })
      } else {
        return response.status(200).json({
          status: 'SUCCESS',
          message: 'Pendaftaran tanpa kuesioner.'
        })
      }
    } catch (err) {
      return response.status(err.status).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  async submitForm ({ auth, params, request, response }) {
    const answer = request.post()
    const user = auth.user

    const trx = await Database.transaction()

    try {
      const activity = await Activity_m
        .query()
        .select('activities.*')
        .join('activity_categories', 'activity_categories.id', 'activities.category_id')
        .where('activity_categories.is_active', 1)
        .where('slug', params.slug)
        .first()

      if (!activity) {
        return response.status(404).json({
          status: 'FAILED',
          message: 'Data tidak ditemukan.'
        })
      }

      // Reject registration if activity is closed
      if (activity.status == 'CLOSED') {
        return response.status(400).json({
          status: 'FAILED',
          message: 'Pendaftaran sudah ditutup.'
        })
      }

      const member = await Member_m.find(user.id)
      const memberRoles = await MemberRole_m.all()
      const registered = await ActivityRegistration_m.findBy({ member_id: user.id, activity_id: activity.id })

      this.validateFormEndpointRequest(activity, member, registered, memberRoles)

      const registration = {}
      registration.member_id = member.id
      registration.activity_id = activity.id

      const insert = await trx
        .insert(registration)
        .into(ActivityRegistration_m.table)

      const form_data = JSON.parse(activity.form_data)

      const sanitized_answer = FormValidator.validate(form_data, answer)

      Logger.level = 'debug'
      Logger.transport('file').debug('start inserting answers', {'timestamps':Date.now()})
      for (const [key, value] of Object.entries(sanitized_answer)) {
        let values = JSON.stringify(value)

        if (values[0] == '"') {
          values = values.slice(1, -1)
        }
        await trx
          .insert({ id_registration: insert, id_name: key, answer: values })
          .into(SaveQuestionnaire_m.table)
      }

      trx.commit()
      Logger.transport('file').debug('finish inserting answers', {'timestamps':Date.now()})
      Logger.level = 'info'
      Logger.transport('file').info('request data', {
        'timestamps' : Date.now(),
        'method' : request.method(),
        'url' : request.url(),
        'headers' : request.headers()
      })

      return response.status(200).json({
        status: 'SUCCESS',
        message: 'Pendaftaran kamu berhasil.'
      })
    } catch (err) {
      trx.rollback()
      Logger.level = 'error'
      Logger.transport('file').error('error data', {
        'timestamps' : Date.now(),
        'status' : err.status,
        'message' : err.message,
        'stack' : err.stack
      })
      return response.status(err.status).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  async getFormAnswers({ auth, params, response }) {
    const user = auth.user
    try {
      const activity = await Activity_m.findBy('slug', params.slug)
      const registered = await ActivityRegistration_m.findBy({ member_id: user.id, activity_id: activity.id })
      const formData = JSON.parse(activity.form_data)

      // Reject registration if activity is closed
      if (activity.status == 'CLOSED') {
        return response.status(400).json({
          status: 'FAILED',
          message: 'Pendaftaran sudah ditutup.'
        })
      }

      if (!registered) {
        return response.status(403).json({
          status: 'FAILED',
          message: 'Kamu belum terdaftar pada kegiatan ini.'
        })
      }

      if (formData.length == 0) {
        return response.status(200).json({
          status: 'SUCCESS',
          message: 'Pendaftaran tanpa kuesioner.'
        })
      }

      const getAnswers = await SaveQuestionnaire_m
        .query()
        .where('id_registration', registered.id)
        .fetch()

      const answers = getAnswers.toJSON()

      answers.forEach(item=>{
        delete item.id
        delete item.id_registration
      })

      return response.status(200).json({
        status: 'SUCCESS',
        message: 'Kuesioner dan jawaban berhasil dimuat.',
        answers: answers, 
        form: formData
      })

    } catch (err) {
      return response.status(err.status).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  async saveFormAnswers({ auth, params, request, response }) {
    const answer = request.post()
    const user = auth.user

    try {
      const activity = await Activity_m.findBy('slug', params.slug)
      const registered = await ActivityRegistration_m.findBy({ member_id: user.id, activity_id: activity.id })
      const formData = JSON.parse(activity.form_data)

      // Reject registration if activity is closed
      if (activity.status == 'CLOSED') {
        return response.status(400).json({
          status: 'FAILED',
          message: 'Pendaftaran sudah ditutup.'
        })
      }

      // Reject registration if activity registration is outdated
      const current_date = new Date()
      if ((current_date <= activity.register_begin_date) || (current_date > activity.register_end_date)) {
        return response.status(400).json({
          status: 'FAILED',
          message: 'Tanggal pendaftaran tidak sesuai.'
        })
      }

      if (!registered) {
        return response.status(403).json({
          status: 'FAILED',
          message: 'Kamu belum terdaftar pada kegiatan ini.'
        })
      }

      if (formData.length == 0) {
        return response.status(200).json({
          status: 'SUCCESS',
          message: 'Pendaftaran tanpa kuesioner.'
        })
      }

      const sanitized_answer = FormValidator.validate(formData, answer)

      for (const [key, value] of Object.entries(sanitized_answer)) {
        let values = JSON.stringify(value)

        if (values[0] == '"') {
          values = values.slice(1, -1)
        }

        await SaveQuestionnaire_m
          .query()
          .where({id_registration: registered.id, id_name: key})
          .update({answer: values})
      }

      response.status(200).json({
        status: 'SUCCESS',
        message: 'Jawaban kuesioner berhasil disimpan.'
      })

    } catch (err) {
      response.status(500).json({
        status: 'FAILED',
        message: err.message
      })
    }
  }

  checkIndex (objects, objId) {
    // a function that returns role index as we are not using ID anymore to see the order
    var row = objects.find(obj => obj.id == objId)
    return row.index
  }

  /**
   * Since the requirement is the same for GET and POST
   * Opt to move validation to inside this function
   * */
  validateFormEndpointRequest (activity, member, registered, memberRoles) {
    const dataCheck = Boolean(member.phone &&
                                 member.line_id &&
                                 member.province_id &&
                                 member.regency_id &&
                                 member.district_id &&
                                 member.village_id &&
                                 member.date_of_birthday &&
                                 member.current_address &&
                                 member.university_id &&
                                 member.faculty &&
                                 member.major)

    if (!dataCheck) {
      throw new BadRequestException('Kamu belum melengkapi data pengguna.', 422)
    }

    const roles = memberRoles.toJSON()

    var member_role = this.checkIndex(roles, member.role_id)
    var minimum_role = this.checkIndex(roles, activity.minimum_role_id)
    var maximum_role = this.checkIndex(roles, activity.maximum_role_id)

    if (member_role > maximum_role || member_role < minimum_role) {
      throw new BadRequestException('Jenjangmu di luar syarat untuk mengikuti kegiatan ini.', 403)
    }

    const current_date = new Date()
    if ((current_date <= activity.register_begin_date) || (current_date > activity.register_end_date)) {
      throw new BadRequestException('Tanggal pendaftaran tidak sesuai', 400)
    }

    if (registered) {
      throw new BadRequestException('Kamu sudah pernah mendaftar di kegiatan ini.', 409)
    }
  }
}

module.exports = ActivityController
