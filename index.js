var blessed = require('blessed');
var snoowrap = require('snoowrap');

var config = require('./config');
var LISTING_STUB = require('./fixtures/Listing');

var SubmissionMap = new Map(); // FIXME Global variables;

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

// Header
blessed.Box({
  parent: screen,
  content: 'Welcome to Reddit 2 Dota 2!',
  width: '100%',
  height: '10%',
  top: '0',
  left: 'center',
  align: 'center',
  border: {
    type: 'line',
  },
});

// Footer
blessed.Box({
  parent: screen,
  content: '{bold}Keyboard shortcuts:{/bold} ' +
    'Quit: Ctrl-C; Esc: Close; Vim keys - j: down, k: up',
  tags: true,
  width: '100%',
  height: '10%',
  top: '90%',
  left: 'center',
  align: 'left',
  border: {
    type: 'line',
  },
});

var list = blessed.ListTable({
  parent: screen,
  width: '100%',
  height: '80%',
  top: '10%',
  left: 'center',
  align: 'left',
  border: {
    type: 'line',
  },
  selectedBg: 'green',
  style: {
    header: {
      bold: true,
    },
    cell: {
    },
  },
  keys: true,
  vi: true,
});

list.key('r', function(ch, key) {
  fetchSubreddit();
});

list.on('select', function(ch, index) {
  var item = list.getItem(index);
  // FIXME MAJOR HACK
  var id = item.content.trim().split(' ')[0];
  var submission = SubmissionMap.get(id);

  var content = submission.selftext || submission.url;
  title.setContent(submission.title);
  body.setContent(content);

  screen.append(overlay);
  body.focus();
  screen.render();
});

var overlay = blessed.Box({
  width: '100%',
  height: '80%',
  top: '10%',
  left: 'center',
  align: 'left',
  border: {
    type: 'line',
  },
  keys: true,
  vi: true,
});

var title = blessed.Text({
  parent: overlay,
  width: '100%',
  height: '10%',
  top: '0',
  left: 'center',
  align: 'left',
  style: {
    bold: true,
  },
  border: {
    type: 'line',
  },
});

var body = blessed.Text({
  parent: overlay,
  width: '100%',
  height: '80%',
  top: '10%',
  left: 'center',
  align: 'left',
  border: {
    type: 'line',
  },
  keys: true,
  vi: true,
  scrollable: true,
  alwaysScroll: true,
});

body.key(['escape'], function(ch, key) {
  overlay.detach();
  list.focus();
  screen.render();
});

var loading = blessed.Loading({
  parent: screen,
  top: 'center',
  left: 'center',
  align: 'center',
  width: '20%',
  height: '10%',
});

loading.load('Loading Reddit. Sit tight!');

// Init
fetchSubreddit();
screen.render();

// Helper functions
function fetchSubreddit() {
  if (config.DEBUG) {
    return setTimeout(function() {
      setTable(LISTING_STUB);
    }, config.STUB_RESPONSE_DELAY);
  }

  subreddit
    .getTop({limit: 20, time: 'day'})
    .then(setTable);
}

var headers = [
  [
    'ID',
    'Title',
    'Domain',
    'Text',
    'Ups',
    'Score',
  ],
];

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

  var data = headers.concat(submissions);
  list.setData(data);
  list.focus();
  list.select(0);
  loading.stop(); // FIXME Should only hide for first load
  screen.render();
}

function transform(value) {
  value = value.toString();

  return value.length <= 50 ? value : value.substr(0, 47) + '...';
}

