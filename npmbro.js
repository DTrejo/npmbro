var jerk = require('jerk')
var npm = require('npm')
var EventEmitter = require('events').EventEmitter
var options =
  { server: 'irc.freenode.net'
  , nick: 'npmbro'
  , channels:
    [ '#dtrejo'
    // , '#node.js'
    ]
  }

var re =
  { search: /npm search ((?:[a-z0-9_ -]*))/
  , install: /npm install ((?:[a-z0-9_ -]*))/
  , docs: /npm docs ((?:[a-z0-9_ -]*))/
  }

var bro = new EventEmitter()
bro.re = re
bro.search = search
bro.docs = docs
bro.install = docs // alias

module.exports = bro

function search (m, cb) {
  // return npm.commands.search(['some', 'args'], function (er, data) {
    // if (er) throw new Error(er.message)
    var reply = m.user + ': you searched for ' + m.match_data[1] + '.'
    m.say(reply)
    return cb(null, reply)
  // })
}

function install (m) {
  return docs(m)
}
function docs (m) {
  var reply = m.user + ': here\'s the url for ' + m.match_data[1] + '.'
  m.say(reply)
  return reply
}

function handlers(j) {
  j.watch_for(re.search, search)
  j.watch_for(re.install, install)
  j.watch_for(re.docs, docs)
}

if (!module.parent) {
  bro.on('load', function (npm) {
    jerk(handlers).connect(options)
  })
}

npm.load({}, function (er) {
  if (er) throw new Error(er.message)
  npm.on('log', function (m) {
    console.log(m)
  })
  bro.emit('load', npm)
})
