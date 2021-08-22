const mongoose = require('mongoose')

const moment = require('moment')

const datemask = 'DD-MM-YY'

const uidGenerator = require('node-unique-id-generator')

// this package creates a field in db which increments sequentially

const AutoIncrement = require('mongoose-sequence')(mongoose)

const Review = require('./review')

const Ticket = require('./ticket')

const passportLocalMongoose = require('passport-local-mongoose')

// mongoose.set('useCreateIndex', true)

const userSchema = new mongoose.Schema({
  //for Isp, this is name of Isp., for Customer this is name of customer
  nameOfUser: {
    type: String
  },
  username: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    // index: true
  },
  password: {
    type: String
  },
  role: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,

})
// this plugin ensures that email be used to identify isp
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' })

// this plugin adds up an id field to schema which increments serially
userSchema.plugin(AutoIncrement, { inc_field: 'serial' })
module.exports = mongoose.model('User', userSchema)
