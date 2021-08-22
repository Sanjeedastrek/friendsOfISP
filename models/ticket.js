const	mongoose = require('mongoose')

const moment = require('moment')

const datemask = 'DD-MM-YY hh:mma'

const Reply = require('./reply')

const passportLocalMongoose = require('passport-local-mongoose')

// this package creates a field in db which increments sequentially

const AutoIncrement = require('mongoose-sequence')(mongoose)

var ticketSchema = new mongoose.Schema({

  isp: 'String',
  package: {
	    type: 'String'
  },
  // this is actually username
  opener: {
    type: 'String'
  },
  nameOfUser : String,
  userEmail: String,
  ispEmail: String,
  department: String,
  title: {
	    type: 'String'
  },
  description: {
	    type: 'String'
  },
  // when first ticket is created, it is 0; when ticket is not solved it is 1; when ticket is solved it is 2;
  ticketStatus: {
	    type: Number
  },
  solved: Boolean,
  ticketDate: {
    type: 'String',
    default: function () {
      return moment().format(datemask)
    }
  },

  ticketId: {
    type: Number
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply'
  }]

})

// this plugin adds up an id field to schema which increments serially
ticketSchema.plugin(AutoIncrement, { inc_field: 'ticketId' })

module.exports = mongoose.model('Ticket', ticketSchema)
