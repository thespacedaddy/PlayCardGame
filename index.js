//Stuff for Socket Connection:
var io = require('socket.io-client');
var socket = io('https://CardServer--jaxcksn.repl.co')
//CLI Dependencies
const prompts = require('prompts');

//Other Utility


//Socket.IO Connections
socket.on('connect',()=>{
  createPlayer();
})

/**
 * Creating the Player JSON for connection:
 *    PlayerJson: 
 *     {
 *       playerID: UID
 *       type: "Host" || "Player"
 *       room: roomID (null by default)
 *       nickname: String
 *     }
 *  
 *  The server will not connect until the playerJSON is
 *  ready for the server to process.
 */
async function createPlayer() {
    //These are the questions
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
        name:'playerNickname',
        message: 'What would you like your nickname to be?'
      }
    ]);
    //Do this after the questions
    let playerChoices = {
      playerType: response.isHost ? 'host' : 'player',
      playerNickname: response.playerNickname
    }

    socket.emit('playerJoin', playerChoices);

  };

