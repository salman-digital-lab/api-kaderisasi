'use strict'

const { validateAll, validate, sanitizor } = use('Validator')
const ClassSectionVideo = use('App/Models/ClassSectionVideo')

class ClassSectionVideoController {
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
    const videos = await ClassSectionVideo
      .query()
      .where('section_id', params.id_section)
      .where('title', 'LIKE', `%${search}%`)
      .paginate(page, perPage)

    return response.json({
      status: 'SUCCESS',
      message: 'success get videos',
      data: videos
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
      const video = await ClassSectionVideo.find(id)

      if (video !== null) {
        return response
          .status(200)
          .json({
            status: 'SUCCESS',
            message: 'Video ditemukan',
            data: video
          })
      }

      return response
        .status(404)
        .json({
          status: 'FAILED',
          message: 'Video tidak ditemukan'
        })
    } catch (error) {
      response.status(500).json({
        status: 'FAILED',
        message: error.message
      })
    }
  }
}

module.exports = ClassSectionVideoController
