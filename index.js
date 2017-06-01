var blessed = require('blessed');
var snoowrap = require('snoowrap');

var config = require('./config');

// FIXME Global variables;
var SubmissionMap = new Map();

// Snoowrap - Reddit
var reddit = new snoowrap({
  userAgent: config.REDDIT_USER_AGENT,
  clientId: config.REDDIT_CLIENT_ID,
  clientSecret: config.REDDIT_CLIENT_SECRET,
  username: config.REDDIT_USERNAME,
  password: config.REDDIT_PASSWORD,
});

var subreddit = reddit.getSubreddit(config.REDDIT_SUBREDDIT);

// Blessed - Elements
var screen = blessed.screen({
  smartCSR: true,
  title: 'Reddit 2 Dota 2',
});

screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

var list = blessed.ListTable({
  parent: screen,
  width: '100%',
  height: '80%',
  top: '20%',
  left: 'center',
  align: 'center',
  fg: 'blue',
  border: {
    type: 'line',
  },
  selectedBg: 'green',
  keys: true,
  vi: true,
});

list.key('r', function(ch, key) {
  fetchSubreddit();
});

list.on('select', function(_, index) {
  var item = list.getItem(index);
  // FIXME MAJOR HACK
  var id = item.content.trim().split(' ')[0];
  var submission = SubmissionMap.get(id);

  var overlayContent =
    submission.selftext ||
    submission.url;

  infoOverlay.setContent(overlayContent);
  screen.append(infoOverlay);
  infoOverlay.focus();
  screen.render();
});

// TODO Improve title bar
blessed.Box({
  parent: screen,
  content: 'Welcome to R2D2!',
  width: '100%',
  height: '20%',
  top: '0',
  left: 'center',
  align: 'center',
  border: {
    type: 'line',
  },
  selectedBg: 'green',
});

var infoOverlay = blessed.Box({
  content: 'Overlay',
  width: '100%',
  height: '80%',
  top: '20%',
  left: 'center',
  align: 'center',
  border: {
    type: 'line',
  },
  keys: true,
  vi: true,
});

infoOverlay.key(['q', 'escape'], function(ch, key) {
  infoOverlay.detach();
  list.focus();
  screen.render();
});

var loading = blessed.Loading({
  parent: screen,
});

loading.load('Loading Reddit');

// Init
fetchSubreddit();
screen.render();

// Helper functions
function fetchSubreddit() {
  subreddit
    .getTop({limit: 20, time: 'day'})
    .then(setTable);
}

function setTable(Listing) {
  var submissions = Listing.map(function(submission) {
    SubmissionMap.set(submission.id, submission);

    return ([
      transform(submission.id),
      transform(submission.title),
      transform(submission.domain),
      transform(submission.selftext),
      transform(submission.ups),
      transform(submission.score),
    ]);
  });

  list.setData(submissions);
  list.select(0);
  loading.stop();
  screen.render();
}

function transform(value) {
  value = value.toString();

  return value.length <= 50 ? value : value.substr(0, 47) + '...';
}

