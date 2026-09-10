export class Cards {
    static typeCards = [];
    static deck = [];

    constructor(name, cardPhoto, amount, type, color, description = "") {
        this.name = name
        Cards.typeCards.push(this)
        this.cardPhoto = cardPhoto
        this.amount = amount
        this.type = type
        this.color = color
        this.description = description;
    }

    static buildDeck(){
        Cards.deck = [];
        Cards.typeCards.forEach(card => {
            for(let i = 0; i < card.amount; i++){
                Cards.deck.push({
                    name: card.name,
                    cardPhoto: card.cardPhoto,
                    type: card.type,
                    color: card.color,
                    description: card.description
                });
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

const CARD_HELP = {
    // Órganos
    organ: "Al usarlo se añade a tu cuerpo. Consigue 4 organos diferentes para ganar, siempre y cuando no esten infectados.",
    rainbow_organ: "Órgano comodín. Añadelo a tu cuerpo pero recibe virus y vacunas de cualquier color.",
    // Vacunas
    medicine: "Protege al órgano o cura 1 virus del color que le corresponda. Con 2 vacunas es inmuniza el órgano.",
    rainbow_medicine: "Vacuna comodín. Cura o protege cualquier órgano.",
    // Virus
    virus: "Infecta un organo o destruye 1 de sus vacunas, si el color corresponde. 2 virus destruyen al órgano. El efecto aplica a rivales o uno mismo.",
    rainbow_virus: "Virus comodín. Infecta cualquier órgano del tablero.",
    // Tratamientos
    contagion: "infecta organos de tus rivales siempre y cuando el color coincida y el organo no tenga virus ni vacunas.",
    thief: "Roba un órgano no inmune a un rival si no lo tienes duplicado.",
    transplant: "Intercambia 2 órganos no inmunes entre cuerpos diferentes.",
    glove: "Obliga a TODOS tus rivales a descartar su mano actual. En su turno solo podran robar hasta tener 3 cartas.",
    medical_error: "Intercambia tu cuerpo completo por el de un rival."
};

let bone = new Cards('bone', '/assets/cards/bone.png', 5, 'organ', 'yellow', CARD_HELP.organ);
let brain = new Cards('brain', '/assets/cards/brain.png', 5, 'organ', 'blue', CARD_HELP.organ);
let heart = new Cards('heart', '/assets/cards/heart.png', 5, 'organ', 'red', CARD_HELP.organ);
let stomach = new Cards('stomach', '/assets/cards/stomach.png', 5, 'organ', 'green', CARD_HELP.organ);
let nervousSystem = new Cards('nervousSystem', '/assets/cards/rainbow_organ.png', 1, 'organ', 'rainbow', CARD_HELP.rainbow_organ);

let yellowMedicine = new Cards('yellow_medicine', '/assets/cards/yellow_medicine.png', 4, 'medicine', 'yellow', CARD_HELP.medicine);
let blueMedicine = new Cards('blue_medicine', '/assets/cards/blue_medicine.png', 4, 'medicine', 'blue', CARD_HELP.medicine);
let redMedicine = new Cards('red_medicine', '/assets/cards/red_medicine.png', 4, 'medicine', 'red', CARD_HELP.medicine);
let greenMedicine = new Cards('green_medicine', '/assets/cards/green_medicine.png', 4, 'medicine', 'green', CARD_HELP.medicine);
let rainbowMedicine = new Cards('rainbow_medicine', '/assets/cards/rainbow_medicine.png', 4, 'medicine', 'rainbow', CARD_HELP.rainbow_medicine);

let yellowVirus = new Cards('yellow_virus', '/assets/cards/yellow_virus.png', 4, 'virus', 'yellow', CARD_HELP.virus);
let blueVirus = new Cards('blue_virus', '/assets/cards/blue_virus.png', 4, 'virus', 'blue', CARD_HELP.virus);
let redVirus = new Cards('red_virus', '/assets/cards/red_virus.png', 4, 'virus', 'red', CARD_HELP.virus);
let greenVirus = new Cards('green_virus', '/assets/cards/green_virus.png', 4, 'virus', 'green', CARD_HELP.virus);
let rainbowVirus = new Cards('rainbow_virus', '/assets/cards/rainbow_virus.png', 1, 'virus', 'rainbow', CARD_HELP.rainbow_virus);

let contagion = new Cards('contagion', '/assets/cards/contagion.png', 2, 'treatment', 'purple', CARD_HELP.contagion);
let thief = new Cards('thief', '/assets/cards/thief.png', 3, 'treatment', 'purple', CARD_HELP.thief);
let transplant = new Cards('transplant', '/assets/cards/transplant.png', 3, 'treatment', 'purple', CARD_HELP.transplant);
let glove = new Cards('glove', '/assets/cards/glove.png', 1, 'treatment', 'purple', CARD_HELP.glove);
let medicalError = new Cards('medical_error', '/assets/cards/medical_error.png', 1, 'treatment', 'purple', CARD_HELP.medical_error);

