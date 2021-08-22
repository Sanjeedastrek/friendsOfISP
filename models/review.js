const	mongoose = require('mongoose')

const moment = require('moment')

const datemask = 'DD-MM-YY hh:mma'

// mongoose.set('useCreateIndex', true);

var reviewSchema = new mongoose.Schema({
  user: {
    type: 'String'

  },
  nameOfReviewer: String,
  isp: String,
  package: {
	    type: 'String'
	    },
  comment: {
    type: 'String'
  },
  reviewDate: {
    type: 'String',
    default: function () {
      return moment().format(datemask)
    }
  },
  rating: Number,
  

})

module.exports = mongoose.model('Review', reviewSchema)
