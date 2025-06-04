// hooks.mjs
import { log, MODULE_ID } from "./main.mjs";
import { updateFXMasterMasks } from "./environment-control.mjs";
import { WeatherControlApp } from "./apps/weather-control-app.mjs";

/**
 * Register all module hooks
 */
export const setupHooks = function() {
    log("Setting up module hooks...");

    // Hook for token movement to apply/remove penalties
    Hooks.on("updateToken", (document, change, options, userId) => {
        if (!game.user.isGM) return;
        if (!("x" in change || "y" in change)) return; // Only interested in position changes

        log(`Token ${document.name} moved.`);
        Hooks.call(`dynamicEnvironmentControl.tokenMoved`, document);
    });

    // Hook for drawing configuration to add "Is Indoor Zone" checkbox
    Hooks.on("renderDrawingConfig", (app, html, data) => {
        if (!game.user.isGM) return;
        const isIndoorZone = app.object.flags[MODULE_ID]?.isIndoorZone || false;

        const tab = html.find('.tab[data-tab="data"]');
        if (tab.length === 0) return; // Ensure data tab exists

        // Append a new form group for the checkbox
        const newHtml = `
            <div class="form-group">
                <label>${game.i18n.localize(`${MODULE_ID}.Settings.IsIndoorZone.Name`)}</label>
                <div class="form-fields">
                    <input type="checkbox" name="flags.${MODULE_ID}.isIndoorZone" ${isIndoorZone ? 'checked' : ''}>
                </div>
                <p class="hint">${game.i18n.localize(`${MODULE_ID}.Settings.IsIndoorZone.Hint`)}</p>
            </div>
        `;
        tab.append(newHtml);

        app.setPosition(); // Recalculate app position due to added content
    });

    // Hooks to update FXMaster masks when drawings are created, updated, or deleted
    Hooks.on("createDrawing", (document, options, userId) => {
        if (game.user.isGM) updateFXMasterMasks();
    });

    Hooks.on("updateDrawing", (document, change, options, userId) => {
        if (game.user.isGM && "flags" in change && MODULE_ID in change.flags) {
            // Only update if our flag potentially changed
            updateFXMasterMasks();
        }
    });

    Hooks.on("deleteDrawing", (document, options, userId) => {
        if (game.user.isGM) updateFXMasterMasks();
    });

    // Hook to add the custom Weather Control button to Scene Controls
    Hooks.on("renderSceneControls", (app, html, data) => {
        if (!game.user.isGM) return;

        // Find the FXMaster wand control group
        const fxMasterGroup = html.find('.control-tool[data-tool="fxmaster"]');
        if (fxMasterGroup.length > 0) {
            // Create a new button for Weather Control
            const weatherButton = `
                <li class="control-tool" data-tool="weather-control">
                    <i class="fas fa-cloud-sun-rain"></i>
                    <label>${game.i18n.localize(`${MODULE_ID}.UI.WeatherControl.Button`)}</label>
                </li>
            `;
            // Append it next to the FXMaster button
            fxMasterGroup.after(weatherButton);

            // Add click listener to open the WeatherControlApp
            html.find('.control-tool[data-tool="weather-control"]').click(() => {
                new WeatherControlApp().render(true);
            });
        } else {
            log("FXMaster control group not found. Weather control button not added.");
        }
    });
};