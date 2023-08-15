'use strict'

const Class = use('App/Models/Class')
const { validate, validateAll, sanitizor } = use('Validator')

class ClassController {
  async index ({ response, request }) {
    const data = request.all()
    const rules = {
      search: 'string',
      page: 'number',
      perPage: 'number'
    }

    const validation = await validateAll(data, rules)

    if (validation.fails()) {
      return response
        .status(400)
        .json({
          status: 'FAILED',
          message: validation.messages()
        })
    }

    const search = data.search ? sanitizor.escape(data.search) : ''
    const page = data.page ? data.page : 1
    const perPage = data.perPage ? data.perPage : 10
    const kelas = await Class
      .query()
      .where('title', 'LIKE', `%${search}%`)
      .orWhere('description', 'LIKE', `%${search}%`)
      .paginate(page, perPage)
    return response.json({
      status: 'SUCCESS',
      message: 'success get class',
      data: kelas
    })
  }

  async show ({ params, response }) {
    const id = params.id
    const rules = {
      id: 'required|number'
    }

    const validation = await validate(id, rules)
    if (validation.fails()) {
      return response
        .status(400)
        .json({
          status: 'FAILED',
          message: validation.messages()
        })
    }

    try {
      const kelas = await Class.find(id)

      if (kelas !== null) {
        return response
          .status(200)
          .json({
            status: 'SUCCESS',
            message: 'Kelas ditemukan',
            data: kelas
          })
      }

      return response
        .status(404)
        .json({
          status: 'FAILED',
          message: 'Kelas tidak ditemukan'
        })
    } catch (error) {
      response.status(500).json({
        status: 'FAILED',
        message: error.message
      })
    }
  }
}

module.exports = ClassController
