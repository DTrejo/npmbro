var jerk = require('jerk')

var options =
  { server: 'irc.freenode.net'
  , nick: 'npmbro'
  , channels: [ '#dtrejo', '#node.js' ]
  }

jerk(function(j) {

  j.watch_for('soup', function(message) {
    message.say(message.user + ': soup is good food!')
  })

  j.watch_for(/^(.+) are silly$/, function(message) {
    message.say(message.user + ': ' + message.match_data[1] + ' are NOT SILLY. Don\'t joke!')
  })

}).connect(options)
