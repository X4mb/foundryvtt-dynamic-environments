// environment-control.mjs
import { MODULE_ID, log, error } from "./main.mjs";

let activeWeatherFX = null; // Store the currently active FXMaster effect

/**
 * Initializes the environment control logic.
 * Called on `ready` hook.
 */
export const setupEnvironmentControl = () => {
    log("Setting up environment control logic.");

    // Initial setup of weather FX based on current setting
    updateWeatherFX(game.settings.get(MODULE_ID, 'currentWeather'));

    // Listen for our custom weather change hook
    Hooks.on(`dynamicEnvironmentControl.weatherChanged`, (newWeather) => {
        log(`Custom hook: Weather changed to ${newWeather}`);
        updateWeatherFX(newWeather);
        applyMovementPenaltiesToAllTokens(); // Re-evaluate all tokens on weather change
    });

    // Listen for our custom token moved hook
    Hooks.on(`dynamicEnvironmentControl.tokenMoved`, (tokenDocument) => {
        handleTokenMovement(tokenDocument);
    });
};

/**
 * Updates FXMaster effect based on current weather setting.
 * This will be the simple version, without indoor masking yet.
 */
async function updateWeatherFX(weatherType) {
    // Ensure FXMaster is active
    if (!game.modules.get('fxmaster')?.active) {
        error("FXMaster not active, cannot update weather effects.");
        return;
    }

    // Clear any existing active weather effect
    if (activeWeatherFX) {
        await FXMASTER.fx.delete(activeWeatherFX);
        activeWeatherFX = null;
    }

    const scene = game.scenes.current;
    if (!scene) return;

    // Define FXMaster effects for each weather type
    const weatherEffects = {
        'clear': null, // No effect
        'lightRain': {
            type: 'rain',
            options: {
                density: 0.2, // Lighter rain
                speed: 2,
                direction: 0,
                size: 10
            }
        },
        'heavyRain': {
            type: 'rain',
            options: {
                density: 0.5, // Heavier rain
                speed: 3,
                direction: 0,
                size: 15
            }
        },
        'snow': {
            type: 'snow',
            options: {
                density: 0.2,
                speed: 1,
                direction: 0,
                size: 10,
                tint: '#FFFFFF'
            }
        },
        'blizzard': {
            type: 'snow',
            options: {
                density: 0.7,
                speed: 2,
                direction: 0,
                size: 15,
                tint: '#E0FFFF',
                rotation: true // Add some swirling for blizzard
            }
        }
        // Add more weather types here
    };

    const effect = weatherEffects[weatherType];
    if (effect) {
        // Apply the new FXMaster effect
        activeWeatherFX = await FXMASTER.fx.play(effect.type, effect.options);
        log(`Applied FXMaster effect: ${effect.type}`);
    } else {
        log(`No FXMaster effect for weather type: ${weatherType}`);
    }
}

/**
 * Handles token movement: checks indoor/outdoor status and applies/removes movement penalties.
 */
async function handleTokenMovement(tokenDocument) {
    if (!game.settings.get(MODULE_ID, 'enableMovementPenalties')) return;

    const actor = tokenDocument.actor;
    if (!actor) {
        log(`No actor found for token ${tokenDocument.name}`);
        return;
    }

    const isTokenCurrentlyIndoors = isTokenIndoors(tokenDocument);
    const currentWeather = game.settings.get(MODULE_ID, 'currentWeather');

    // Apply/Remove Movement Penalty
    if (!isTokenCurrentlyIndoors) { // Only apply penalties if outdoors
        const penalty = getMovementPenaltyForWeather(currentWeather);
        if (penalty !== 0) {
            await applyPF2eSpeedPenalty(actor, penalty, currentWeather);
        } else {
            await removePF2eSpeedPenalty(actor);
        }
    } else {
        // Token moved indoors, remove any existing penalty
        await removePF2eSpeedPenalty(actor);
    }

    // TODO: Later, call indoor/outdoor FXMaster masking logic here.
    // For now, FXMaster is global.
}

/**
 * Determines if a token is currently indoors.
 * This version focuses on Radial Occlusion Overhead Tiles.
 * A token is considered "indoors" if it is directly beneath an overhead tile
 * that uses Radial Occlusion and is currently occluding for that token.
 * @param {TokenDocument} token - The token document to check.
 * @returns {boolean}
 */
function isTokenIndoors(token) {
    if (!canvas.tiles) return false;

    // Iterate through all overhead tiles on the current scene
    for (const tile of canvas.tiles.placeables) {
        // Check if it's an overhead tile and uses Radial Occlusion
        if (tile.document.overhead && tile.document.occlusion.mode === CONST.TILE_OCCLUSION_MODES.RADIAL) {
            // Check if the tile is currently occluding for this token
            // Foundry's internal rendering handles this: if the tile is "invisible" to the token,
            // it means the token is underneath it.
            // Note: `tile.isVisible` relates to GM's view or token's vision.
            // A better check for 'under' is likely to use tile.bounds.contains()
            // or specific logic related to token-tile interaction for radial.
            // For simplicity, let's start with a direct bound check.
            if (tile.bounds.contains(token.center.x, token.center.y)) {
                log(`Token ${token.name} is under occluding overhead tile.`);
                return true;
            }
        }
    }

    // TODO: Future enhancement - combine with wall-based detection for full indoor definition.
    return false;
}

