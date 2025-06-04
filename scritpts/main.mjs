// main.mjs
import { registerSettings } from "./settings.mjs";
import { setupHooks } from "./hooks.mjs";
import { setupEnvironmentControl } from "./environment-control.mjs";

// Define module ID for easy access
export const MODULE_ID = 'dynamic-environment-control';
export const log = (...args) => console.log(MODULE_ID, '|', ...args);
export const error = (...args) => console.error(MODULE_ID, '|', ...args);

/* ------------------------------------ */
/* Initialize module                    */
/* ------------------------------------ */
Hooks.once('init', async function() {
    log('Initializing Dynamic Environment Control');

    // Register module settings
    registerSettings();
});

/* ------------------------------------ */
/* Setup module (after all modules are initialized) */
/* ------------------------------------ */
Hooks.once('setup', function() {
    log('Setting up Dynamic Environment Control');
    // Any setup logic that needs all modules to be initialized
});

/* ------------------------------------ */
/* Ready module (when game data is loaded) */
/* ------------------------------------ */
Hooks.once('ready', async function() {
    log('Dynamic Environment Control Ready!');

    // Check for FXMaster dependency
    if (!game.modules.get('fxmaster')?.active) {
        ui.notifications.error(`${MODULE_ID} | FXMaster module is not active. Please enable it for full functionality.`, { permanent: true });
        error("FXMaster module is not active!");
        return;
    }

    // Setup all our hooks
    setupHooks();

    // Initialize core environment control logic
    setupEnvironmentControl();
});