var specify = require('specify')
var filters = process.argv.slice(2)
var bro = require('./npmbro')
var re = bro.re
var noop = function () {}
var searches =
  [ 'npm search dude'
  , 'npm search bro'
  , '   npm search bro'
  , 'npm search    kgoiewjgwre998932nnlj'
  , 'npm search osdignsd-'
  , 'npm search 23949---_9'
  , 'npm search 42'
  , 'npm search hello world'
  , 'npm search lotsa white at the end    '
  ]
/*
npm search dude
npm search bro
   npm search bro
npm search    kgoiewjgwre998932nnlj
npm search osdignsd-
npm search 23949---_9
npm search 42
npm search hello world
npm search lotsa white at the end
*/
var docs = searches
  .map(function (s) {
    return s.replace('search', 'docs')
  })

// returns a mock message
function message(s, re) {
  return {
    match_data: s.match(re)
  , user: 'DTrejo'
  , source: s
  , say: noop
  }
};

specify('search', function (a) {
  a.expect(searches.length * 3)
  searches.forEach(function (s) {
    a.ok(re.search.test(s))
    bro.search(message(s, re.search), function (er, reply) {
      a.ok(!er)
      console.log(reply)
      a.ok(reply)
    })
  });
})

specify('docs', function (a) {
  a.expect(docs.length * 2)
  docs.forEach(function (s) {
    a.ok(re.docs.test(s));
    var reply = bro.docs(message(s, re.docs))
    console.log(reply)
    a.ok(reply)
  })
})

bro.on('load', function () {
  specify.run(filters)
})
