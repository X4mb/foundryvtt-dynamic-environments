// This hook runs very early, ideal for registering settings.
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
            // TODO: Potentially trigger a re-evaluation of token speeds on the current scene
            // Or apply/remove specific PF2e conditions here based on weather.
        }
    });

    game.settings.register("foundryvtt-dynamic-environments", "lightRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
        range: { min: 0, max: 100, step: 5 }
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
    }
});

// Hook to add a checkbox to the Scene Configuration for "Is Outdoor Scene"
Hooks.on("renderSceneConfig", (app, html, data) => {
    const isOutdoorScene = app.document.getFlag("foundryvtt-dynamic-environments", "isOutdoorScene");
    const checked = isOutdoorScene === true ? "checked" : "";
    const htmlContent = `
        <div class="form-group">
            <label>Is Outdoor Scene?</label>
            <div class="form-fields">
                <input type="checkbox" name="flags.foundryvtt-dynamic-environments.isOutdoorScene" data-dtype="Boolean" ${checked}>
            </div>
            <p class="hint">Check this if the scene represents an outdoor environment where weather penalties apply.</p>
        </div>
    `;
    // Insert into the 'details' tab of the scene config. Adjust if this tab doesn't exist
    // or if you prefer a different location.
    html.find('.tab[data-tab="details"]').append(htmlContent);
    app.setPosition({height: "auto"}); // Adjust app height if needed
});


// Hook into token movement BEFORE it happens
Hooks.on("preUpdateToken", (scene, token, updates, options, userId) => {
    // Only proceed if movement penalties are enabled globally
    if (!game.settings.get("foundryvtt-dynamic-environments", "enableWeatherMovementPenalties")) {
        return true; // Allow update to proceed without modification
    }

    // Check if token is moving (x or y coordinates are changing)
    if (!("x" in updates) && !("y" in updates)) {
        return true; // Not a movement update
    }

    // Get the current scene's outdoor status
    const isOutdoorScene = scene.getFlag("foundryvtt-dynamic-environments", "isOutdoorScene");
    if (!isOutdoorScene) {
        console.log(`Dynamic Environment Control | Token ${token.name} is in an indoor scene (or scene not marked outdoor), no penalty applied.`);
        return true; // No penalty if scene is not explicitly marked as outdoor
    }

    const currentWeather = game.settings.get("foundryvtt-dynamic-environments", "currentWorldWeather");
    let penalty = 0;

    // Determine penalty based on current world weather setting
    switch (currentWeather) {
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
            // For blizzard, let's say it's heavy snow penalty + an additional factor
            penalty = game.settings.get("foundryvtt-dynamic-environments", "snowSpeedPenalty") * 1.5;
            break;
        case "clear":
        default:
            penalty = 0; // No penalty for clear weather
            break;
    }

    if (penalty === 0) {
        return true; // No penalty to apply
    }

    // --- APPLYING THE PENALTY (PF2e Specific) ---
    // This part is currently illustrative. The actual implementation for PF2e
    // movement penalties is complex and goes beyond simple updates.
    // It would involve either:
    // 1. Temporarily modifying the token's actor's speed attributes.
    // 2. Applying a PF2e-specific condition (e.g., 'Difficult Terrain') to the actor.
    // 3. Using libWrapper to wrap a core PF2e movement calculation function.

    // For now, this will show a notification and log to console when a penalty *would* apply.
    ui.notifications.warn(`Dynamic Environment Control | Attempting to apply ${penalty}ft movement penalty to ${token.name} due to ${currentWeather}! (Actual PF2e movement modification needs implementation)`);
    console.log(`Dynamic Environment Control | Applied ${penalty}ft movement penalty to ${token.name} due to ${currentWeather}.`);

    return true; // Always return true from preUpdateToken to allow the movement to proceed.
});