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







// Mapeo de IDs técnicos de turnos a nombres legibles para la UI
const COLOR_LABELS = {
    "playerOrange": "Naranja 🍊",
    "playerBlue": "Azul 💧",
    "playerRed": "Rojo 🔥",
    "playerYellow": "Amarillo ⚡",
    "playerGreen": "Verde 🌿"
};

// Diccionario emparejado al 100% con los nombres que pusiste en tu deck.js
const CARD_LABELS = {
    "bone": "🦴 Huesos",
    "brain": "🧠 Cerebro",
    "heart": "🫀 Corazón",
    "stomach": "🫁 Estómago",
    "nervousSystem": "🌈 Sist. Nervioso",
    "yellow_medicine": "💉 Vacuna Amarilla",
    "blue_medicine": "💉 Vacuna Azul",
    "red_medicine": "💉 Vacuna Roja",
    "green_medicine": "💉 Vacuna Verde",
    "rainbow_medicine": "💉 Súper Vacuna 🌈",
    "yellow_virus": "🦠 Virus Amarillo",
    "blue_virus": "🦠 Virus Azul",
    "red_virus": "🦠 Virus Rojo",
    "green_virus": "🦠 Virus Verde",
    "rainbow_virus": "🦠 Virus Comodín 🌈",
    "treatment_contagion": "🧪 Contagio",
    "treatment_thief": "🥷 Ladrón",
    "treatment_transplant": "🔄 Trasplante",
    "treatment_glove": "🧤 Guante de Látex",
    "treatment_medical_error": "☣️ Error Médico",
    "discard_action": "🗑️ Descarte"
};

/**
 * Renderiza y actualiza en tiempo real el panel central superior del tablero
 * @param {Object} gameState - El objeto de estado actual del juego venido de Firebase
 * @param {string} localHandKey - Tu HAND_KEY actual
 */
export function updateCentralActionPanel(gameState, localHandKey) {
    const turnContainer = document.getElementById("info-turno-texto");
    const historyContainer = document.getElementById("historial-lineas");
    const cardSlot = document.getElementById("slot-carta-flotante");

    if (!turnContainer) return;

    // 1. CONTROL DEL TURNO ACTUAL
    const activeTurnKey = gameState.turn; 
    const isMyTurn = activeTurnKey === localHandKey;

    if (isMyTurn) {
        turnContainer.innerHTML = `<span style="color: #2ecc71; font-weight: bold; font-family: monospace;">¡TU TURNO!</span>`;
    } else {
        const rivalName = COLOR_LABELS[activeTurnKey] || activeTurnKey;
        turnContainer.innerHTML = `TURNO DE: <span style="color: #e74c3c; font-weight: bold; font-family: monospace;">${rivalName.toUpperCase()}</span>`;
    }

    // 2. CONTROL DEL HISTORIAL Y LA CARTA FLOTANTE
    if (gameState.lastPlay) {
        const { playerKey, cardType, targetPlay } = gameState.lastPlay;
        const actor = playerKey === localHandKey ? "Tú" : (COLOR_LABELS[playerKey] || "Rival");
        const cardName = CARD_LABELS[cardType] || "Carta Especial";
        
        let logMessage = `• ${actor} usó ${cardName}`;
        if (targetPlay) logMessage += ` en ${targetPlay}`;

        // Imprimir línea en el historial sin duplicados visuales en cascada
        if (historyContainer && historyContainer.firstChild?.innerText !== logMessage) {
            const newLine = document.createElement("p");
            newLine.style.cssText = "margin: 3px 0; font-size: 11px; color: #fff; font-family: monospace;";
            newLine.innerText = logMessage;
            
            historyContainer.insertBefore(newLine, historyContainer.firstChild);

            // Mantener un tope máximo de 3 mensajes visibles para evitar desbordes
            while (historyContainer.children.length > 3) {
                historyContainer.removeChild(historyContainer.lastChild);
            }
        }

        // 3. RENDER VISUAL DE LA CARTA FLOTANTE CON SU RUTA DE IMAGEN REAL
        if (cardSlot) {
            const cleanCardName = cardType ? cardType.replace("treatment_", "") : "";
            // Importación dinámica limpia de la clase Cards de tu deck.js para extraer la imagen asignada
            import('./deck.js').then(({ Cards }) => {
                const originalCard = (Cards && Cards.typeCards) 
                    ? Cards.typeCards.find(c => c.name === cleanCardName) 
                    : null;

                if (originalCard && originalCard.cardPhoto) {
                    cardSlot.innerHTML = `
                        <div class="carta-activa-preview" style="background-image: url('${originalCard.cardPhoto}'); background-size: 100% 100%; width: 65px; height: 95px; border: 3px solid #fff; border-radius: 4px; box-shadow: 0px 4px 0px rgba(0,0,0,0.5); position: relative; animation: floatAnim 2s ease-in-out infinite;">
                            <span style="font-size: 8px; font-weight: bold; text-align: center; color: #fff; font-family: monospace; background: rgba(0,0,0,0.7); padding: 2px 0; position: absolute; bottom: 0; left: 0; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${cardName.split(" ").pop()}
                            </span>
                        </div>
                    `;
                } else {
                    // Color de respaldo gris/púrpura si es una acción directa de descarte
                    let fallbackColor = cardType === "discard_action" ? "#7f8c8d" : "#8e44ad";
                    cardSlot.innerHTML = `
                        <div class="carta-activa-preview" style="background: ${fallbackColor}; width: 65px; height: 95px; border: 3px solid #fff; border-radius: 4px; box-shadow: 0px 4px 0px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box; animation: floatAnim 2s ease-in-out infinite;">
                            <span style="font-size: 9px; font-weight: bold; text-align: center; color: #fff; font-family: monospace; text-shadow: 1px 1px 0 #000;">
                                ${cardName}
                            </span>
                        </div>
                    `;
                }
            }).catch(err => {
                console.error("Error cargando dinámicamente deck.js en el historial:", err);
            });
        }
    } else {
        if (cardSlot) {
            cardSlot.innerHTML = `<div style="font-size:10px; color:#7f8c8d; text-align:center; font-family: monospace; border: 2px dashed #34495e; padding: 12px; border-radius: 4px;">Esperando...</div>`;
        }
    }
}