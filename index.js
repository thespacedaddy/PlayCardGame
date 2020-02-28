//Stuff for Socket Connection:
var io = require('socket.io-client');
var socket = io('https://CardServer--jaxcksn.repl.co')
//CLI Dependencies
const prompts = require('prompts');
const spn = require('spinnies');
const spinnies = new spn();
const chalk = require('chalk');
const shortid = require('shortid')
const logUpdate = require('log-update')
const readline = require('readline')
const pak = require('press-any-key');
const ansi = require('sisteransi');

const p = str => process.stdout.write(str);

//Other Utility Vars and Functions
var id;
var nickname;
var currentRoom;
var hasJoinedRoom = false;
var gameSelected = 'none';
var finishLoop = false;


//Host Variables
var playersConnected = 9;
var playersAdded = [];

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

/**
 * TODO LIST:
 * 1. Figure out server disconnect stuff.
 *  - I need to remove rooms when host disconnects
 *  - remove clients when they disconnect
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
      spinnies.add('waitForRoom', { text: 'Creating Room. Please wait.' })
      setTimeout(() => {
        spinnies.succeed('waitForRoom', { text: `Done! Your room ID is: ${roomCallback}` });
        hostMenu(roomCallback);
      }, 2000)
      //Start host function
    } else {
      //Start player function
      playerMenu();
    }
  });
};

function hostMenu(roomCode) {
  // This is the game selection loop
  hostLoop(roomCode)
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
  //TODO: Gameplay Functions
}

//Choose Game Prompt Function
async function whatGamePrompt() {
  const response = await prompts([
    {
      type: 'select',
      name: 'gameMode',
      message: 'What game would you like to play?',
      warn: chalk.red('Not enough players!'),
      hint: 'Choose One',
      choices: [
        { title: 'War', value: 'war', disabled: canPlayWar()},
        { title: 'Blackjack', value: 'blackjack', disabled: canPlayBlackjack()},
        {
          title: 'Cancel', value: 'none', description: chalk.green('Keep waiting for more players.')
        }
      ]
    }
  ])
  gameSelected = response.gameMode;
}

const hostLoop = async (roomCode) => {
  do {
    clearConsole();
    console.log(chalk.bold('Card Game Main Menu'))
    console.log(`Your room code is ${roomCode}`);
    console.log(`There are ${playersConnected} players connected.`)
    


    //Wait for a keypress. Lets the host wait for people.
    await pak('\nPress any key to continue...').then(() => {
      console.log('\n')
    })
    await whatGamePrompt()

    

  } while (gameSelected == 'none')

  
}

socket.on('joinedRoom', () => {
    playersConnected += 1;
    p(ansi.cursor.save);
    p(ansi.cursor.hide);
    p(ansi.cursor.to(10,3));
    p(ansi.erase.lineEnd)
    p(`${playersConnected} players connected.`)

    p(ansi.cursor.restore);
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
