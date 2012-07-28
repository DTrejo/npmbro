var jerk = require('jerk')
  , async = require('async')
  , request = require('request')
  , EventEmitter = require('events').EventEmitter
  , http = require('http')
  , moment = require('moment')
  , SEARCH = 'http://eirikb.github.com/nipster/#'
  , options =
    { server: 'irc.freenode.net'
    , nick: 'npmbrotest'
    , channels:
      [ '#dtrejo'
      // , '#node.js'
      // , '#nodejitsu'
      // , '#robotjs'
      ]
    }
  , bro = new EventEmitter()

//
// helpers
//
function identity (e) {
  return (e || '').trim()
}
function isUrl (s) {
  return s.indexOf('http') > -1
}
function noop () {}

//
// Routes
//
function search (m) {
  if (!m.match_data[1]) return

  m.match_data[1] = m.match_data[1].replace('search', '').trim()
  var reply = m.user + ': Please see ' + SEARCH
  + encodeURIComponent(m.match_data[1])
  m.say(reply)
  return reply
}
function docs (m, cb) {
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
    var n = name.split("@").shift()
    fetchPackageJSON(n, false, function (er, packageJSON) {
      if (er) return callback(er)
      callback(null, docsUrl(packageJSON))
    })
  }, onUrls)

  function onUrls(err, urls) {
    if (err) return cb(err)

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
function stats (m, cb) {
  cb = cb || noop
  if (!m.match_data[1]) return cb

  var lib = m.match_data[1].replace('stats', '').trim().split(' ')[0]
  if (!lib) {
    m.say(m.user + ': Usage is: npm stats <packagename>')
    return cb()
  }
  lib = lib.split('@')[0]

  fetchStats(lib, function (err, stats) {
    if (err || !stats) {
      m.say(m.user + ': Sorry, I can\'t work that one out')
      return cb(err)
    }

    m.say(m.user
      + ': Stats for '
      + lib
      + ': Latest v'
      + stats.version
      + ' published '
      + moment(stats.published).fromNow()
      + ', last pushed to GitHub '
      + moment(stats.ghlastPush).fromNow()
      + ', '
      + stats.ghforks + ' forks, '
      + stats.ghwatchers + ' watchers, '
      + stats.tweets + ' tweets'
    )
    cb()
  })
}
function help (m) {
  if (!m.match_data[1]) return

  m.match_data[1] = m.match_data[1].replace(/help search|help/, '').trim()
  var reply = m.user + ': Please see npm\'s documentation at'
    + ' https://duckduckgo.com/?q='
    + encodeURIComponent('site:http://npmjs.org/doc/ ' + m.match_data[1])
  m.say(reply)
  return reply
}
function node (m) {
  var reply = m.user + ': Please ctrl-f or cmd-f through the node docs at'
    + ' http://nodejs.org/docs/latest/api/all.html'
  m.say(reply)
  return reply
}
function credits (m) {
  m.say(m.user + ': npmbro was written by http://twitter.com/ddtrejo, and'
    + ' named by http://twitter.com/maxogden. The original npm was'
    + ' written by http://twitter.com/izs. Contribute to npmbro at'
    + ' https://github.com/DTrejo/npmbro.')
}
function dtrejosaysyoushouldreallydie (m) {
  if (m.user === "DTrejo") {
    m.say("Goodbye master.")
    return process.exit(0)
  }
  m.say("Sorry, you're not special.")
}

var routes =
  { search  : search
  , docs    : docs
  , install : docs // somewhat handy alias
  , stats   : stats
  , help    : help
  , node    : node
  , credits : credits
  , dtrejosaysyoushouldreallydie : dtrejosaysyoushouldreallydie
  }

function fetchPackageJSON (lib, full, callback) {
  request.get("https://registry.npmjs.org/" + lib + (full ? '' : '/latest'), { json: true }, function (err, response, data) {
    if (err || response.statusCode != 200) return callback(err || 'not found')
    return callback(null, data)
  })
}

var repoRegex = /github.com\/([\.\-\w]+)\/([^$\/#]+)/

function repoMatch (s) {
  if (!s) return null
  if (Array.isArray(s)) s = s.shift()
  return s && typeof s == 'string' && s.match(repoRegex)
}

function fetchStats (lib, callback) {
  fetchPackageJSON(lib, true, function (err, packageJSON) {
    if (err) return callback(err)
    var latestVersion = packageJSON['dist-tags'].latest
      , latest = packageJSON.versions[latestVersion]

    var match = repoMatch(latest.homepage)
    if (!match) match = repoMatch(latest.repository)
    if (!match) match = latest.repository && repoMatch(latest.repository.url)
    if (!match) return callback('not found')

    var githubUser = match[1]
      , githubRepo = match[2].replace(/\.git$/, '')
      , homepage   = typeof latest.homepage == 'string' ? latest.homepage : 'https://' + match[0].replace(/\.git$/, '')

      , fetchTwitter = function fetchTwitter (callback) {
          request(
            'http://urls.api.twitter.com/1/urls/count.json?url=' + encodeURIComponent(homepage)
          , { json: true }
          , function (err, response, data) {
              if (err || typeof data.count != 'number')
                return callback('Error requesting tweet count from Twitter')
              callback(null, data.count)
            }
          )
        }
      , fetchGithub = function fetchGithub (callback) {
          request(
            'https://api.github.com/repos/' + githubUser + '/' + githubRepo
          , { json: true }
          , function (err, response, data) {
              if (err || typeof data.forks != 'number' || typeof data.watchers != 'number')
                return callback('Error requesting repo data from GitHub')

              callback(null, {
                forks    : data.forks
              , watchers : data.watchers
              , url      : data.html_url
              , lastPush : data.pushed_at
              })
            }
          )
        }
      , compileStats = function compileStats (err, stats) {
          if (err) return callback(err)
          callback(null, {
            version    : latestVersion
          , published  : packageJSON.time[latestVersion]
          , tweets     : stats.twitter
          , ghforks    : stats.github.forks
          , ghwatchers : stats.github.watchers
          , ghlastPush : stats.github.lastPush
          })
        }

    async.parallel({ twitter: fetchTwitter, github: fetchGithub }, compileStats)
  })
}

    // mostly lifted from @izs
    // https://github.com/isaacs/npm/blob/master/lib/docs.js
function docsUrl (packageJSON) {
  var homepage = packageJSON.homepage
    , repo     = packageJSON.repository || packageJSON.repositories

  if (homepage) return homepage
  if (repo) {
    if (Array.isArray(repo)) repo = repo.shift()
    if (repo.hasOwnProperty("url")) repo = repo.url
    if (repo) {
      return repo.replace(/^git(@|:\/\/)/, 'http://').replace(/\.git$/, '') + "#readme"
    }
  }
  return "http://search.npmjs.org/#/" + packageJSON.name
}

bro.routes = routes
bro.router = router
module.exports = bro

function router (m, cb) {
  // ignore isaac shlueter so we don't clutter up conversations about npm
  if (m.user.indexOf('isaacs') > -1) return

  m.match_data = m.text[0].match(/(?:npm(?:bro)?) (((?:[a-z0-9A-Z_ -]*)))/)
  if (!m.match_data) {
    var reply = 'Powered by http://jit.su/        '
      + ' Available commands: '
      + Object.keys(routes)
        .filter(function (r) {
          return r.indexOf('dtrejo') === -1
        })
        .map(function(r) {
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

http.createServer(function (req, res) {
  res.end('Yes, I am alive and well!')
}).listen(8000)
