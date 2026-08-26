import { assignPlayer, GAME_ID } from './state.js';
import { firebaseMock } from './firebaseMock.js';
import { startGame, syncDataBase } from './gameLifecycle.js';
import { avatarButtons } from './domElements.js';
import { switchScreen, togglePlayButton, renderAvatarSelection } from './menuUI.js';
import { initTargetListener } from './targetManager.js';

let preliminarySelection = null;
let gameStarted = false;

// Iniciamos el escucha de objetivos de ataque/vacunación al arrancar
initTargetListener();

firebaseMock.listenMatch(GAME_ID, (gameData) => {
    if (!gameData) return; // seguridad
    if (gameData.state === "finalizado") { 
        syncDataBase(gameData);
        return; // Rompe el flujo, evitando ejecutar codigo de otros botonoes
    }

    const notAvailable = gameData.unavailablePlayers || [];
    // el host sera el primero en la lista y sera el unico que puede iniciar el juego
    togglePlayButton(notAvailable.length > 0 && preliminarySelection && preliminarySelection.id === notAvailable[0]);

    //Carga el tablero con los jugadres actuales en la sala y evita el acceso de nuevos jugadores durante el juego
    if (gameData.state === "en_progreso") {
        if (!gameStarted) { gameStarted = true; switchScreen(true); }
        syncDataBase(gameData); 
        return;
    }

    // regresa al menu y el estado cambio a "esperando"
    if (gameData.state === "esperando" && gameStarted) { 
        gameStarted = false; 
        switchScreen(false); 
    }
    renderAvatarSelection(notAvailable, preliminarySelection);
});

async function processCharacterBlock(currentSelection) {
    const gameData = await firebaseMock.getGame(GAME_ID);
    let notAvailable = gameData?.unavailablePlayers ? gameData.unavailablePlayers : [];

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

if (avatarButtons) {
    avatarButtons.forEach(b => {
        b.addEventListener('click', (e) => {
            processCharacterBlock(e.currentTarget);
        });
    });
}

const playBtn = document.getElementById('play');
if (playBtn) {
    playBtn.addEventListener('click', async () => {
        if (!preliminarySelection) { 
            alert("Por favor, selecciona un personaje antes de jugar."); 
            return; 
        } 
        await startGame(); 
    });
}


//escucha si el tamaño de la pantalla cambia
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-rivals-btn");
    const rivalsPanel = document.getElementById("rivals");

    if (toggleBtn && rivalsPanel) {
        toggleBtn.addEventListener("click", () => {
            // Alterna la clase active para deslizar el panel
            rivalsPanel.classList.toggle("active");
            
            // Alterna el texto que despliega el cuerpo de los rivales
            if (rivalsPanel.classList.contains("active")) {
                toggleBtn.innerText = "❌ Cerrar";
                toggleBtn.style.backgroundColor = "#34495e";
            } else {
                toggleBtn.innerText = "👥 Rivales";
                toggleBtn.style.backgroundColor = "#e74c3c";
            }
        });
    }
});
