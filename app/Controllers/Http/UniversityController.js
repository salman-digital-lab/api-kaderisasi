'use strict'

const University = use('App/Models/University')
class UniversityController {
  async getUniversities ({ response }) {
    try {
      const universities = await University.all()

      response.status(200).json({
        status: 'SUCCESS',
        message: 'Berhasil mendapatkan data universitas',
        data: universities
      })
    } catch (err) {
      response.status(500).json({
        status: 'FAILED',
        message: 'Gagal mendapatkan data universitas karena kesalahan server'
      })
    }
  }
}

module.exports = UniversityController
