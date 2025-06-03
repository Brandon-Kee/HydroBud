// background.js
// Initialize the extension
// let isAggressiveMode = false;

// * Initialize hydration data when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
    console.log("Plant Extension Installed");

    // Set default values if not already set
    const data = await chrome.storage.local.get(["totalWater", "waterGoal", "plantStage", "plantType"]);
    console.log(`data: ${data}`);
    console.log(`totalWater: ${data.totalWater}`);
    console.log(`waterGoal: ${data.waterGoal}`);
    console.log(`plantStage: ${data.plantStage}`);
    console.log(`plantType: ${data.plantType}`);

    if (!data.totalWater) {
        await chrome.storage.local.set({ totalWater: 0 });
    }
    if (!data.waterGoal) {
        await chrome.storage.local.set({ waterGoal: 2000 }) // in ml
    }
    if (!data.plantStage) {
        await chrome.storage.local.set({ plantStage: "pot" });
    }
    if (!data.plantType) {
        await chrome.storage.local.set({ plantType: "plant1" });
    }  
});

// * Set reminders based on user-defined frequency
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setUserInput") {
        const frequency = request.frequency;
        const userType = request.plantType;
        const userGoal = request.waterGoal;

        // Clear existing alarms
        chrome.alarms.clearAll(() => {
            console.log("Existing alarms cleared.");

            // Create a new hydration reminder alarm
            chrome.alarms.create("hydrationReminder", { periodInMinutes: frequency });
            console.log(`Hydration reminder set for every ${frequency} minutes.`);
        });

        chrome.storage.local.set({ plantType: userType, waterGoal: userGoal });

        sendResponse({ status: "success", message: "Set user input." });
    }
});

// * Update progress and plant state when the user drinks water
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "drinkWater") {
        const amount = request.amount;

        chrome.storage.local.get(["totalWater", "waterGoal"], (data) => {
            const newWater = data.totalWater + amount;
            const waterGoal = data.waterGoal;

            chrome.storage.local.set({ totalWater: newWater }, () => {
                // Update the plant state based on progress
                const states = ["pot", "sprout1", "sprout2", "S1_flower1", "S1_flower2", "S1_flower3"]
                const idx = (newWater / waterGoal) * (states.length - 1);
                const newStage = states[Math.ceil(idx)];
                // console.log(`idx: ${idx} Math.floor(idx): ${Math.floor(idx)} newStage: ${newStage}`)

                chrome.storage.local.set({ plantStage: newStage }, () => {
                    console.log("Plant state updated to:", newStage);
                });

                sendResponse({ status: "success" });
            });
        });
        return true; // Keep the messaging channel open for async response
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "hydrationReminder") {
        console.log("timerSetOff event triggered in background.js");
        chrome.tabs.query({ active: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "timerSetOff" }, function (response) { });
        });
    }
});

function resetNewDay() {
    let now = new Date();
    let midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    let timeToMidnight = midnight - now;
    setTimeout(() => {
        chrome.storage.local.set({ totalWater: 0, waterGoal: 2000, plantType: "plant1", plantStage: "pot" }, () => {
            console.log("Plant and water data reset for a new day.");
        });
        resetNewDay(); //call again for next day
    }, timeToMidnight);
}
resetNewDay(); // Initialize the reset function when the background script loads


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(
        sender.tab
            ? "(Im background.js) from a content script:" + sender.tab.url
            : "(Im background.js) from the extension"
    );
});