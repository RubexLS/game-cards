import { iniciarJuego, syncDataBase, asignarRolLocal } from './ui.js'; 
import { firebaseMock } from './firebaseMock.js'; // Tu archivo de Firebase

const pantallaMenu = document.getElementById('menu');
const pantallaJuego = document.getElementById('viewMap');
const botonJugar = document.getElementById('play');

const GAME_ID = "game_001";
let preliminarySelection = null;
const botones = document.querySelectorAll('.select');

let juegoIniciadoLocalmente = false;

// 1. ESCUCHA INMEDIATA DEL MENÚ: Bloquea botones ocupados por otros jugadores
firebaseMock.listenMatch(GAME_ID, (gameData) => {
    if (!gameData) return;

    //si la partida ya inició en la nube, bloqueamos el acceso tarde
    if (gameData.state === "en_progreso") {
        if (!juegoIniciadoLocalmente) {
            juegoIniciadoLocalmente = true;
            
            // Transición automática de pantallas para TODOS los clientes conectados
            pantallaMenu.style.display = 'none';
            pantallaJuego.style.display = 'grid';
            
            console.log("¡La partida ha comenzado! Transicionando al tablero...");
        }

        syncDataBase(gameData);
        return; 
    }

    const ocupados = gameData.occupiedPlayers || [];

    botones.forEach(boton => {
        // Si el botón fue seleccionado por MÍ, no lo tocamos aquí para mantener nuestra selección visual
        if (preliminarySelection && preliminarySelection.id === boton.id) {
            boton.disabled = true;
            boton.style.opacity = "0.6"; // Opacidad intermedia para saber que es TUYO
            // boton.style.pointerEvents = "auto"; // Te permite volver a hacerle clic si quieres cambiarlo
            return;
        }

        // Si el botón está en la lista de ocupados de Firebase, lo bloqueamos para los demás
        if (ocupados.includes(boton.id)) {
            boton.disabled = true;
            boton.style.opacity = "0.3"; // Más opaco para notar que está "tomado"
            boton.style.pointerEvents = "none";
        } else {
            // Si el jugador se sale o libera el color, se vuelve a habilitar
            boton.disabled = false;
            boton.style.opacity = "1";
            boton.style.pointerEvents = "auto";
        }
    });
});

async function block(currentSelection) {
    const gameData = await firebaseMock.getGame(GAME_ID);
    let ocupados = (gameData && gameData.occupiedPlayers) ? gameData.occupiedPlayers : [];

    if (ocupados.includes(currentSelection.id)) {
        alert("¡Este personaje acaba de ser seleccionado por otro jugador!");
        return;
    }

    if (preliminarySelection) {
        ocupados = ocupados.filter(id => id !== preliminarySelection.id);
    }
    
    preliminarySelection = currentSelection;

    ocupados.push(currentSelection.id);

    asignarRolLocal(currentSelection.id);

    await firebaseMock.updateGame(GAME_ID, {
        occupiedPlayers: ocupados
    });
}

botones.forEach(boton => {
    boton.addEventListener('click', (evento) => {
        block(evento.currentTarget);
    });
});

botonJugar.addEventListener('click', async () => {
    if (!preliminarySelection) {
        alert("Por favor, selecciona un personaje antes de jugar.");
        return;
    }
    
    await iniciarJuego();
});



