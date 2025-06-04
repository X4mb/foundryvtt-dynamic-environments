// This hook runs very early, ideal for registering settings.
Hooks.on("init", () => {
    console.log("Dynamic Environment Control | Initializing module...");

    // REMOVED: enableIndoorWeatherMasking setting (no longer FXMaster dependent)

    game.settings.register("foundryvtt-dynamic-environments", "enableWeatherMovementPenalties", {
        name: "dynamic-environment-control.Setting.EnableWeatherMovementPenalties.Name",
        hint: "dynamic-environment-control.Setting.EnableWeatherMovementPenalties.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    // NOTE: The 'Current World Weather' setting is now for *global* setting,
    // but we will primarily use the SCENE'S built-in weather effect.
    // This setting might be removed later if it's no longer needed,
    // or repurposed for manual override.
    // For now, let's keep it as a fallback/display of current weather.
    game.settings.register("foundryvtt-dynamic-environments", "currentWorldWeather", {
        name: "dynamic-environment-control.Setting.CurrentWorldWeather.Name",
        hint: "dynamic-environment-control.Setting.CurrentWorldWeather.Hint",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "clear": "dynamic-environment-control.Weather.Clear",
            "Rain": "dynamic-environment-control.Weather.Rain", // Match built-in names
            "Rain Storm": "dynamic-environment-control.Weather.RainStorm", // Match built-in names
            "Fog": "dynamic-environment-control.Weather.Fog", // Not directly penalized in this example
            "Snow": "dynamic-environment-control.Weather.Snow", // Match built-in names
            "Blizzard": "dynamic-environment-control.Weather.Blizzard", // Match built-in names
            "Autumn Leaves": "dynamic-environment-control.Weather.AutumnLeaves" // Not penalized
        },
        default: "clear",
        onChange: value => {
            console.log("Dynamic Environment Control | Global World Weather setting changed to:", value);
            // This global setting is now less critical as we'll read from scene.data.weather
            // You might want to update tokens on the current scene when this changes.
        }
    });

    game.settings.register("foundryvtt-dynamic-environments", "lightRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 5, // Default for light rain, typically minor difficult terrain
        range: { min: 0, max: 100, step: 5 }
    });

    game.settings.register("foundryvtt-dynamic-environments", "heavyRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.HeavyRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.HeavyRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 10, // Default for heavy rain/rain storm, typically difficult terrain
        range: { min: 0, max: 100, step: 5 }
    });

    game.settings.register("foundryvtt-dynamic-environments", "snowSpeedPenalty", {
        name: "dynamic-environment-control.Setting.SnowSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.SnowSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 10, // Default for snow, typically difficult terrain
        range: { min: 0, max: 100, step: 5 }
    });

    // New penalty setting for Blizzard
    game.settings.register("foundryvtt-dynamic-environments", "blizzardSpeedPenalty", {
        name: "dynamic-environment-control.Setting.BlizzardSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.BlizzardSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 20, // Default for blizzard, typically greater difficult terrain or more severe
        range: { min: 0, max: 100, step: 5 }
    });
});

// This hook runs once Foundry VTT is fully loaded, including all modules and systems.
Hooks.on("ready", () => {
    // Check if your module is active before running its main logic
    if (game.modules.get("foundryvtt-dynamic-environments")?.active) {
        console.log("Dynamic Environment Control | Module is active and ready!");

        // Set the global "Current World Weather" setting to match the active scene's weather
        // This makes the global setting more informative, though not directly used for penalties now.
        if (canvas.scene && canvas.scene.data.weather) {
            game.settings.set("foundryvtt-dynamic-environments", "currentWorldWeather", canvas.scene.data.weather);
        }

        // --- Core Module Logic Starts Here ---
    }
});

