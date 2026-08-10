export { Cards };

import { firebaseMock, buttonStatus, recordUsage } from './firebaseMock.js';

const GAME_ID = 'game_001';

import {
        gameState, 
        handTemp,
        renderBoard, 
        renderHand,
        getStatus,
        syncDataBase,
        HAND_KEY,
        BODY_KEY
} from './ui.js';

const options = document.getElementById('options');

const organBrain = document.getElementById('brain-slot');
const organHeart = document.getElementById('heart-slot');
const organStomach = document.getElementById('stomach-slot');
const organBone = document.getElementById('bone-slot');
const organNervous = document.getElementById('nervous-slot');

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

const ALL_BODY = ['bodyOrange', 'bodyBlue', 'bodyRed', 'bodyYellow', 'bodyGreen'];

class Cards {
    static typeCards = [];
    static deck = [];

    constructor(name, cardPhoto, amount, type, color) {
        this.name = name
        Cards.typeCards.push(this)
        this.cardPhoto = cardPhoto
        this.amount = amount
        this.type = type
        this.color = color
        this.w = 40
        this.h = 40
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
    //verifica si es el contenedor del jugador
    const myHand = (contenedorHTML === handTemp);

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
            optionUse.innerText = 'Usar';

            if (buttonStatus()) {
                optionUse.disabled = true;
                optionUse.innerText = '1 por turno';
            }
            
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

async function exileCard(cardIndex) {
    let handKey = HAND_KEY;
    let hand = gameState[handKey];

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
        photo: `url('${organCard.cardPhoto}')`
    });

    await firebaseMock.updateGame(GAME_ID, {
        [HAND_KEY]: hand,
        [BODY_KEY]: gameState[BODY_KEY]
    });
}

// Renderizado del cuerpo del jugador y sus rivales
export function renderBodyBoard (bodyKey, slotsHTML) {
    if (!slotsHTML) return;

    [slotsHTML.brain, slotsHTML.heart, slotsHTML.stomach, slotsHTML.bone, slotsHTML.nervous].forEach(slot => {
        if (slot) slot.innerHTML = ''; 
    });

    const bodyCards = gameState[bodyKey] || [];

    bodyCards.forEach(card => {
        let organSlot;
        const organDiv = document.createElement('div');

        switch (card.name) {
            case 'brain': organDiv.className = 'organ brain-card'; organSlot = slotsHTML.brain; break;
            case 'heart': organDiv.className = 'organ heart-card'; organSlot = slotsHTML.heart; break;
            case 'stomach': organDiv.className = 'organ stomach-card'; organSlot = slotsHTML.stomach; break;
            case 'bone': organDiv.className = 'organ bone-card'; organSlot = slotsHTML.bone; break;
            default: organDiv.className = 'organ nervous-card'; organSlot = slotsHTML.nervous; break;
        }

        if (organSlot) {
            organDiv.style.backgroundImage = card.photo;
            organDiv.style.backgroundSize = 'cover';
            organDiv.style.width = '100%';
            organDiv.style.height = '100%';
            
            // Atributos de metadatos listos para cuando lances virus
            organDiv.dataset.propietario = bodyKey; 
            organDiv.dataset.organo = card.name;

            organSlot.appendChild(organDiv);
        }
    });

    [slotsHTML.brain, slotsHTML.heart, slotsHTML.stomach, slotsHTML.bone, slotsHTML.nervous].forEach(slot => {
        if (slot && slot.children.length === 0) {
            slot.innerText = 'Vacío';
        }
    });
}

// FUNCIÓN PRINCIPAL DE INYECCIÓN VISUAL
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
    const miIndice = ALL_BODY.indexOf(BODY_KEY);

    // Cortamos y reordenamos el array para que los que están "después" pasen al frente
    const listaRivalesRotada = [
        ...ALL_BODY.slice(miIndice + 1),
        ...ALL_BODY.slice(0, miIndice)
    ];

    // Mapea a los 4 oponentes en los 4 contenedores relativos del DOM
    listaRivalesRotada.forEach((claveRival, index) => {
        const slotsDestino = slotsRivalsDOM[index];
        if (slotsDestino) {
            renderBodyBoard(claveRival, slotsDestino);
        }
    });
}
