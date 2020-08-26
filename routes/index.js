var express = require('express');
var router = express.Router();

const MessagingResponse = require('twilio').twiml.MessagingResponse;

router.post('/play-game', (req, res) => {
  /* 
   * Getting set up 
   */

  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body.toLowerCase().trim();
  const word = 'twilio';
  
  /* 
   * Helper functions to handle game play 
   */
  
  // Creates a new session, sets a new game message that will be sent to the user
  const handleNewGame = () => {
    req.session.wordState = new Array(word.length).fill('_');
    req.session.lives = 5;
    req.session.playing = true;
		twiml.message(`Text back one letter at a time to try and figure out the word. If you know the word, text the entire word!\n
									You have ${req.session.lives} lives left. \n\n ${req.session.wordState.join(' ')}`);
  }

  // Sets invalid word message
  const handleInvalidSMS = () => twiml.message('To start a new game, send start!');

  // Checks if the guess is a win, a letter match, or neither
	const checkForSuccess = () => {
		if (incomingMsg == word) { return 'win' }
		if (word.includes(incomingMsg)) { return 'match' }
		return false;
  }
  
  // Destroys all session data and sets a game over message that will be sent to the user
	const handleGameOver = msg => {
		req.session.destroy();
		twiml.message(msg);
	}
  
  // Removes a life, checks for loss, sets message to user
	const handleBadGuess = () => {
		req.session.lives--;
		
		if (req.session.lives == 0) {
			handleGameOver('Oh no, you ran out of lives! Game over.');
		} else {
			twiml.message(`Nope, that was incorrect. You have ${req.session.lives} lives left.`);
		}
	}

  // Finds the position of the matching letter(s) and replaces the letters' corresponding dash
  // with the actual letter
  // Checks to see if the user has now guessed the entire word and therefore won
  // Sets a message to send to the user based on the whether the user has won
  const handleMatch = () => {
    for (let [i, char] of [...word].entries()) {
			if (char == incomingMsg) {
				req.session.wordState[i] = incomingMsg;
			}
		}
    
    if (req.session.wordState.join('') == word) {
      handleGameOver('You guessed the word! You win!')
    } else {
		  twiml.message(req.session.wordState.join(' '));
    }
  }


  /* 
   * Game play logic 
   */

  if (!req.session.playing) {
    if (incomingMsg == 'start') {
      handleNewGame();
    } else {
      handleInvalidSMS();
    }
  } else {
    const winOrMatch = checkForSuccess();

    if (!winOrMatch) {
      handleBadGuess();
    } else if (winOrMatch == 'win') {
      handleGameOver('You guessed the word! You win!');
    } else {
      handleMatch();
    }  
  }



  /* 
   * Sending response
   */
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;







