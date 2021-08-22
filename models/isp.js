const mongoose = require('mongoose')

const moment = require('moment')

const datemask = 'DD-MM-YY'
// const datemask = 'DD-MM-YY hh:mma'

const uidGenerator = require('node-unique-id-generator')

const Review = require('./review')

// this pakage creates an id field in db which increments sequentially

const AutoIncrement = require('mongoose-sequence')(mongoose)

const passportLocalMongoose = require('passport-local-mongoose')

// mongoose.set('useCreateIndex', true)

var ispSchema = new mongoose.Schema({

  nameOfIsp: {
    type: 'String',
  },
  username: {
    type: 'String'
  },
  email: {
    type: 'String'
  },
  phone: {
    type: 'String'
  },
  headOffice: String,
  establishedOn: {
    type: 'String'
  },
  registrationNumber: String,
  about: String,
  location: Array,
  logo: String,
  messengerLink: String,

  // it contains the customer info who have completed their profile,but verification is pending
  profileCompleteNotifications: [{
    customerId: String,
    username: String,
    phone: String,
    address: String,
    package: String,
    completionDate: {
      type: String,
      default: moment().format(datemask)
    },
    // status true means profile is complete
    status: Boolean,

  }],
  verified: Boolean,
  ispProfileComplete: Boolean,
  packageCounter: {
    type: Number,
    default: 0
  },
  // ispId: {
  //   type: 'String',
  //   default: function() {
  //     return uidGenerator.generateUniqueId(this.nameOfIsp.substring(0, 3))
  //   }
  // },
  memberSince: {
    type: 'String',
    default: function() {
      return moment().format(datemask)
    }
  },
  valid: Boolean


})
// this plugin ensures that email be used to identify isp
// ispSchema.plugin(passportLocalMongoose, { usernameField: 'email' })

// this plugin adds up an id field to schema which increments serially
// ispSchema.plugin(AutoIncrement, { inc_field: 'id' })
module.exports = mongoose.model('Isp', ispSchema)
