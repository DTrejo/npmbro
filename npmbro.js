var jerk = require('jerk')
  , npm = require('npm')
  , EventEmitter = require('events').EventEmitter
  , SEARCH = 'http://eirikb.github.com/nipster/#'
  , options =
    { server: 'irc.freenode.net'
    , nick: 'npmbro'
    , channels:
      [ '#dtrejo'
      // , '#node.js'
      ]
    }
  , bro = new EventEmitter()
  , routes =
    { search: function search (m) {
        m.match_data[1] = m.match_data[1].replace('npm search', '')
        var reply = m.user + ': Please see ' + SEARCH
        + encodeURIComponent(m.match_data[1]) + ' .'
        m.say(reply)
        return reply
      }
    , docs: function docs (m) {
        var reply = m.user + ': Please see ' + m.match_data[1] + '.'
        m.say(reply)
        return reply
      }
    , help: function help (m) {
        var reply = m.user + ': Please see https://duckduckgo.com/?q='
          + encodeURIComponent('site:http://npmjs.org/doc/ ' + m.match_data[1])
        m.say(reply)
        return reply
      }
    }

bro.routes = routes
bro.router = router
module.exports = bro

function router (m, npm) {
  m.match_data = m.source.match(/(?:npm(?:bro)?) (((?:[a-z0-9_ -]*)))/)
  var cmd = ((m.match_data[1] || '').split(' ') || [])[0]
  var route = routes[cmd]
  if (route) return route(m, npm)
  else return routes.help(m, npm)
}

if (!module.parent) {
  bro.on('load', function (npm) {
    jerk(function (j) {
      j.watch_for(/(?:npm(?:bro)?)/, function (m) {
        router(m, npm)
      })
    }).connect(options)
  })
}

npm.load({}, function (er) {
  if (er) throw new Error(er.message)
  npm.on('log', function (m) {
    console.log(m)
  })
  bro.emit('load', npm)
})