// Hook to add a checkbox to the Scene Configuration for "Is Indoor Scene?"
Hooks.on("renderSceneConfig", (app, html, data) => {
    // Get current value for the checkbox
    const isIndoorScene = app.document.getFlag("foundryvtt-dynamic-environments", "isIndoorScene");
    const checked = isIndoorScene === true ? "checked" : "";
    const htmlContent = `
        <div class="form-group">
            <label>${game.i18n.localize("dynamic-environment-control.Setting.IsIndoorScene.Name")}</label>
            <div class="form-fields">
                <input type="checkbox" name="flags.foundryvtt-dynamic-environments.isIndoorScene" data-dtype="Boolean" ${checked}>
            </div>
            <p class="hint">${game.i18n.localize("dynamic-environment-control.Setting.IsIndoorScene.Hint")}</p>
        </div>
    `;
    // Target the select element for "Weather Effect" and insert after its parent form-group
    // Based on your screenshot, it's <select name="weather"> within a form-group.
    html.find('select[name="weather"]').closest('.form-group').after(htmlContent);
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

    // Get the current scene's indoor status
    const isIndoorScene = scene.getFlag("foundryvtt-dynamic-environments", "isIndoorScene");
    // If the scene is marked as indoor, no penalty
    if (isIndoorScene) {
        console.log(`Dynamic Environment Control | Token ${token.name} is in an indoor scene, no penalty applied.`);
        return true;
    }

    // Get the built-in weather effect for the current scene
    const sceneWeatherEffect = scene.data.weather || "clear"; // Default to "clear" if no weather is set
    let penalty = 0;

    // Determine penalty based on current scene's weather effect
    switch (sceneWeatherEffect) {
        case "Rain": // Light Rain equivalent
            penalty = game.settings.get("foundryvtt-dynamic-environments", "lightRainSpeedPenalty");
            break;
        case "Rain Storm": // Heavy Rain equivalent
            penalty = game.settings.get("foundryvtt-dynamic-environments", "heavyRainSpeedPenalty");
            break;
        case "Snow":
            penalty = game.settings.get("foundryvtt-dynamic-environments", "snowSpeedPenalty");
            break;
        case "Blizzard":
            penalty = game.settings.get("foundryvtt-dynamic-environments", "blizzardSpeedPenalty");
            break;
        case "Fog": // Fog typically doesn't affect movement speed directly in PF2e, but visibility.
        case "Autumn Leaves": // Aesthetic
        case "clear": // Clear weather
        default:
            penalty = 0; // No penalty for other effects or clear weather
            break;
    }

    if (penalty === 0) {
        return true; // No penalty to apply
    }

    // --- APPLYING THE PENALTY (PF2e Specific - Conceptual) ---
    // This is the core challenge. Modifying actual movement speed in PF2e
    // involves understanding its system's internal speed calculation.
    // Simply modifying a token's `updates` object here for `x` or `y` won't
    // change the underlying speed displayed on the token or calculated by the system.

    // For PF2e, you typically interact with the Actor's `system.attributes.speed`
    // or apply conditions that impose difficult terrain or other movement reductions.

    // For now, we will notify the GM and log to console for visibility.
    // This confirms your module is correctly detecting conditions and calculating penalties.
    ui.notifications.warn(`Dynamic Environment Control | Applying ${penalty}ft movement penalty to ${token.name} due to ${sceneWeatherEffect}! (Actual PF2e movement modification needs implementation)`);
    console.log(`Dynamic Environment Control | Applied ${penalty}ft movement penalty to ${token.name} due to ${sceneWeatherEffect}.`);

    // To truly modify PF2e movement, you might need to:
    // A) Use libWrapper to wrap PF2e's `Token.prototype._getMovementSpeed` (or similar) method.
    // B) Apply a temporary PF2e condition (e.g., 'Difficult Terrain') to the token's actor.
    //    This involves calling `token.actor.createEmbeddedDocuments("Item", [{ type: "condition", ... }])`.
    //    You'd need to define the condition item JSON first.
    // C) Override the token's `getBarAttributes` to display a modified speed,
    //    but this won't change the actual movement mechanic.

    return true; // Always return true to allow the token update to complete.
});