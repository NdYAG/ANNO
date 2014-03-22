var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var User = new Schema({
  //username: String,
  douban: {
    id: Number,
    uid: String,
    name: String,
    avatar: String,
    large_avatar: String,
    accessToken: String
  }
})

mongoose.model('User', User)

module.exports = mongoose.model('User')
