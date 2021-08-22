const	mongoose = require('mongoose')

mongoose.set('useCreateIndex', true)

const ispPackageSchema = new mongoose.Schema({
  packageName: {
    type: 'String',
    required: true
    // unique: true
    // commented out on 11/2/2019
  },
  normalSpeed: 'Number',
  bdixSpeed: 'Number',
  googleSpeed: 'Number',
  packagePrice: {
	    type: 'Number'
  },
  // isp: {
  //   // type: mongoose.Schema.Types.ObjectId,
  //   // ref:"Isp"
  //   type: 'String'
  // },
  nameOfIsp: {
    type: 'String'
  },
  ispUsername : {
    type: 'String'
  },
  messengerLink: String,
  logo: String,
  averageRating: {
    type: Number,
    default: function () {
      return 0
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  ticket: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }]

})

module.exports = mongoose.model('Package', ispPackageSchema)
