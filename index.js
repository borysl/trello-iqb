const ERRORS = {
  NO_ERROR: 0,
  CANT_PARSE_DOTENV: 1,
  SOME_ERROR: 99,
};

const express = require('express');
const { columns, qbs } = require('./trelloSettings.js');

if (process.env.NODE_ENV !== 'production') {
  console.log('Loading env from local file in non-production environment.');
  const dotenvParse = require('dotenv').config();
  if (dotenvParse.error) {
    console.log(dotenvParse.error);
    process.exit(ERRORS.CANT_PARSE_DOTENV);
  }
}

const port = process.env.PORT || 8080;

var Trello = require('trello');
var trello = new Trello(process.env.TRELLO_APP_KEY, process.env.TRELLO_API_TOKEN);

function handleError(err, res) {
  if (err) {
    res.write(500);
    if (err.message) {
      res.error(err.message);
      res.error(`Stack: ${err.stack}`);
    } else {
      res.error('Unknown Trello error.');
      res.error(JSON.stringify(err));
    }
    res.end();
  }
}

async function populateCards(cards) {
  let populatePromises = cards.map(async card => {
    let checkListPromise = trello.getChecklistsOnCard(card.id);
    let attachmentPromise = trello.getAttachmentsOnCard(card.id);
    let [checklists, attachments] = await Promise.all([checkListPromise, attachmentPromise]);
    card.checklists = checklists;
    card.attachments = attachments;
  });

  await Promise.all(populatePromises);
}

async function getDataFromTrello(column) {
  let boards = await trello.getBoards(process.env.TRELLO_USER_ID);
  let board = boards.find(_ => _.id === process.env.TRELLO_BOARD_ID);
  let lists = await trello.getListsOnBoard(board.id);
  var todoList = lists[column];
  let cards = await trello.getCardsOnList(todoList.id);

  await populateCards(cards);

  console.log('Data received from Trello.');
  return {
    cards,
    boardUrl: board.url,
  };
}

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  let ou = {
    name: 'Web Site',
  }
  res.render('index', ou);
})
addQb('/todo', 'todo', 'Input', 'To Do');
addQb('/wip', 'wip', 'WIP', 'In Progress');
addQb('/resolved', 'resolved', 'Code Review', 'Code Review / Merge');

function addQb(path, qbName, qbFullName, columnName) {
  app.get(path, async (req, res) => {
    try {
      let { cards, boardUrl } = await getDataFromTrello(columns[qbName]);

      let validate = qbs[qbName];

      var cardsAnalysis = cards.map(card => {
        let sins = validate(card);
        return {
          url: card.url,
          name: card.name,
          sins: sins,
        };
      });

      let analysis = {
        boardUrl,
        cardsAnalysis,
        columnName,
        qbFullName,
      };

      res.render('qb', analysis);
    } catch (err) {
      handleError(err, res);
    }
  });
}

app.listen(port, () => {
  console.log(`Server listens port ${port}.`);
});
