'use strict'

const Database = use('Database')
const Checklist = use('App/Models/Checklist')
const MemberChecklist = use('App/Models/MemberChecklist')
const { validate, validateAll, sanitizor } = use('Validator')

class ChecklistController {
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
    const checklists = await Checklist
      .query()
      .where('checklist_name', 'LIKE', `%${search}%`)
      .paginate(page, perPage)

    return response.json({ status: 'SUCCESS', message: 'success get checklists', data: checklists })
  }

  async member ({ auth, response }) {
    const id = auth.user.id
    try {
      const checklists = await Checklist
        .query()
        .whereIn(
          'id',
          Database
            .from('member_checklists')
            .select('checklist_id')
            .where('member_id', id)
        )
        .select('id', 'checklist_name')
        .fetch()

      return response.json({
        status: 'SUCCESS',
        message: 'Berhasil get checklists',
        data: checklists
      })
    } catch (error) {
      return response.json({
        status: 'FAILED',
        message: error.code
      })
    }
  }

  async tick ({ auth, response, params }) {
    const data = params
    const rules = {
      checklist_id: 'required|number'
    }
    const validation = await validate(data, rules)
    if (validation.fails()) {
      return response.status(404).json({ status: 'FAILED', messages: validation.messages() })
    }

    const check = await MemberChecklist
      .query().where('member_id', auth.user.id)
      .where('checklist_id', data.checklist_id)
      .first()
    if (check) {
      return response.status(409).json({
        status: 'FAILED',
        message: 'Checklist ini sudah di centang'
      })
    }

    try {
      await MemberChecklist.create({
        member_id: auth.user.id,
        checklist_id: data.checklist_id
      })

      return response.json({
        status: 'SUCCESS',
        message: 'Berhasil mencentang checklist'
      })
    } catch (error) {
      return response.status(500).json({
        status: 'FAILED',
        message: error.code
      })
    }
  }

  async untick ({ auth, params, response }) {
    const untick = await MemberChecklist
      .query().where('member_id', auth.user.id)
      .where('checklist_id', params.checklist_id)
      .first()
    if (!untick) {
      return response.status(404).json({
        status: 'FAILED',
        message: 'Data tidak ditemukan'
      })
    }

    try {
      untick.delete()
      return response.json({
        status: 'SUCCESS',
        message: 'Berhasil Un-Centang checklist'
      })
    } catch (error) {
      return response.status(500).json({
        status: 'FAILED',
        message: error.code
      })
    }
  }
}

module.exports = ChecklistController
