// settings.mjs
import { MODULE_ID } from "./main.mjs";

/**
 * Register all module settings
 */
export const registerSettings = function() {
    // Example: Enable/Disable Weather Masking
    game.settings.register(MODULE_ID, 'enableWeatherMasking', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.EnableWeatherMasking.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.EnableWeatherMasking.Hint`),
        scope: 'world', // 'world' or 'client'
        config: true,   // Show in the module settings
        type: Boolean,
        default: true,
        requiresReload: false // Does not require a Foundry reload to take effect
    });

    // Example: Enable/Disable Movement Penalties
    game.settings.register(MODULE_ID, 'enableMovementPenalties', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.EnableMovementPenalties.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.EnableMovementPenalties.Hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false
    });

    // Setting for Current Weather Condition (GM controlled)
    // We'll use a dropdown of predefined weather types, extensible later.
    game.settings.register(MODULE_ID, 'currentWeather', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.CurrentWeather.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.CurrentWeather.Hint`),
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'clear': game.i18n.localize(`${MODULE_ID}.Weather.Clear`),
            'lightRain': game.i18n.localize(`${MODULE_ID}.Weather.LightRain`),
            'heavyRain': game.i18n.localize(`${MODULE_ID}.Weather.HeavyRain`),
            'snow': game.i18n.localize(`${MODULE_ID}.Weather.Snow}`),
            'blizzard': game.i18n.localize(`${MODULE_ID}.Weather.Blizzard}`)
            // Add more weather types here as needed
        },
        default: 'clear',
        onChange: value => {
            // This is where we'll trigger FXMaster updates and movement penalty re-evaluation
            console.log(`${MODULE_ID} | Current Weather changed to: ${value}`);
            // TODO: Trigger FXMaster update and movement re-evaluation here
            Hooks.call(`dynamicEnvironmentControl.weatherChanged`, value);
        }
    });

    // Example: Movement Penalty for Light Rain (for PF2e, this would be a speed reduction)
    game.settings.register(MODULE_ID, 'lightRainSpeedPenalty', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.LightRainSpeedPenalty.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.LightRainSpeedPenalty.Hint`),
        scope: 'world',
        config: true,
        type: Number,
        default: 5, // Example: -5 feet movement speed
        range: {
            min: 0,
            max: 30,
            step: 5
        }
    });

    // THESE SETTINGS NEED TO BE ADDED IN THE QUESTIONS
    // game.settings.register(MODULE_ID, 'heavyRainSpeedPenalty', { ... });
    // game.settings.register(MODULE_ID, 'snowSpeedPenalty', { ... });
    // game.settings.register(MODULE_ID, 'blizzardSpeedPenalty', { ... });
};