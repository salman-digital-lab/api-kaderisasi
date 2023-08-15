'use strict'

const { validateAll, validate, sanitizor } = use('Validator')
const ClassSection = use('App/Models/ClassSection')

class ClassSectionController {
  async index ({ response, request, params }) {
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
          message: validation.messages()[0]
        })
    }

    const search = data.search ? sanitizor.escape(data.search) : ''
    const page = data.page ? data.page : 1
    const perPage = data.perPage ? data.perPage : 10
    const sections = await ClassSection
      .query()
      .where('class_id', params.id_class)
      .where('title', 'LIKE', `%${search}%`)
      .paginate(page, perPage)

    return response.json({
      status: 'SUCCESS',
      message: 'success get sections',
      data: sections
    })
  }

  async show ({ params, response }) {
    const id = params.id

    if (isNaN(id)) {
      return response.status(400).json({
        status: 'FAILED',
        message: 'Parameter id harus berupa angka'
      })
    }

    try {
      const section = await ClassSection.find(id)

      if (section !== null) {
        return response
          .status(200)
          .json({
            status: 'SUCCESS',
            message: 'Section ditemukan',
            data: section
          })
      }

      return response
        .status(404)
        .json({
          status: 'FAILED',
          message: 'Section tidak ditemukan'
        })
    } catch (error) {
      response.status(500).json({
        status: 'FAILED',
        message: error.message
      })
    }
  }
}

module.exports = ClassSectionController
