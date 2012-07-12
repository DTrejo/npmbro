var jerk = require('jerk')
  , async = require('async')
  , request = require('request')
  , EventEmitter = require('events').EventEmitter
  , SEARCH = 'http://eirikb.github.com/nipster/#'
  , identity = function(e) { return (e || '').trim() }
  , isUrl = function(s) { return s.indexOf('http') > -1 }
  , noop = function() {}
  , options =
    { server: 'irc.freenode.net'
    , nick: 'npmbro'
    , channels:
      [ '#dtrejo'
      , '#node.js'
      ]
    }
  , bro = new EventEmitter()
  , routes =
    { search: function search (m) {
        if (!m.match_data[1]) return

        m.match_data[1] = m.match_data[1].replace('search', '').trim()
        var reply = m.user + ': Please see ' + SEARCH
        + encodeURIComponent(m.match_data[1])
        m.say(reply)
        return reply
      }
    // the only async fn, b/c calls out to npm
    , docs: function docs (m, cb) {
        cb = cb || noop
        if (!m.match_data[1]) return cb()

        var names =
          m.match_data[1].replace('docs', '')
          .split(' ')
          .filter(identity)

        if (!names.length) {
          var reply = m.user + ': Usage is: npm docs <packagename>'
          m.say(reply)
          return cb(null, reply)
        }

        return async.map(names, function(name, callback) {
          return docsUrl([ name ], callback)
        }, onUrls)
        function onUrls(err, urls) {
          urls = urls
            .filter(identity)
            .filter(isUrl)

          if (!urls.length) {
            var reply = m.user + ': No results';
            m.say(reply)
            return cb(err, reply)
          }
          var reply = m.user + ': Please see ' + urls.join(' ')
          m.say(reply)
          return cb(err, reply)
        }
      }
    , help: function help (m) {
        if (!m.match_data[1]) return

        m.match_data[1] = m.match_data[1].replace(/help search|help/, '').trim()
        var reply = m.user + ': Please see npm\'s documentation at'
          + ' https://duckduckgo.com/?q='
          + encodeURIComponent('site:http://npmjs.org/doc/ ' + m.match_data[1])
        m.say(reply)
        return reply
      }
    , node: function node (m) {
      var reply = m.user + ': Please ctrl-f or cmd-f through the node docs at'
        + ' http://nodejs.org/docs/latest/api/all.html'
      m.say(reply)
      return reply
    }
    , credits: function credits (m) {
        m.say(m.user + ': npmbro was written by http://twitter.com/ddtrejo, and'
          + ' named by http://twitter.com/maxogden. The original npm was'
          + ' written by http://twitter.com/izs. Contribute to npmbro at'
          + ' https://github.com/DTrejo/npmbro.')
      }
    }

// lifted from @izs
// https://github.com/isaacs/npm/blob/master/lib/docs.js
function docsUrl(args, cb) {
  var n = args[0].split("@").shift()

  request.get("https://registry.npmjs.org/" + n + "/latest", { json: true }, onData);
  function onData(er, response, d) {
    if (!(!er && response.statusCode == 200)) return cb(er)

    var homepage = d.homepage
      , repo = d.repository || d.repositories
    if (homepage) return cb(null, homepage)
    if (repo) {
      if (Array.isArray(repo)) repo = repo.shift()
      if (repo.hasOwnProperty("url")) repo = repo.url
      if (repo) {
        return cb(null, repo.replace(/^git(@|:\/\/)/, 'http://')
                            .replace(/\.git$/, '') + "#readme")
      }
    }
    return cb(null, "http://search.npmjs.org/#/" + d.name)
  }
}

bro.routes = routes
bro.router = router
module.exports = bro

function router (m, cb) {
  m.match_data = m.text[0].match(/(?:npm(?:bro)?) (((?:[a-z0-9_ -]*)))/)
  if (!m.match_data) {
    var reply = 'npmbro usage: '
      + '`npm <command> <arguments ...>`'
      + ' For more information on npmbro, see'
      + ' https://github.com/DTrejo/npmbro or run'
      + ' `npm docs npmbro` or run `npm credits`.     '
      + ' Available commands: '
      + Object.keys(routes).map(function(r) {
          return 'npm ' + r
        }).join(' | ')
    m.say(reply)
    return cb()
  }
  var cmd = ((m.match_data[1] || '').split(' ') || [])[0]
  var route = routes[cmd]
  if (route) return route(m, cb)
  else return routes.help(m, cb)
}

if (!module.parent) {
  jerk(function (j) {
    j.watch_for(/^(?:npm(?:bro)?)/, function (m) {
      // console.log(m)
      router(m, noop)
    })
  }).connect(options)
}
