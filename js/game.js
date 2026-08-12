import { firebaseMock, buttonStatus, recordUsage } from './firebaseMock.js';
import { renderBodyBoard, handTemp } from './ui.js';
import { gameState, HAND_KEY, BODY_KEY, getStatus, GAME_ID } from './state.js';

const options = document.getElementById('options');
const ALL_BODY = ['bodyOrange', 'bodyBlue', 'bodyRed', 'bodyYellow', 'bodyGreen'];

export const organBrain = document.getElementById('brain-slot');
export const organHeart = document.getElementById('heart-slot');
export const organStomach = document.getElementById('stomach-slot');
export const organBone = document.getElementById('bone-slot');
export const organNervous = document.getElementById('nervous-slot');

const slotsRivalsDOM = [
    {
        brain: document.getElementById('brain-slot-rivalOne'),
        heart: document.getElementById('heart-slot-rivalOne'),
        stomach: document.getElementById('stomach-slot-rivalOne'),
        bone: document.getElementById('bone-slot-rivalOne'),
        nervous: document.getElementById('nervous-slot-rivalOne')
    },
    {
        brain: document.getElementById('brain-slot-rivalTwo'),
        heart: document.getElementById('heart-slot-rivalTwo'),
        stomach: document.getElementById('stomach-slot-rivalTwo'),
        bone: document.getElementById('bone-slot-rivalTwo'),
        nervous: document.getElementById('nervous-slot-rivalTwo')
    },
    {
        brain: document.getElementById('brain-slot-rivalThree'),
        heart: document.getElementById('heart-slot-rivalThree'),
        stomach: document.getElementById('stomach-slot-rivalThree'),
        bone: document.getElementById('bone-slot-rivalThree'),
        nervous: document.getElementById('nervous-slot-rivalThree')
    },
    {
        brain: document.getElementById('brain-slot-rivalFour'),
        heart: document.getElementById('heart-slot-rivalFour'),
        stomach: document.getElementById('stomach-slot-rivalFour'),
        bone: document.getElementById('bone-slot-rivalFour'),
        nervous: document.getElementById('nervous-slot-rivalFour')
    }
];

export class Cards {
    static typeCards = [];
    static deck = [];

    constructor(name, cardPhoto, amount, type, color) {
        this.name = name
        Cards.typeCards.push(this)
        this.cardPhoto = cardPhoto
        this.amount = amount
        this.type = type
        this.color = color
    }

