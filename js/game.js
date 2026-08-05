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

let bone = new Cards('bone', '/assets/bone.png', 5, 'organ', 'yellow');
let brain = new Cards('brain', '/assets/brain.png', 5, 'organ', 'blue');
let heart = new Cards('heart', '/assets/heart.png', 5, 'organ', 'red');
let stomach = new Cards('stomach', '/assets/stomach.png', 5, 'organ', 'green');
let nervousSystem = new Cards('nervousSystem', '/assets/rainbow_organ.png', 1, 'organ', 'rainbow');

let yellowMedicine = new Cards('yellow_medicine', '/assets/yellow_medicine.png', 4, 'medicine', 'yellow');
let blueMedicine = new Cards('blue_medicine', '/assets/blue_medicine.png', 4, 'medicine', 'blue');
let redMedicine = new Cards('red_medicine', '/assets/red_medicine.png', 4, 'medicine', 'red');
let greenMedicine = new Cards('green_medicine', '/assets/green_medicine.png', 4, 'medicine', 'green');
let rainbowMedicine = new Cards('rainbow_medicine', '/assets/rainbow_medicine.png', 4, 'medicine', 'rainbow');

let yellowVirus = new Cards('yellow_virus', '/assets/yellow_virus.png', 4, 'virus', 'yellow');
let blueVirus = new Cards('blue_virus', '/assets/blue_virus.png', 4, 'virus', 'blue');
let redVirus = new Cards('red_virus', '/assets/red_virus.png', 4, 'virus', 'red');
let greenVirus = new Cards('green_virus', '/assets/green_virus.png', 4, 'virus', 'green');
let rainbowVirus = new Cards('rainbow_virus', '/assets/rainbow_virus.png', 1, 'virus', 'rainbow');

let contagion = new Cards('contagion', '/assets/contagion.png', 2, 'treatment', 'purple');
let thief = new Cards('thief', '/assets/thief.png', 3, 'treatment', 'purple');
let transplant = new Cards('transplant', '/assets/transplant.png', 3, 'treatment', 'purple');
let glove = new Cards('glove', '/assets/glove.png', 1, 'treatment', 'purple');
let medicalError = new Cards('medical_error', '/assets/medical_error.png', 1, 'treatment', 'purple');

export { Cards };

import { firebaseMock } from './firebaseMock.js';

const GAME_ID = 'game_001';

import {
        estadoJuego, 
        playerHandElement, 
        oponentHandElement, 
        renderBoard, 
        renderHand,
        syncDataBase
} from './ui.js';

const options = document.getElementById('options');
const organBrain = document.getElementById('brain-slot');
const organHeart = document.getElementById('heart-slot');
const organStomach = document.getElementById('stomach-slot');
const organBone = document.getElementById('bone-slot');
const organNervous = document.getElementById('nervous-slot');

export function renderHandPlayer(currentPLayer, contenedorHTML) {
    contenedorHTML.innerHTML = '';
    currentPLayer.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        switch (index) {
            case 0:
                cardDiv.className = 'card left-card';
                break;
            case 1:
                cardDiv.className = 'card medium-card';
                break;
            case 2:
                cardDiv.className = 'card right-card';
                break;
        }
        // cardDiv.innerText = card.name; // nombre de las cartas
        cardDiv.style.backgroundImage = `url('${card.cardPhoto}')`;
        cardDiv.style.backgroundSize = "cover";
        // Al hacer clic en una carta de la mano, se destierra
        cardDiv.addEventListener('click', () => {
            options.innerHTML = '';
            const optionUse = document.createElement('button');
            optionUse.className = 'option use';
            optionUse.innerText = 'Usar';
            
            const optionDiscard = document.createElement('button');
            optionDiscard.className = 'option discard';
            optionDiscard.innerText = 'Descartar';
            
            options.appendChild(optionUse);
            options.appendChild(optionDiscard);

            const buttonDiscard = document.getElementsByClassName('discard')[0];

            buttonDiscard.addEventListener('click', async () => {
                await exileCard(index, `url('${card.cardPhoto}')`);
                options.innerHTML = '';
            });

            const buttonUse = document.getElementsByClassName('use')[0];

            buttonUse.addEventListener('click', async () => {
                await useCard(index, `url('${card.cardPhoto}')`);
                options.innerHTML = '';
            });
        });
        contenedorHTML.appendChild(cardDiv);  
    });
}

async function exileCard(cardIndex, cardImage) {
    let manoActual = estadoJuego.status ? estadoJuego.playerHand : estadoJuego.oponentHand;

    if (manoActual.length === 0) return;

    const excludedCard = manoActual.splice(cardIndex, 1)[0];
    

    estadoJuego.exileZone.push(excludedCard.cardPhoto);

    await firebaseMock.updateGame(GAME_ID, {
        playerHand: estadoJuego.playerHand,
        oponentHand: estadoJuego.oponentHand,
        exileZone: estadoJuego.exileZone
    });

    await syncDataBase();
}

async function useCard(cardIndex, cardImage) {
    let manoActual = estadoJuego.status ? estadoJuego.playerHand : estadoJuego.oponentHand;

    if (manoActual.length === 0) return;
    
    const organCard = manoActual.splice(cardIndex, 1)[0];
    
    estadoJuego.bodyZone.push(organCard.name);

    await firebaseMock.updateGame(GAME_ID, {
        playerHand: estadoJuego.playerHand,
        oponentHand: estadoJuego.oponentHand,
        bodyZone: estadoJuego.bodyZone
    });

    await syncDataBase();
    renderBody(cardImage);
}

function renderBody(cardImage){
    let organSlot;

    const organDiv = document.createElement('div');
    switch (estadoJuego.bodyZone[estadoJuego.bodyZone.length - 1]) {
        case 'brain':
            organDiv.className = 'organ brain-card';
            organSlot = organBrain;
            break;
        case 'heart':
            organDiv.className = 'organ heart-card';
            organSlot = organHeart;
            break;
        case 'stomach':
            organDiv.className = 'organ stomach-card';
            organSlot = organStomach;
            break;
        case 'bone':
            organDiv.className = 'organ bone-card';
            organSlot = organBone;
            break;
        default:
            organDiv.className = 'organ nervous-card';
            organSlot = organNervous;
            break;
    }
    organSlot.innerText = '';

    organDiv.style.backgroundImage = cardImage;
    organDiv.style.backgroundSize = 'cover';

    organSlot.appendChild(organDiv);


}