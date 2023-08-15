'use strict'

const Mail = use('Mail')
const Database = use('Database')
const Env = use('Env')

const { validateAll } = use('Validator')

class StudentCareController {
  async add ({ request, response, auth }) {
    const rules = {
      problem_owner: 'required',
      problem_owner_name: 'required',
      problem_category: 'required',
      problem_category_desk: 'required',
      technical_handling: 'required',
      counselor_gender: 'required'
    }

    const validation = await validateAll(request.all(), rules)

    if (validation.fails()) {
      return response.status(400).json(
        {
          status: 'FAILED',
          message: validation.messages()[0].message
        })
    }

    const data = {
      member_id: auth.user.id,
      problem_owner: request.input('problem_owner'),
      problem_owner_name: request.input('problem_owner_name'),
      problem_category: request.input('problem_category'),
      problem_category_desk: request.input('problem_category_desk'),
      technical_handling: request.input('technical_handling'),
      counselor_gender: request.input('counselor_gender'),
      created_at: new Date()
    }

    const tambahData = await Database
      .table('student_care')
      .insert(data)

    if (tambahData) {
      const email_konselor = await Database
        .select('users.email')
        .from('users')
        .innerJoin('users_groups', 'users.id', 'users_groups.user_id')
        .innerJoin('groups', 'users_groups.group_id', 'groups.id')
        .where('groups.name', 'KONSELOR')

      delete data.member_id
      delete data.created_at

      data.konselorUrl = Env.get('STUDENTCARE_URL') + tambahData[0]

      const emails = []
      for (let i=0; i<email_konselor.length; i++) {
        emails.push(email_konselor[i].email)
      }

      await Mail.send('emails/studentcare', data, (message) => {
        message
          .to(emails)
          .from(process.env.MAIL_USERNAME)
          .subject('Laporan kasus Student Care baru')
      })

      const nama = request.input('problem_owner_name')
      return response.status(200).json({
        status: 'SUCCESS',
        message: `Yeay, terima kasih ${nama}, datamu telah berhasil direkam. Tim kami akan menghubungimu maksimal 3x24 jam melalui email, WA, atau LINE sesuai dengan data yang tertulis di data profilmu. Pastikan datamu sudah benar!`
      })
    } else {
      return response.status(500).json({
        status: 'FAILED',
        message: 'Maaf data Anda gagal di input! Coba lagi'
      })
    }
  }
}

module.exports = StudentCareController
