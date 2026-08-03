class Cards {
    static typeCards = [];
    static deck = [];

    constructor(name, cardPhoto, amount, type, color) {
        this.name = name
        Cards.typeCards.push(this)
        this.cardPhoto = new Image()
        this.cardPhoto.src = cardPhoto
        this.amount = amount
        this.type = type
        this.color = color
        this.w = 40
        this.h = 40
    }

    static buildDeck(){
        Cards.typeCards.forEach(card => {
            for(let i = 0; i < card.amount; i++){
                Cards.deck.push({ ...card });
            }
        });
    }

    static mingle() {
        for (let i = Cards.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [Cards.deck[i], Cards.deck[j]] = [Cards.deck[j], Cards.deck[i]];
        }
    }
}

let bone = new Cards('bone', './assets/bone.png', 5, 'organ', 'yellow');
let brain = new Cards('brain', './assets/brain.png', 5, 'organ', 'blue');
let heart = new Cards('heart', './assets/heart.png', 5, 'organ', 'red');
let stomach = new Cards('stomach', './assets/stomach.png', 5, 'organ', 'green');
let nervousSystem = new Cards('nervousSystem', './assets/rainbow_organ.png', 1, 'organ', 'rainbow');

let yellowMedicine = new Cards('yellow_medicine', './assets/yellow_medicine.png', 4, 'medicine', 'yellow');
let blueMedicine = new Cards('blue_medicine', './assets/blue_medicine.png', 4, 'medicine', 'blue');
let redMedicine = new Cards('red_medicine', './assets/red_medicine.png', 4, 'medicine', 'red');
let greenMedicine = new Cards('green_medicine', './assets/green_medicine.png', 4, 'medicine', 'green');
let rainbowMedicine = new Cards('rainbow_medicine', './assets/rainbow_medicine.png', 4, 'medicine', 'rainbow');

let yellowVirus = new Cards('yellow_virus', './assets/yellow_virus.png', 4, 'virus', 'yellow');
let blueVirus = new Cards('blue_virus', './assets/blue_virus.png', 4, 'virus', 'blue');
let redVirus = new Cards('red_virus', './assets/red_virus.png', 4, 'virus', 'red');
let greenVirus = new Cards('green_virus', './assets/green_virus.png', 4, 'virus', 'green');
let rainbowVirus = new Cards('rainbow_virus', './assets/rainbow_virus.png', 1, 'virus', 'rainbow');

let contagion = new Cards('contagion', './assets/contagion.png', 2, 'treatment', 'purple');
let thief = new Cards('thief', './assets/thief.png', 3, 'treatment', 'purple');
let transplant = new Cards('transplant', './assets/transplant.png', 3, 'treatment', 'purple');
let glove = new Cards('glove', './assets/glove.png', 1, 'treatment', 'purple');
let medicalError = new Cards('medical_error', './assets/medical_error.png', 1, 'treatment', 'purple');

export { Cards };