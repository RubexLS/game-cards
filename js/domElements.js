export const options = document.getElementById('options');
export const screenMenu = document.getElementById('menu');
export const screenGame = document.getElementById('viewMap');
export const buttonPlay = document.getElementById('play');
export const avatarButtons = document.querySelectorAll('.select');
export const handTemp = document.getElementById('player-hand');
export const deckElement = document.getElementById('deck');
export const deckCountElement = document.getElementById('deck-count');
export const exileSlot = document.getElementById('exile-slot');

export const organBrain = document.getElementById('brain-slot');
export const organHeart = document.getElementById('heart-slot');
export const organStomach = document.getElementById('stomach-slot');
export const organBone = document.getElementById('bone-slot');
export const organNervous = document.getElementById('nervous-slot');

export const slotsRivalsDOM = [
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

export const bodyRivalsContainers = [
    document.getElementById('bodyRivalOne'),
    document.getElementById('bodyRivalTwo'),
    document.getElementById('bodyRivalThree'),
    document.getElementById('bodyRivalFour')
];