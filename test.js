var specify = require('specify')
  , filters = process.argv.slice(2)
  , bro = require('./npmbro')
  , router = bro.router
  , noop = function () {}
  , searches =
    [ 'npmbro search dude'
    , 'npmbro search gss'
    , 'npmbro search    kgoiewjgwre998932nnlj'
    , 'npmbro search osdignsd-'
    , 'npmbro search 23949---_9'
    , 'npmbro search 42'
    , 'npmbro search run npm'
    , 'npmbro search god forever substack dtrejo twitter    '
    ]
/*
npmbro search dude
npmbro search bro
npmbro search    kgoiewjgwre998932nnlj
npmbro search osdignsd-
npmbro search 23949---_9
npmbro search 42
npmbro search hello world
npmbro search lotsa white at the end
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
