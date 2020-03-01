//Stuff for Socket Connection:
var io = require('socket.io-client');
var socket = io('https://cardgame.jaxcksn.dev')
//CLI Dependencies
const prompts = require('prompts');
const spn = require('spinnies');
const spinnies = new spn();
const shortid = require('shortid')
const readline = require('readline')
const pak = require('press-any-key');
const ansi = require('sisteransi');
const { green, red, bold } = require('kleur');

const p = str => process.stdout.write(str);

//Other Utility Vars and Functions
var id = 0;
var currentRoom = 'notSet';
var isHost = false;
var gameSelected = 'none';
var gameStarted = 'false';

//Card Stuff
var cd = require('./cardGame')

//Host Variables
var playersConnected = 1;
var players = new Map();

// Console Stuff
function clearConsole() {
  console.log('\033[2J') //Clear
  console.log('\033[H')  //Home
}

//Socket.IO Connections
socket.on('connect', () => {
  clearConsole();
  createPlayer();
})

socket.on('disconnect', () => {
  console.log(red('\nError connecting with server. Please restart this program.'))
  process.exit(1)
})

socket.on('playerLeave', (id) => {
  if (isHost) {
    playersConnected -= 1;
    players.delete(id);

    p(ansi.cursor.save);
    p(ansi.cursor.hide);
    p(ansi.cursor.to(10, 3));
    p(ansi.erase.lineEnd)
    p(`${playersConnected} players connected.`)

    p(ansi.cursor.restore);
  }
})

/**
 * TODO LIST:
 * 1. Figure out server disconnect stuff.
 *  - I need to remove rooms when host disconnects
 *  - remove clients when they disconnect
 * 
 * 2. Program the Card Games and Logic
 *  - War
 *  - Blackjack
 */



/**
 * Creating the Player JSON for connection:
 *    PlayerJson: 
 *     {
 *       playerID: GUID (generated server-side)
 *       type: "Host" || "Player"
 *       nickname: String
 *     }
 */
async function createPlayer() {
  // These are the questions
  const response = await prompts([
    {
      type: 'toggle',
      name: 'isHost',
      message: 'Please choose your role',
      initial: false,
      active: 'Host',
      inactive: 'Player'
    },
    {
      //Ask for player nickname
      type: 'text',
      name: 'playerNickname',
      message: 'What would you like your nickname to be?'
    }
  ]);
  //Do this after the questions
  nickname = response.playerNickname;
  let playerChoices = {
    playerType: response.isHost ? 'host' : 'player',
    playerNickname: response.playerNickname

  }

  socket.emit('playerJoin', playerChoices, (playerID, roomCallback) => {
    id = playerID;
    clearConsole();
    console.log('You have successfully joined the game server.')
    //For the host.
    if (playerChoices.playerType == 'host') {
      isHost = true;
      spinnies.add('waitForRoom', { text: 'Creating Room. Please wait.' })
      setTimeout(() => {
        spinnies.succeed('waitForRoom', { text: `Done! Your room ID is: ${roomCallback}` });
        hostMenu(roomCallback);
      }, 2000)
      //Start host function
    } else {
      isHost = false;
      //Start player function
      playerMenu();
    }
  });
};

function hostMenu(roomCode) {
  // This is the game selection loop
  hostLoop(roomCode).then(() => {
    if (gameSelected == 'blackjack') {
      console.log('Starting Blackjack')
      console.log('')
    }
  })

}

function playerMenu() {
  clearConsole();
  joinRoom();
}

async function joinRoom() {
  const response = await prompts([
    {
      type: 'text',
      name: 'roomID',
      message: 'Please enter the ID of the room to join',
      validate: value => shortid.isValid(value) ? true : 'Invalid Room ID'
    }
  ])

  socket.emit('attemptJoinRoom', response.roomID, id, (serverMSG) => {
    if (serverMSG == 'invalid') {
      console.log('Invalid room code. Please try again.');
      playerMenu();
    } else {
      currentRoom = response.roomID;
      hasJoinedRoom = true;
      playerGame();
    }
  })

}

function playerGame() {
  console.log(`Joined room: ${currentRoom}`)
  console.log('')
  spinnies.add('waitForGame', { text: 'Waiting for Host to pick a game.' })
  //TODO: Gameplay Functions
}

//Choose Game Prompt Function
async function whatGamePrompt() {
  console.log('\n')
  const response = await prompts([
    {
      type: 'select',
      name: 'gameMode',
      message: 'What game would you like to play?',
      warn: red('Invalid amount of Players'),
      hint: 'Choose One',
      choices: [
        { title: 'War', value: 'war', disabled: canPlayWar() },
        { title: 'Blackjack', value: 'blackjack', disabled: canPlayBlackjack() },
        {
          title: 'Cancel', value: 'none'
        }
      ]
    }
  ])
  gameSelected = response.gameMode;
}

const hostLoop = async (roomCode) => {
  do {
    clearConsole();
    console.log(bold('Card Game Main Menu'))
    console.log(`Your room code is ${bold().green(roomCode)}`);
    console.log(`There are ${playersConnected} players connected.`)



    //Wait for a keypress. Lets the host wait for people.
    
    await whatGamePrompt()
  } while (gameSelected == 'none')

  //Star war.
  if (gameSelected == 'war') {
    //Lock the room.
    socket.emit('closeRoom', roomCode);
    //Start war game stuff.
    startWarGame(roomCode);
  }
}

socket.on('joinedRoom', (playerJSON) => {
  playersConnected += 1;

  if (isHost) {
    if (gameStarted) {

    } else {
      players.set(playerJSON.playerID, playerJSON.playerNickname);

      p(ansi.cursor.save);
      p(ansi.cursor.hide);
      p(ansi.cursor.to(10, 3));
      p(ansi.erase.lineEnd)
      p(`${playersConnected} players connected.`)

      p(ansi.cursor.restore);
    }
  }
})

function canPlayWar() {
  if (playersConnected == 2) {
    return false
  } else {
    return true
  }
}

function canPlayBlackjack() {
  if (playersConnected > 2) {
    return false
  } else {
    return true
  }
}

//
socket.on('gameMSG', (msg) => {
  spinnies.succeed('waitForGame');
  console.log(msg);
})

socket.on('roomDeleted', () => {
  console.log(red('\nHost disconnected. Please refresh this window.'))
  process.exit()
})



// -----------------------------------------------------
// War Card Game Functions and Loops

function startWarGame(room) {
  //First we create and shuffle a deck.
  let hostDeck = new cd();
  let playerDeck = new cd(hostDeck.split());

  //Now we tell the client
  socket.emit('warGameStarted', room, playerDeck);
  console.clear();
  playWar(room,hostDeck);

}

socket.on('warGameStart', (deck) => {
  var cardDeck = deck;
  playWar(room,deck);
})

//I need to figure out the socket situation for this.

async function playWar(room,deck) {
  console.clear()
  gamePlaying = true;
  while (gamePlaying) {
    console.log(`There are ${deck.length} cards in your hand.`);
    await pak('Press any key to draw a card')
    let card = deck.draw();
    console.log('Drew Card:')
    console.log('[##]')
  }

}