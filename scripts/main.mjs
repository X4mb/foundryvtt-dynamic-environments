// This hook runs very early, ideal for registering settings.
Hooks.on("init", () => {
    console.log("Dynamic Environment Control | Initializing module...");

    game.settings.register("foundryvtt-dynamic-environments", "enableWeatherMovementPenalties", {
        name: "dynamic-environment-control.Setting.EnableWeatherMovementPenalties.Name",
        hint: "dynamic-environment-control.Setting.EnableWeatherMovementPenalties.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("foundryvtt-dynamic-environments", "currentWorldWeather", {
        name: "dynamic-environment-control.Setting.CurrentWorldWeather.Name",
        hint: "dynamic-environment-control.Setting.CurrentWorldWeather.Hint",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "clear": "dynamic-environment-control.Weather.Clear",
            "Rain": "dynamic-environment-control.Weather.Rain",
            "Rain Storm": "dynamic-environment-control.Weather.RainStorm",
            "Fog": "dynamic-environment-control.Weather.Fog",
            "Snow": "dynamic-environment-control.Weather.Snow",
            "Blizzard": "dynamic-environment-control.Weather.Blizzard",
            "Autumn Leaves": "dynamic-environment-control.Weather.AutumnLeaves"
        },
        default: "clear",
        onChange: value => {
            console.log("Dynamic Environment Control | Global World Weather setting changed to:", value);
        }
    });

    game.settings.register("foundryvtt-dynamic-environments", "lightRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.LightRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 5,
        range: { min: 0, max: 100, step: 5 }
    });

    game.settings.register("foundryvtt-dynamic-environments", "heavyRainSpeedPenalty", {
        name: "dynamic-environment-control.Setting.HeavyRainSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.HeavyRainSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 10,
        range: { min: 0, max: 100, step: 5 }
    });

    game.settings.register("foundryvtt-dynamic-environments", "snowSpeedPenalty", {
        name: "dynamic-environment-control.Setting.SnowSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.SnowSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 10,
        range: { min: 0, max: 100, step: 5 }
    });

    game.settings.register("foundryvtt-dynamic-environments", "blizzardSpeedPenalty", {
        name: "dynamic-environment-control.Setting.BlizzardSpeedPenalty.Name",
        hint: "dynamic-environment-control.Setting.BlizzardSpeedPenalty.Hint",
        scope: "world",
        config: true,
        type: Number,
        default: 20,
        range: { min: 0, max: 100, step: 5 }
    });
});

Hooks.on("ready", () => {
    if (game.modules.get("foundryvtt-dynamic-environments")?.active) {
        console.log("Dynamic Environment Control | Module is active and ready!");

        if (canvas.scene && canvas.scene.data && canvas.scene.data.weather) {
            game.settings.set("foundryvtt-dynamic-environments", "currentWorldWeather", canvas.scene.data.weather);
        }
    }
});

// Hooks.on("renderSceneConfig", ...) is no longer used for direct HTML injection.

Hooks.on("activateListeners", (app, html) => {
    // DIAGNOSTIC: Log immediately to see if this hook is firing at all
    console.log("Dynamic Environment Control | activateListeners hook fired for application:", app.constructor.name, app);

    // Only proceed if this is the SceneConfig application
    if (app instanceof SceneConfig) {
        console.log("Dynamic Environment Control | activateListeners specifically for SceneConfig!");

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

        const ambienceTab = html.find('.tab[data-tab="ambient"]'); // Still use find here, as 'html' is the root of the app.

        if (ambienceTab.length > 0) {
            ambienceTab.append(htmlContent);
            console.log("Dynamic Environment Control | 'Is Indoor Scene?' checkbox injected successfully into Ambience tab.");
        } else {
            console.error("Dynamic Environment Control | Could not find the 'Ambience' tab to insert checkbox. Check Foundry VTT HTML structure.");
        }
    } else {
        // Log if it's a different application, to help understand what's triggering the hook
        console.log("Dynamic Environment Control | activateListeners for non-SceneConfig app:", app.constructor.name);
    }
});


// Hook into token movement BEFORE it happens
Hooks.on("preUpdateToken", (scene, token, updates, options, userId) => {
    // Only proceed if movement penalties are enabled globally
    if (!game.settings.get("foundryvtt-dynamic-environments", "enableWeatherMovementPenalties")) {
        return true;
    }

    // Check if token is moving (x or y coordinates are changing)
    if (!("x" in updates) && !("y" in updates)) {
        return true;
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
        case "Fog":
        case "Autumn Leaves":
        case "clear":
        default:
            penalty = 0;
            break;
    }

    if (penalty === 0) {
        return true;
    }

    ui.notifications.warn(`Dynamic Environment Control | Applying ${penalty}ft movement penalty to ${token.name} due to ${sceneWeatherEffect}! (Actual PF2e movement modification needs implementation)`);
    console.log(`Dynamic Environment Control | Applied ${penalty}ft movement penalty to ${token.name} due to ${sceneWeatherEffect}.`);

    return true;
});