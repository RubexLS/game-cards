import { iniciarJuego, syncDataBase, asignarRolLocal } from './ui.js'; 
import { firebaseMock } from './firebaseMock.js'; // Tu archivo de Firebase

const pantallaMenu = document.getElementById('menu');
const pantallaJuego = document.getElementById('viewMap');
const botonJugar = document.getElementById('play');

const GAME_ID = "game_001";
let preliminarySelection = null;
const botones = document.querySelectorAll('.select');

function block(currentSelection) {
    if (preliminarySelection) {
        preliminarySelection.disabled = false;
        preliminarySelection.style.opacity = "1";
    }
    
    currentSelection.disabled = true;
    currentSelection.style.opacity = "0.5";
    
    preliminarySelection = currentSelection;

    asignarRolLocal(currentSelection.id);
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
    
    pantallaMenu.style.display = 'none';
    pantallaJuego.style.display = 'grid';
    
    await iniciarJuego();

    // ACTIVA LA ESCUCHA EN TIEMPO REAL
    firebaseMock.listenMatch(GAME_ID, (estadoActualizado) => {
        console.log("Cambio detectado en la nube. Sincronizando interfaz...");
        
        // Llamamos a tu función de sincronización pasándole los datos frescos de la nube
        syncDataBase(estadoActualizado); 
    });
});



