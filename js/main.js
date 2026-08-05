import { iniciarJuego } from './ui.js'; 

const pantallaMenu = document.getElementById('menu');
const pantallaJuego = document.getElementById('viewMap');
const botonJugar = document.getElementById('play');

botonJugar.addEventListener('click', async () => {
    // 1. Ocultar el menú y mostrar el juego
    pantallaMenu.style.display = 'none';
    pantallaJuego.style.display = 'grid'; // O 'flex' según tu CSS
    
    // 2. Arrancar el juego repartiendo las cartas
    await iniciarJuego();
});



