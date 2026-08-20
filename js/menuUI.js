import { screenMenu, screenGame, buttonPlay, avatarButtons } from './domElements.js';

export function switchScreen(toGame) {
    if (toGame) { if (screenMenu) screenMenu.style.display = 'none'; if (screenGame) screenGame.style.display = 'grid'; }
    else { if (screenMenu) screenMenu.style.display = 'block'; if (screenGame) screenGame.style.display = 'none'; }
}

export function togglePlayButton(visible) { 
    if (buttonPlay) buttonPlay.style.display = visible ? "block" : "none"; 
}

export function renderAvatarSelection(notAvailable, preliminarySelection) {
    if (!avatarButtons) return;
    avatarButtons.forEach(button => {
        if (preliminarySelection && preliminarySelection.id === button.id) {
            button.disabled = true; button.style.backgroundColor = "green"; button.style.filter = "brightness(1.5)"; button.style.opacity = "1"; button.style.pointerEvents = "auto"; return;
        }
        if (notAvailable.includes(button.id)) {
            button.disabled = true; button.style.opacity = "0.5"; button.style.backgroundColor = "red"; button.style.pointerEvents = "none"; button.style.filter = "brightness(1)";
        } else {
            button.disabled = false; button.style.opacity = "1"; button.style.pointerEvents = "auto"; button.style.filter = "brightness(1)"; button.style.backgroundColor = "";
        }
    });
}