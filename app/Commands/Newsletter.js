'use strict'

const { Command } = require('@adonisjs/ace')
const Crypto = require('crypto')
const Mail = use('Mail')
const Database = use('Database')
const Member = use('App/Models/User')
const Activity = use('App/Models/Activity')
const Carousel = use('App/Models/ActivityCarousel')
const Env = use('Env')

class Newsletter extends Command {
  static get signature () {
    return 'newsletter'
  }

  static get description () {
    return 'Send emails consist recently published activity to subscribed user'
  }

  async handle (args, options) {
    const activity = Activity.table
    const carousel = Carousel.table
    try {
      // getting activities & images published yesterday
      const queries = `SELECT ${activity}.name, ${activity}.slug, ${activity}.register_begin_date, ${activity}.register_end_date, ${activity}.begin_date, ${carousel}.filename FROM ${activity} INNER JOIN ${carousel} ON ${activity}.id = ${carousel}.activity_id WHERE date(${activity}.created_at) = subdate(current_date, 1) AND ${activity}.is_published = 1 AND ${activity}.status = 'OPENED' GROUP BY ${activity}.slug`
      let activities = await Database.raw(queries)
      activities = activities[0]

      if (activities.length !== 0) {
        // getting subscribed users
        const subscriberData = await Member
          .query()
          .select('name', 'email')
          .where('is_subscribing', 1)
          .fetch()

        const subscribers = subscriberData.toJSON()

        // convert db date to Indonesian date
        function convertToDateInd (string) {
          const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

          var date = string.split('-')[2]
          var month = string.split('-')[1]
          var year = string.split('-')[0]

          if (month[0] == '0') {
            month = month[1]
          }

          return date + ' ' + months[month] + ' ' + year
        }

        let temp; let temp1; let temp2 = ''
        activities.forEach(function (item) {
          temp = convertToDateInd(item.register_begin_date)
          temp1 = convertToDateInd(item.register_end_date)
          temp2 = convertToDateInd(item.begin_date)
          item.register_begin_date = temp
          item.register_end_date = temp1
          item.begin_date = temp2
        })

        // encrypt function
        function encrypt (plainText) {
          const key = Env.get('NEWSLETTER_KEY')
          const algorithm = Env.get('NEWSLETTER_ENC')
          const iv = Crypto.randomBytes(16)

          const cipher = Crypto.createCipheriv(algorithm, Buffer.from(key), iv)
          let encrypted = cipher.update(plainText)
          encrypted = Buffer.concat([encrypted, cipher.final()])
          const encoded = encrypted.toString('hex')
          const encodedIv = iv.toString('hex')
          const cipherText = encodedIv + encoded
          return cipherText
        }

        // sending emails
        const carouselUrl = Env.get('CAROUSEL_URL')
        const publicActivityUrl = Env.get('PUBLIC_ACTIVITY_URL')
        const publicUnsubscribeUrl = Env.get('PUBLIC_UNSUBSCRIBE_URL')

        for (let i = 0; i < subscribers.length; i++) {
          var user = subscribers[i]
          const token = encrypt(user.email)
          await Mail.send('emails/newsletter', { activities, user, publicActivityUrl, carouselUrl, publicUnsubscribeUrl, token }, (message) => {
            message
              .from(Env.get('MAIL_FROM'), 'Aktivis Salman ITB - Unit BMKA [Badan Kemahasiswaan, Kaderisasi dan Alumni]')
              .subject('Notifikasi Kegiatan Baru')
              .to(user.email)
          })
        }
        console.log(`${this.icon('success')} Emails have been sent`)
      }

      Database.close()
      console.log(`${this.icon('success')} Completed`)
    } catch (error) {
      console.log(error.message)
    }
  }
}

module.exports = Newsletter
