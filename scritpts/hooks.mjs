// hooks.mjs
import { log } from "./main.mjs";

/**
 * Register all module hooks
 */
export const setupHooks = function() {
    log("Setting up module hooks...");

    // Example hook: Listen for when a token is updated (e.g., moved)
    Hooks.on("updateToken", (document, change, options, userId) => {
        if (!game.user.isGM) return; // Only GM processes this
        if (!("x" in change || "y" in change)) return; // Only interested in position changes

        log(`Token ${document.name} moved.`);
        // TODO: Trigger indoor/outdoor check and movement penalty update
        // We'll move this logic into environment-control.mjs
        Hooks.call(`dynamicEnvironmentControl.tokenMoved`, document);
    });

    // More hooks will go here, e.g., for rendering character sheets, etc.
};