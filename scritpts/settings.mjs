// settings.mjs
import { MODULE_ID } from "./main.mjs";

/**
 * Register all module settings
 */
export const registerSettings = function() {
    game.settings.register(MODULE_ID, 'enableWeatherMasking', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.EnableWeatherMasking.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.EnableWeatherMasking.Hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false
    });

    game.settings.register(MODULE_ID, 'enableMovementPenalties', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.EnableMovementPenalties.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.EnableMovementPenalties.Hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false
    });

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
        },
        default: 'clear',
        onChange: value => {
            Hooks.call(`dynamicEnvironmentControl.weatherChanged`, value);
        }
    });

    // --- Movement Penalty Settings ---
    // PF2e typically uses "difficult terrain" (2 squares per 1 moved), which effectively halves speed.
    // These settings allow for configurable flat penalties for simplicity and customization.
    // Consider setting them to 0 if you prefer to enforce "difficult terrain" via other means,
    // or if the fixed penalty is too strong.

    game.settings.register(MODULE_ID, 'lightRainSpeedPenalty', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.LightRainSpeedPenalty.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.LightRainSpeedPenalty.Hint`),
        scope: 'world',
        config: true,
        type: Number,
        default: 0, // Default to 0 as light rain usually no penalty
        range: {
            min: 0,
            max: 30,
            step: 5
        }
    });

    game.settings.register(MODULE_ID, 'heavyRainSpeedPenalty', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.HeavyRainSpeedPenalty.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.HeavyRainSpeedPenalty.Hint`),
        scope: 'world',
        config: true,
        type: Number,
        default: 5, // A small penalty for heavy rain
        range: {
            min: 0,
            max: 30,
            step: 5
        }
    });

    game.settings.register(MODULE_ID, 'snowSpeedPenalty', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.SnowSpeedPenalty.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.SnowSpeedPenalty.Hint`),
        scope: 'world',
        config: true,
        type: Number,
        default: 10, // More significant for snow
        range: {
            min: 0,
            max: 30,
            step: 5
        }
    });

    game.settings.register(MODULE_ID, 'blizzardSpeedPenalty', {
        name: game.i18n.localize(`${MODULE_ID}.Settings.BlizzardSpeedPenalty.Name`),
        hint: game.i18n.localize(`${MODULE_ID}.Settings.BlizzardSpeedPenalty.Hint`),
        scope: 'world',
        config: true,
        type: Number,
        default: 20, // A heavy penalty for blizzards
        range: {
            min: 0,
            max: 30,
            step: 5
        }
    });
};