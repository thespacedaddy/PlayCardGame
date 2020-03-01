/*
  I'm gonna try to keep this as clean and simple as
  I can but I doubt I can.
*/

//Decks are shuffled using a MersenneTwister
const { Random, MersenneTwister19937 } = require("random-js");
const random = new Random(MersenneTwister19937.autoSeed());


/**
 * This is the object/class for the card deck,
 * and contains all of the methods. The idea is to pass
 * these objects around, instead of an array.
 * 
 * 
 * @param {CardDeck} [deck] the existing deck to use.
 * @param {boolean} [jokers=false] Include Jokers in the   deck.
 * @param {boolean} [shuffle=true] Should the deck be shuffled when constructed.
 */
class CardDeck {
  constructor(deck = [], jokers = false, shuffle = true) {
    this.deck = deck;
    if (deck.length == 0) {

      //initalize the deck
      for (let i = 0; i < 52; i++) {
        if (i < 13) {
          let suit = 'spade'
          this.deck.push(new Card(i, suit));

        } else if (i < 26) {
          let suit = 'diamond'
          let v = i - 13
          this.deck.push(new Card(v, suit));

        } else if (i < 39) {
          let suit = 'heart'
          let v = i - 26
          this.deck.push(new Card(v, suit));

        } else {
          let suit = 'club'
          let v = i - 39
          this.deck.push(new Card(v, suit));
        }
      }
      if (shuffle) {
        this.shuffle();
      }
    }
  }

  //Deck methods
  /**
   * Shuffle the deck using the Fisher-Yates shuffle 
   * algorithm. (Because why reinvent the wheel?) All 
   * randomness is provided by a Mersenne Twister.
   *  
   */
  shuffle() {
    let d = this.deck;
    for (let i = d.length - 1; i > 0; i--) {
      let j = random.integer(0, i);
      [d[i], d[j]] = [d[j], d[i]];
    }
    this.deck = d;
  }

  /**
   * Deck split function.
   * Use like:
   * 2ndDeck = new cD(deck.split()).
   * 
   * @returns {CardDeck} Returns a new card deck, half of the orginal, and changes the orginal to the other half.
   * 
   */
  split() {
    let fullDeck = this.deck
    let halfwayThrough = Math.floor(fullDeck.length / 2)

    this.deck = fullDeck.slice(0, halfwayThrough);
    return fullDeck.slice(halfwayThrough, fullDeck.length)
  }
  /**
   * Draws cards from the deck.
   * @param {number} [number=1] The number of cards to draw.
   * @returns {(Card|Array)} Returns Card or Array of Cards
   */
  draw(number=1) {
    let deck = this.deck;
    if (number == 1) {
      let drawnCard = this.deck[0];
      this.deck.shift();
      return drawnCard;
    } else {
      let drawnCards = [];
      for(let i=number;i<number;i++) {
        drawnCards.push(this.deck[i]);
        this.deck.shift();
      }
      return drawnCards;
    }
  }
  /**
   * Simply adds card to end of deck.
   * @param {Card} [card] The card object to add.
   */
  addToDeck(card) {
    this.deck.push(card);
  }

}

/**
 * The card object.
 * @param {number} [rank] The rank of the card. 0 is Ace, and 12 is King. 13 for Joker.
 * @param {string} [suit] The suit of the card.
 */
class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
  }
}

module.exports = CardDeck, Card;