/**
 * Gets the movement penalty (in feet/units) for the given weather type.
 * @param {string} weatherType - The current weather type string.
 * @returns {number} - The speed penalty value.
 */
function getMovementPenaltyForWeather(weatherType) {
    switch (weatherType) {
        case 'lightRain':
            return game.settings.get(MODULE_ID, 'lightRainSpeedPenalty');
        case 'heavyRain':
            return game.settings.get(MODULE_ID, 'heavyRainSpeedPenalty'); // Will need to add this setting
        case 'snow':
            return game.settings.get(MODULE_ID, 'snowSpeedPenalty'); // Will need to add this setting
        case 'blizzard':
            return game.settings.get(MODULE_ID, 'blizzardSpeedPenalty'); // Will need to add this setting
        default:
            return 0; // No penalty for clear or unknown weather
    }
}

/**
 * Applies a speed penalty to a PF2e Actor via an Active Effect.
 * @param {ActorPF2e} actor - The PF2e Actor to modify.
 * @param {number} penalty - The amount of speed reduction.
 * @param {string} weatherType - The type of weather causing the penalty.
 */
async function applyPF2eSpeedPenalty(actor, penalty, weatherType) {
    const effectId = `<span class="math-inline">\{MODULE\_ID\}\-speed\-penalty\-</span>{weatherType}`;
    const existingEffect = actor.effects.find(e => e.flags[MODULE_ID]?.weatherEffectId === effectId);

    // If the effect already exists and has the correct penalty, do nothing
    // Or if the penalty is 0, just remove it.
    if (penalty === 0) {
        if (existingEffect) {
            await existingEffect.delete();
            log(`Removed speed penalty from ${actor.name} due to ${weatherType}.`);
        }
        return;
    }

    // PF2e uses attributes.movement.speed.value for base speed.
    // We'll apply a modifier that reduces this.
    // Active Effects in PF2e are powerful and preferred.
    // We will create a temporary effect that modifies the base speed.
    const effectData = {
        id: effectId, // Unique ID for our effect
        name: game.i18n.localize(`${MODULE_ID}.Effects.SpeedPenalty.Name`) + ` (${game.i18n.localize(`${MODULE_ID}.Weather.${weatherType}`)})`,
        icon: "icons/svg/snail.svg", // Or a specific weather icon
        changes: [
            {
                key: "system.attributes.movement.speed.value", // This targets the base speed in PF2e
                mode: CONST.ACTIVE_EFFECT_MODES.ADD, // Subtract from the current value
                value: String(-penalty) // Ensure it's a string, PF2e can handle negative numbers
            }
        ],
        flags: {
            [MODULE_ID]: {
                weatherEffectId: effectId, // Custom flag to identify our effect
                weatherType: weatherType
            }
        },
        origin: MODULE_ID, // Mark as coming from our module
        transfer: false, // Don't transfer to items
        disabled: false,
        // For temporary effects, you might use duration: { rounds: 1 } and reapply on token move,
        // or simply manage its existence. For simplicity, we'll just apply/remove.
        // duration: { seconds: null } // Stays until removed
    };

    if (existingEffect) {
        // Update existing effect if penalty changes
        const currentPenalty = -parseInt(existingEffect.changes.find(c => c.key === "system.attributes.movement.speed.value")?.value || "0");
        if (currentPenalty !== penalty) {
            await existingEffect.update(effectData);
            log(`Updated speed penalty for ${actor.name} to ${penalty} from ${weatherType}.`);
        }
    } else {
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        log(`Applied speed penalty of ${penalty} to ${actor.name} due to ${weatherType}.`);
    }
}

/**
 * Removes the speed penalty effect from a PF2e Actor.
 * @param {ActorPF2e} actor - The PF2e Actor to modify.
 */
async function removePF2eSpeedPenalty(actor) {
    const effectsToRemove = actor.effects.filter(e => e.flags[MODULE_ID]?.weatherEffectId?.startsWith(`${MODULE_ID}-speed-penalty-`));
    if (effectsToRemove.length > 0) {
        await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToRemove.map(e => e.id));
        log(`Removed all weather-related speed penalties from ${actor.name}.`);
    }
}

/**
 * Re-evaluates movement penalties for all tokens on the current scene.
 * Useful when weather changes.
 */
async function applyMovementPenaltiesToAllTokens() {
    if (!game.settings.get(MODULE_ID, 'enableMovementPenalties')) return;
    if (!canvas.tokens) return;

    for (const token of canvas.tokens.placeables) {
        await handleTokenMovement(token.document);
    }
}