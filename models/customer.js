const mongoose = require('mongoose')

const moment = require('moment')

const datemask = 'DD-MM-YY'

const uidGenerator = require('node-unique-id-generator')

// this package creates a field in db which increments sequentially

const AutoIncrement = require('mongoose-sequence')(mongoose)



const passportLocalMongoose = require('passport-local-mongoose')

mongoose.set('useCreateIndex', true)

const customerSchema = new mongoose.Schema({
  nameOfCustomer: {
    type: 'String'
  },
  email: {
    type: 'String'
  },
  nameOfIsp: {
    type: 'String'
  },
  username: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  phone: {
    type: 'String'
  },

  package: {
    type: 'String'
    // required:true,
  },
  customerId: {
    type: String
    // unique:true,
  },
  address: String,

 
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  // when user completes profile this is true
  complete: {
    type: Boolean
  },
  profileComplete: Boolean,
  // if user.ispVerificationStatus equals 0, user registered but didn't complete profile, when 1, user completes profile
  // but still ISP didn't verify, if 2, ISP verified as valid and user can review, if 3, ISP verified as invalid.
  // profileComplete global var is set to true/false depedning on value of ispNotificationStatus
  ispVerificationStatus: Number,
  userId: {
    type: 'String',
    default: function() {
      return uidGenerator.generateUniqueId(this.username.substring(0, 3))
    }
  },
  ticket: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  memberSince: {
    type: 'String',
    default: function() {
      return moment().format(datemask)
    }
  }


})
// this plugin ensures that email be used to identify isp
customerSchema.plugin(passportLocalMongoose, { usernameField: 'email' })

// this plugin adds up an id field to schema which increments serially
// userSchema.plugin(AutoIncrement, { inc_field: 'serial' })
module.exports = mongoose.model('Customer', customerSchema)
