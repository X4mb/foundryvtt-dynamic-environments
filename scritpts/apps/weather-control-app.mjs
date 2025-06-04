// scripts/apps/weather-control-app.mjs
import { MODULE_ID } from "../main.mjs";

export class WeatherControlApp extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "weather-control-app",
            classes: [MODULE_ID, "weather-control"],
            title: game.i18n.localize(`${MODULE_ID}.UI.WeatherControl.Title`),
            template: `modules/${MODULE_ID}/templates/weather-control-app.hbs`,
            width: 300,
            height: "auto",
            closeOnSubmit: true,
            submitOnChange: false,
            submitOnClose: false
        });
    }

    /**
     * Get the data for the template.
     * @returns {object} The data to render in the template.
     */
    getData() {
        const currentSetting = game.settings.get(MODULE_ID, 'currentWeather');
        const weatherChoices = game.settings.settings.get(`${MODULE_ID}.currentWeather`).choices;

        // Convert choices object to an array for easier iteration in Handlebars
        const weatherOptions = Object.entries(weatherChoices).map(([key, value]) => ({
            key: key,
            label: value,
            selected: key === currentSetting
        }));

        return {
            currentWeather: currentSetting,
            weatherOptions: weatherOptions,
            i18n: key => game.i18n.localize(`${MODULE_ID}.UI.WeatherControl.${key}`)
        };
    }

    /**
     * Event listeners for the form.
     * @param {jQuery} html The rendered HTML of the form.
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('select[name="weatherType"]').change(async (event) => {
            const newWeather = event.currentTarget.value;
            await game.settings.set(MODULE_ID, 'currentWeather', newWeather);
            this.render(false); // Re-render to show updated selected value
        });
    }

    /**
     * This method is called when the form is submitted.
     * We're not using form submission for this simple app, but rather `onChange` listeners.
     * @param {Event} event The submit event.
     * @param {object} formData The form data.
     */
    async _updateObject(event, formData) {
        // No-op for this form, as changes are handled immediately by onChange
    }
}