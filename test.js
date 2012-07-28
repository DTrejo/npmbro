var specify = require('specify')
  , filters = process.argv.slice(2)
  , bro = require('./npmbro')
  , router = bro.router
  , noop = function () {}
  , searches =
    [ 'npm search dude'
    , 'npm search gss'
    // , '   npm search everyauth'
    , 'npm search    kgoiewjgwre998932nnlj'
    , 'npm search osdignsd-'
    , 'npm search 23949---_9'
    , 'npm search 42'
    , 'npm search run npm'
    , 'npm search god forever substack dtrejo twitter    '
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
var help = searches
  .map(function (s) {
    return s.replace('search', 'help')
  })

// returns a mock message
function message (s) {
  return {
    match_data: null
  , user: 'DTrejo'
  , source: s
  , say: noop
  , text: [ s ]
  }
};

specify('search', function (a) {
  a.expect(searches.length)
  searches.forEach(function (s) {
    var m = message(s)
    var reply = router(m, noop)
    console.log(m.source, '->', reply)
    a.ok(reply)
  });
})

specify('docs', function (a) {
  a.expect(docs.length)
  docs.forEach(function (s) {
    var m = message(s)
    router(m, function(err, reply) {
      if (err) a.ok(err)
      else a.ok(reply.indexOf('http'))

      reply = err || reply
      console.log(m.source, '->', reply)
    })

  })
})

specify('help', function (a) {
  a.expect(help.length)
  help.forEach(function (s) {
    var m = message(s)
    var reply = router(m)
    console.log(m.source, '->', reply)
    a.ok(reply.indexOf('duckduckgo'))
  })
})

specify.run(filters)
