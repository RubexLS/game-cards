import { options, handTemp } from './domElements.js';

export function clearOptions() { if (options) options.innerHTML = ''; }
export function freezeHandInterface() { if (handTemp) handTemp.classList.add('disabled'); }
export function hideVictoryBanner() { const b = document.getElementById('victory-banner'); if (b) b.remove(); }

export function showVictoryBanner(winnerKey, isHost) {
    hideVictoryBanner();
    const banner = document.createElement('div');
    banner.id = 'victory-banner';
    banner.style.cssText = "position:fixed; top:20%; left:50%; transform:translate(-50%, -50%); background:gold; color:black; padding:20px; font-size:24px; font-weight:bold; border-radius:10px; z-index:999; text-align:center;";
    banner.innerHTML = `🏆 ¡${winnerKey ? winnerKey.replace('player', 'Jugador ') : 'Alguien'} ha ganado! 🏆`;
    
    if (isHost) {
        const btn = document.createElement('button'); btn.innerText = "Iniciar Nueva Partida";
        btn.style.cssText = "display:block; margin:15px auto 0; padding:10px; cursor:pointer;";
        btn.addEventListener('click', async () => { const { resetWholeGame } = await import('./gameLifecycle.js'); await resetWholeGame(); });
        banner.appendChild(btn);
    } else {
        const p = document.createElement('p'); p.innerText = "Esperando que el Host reinicie...";
        p.style.cssText = "font-size:14px; margin-top:10px; font-weight:normal;";
        banner.appendChild(p);
    }
    document.body.appendChild(banner);
}