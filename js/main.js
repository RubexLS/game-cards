import { 
    startGame, 
    syncDataBase, 
    assignPlayer
    // rolRecovery
} from './ui.js';

import { firebaseMock } from './firebaseMock.js';

const screenMenu = document.getElementById('menu');
const screenGame = document.getElementById('viewMap');
const buttonPlay = document.getElementById('play');

const GAME_ID = "game_001";
let preliminarySelection = null;
const buttons = document.querySelectorAll('.select');

let gameStarted = false;

//online
// const loadedRol = rolRecovery();
// if (loadedRol) {
//     // Simula que volvió a clickear su personaje guardado internamente
//     preliminarySelection = { id: loadedRol };
// }

// Bloquea botones ocupados por otros jugadores
firebaseMock.listenMatch(GAME_ID, (gameData) => {
    if (!gameData) return; // seguridad

    // online
    // if (gameData.state === "en_progreso") {
    //     // Solo entra al juego si el navegador tiene un rol asignado
    //     if (preliminarySelection) { 
    //         if (!gameStarted) {
    //             gameStarted = true;
    //             screenMenu.style.display = 'none';
    //             screenGame.style.display = 'grid';
    //         }
    //         syncDataBase(gameData);
    //     } else {
    //         // Si entra alguien sin rol mientras el juego corre, es un espectador o está fuera
    //         alert("La partida ya está en progreso y no tienes un personaje asignado.");
    //         screenMenu.style.display = 'block';
    //         screenGame.style.display = 'none';
    //     }
    //     return; 
    // }

    const notAvailable = gameData.unavailablePlayers || [];

    // el host sera el primero en la lista y sera el unico que puede iniciar el juego
    if (notAvailable.length > 0 && preliminarySelection && preliminarySelection.id === notAvailable[0]) {
        buttonPlay.style.display = "block";
    } else {
        buttonPlay.style.display = "none";
    }

    //Carga el tablero con los jugadres actuales en la sala y evita el acceso de nuevos jugadores durante el juego
    if (gameData.state === "en_progreso") {
        if (!gameStarted) {
            gameStarted = true;
            
            screenMenu.style.display = 'none';
            screenGame.style.display = 'grid';
        }

        syncDataBase(gameData);
        return; 
    }

    buttons.forEach(button => {
        //Seleccion del jugador local
        if (preliminarySelection && preliminarySelection.id === button.id) {
            button.disabled = true;
            button.style.backgroundColor = "green";
            button.style.filter = "brightness(1.5)"; 
            return;
        }

        //Bloqueo de avatars seleccionados por otros jugadores
        if (notAvailable.includes(button.id)) {
            button.disabled = true;
            button.style.opacity = "0.5";
            button.style.backgroundColor = "red";
            button.style.pointerEvents = "none";
        } else {
            // regresa el avatar a su estado inicial al seleccionar otro avatar
            button.disabled = false;
            button.style.opacity = "1";
            button.style.pointerEvents = "auto";
            button.style.filter = "brightness(1)"; 
            button.style.backgroundColor = "";
        }
    });
});

async function block(currentSelection) {
    const gameData = await firebaseMock.getGame(GAME_ID);
    let notAvailable = (gameData && gameData.unavailablePlayers) ? gameData.unavailablePlayers : [];

    //evita las selecciones simultaneas de un personaje
    if (notAvailable.includes(currentSelection.id)) {
        alert("¡Este personaje acaba de ser seleccionado por otro jugador!");
        return;
    }

    if (preliminarySelection) {
        notAvailable = notAvailable.filter(id => id !== preliminarySelection.id);
    }
    
    preliminarySelection = currentSelection;

    notAvailable.push(currentSelection.id);

    assignPlayer(currentSelection.id);

    await firebaseMock.updateGame(GAME_ID, {
        unavailablePlayers: notAvailable
    });
}

buttons.forEach(button => {
    button.addEventListener('click', (evento) => {
        block(evento.currentTarget);
    });
});

buttonPlay.addEventListener('click', async () => {
    if (!preliminarySelection) {
        alert("Por favor, selecciona un personaje antes de jugar.");
        return;
    }
    
    await startGame();
});



