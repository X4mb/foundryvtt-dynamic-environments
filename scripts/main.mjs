Hooks.on("init", () => {
    console.log("Dynamic Environment Control | Initializing module...");

    // Register module settings
    game.settings.register("foundryvtt-dynamic-environments", "enableIndoorWeatherMasking", {
        name: "dynamic-environment-control.Setting.EnableIndoorWeatherMasking.Name",
        hint: "dynamic-environment-control.Setting.EnableIndoorWeatherMasking.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("foundryvtt-dynamic-environments", "enableWeatherMovementPenalties", {
        name: "dynamic-environment-control.Setting.EnableWeatherMovementPenalties.Name",
        hint: "dynamic-environment-control.Setting.EnableWeatherMovementPenalties.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    // Register the "Current World Weather" dropdown setting
    game.settings.register("foundryvtt-dynamic-environments", "currentWorldWeather", {
        name: "dynamic-environment-control.Setting.CurrentWorldWeather.Name",
        hint: "dynamic-environment-control.Setting.CurrentWorldWeather.Hint",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "clear": "dynamic-environment-control.Weather.Clear",
            "light-rain": "dynamic-environment-control.Weather.LightRain",
            "heavy-rain": "dynamic-environment-control.Weather.HeavyRain",
            "snow": "dynamic-environment-control.Weather.Snow",
            "blizzard": "dynamic-environment-control.Weather.Blizzard"
        },
        default: "clear",
        onChange: value => {
            console.log("Dynamic Environment Control | World Weather changed to:", value);
            // TODO: Add logic here to react to weather changes (e.g., update token speeds, scene effects)
        }
    });

    game.settings.register("foundryvtt-dynamic-environments", "lightRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
        range: { min: 0, max: 100, step: 5 } // Example range
    });

    game.settings.register("foundryvtt-dynamic-environments", "heavyRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.HeavyRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.HeavyRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
        range: { min: 0, max: 100, step: 5 }
    });

    game.settings.register("foundryvtt-dynamic-environments", "snowSpeedPenalty", {
        name: "dynamic-environment-control.Setting.SnowSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.SnowSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
        range: { min: 0, max: 100, step: 5 }
    });
});

// This hook runs once Foundry VTT is fully loaded, including all modules and systems.
Hooks.on("ready", () => {
    // Check if your module is active before running its main logic
    if (game.modules.get("foundryvtt-dynamic-environments")?.active) {
        console.log("Dynamic Environment Control | Module is active and ready!");

        // --- Core Module Logic Starts Here ---
        // You will add your main functionality here.

        // Example: How to read a setting
        // const isWeatherMaskingEnabled = game.settings.get("foundryvtt-dynamic-environments", "enableIndoorWeatherMasking");
        // console.log("Weather Masking Enabled:", isWeatherMaskingEnabled);

        // Example: Integrate with FXMaster
        // You'll need to research FXMaster's API for the best way to interact.
        // It might have hooks for when effects are applied or a global API object.
        // E.g., if FXMaster triggers a hook when its weather effects change:
        /*
        Hooks.on("FXMaster.EffectsUpdated", (scene, effects) => {
            console.log("FXMaster effects updated on scene:", scene, effects);
            // Your logic to check 'Indoor Zone' drawings and mask effects
        });
        */

        // Example: Hook into token movement for penalties (conceptual)
        // This is where you'd check current weather, outdoor status, and apply speed penalties.
        /*
        Hooks.on("preUpdateToken", (scene, token, updates, options, userId) => {
            // Only proceed if movement penalties are enabled
            if (!game.settings.get("foundryvtt-dynamic-environments", "enableWeatherMovementPenalties")) {
                return true; // Allow the token update to proceed
            }

            // Check if it's a movement update (x or y changed)
            if (!("x" in updates) && !("y" in updates)) {
                return true;
            }

            const currentWorldWeather = game.settings.get("foundryvtt-dynamic-environments", "currentWorldWeather");
            let penalty = 0;

            // Determine penalty based on weather
            switch (currentWorldWeather) {
                case "light-rain":
                    penalty = game.settings.get("foundryvtt-dynamic-environments", "lightRainSpeedPenalty");
                    break;
                case "heavy-rain":
                    penalty = game.settings.get("foundryvtt-dynamic-environments", "heavyRainSpeedPenalty");
                    break;
                case "snow":
                    penalty = game.settings.get("foundryvtt-dynamic-environments", "snowSpeedPenalty");
                    break;
                case "blizzard":
                    // Example: Blizzard might use snow penalty or a custom one
                    penalty = game.settings.get("foundryvtt-dynamic-environments", "snowSpeedPenalty") * 2;
                    break;
            }

            if (penalty > 0) {
                // TODO: Implement logic to determine if token is "outdoors"
                // This could involve:
                // - Checking scene flags.
                // - Iterating through drawings on the scene to see if the token is within an "Indoor Zone".
                // - For PF2e, you'd apply the penalty to the token's calculated speed or use a system-specific hook.
                
                console.log(`Dynamic Environment Control | Potential movement penalty of ${penalty}ft for ${token.name} due to ${currentWorldWeather}.`);
                // Example of a notification (for testing)
                // ui.notifications.info(`DEBUG: Attempting to apply ${penalty}ft penalty to ${token.name}.`);

                // Actual penalty application for PF2e would involve modifying movement
                // calculations, perhaps using libWrapper to override a core method.
            }

            return true; // Always return true from preUpdateToken to allow the update
        });
        */
    }
});