const	mongoose = require('mongoose')

const moment = require('moment')

const datemask = 'DD-MM-YY hh:mma'

// this package creates a field in db which increments sequentially

const AutoIncrement = require('mongoose-sequence')(mongoose)

var replySchema = new mongoose.Schema({

  replyerType:
	{
	  type: String
	},
  ticketId: Number,
  // this is actually username 
  name: String,
  nameOfReplier : String,
  reply:
	{
	    type: 'String'
	},
  replyDate: {
    type: 'String',
    default: function () {
      return moment().format(datemask)
    }
  },
  // when ISP resolves issue, it is 2; otherwise 1
  status: Number,
  // when it is true, it means user has resolved (status in ticket is 2) otherwise user still didn't resolve it
  solved: Boolean
})

module.exports = mongoose.model('Reply', replySchema)
