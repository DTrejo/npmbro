var re =
  { search: /npm\s+search\s+((?:[a-z0-9_-]*))/
  , install: /npm\s+install\s+((?:[a-z0-9_-]*))/
  , docs: /npm\s+docs\s+((?:[a-z0-9_-]*))/
  }
var bro =
  { re: re
  , search: search
  , docs: docs
  , install: docs
  }

module.exports = bro

var jerk = require('jerk')
var options =
  { server: 'irc.freenode.net'
  , nick: 'npmbro'
  , channels:
    [ '#dtrejo'
    // , '#node.js'
    ]
  }

function handlers(j) {

  j.watch_for('soup', function(message) {
    message.say(message.user + ': soup is good food!')
  })
  j.watch_for(re.search, search)
  j.watch_for(re.install, install)
  j.watch_for(re.docs, docs)
}

function search (m) {
  var reply = m.user + ': you searched for ' + m.match_data[1] + '.'
  m.say(reply)
  return reply
}

function install (m) {
  return docs(m)
}
function docs (m) {
  var reply = m.user + ': here\'s the url for ' + m.match_data[1] + '.'
  m.say(reply)
  return reply
}

if (!module.parent) {
  jerk(handlers).connect(options)
}
