// config sample
// replace api_key, api_secret
module.exports = {
  site: {
    name: '读书笔记',
    url: 'http://localhost:3000'
  },
  oauth: {
    key: 'Secret',
    secret: 'Cat',
    scope: 'douban_basic_common,book_basic_r,book_basic_w,shuo_basic_r'
  },
  database: {
    uri: 'mongodb://localhost/anno'
  },
  session: {
    secret: 'secret cat'
  }
}
