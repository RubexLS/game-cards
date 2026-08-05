import { iniciarJuego } from './ui.js'; 

const pantallaMenu = document.getElementById('menu');
const pantallaJuego = document.getElementById('viewMap');
const botonJugar = document.getElementById('play');

botonJugar.addEventListener('click', async () => {
    pantallaMenu.style.display = 'none';
    pantallaJuego.style.display = 'grid';
    
    await iniciarJuego();
});



