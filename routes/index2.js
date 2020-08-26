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
   * Game play logic 
   */

	if (incomingMsg == 'start') {
    req.session.wordState = new Array(word.length).fill('_');
		req.session.lives = 5;
		twiml.message(`Text back one letter at a time to try and figure out the word. If you know the word, text the entire word!\n
									You have ${req.session.lives} lives left. \n\n ${req.session.wordState.join(' ')}`);
	} else {
    const winOrMatch = checkForSuccess();

    if (!winOrMatch) {
      req.session.lives--;
		
			if (req.session.lives == 0) {
				req.session.destroy();
				twiml.message('Oh no, you ran out of lives! Game over.');
			} else {
				twiml.message(`Nope, that was incorrect. You have ${req.session.lives} lives left.`);
			}
    } else if (winOrMatch == 'win') {
			req.session.destroy();
			twiml.message('You guessed the word! You win!');
    } else {
      for (let [i, char] of [...word].entries()) {
				if (char == incomingMsg) {
					req.session.wordState[i] = incomingMsg;
				}
			}
			
			if (req.session.wordState.join('') == word) {
				req.session.destroy();
				twiml.message('You guessed the word! You win!');
			} else {
				twiml.message(req.session.wordState.join(' '));
			}
    }  
  }

  /* 
   * Helper function
   */

  // Checks if the guess is a win, a letter match, or neither
  const checkForSuccess = () => {
		if (incomingMsg == word) { return 'win' }
		if (word.includes(incomingMsg)) { return 'match' }
		return false;
  }

  /* 
   * Sending response
   */

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;







