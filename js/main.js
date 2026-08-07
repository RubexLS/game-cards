import { iniciarJuego, syncDataBase } from './ui.js'; 
import { firebaseMock } from './firebaseMock.js'; // Tu archivo de Firebase

const pantallaMenu = document.getElementById('menu');
const pantallaJuego = document.getElementById('viewMap');
const botonJugar = document.getElementById('play');

const GAME_ID = "game_001";

botonJugar.addEventListener('click', async () => {
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



