export { Cards };

import { firebaseMock, obtenerEstadoBotonTurno, registrarUsoCarta } from './firebaseMock.js';

const GAME_ID = 'game_001';

import {
        estadoJuego, 
        handTemp, 
        // oponentHandElement, 
        renderBoard, 
        renderHand,
        getStatus,
        syncDataBase,
        MI_MANO_CLAVE,
        MI_CUERPO_CLAVE
} from './ui.js';

const options = document.getElementById('options');

const organBrain = document.getElementById('brain-slot');
const organHeart = document.getElementById('heart-slot');
const organStomach = document.getElementById('stomach-slot');
const organBone = document.getElementById('bone-slot');
const organNervous = document.getElementById('nervous-slot');

const slotsRivalesDOM = [
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

const TODOS_LOS_CUERPOS = ['bodyOrange', 'bodyBlue', 'bodyRed', 'bodyYellow', 'bodyGreen'];

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



export function renderHandPlayer(currentPLayer, contenedorHTML) {
    contenedorHTML.innerHTML = '';
    //verifica si es el contenedor del jugador
    const esMiMano = (contenedorHTML === handTemp);

    currentPLayer.forEach((card, index) => {
        const cardDiv = document.createElement('div');

        if (index === 0) cardDiv.className = 'card left-card';
        else if (index === 1) cardDiv.className = 'card medium-card';
        else if (index === 2) cardDiv.className = 'card right-card';

        // cardDiv.innerText = card.name; // nombre de las cartas
        cardDiv.style.backgroundImage = `url('${card.cardPhoto}')`;
        cardDiv.style.backgroundSize = "cover";
        // Al hacer clic en una carta de la mano, se destierra
        cardDiv.addEventListener('click', () => {
            options.innerHTML = '';

            const optionUse = document.createElement('button');
            optionUse.className = 'option use';
            optionUse.innerText = 'Usar';

            if (obtenerEstadoBotonTurno()) {
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
                if (obtenerEstadoBotonTurno()) return; 

                // Bloquea el estado local del botón de forma inmediata
                registrarUsoCarta();
                optionUse.disabled = true;
                options.innerHTML = '';

                await useCard(index);
            });
        });
        contenedorHTML.appendChild(cardDiv);  
    });
}

async function exileCard(cardIndex) {
    // Detectamos dinámicamente cuál es mi propiedad en la base de datos según el estado del turno
    // const miClaveRol = estadoJuego.status ? 'playerOrange' : 'playerBlue';
    let miManoClave = MI_MANO_CLAVE;
    let miMano = estadoJuego[miManoClave];

    if (miMano.length === 0) return;

    // Quita la carta del array local
    const excludedCard = miMano.splice(cardIndex, 1)[0];

    // Guardamos la URL limpia de la foto directamente en el historial de descarte
    // const urlFormateada = `url('${excludedCard.cardPhoto}')`;
    estadoJuego.exileZone.push(excludedCard.cardPhoto);

    await firebaseMock.updateGame(GAME_ID, {
        [miManoClave]: miMano,
        exileZone: estadoJuego.exileZone
    });
}

async function useCard(cardIndex) {
    // const miClaveRol = estadoJuego.status ? 'playerOrange' : 'playerBlue';
    let miMano = estadoJuego[MI_MANO_CLAVE];

    if (!miMano || miMano.length === 0) return;
    
    const organCard = miMano.splice(cardIndex, 1)[0];

    estadoJuego[MI_CUERPO_CLAVE].push({
        name: organCard.name,
        photo: `url('${organCard.cardPhoto}')`
    });

    await firebaseMock.updateGame(GAME_ID, {
        [MI_MANO_CLAVE]: miMano,
        [MI_CUERPO_CLAVE]: estadoJuego[MI_CUERPO_CLAVE]
    });
}

// export function renderBody(cardImage){
//     // 1. Limpiar todos los slots antes de redibujar para evitar duplicados visuales
//     [organBrain, organHeart, organStomach, organBone, organNervous].forEach(slot => slot.innerHTML = 'Vacío');

//     const miCuerpoActual = estadoJuego[MI_CUERPO_CLAVE] || [];

//     miCuerpoActual.forEach(card => {
//         let organSlot;
//         const organDiv = document.createElement('div');

//         switch (card.name) {
//             case 'brain':
//                 organDiv.className = 'organ brain-card';
//                 organSlot = organBrain;
//                 break;
//             case 'heart':
//                 organDiv.className = 'organ heart-card';
//                 organSlot = organHeart;
//                 break;
//             case 'stomach':
//                 organDiv.className = 'organ stomach-card';
//                 organSlot = organStomach;
//                 break;
//             case 'bone':
//                 organDiv.className = 'organ bone-card';
//                 organSlot = organBone;
//                 break;
//             default:
//                 organDiv.className = 'organ nervous-card';
//                 organSlot = organNervous;
//                 break;
//         }

//         organSlot.innerText = '';
//         organDiv.style.backgroundImage = card.photo;
//         organDiv.style.backgroundSize = 'cover';
//         organDiv.style.width = '100%';
//         organDiv.style.height = '100%';
//         organSlot.appendChild(organDiv);
//     });
// }

// FUNCIÓN UNIVERSAL DE RENDERIZADO
export function renderCuerpoEspecifico(claveCuerpo, slotsHTML) {
    if (!slotsHTML) return;

    [slotsHTML.brain, slotsHTML.heart, slotsHTML.stomach, slotsHTML.bone, slotsHTML.nervous].forEach(slot => {
        if (slot) slot.innerHTML = ''; 
    });

    const cartasCuerpo = estadoJuego[claveCuerpo] || [];

    cartasCuerpo.forEach(card => {
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
            organDiv.dataset.propietario = claveCuerpo; 
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
    // A. DIBUJAR MI PROPIO CUERPO EN LA IZQUIERDA
    const misSlotsLocales = {
        brain: organBrain,
        heart: organHeart,
        stomach: organStomach,
        bone: organBone,
        nervous: organNervous
    };
    renderCuerpoEspecifico(MI_CUERPO_CLAVE, misSlotsLocales);

    // B. ROTAR Y DIBUJAR A LOS RIVALES EN LA DERECHA
    if (!MI_CUERPO_CLAVE) return;

    // Buscamos en qué posición del array global estoy parado
    const miIndice = TODOS_LOS_CUERPOS.indexOf(MI_CUERPO_CLAVE);

    // Cortamos y reordenamos el array para que los que están "después" pasen al frente
    const listaRivalesRotada = [
        ...TODOS_LOS_CUERPOS.slice(miIndice + 1),
        ...TODOS_LOS_CUERPOS.slice(0, miIndice)
    ];

    // Mapeamos a los 4 oponentes en los 4 contenedores relativos del DOM
    listaRivalesRotada.forEach((claveRival, index) => {
        const slotsDestino = slotsRivalesDOM[index];
        if (slotsDestino) {
            renderCuerpoEspecifico(claveRival, slotsDestino);
        }
    });
}
