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
    // Initial setup of FXMaster masks
    updateFXMasterMasks();

    // Listen for our custom weather change hook
    Hooks.on(`dynamicEnvironmentControl.weatherChanged`, (newWeather) => {
        log(`Custom hook: Weather changed to ${newWeather}`);
        updateWeatherFX(newWeather);
        updateFXMasterMasks(); // Update masks in case effect types change
        applyMovementPenaltiesToAllTokens(); // Re-evaluate all tokens on weather change
    });

    // Listen for our custom token moved hook
    Hooks.on(`dynamicEnvironmentControl.tokenMoved`, (tokenDocument) => {
        handleTokenMovement(tokenDocument);
    });
};

/**
 * Updates FXMaster effect based on current weather setting.
 */
async function updateWeatherFX(weatherType) {
    if (!game.modules.get('fxmaster')?.active) return; // Should be checked on ready hook

    // Clear any existing active weather effect
    if (activeWeatherFX) {
        await FXMASTER.fx.delete(activeWeatherFX);
        activeWeatherFX = null;
    }

    const scene = game.scenes.current;
    if (!scene) return;

    // Define FXMaster effects for each weather type
    // You can customize options further here based on FXMaster's documentation
    const weatherEffects = {
        'clear': null, // No effect
        'lightRain': {
            type: 'rain',
            options: {
                density: 0.2,
                speed: 2,
                direction: 0,
                size: 10,
                tint: '#e6e6fa' // Light misty color
            }
        },
        'heavyRain': {
            type: 'rain',
            options: {
                density: 0.5,
                speed: 3,
                direction: 0,
                size: 15,
                tint: '#b0c4de' // Darker rain color
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
                rotation: true, // Add some swirling for blizzard
                fadeIn: 500,
                fadeOut: 500
            }
        }
        // Add more weather types and their FXMaster options here
        // Example: 'fog': { type: 'fog', options: { density: 0.5 } }
    };

    const effect = weatherEffects[weatherType];
    if (effect) {
        activeWeatherFX = await FXMASTER.fx.play(effect.type, effect.options);
        log(`Applied FXMaster effect: ${effect.type} for ${weatherType}`);
    } else {
        log(`No FXMaster effect for weather type: ${weatherType}`);
    }
}

/**
 * Updates FXMaster particle effect masks based on "Is Indoor Zone" drawings.
 */
export async function updateFXMasterMasks() {
    if (!game.modules.get('fxmaster')?.active) return;
    if (!game.settings.get(MODULE_ID, 'enableWeatherMasking')) {
        FXMASTER.fx.maskParticleEffects([], true); // Clear all masks if disabled
        return;
    }

    const currentScene = game.scenes.current;
    if (!currentScene) return;

    const indoorDrawingIds = currentScene.drawings
        .filter(d => d.flags[MODULE_ID]?.isIndoorZone)
        .map(d => d.id);

    if (indoorDrawingIds.length > 0) {
        log(`Masking FXMaster effects within ${indoorDrawingIds.length} indoor zones.`);
        // `true` means 'mask all listed drawings'
        await FXMASTER.fx.maskParticleEffects(indoorDrawingIds, true);
    } else {
        log("No indoor zones found or enabled for masking. Clearing FXMaster masks.");
        await FXMASTER.fx.maskParticleEffects([], true); // Clear any active masks
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
}

/**
 * Determines if a token is currently indoors based on "Is Indoor Zone" drawings.
 * This is used for movement penalties. FXMaster masking uses the drawing IDs directly.
 * @param {TokenDocument} token - The token document to check.
 * @returns {boolean}
 */
function isTokenIndoors(token) {
    if (!canvas.drawings) return false;

    const currentScene = game.scenes.current;
    if (!currentScene) return false;

    // Check if the token's center is within any drawing marked as "Is Indoor Zone"
    for (const drawing of currentScene.drawings) {
        if (drawing.flags[MODULE_ID]?.isIndoorZone) {
            if (drawing.bounds.contains(token.center.x, token.center.y)) {
                log(`Token ${token.name} is inside an indoor zone drawing.`);
                return true;
            }
        }
    }
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
            return game.settings.get(MODULE_ID, 'heavyRainSpeedPenalty');
        case 'snow':
            return game.settings.get(MODULE_ID, 'snowSpeedPenalty');
        case 'blizzard':
            return game.settings.get(MODULE_ID, 'blizzardSpeedPenalty');
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
    const effectId = `${MODULE_ID}-speed-penalty-${weatherType}`;
    const existingEffect = actor.effects.find(e => e.flags[MODULE_ID]?.weatherEffectId === effectId);

    if (penalty === 0) {
        if (existingEffect) {
            await existingEffect.delete();
            log(`Removed speed penalty from ${actor.name} due to ${weatherType}.`);
        }
        return;
    }

    const effectData = {
        id: effectId,
        name: game.i18n.localize(`${MODULE_ID}.Effects.SpeedPenalty.Name`) + ` (${game.i18n.localize(`${MODULE_ID}.Weather.${weatherType}`)})`,
        icon: "icons/svg/snail.svg",
        changes: [
            {
                key: "system.attributes.movement.speed.value",
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: String(-penalty)
            }
        ],
        flags: {
            [MODULE_ID]: {
                weatherEffectId: effectId,
                weatherType: weatherType
            }
        },
        origin: MODULE_ID,
        transfer: false,
        disabled: false
    };

    if (existingEffect) {
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