    static buildDeck(){
        Cards.deck = [];
        Cards.typeCards.forEach(card => {
            for(let i = 0; i < card.amount; i++){
                Cards.deck.push({
                    name: card.name,
                    cardPhoto: card.cardPhoto,
                    type: card.type,
                    color: card.color
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

let bone = new Cards('bone', '/assets/cards/bone.png', 5, 'organ', 'yellow');
let brain = new Cards('brain', '/assets/cards/brain.png', 5, 'organ', 'blue');
let heart = new Cards('heart', '/assets/cards/heart.png', 5, 'organ', 'red');
let stomach = new Cards('stomach', '/assets/cards/stomach.png', 5, 'organ', 'green');
let nervousSystem = new Cards('nervousSystem', '/assets/cards/rainbow_organ.png', 1, 'organ', 'rainbow');

let yellowMedicine = new Cards('yellow_medicine', '/assets/cards/yellow_medicine.png', 4, 'medicine', 'yellow');
let blueMedicine = new Cards('blue_medicine', '/assets/cards/blue_medicine.png', 4, 'medicine', 'blue');
let redMedicine = new Cards('red_medicine', '/assets/cards/red_medicine.png', 4, 'medicine', 'red');
let greenMedicine = new Cards('green_medicine', '/assets/cards/green_medicine.png', 4, 'medicine', 'green');
let rainbowMedicine = new Cards('rainbow_medicine', '/assets/cards/rainbow_medicine.png', 4, 'medicine', 'rainbow');

let yellowVirus = new Cards('yellow_virus', '/assets/cards/yellow_virus.png', 4, 'virus', 'yellow');
let blueVirus = new Cards('blue_virus', '/assets/cards/blue_virus.png', 4, 'virus', 'blue');
let redVirus = new Cards('red_virus', '/assets/cards/red_virus.png', 4, 'virus', 'red');
let greenVirus = new Cards('green_virus', '/assets/cards/green_virus.png', 4, 'virus', 'green');
let rainbowVirus = new Cards('rainbow_virus', '/assets/cards/rainbow_virus.png', 1, 'virus', 'rainbow');

let contagion = new Cards('contagion', '/assets/cards/contagion.png', 2, 'treatment', 'purple');
let thief = new Cards('thief', '/assets/cards/thief.png', 3, 'treatment', 'purple');
let transplant = new Cards('transplant', '/assets/cards/transplant.png', 3, 'treatment', 'purple');
let glove = new Cards('glove', '/assets/cards/glove.png', 1, 'treatment', 'purple');
let medicalError = new Cards('medical_error', '/assets/cards/medical_error.png', 1, 'treatment', 'purple');

//Renderizado de la mano del jugador y control de las acciones con las cartas de la misma
export function renderHandPlayer(currentPLayer, contenedorHTML) {
    contenedorHTML.innerHTML = '';

    currentPLayer.forEach((card, index) => {
        const cardDiv = document.createElement('div');

        if (index === 0) cardDiv.className = 'card left-card';
        else if (index === 1) cardDiv.className = 'card medium-card';
        else if (index === 2) cardDiv.className = 'card right-card';

        cardDiv.style.backgroundImage = `url('${card.cardPhoto}')`;
        cardDiv.style.backgroundSize = "cover"; // Hasta este punto se grafica cada una de las cartas de la mano
        
        //acciones disponibles al seleccionar una carta
        cardDiv.addEventListener('click', () => {
            options.innerHTML = '';

            const optionUse = document.createElement('button');
            optionUse.className = 'option use';
            optionUse.innerText = buttonStatus() ? '1 por turno' : 'Usar';
            optionUse.disabled = buttonStatus();
            
            const optionDiscard = document.createElement('button');
            optionDiscard.className = 'option discard';
            optionDiscard.innerText = 'Descartar';
            
            options.appendChild(optionUse);
            options.appendChild(optionDiscard);

            optionDiscard.addEventListener('click', async () => {
                options.innerHTML = '';
                await exileCard(index);
            });

            optionUse.addEventListener('click', async () => {
                // en caso de multiples clicks
                if (buttonStatus()) return; 

                // Bloquea el estado local del botón de forma inmediata
                recordUsage();
                optionUse.disabled = true;
                options.innerHTML = '';

                await useCard(index);
            });
        });
        contenedorHTML.appendChild(cardDiv);  
    });
}

export async function drawCard() {
    // Bloquear si no es mi turno
    if (!getStatus()) { alert("No es tu turno para robar."); return; }
    if (gameState.deck.length === 0) { alert("¡No quedan cartas!"); return; }
    
    const hand = gameState[HAND_KEY];
    if (hand.length >= 3) { alert("Tu mano está llena."); return; }

    // Modificacion de los datos temporalmente
    const nextCard = gameState.deck.pop();
    hand.push(nextCard);

    await firebaseMock.updateGame(GAME_ID, {
        deck: gameState.deck, 
        [HAND_KEY]: hand 
    });
}

async function exileCard(cardIndex) {
    let hand = gameState[HAND_KEY];
    if (hand.length === 0) return;

    // Quita la carta del array local
    const excludedCard = hand.splice(cardIndex, 1)[0];
    gameState.exileZone.push(excludedCard.cardPhoto);

    await firebaseMock.updateGame(GAME_ID, {
        [handKey]: hand,
        exileZone: gameState.exileZone
    });
}

async function useCard(cardIndex) {
    let hand = gameState[HAND_KEY];
    if (!hand || hand.length === 0) return;
    
    const organCard = hand.splice(cardIndex, 1)[0];

    gameState[BODY_KEY].push({
        name: organCard.name,
        cardPhoto: organCard.cardPhoto
    });

    await firebaseMock.updateGame(GAME_ID, {
        [HAND_KEY]: hand,
        [BODY_KEY]: gameState[BODY_KEY]
    });
}

// Inyeccion visual
export function renderBody() {
    // Dibuja el cuerpo local
    const myOrganSlots = {
        brain: organBrain,
        heart: organHeart,
        stomach: organStomach,
        bone: organBone,
        nervous: organNervous
    };
    renderBodyBoard(BODY_KEY, myOrganSlots);

    // Rota y dibuja los cuerpos de los rivales
    if (!BODY_KEY) return;

    // Buscamos en qué posición del array global esta ubicado
    const indexLocation = ALL_BODY.indexOf(BODY_KEY);

    // Corte y reordenamiento del array 
    const rotatedRivals = [
        ...ALL_BODY.slice(indexLocation + 1),
        ...ALL_BODY.slice(0, indexLocation)
    ];

    // Mapea a los 4 oponentes en los 4 contenedores relativos del DOM
    rotatedRivals.forEach((rivalKey, index) => {
        const slotsDestino = slotsRivalsDOM[index];
        if (slotsDestino) {
            renderBodyBoard(rivalKey, slotsDestino);
        }
    });
}
