'use strict'

const Member_m = use('App/Models/User')
const Database = use('Database')

class StatisticController {
  async getHomepageStatistic ({ response }) {
    try {
      const university_count = await Database
        .from('members')
        .countDistinct('university_id AS university_count')

      const kader_count = await Database
        .from('members')
        .count('* AS kader_count')

      const province_count = await Database
        .from('members')
        .countDistinct('province_id AS province_count')

      return response.status(200).json({
        status: 'SUCCESS',
        message: 'Berhasil mendapatkan statistik homepage',
        data: {
          university_count: university_count[0].university_count,
          kader_count: kader_count[0].kader_count,
          province_count: province_count[0].province_count
        }
      })
    } catch (err) {
      return response.status(500).json({
        status: 'FAILED',
        message: 'Gagal mendapatkan statistik homepage karena kesalahan server'
      })
    }
  }
}

module.exports = StatisticController
