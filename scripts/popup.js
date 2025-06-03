document.addEventListener("DOMContentLoaded", function () {
    // Array of plant images
    const plantImages = [
        'images/seed1.png', // Image 1
        'images/seed2.png', // Image 2
        'images/seed3.png',  // Image 4
        'images/seed4.png', // Image 3
    ];

    let currentIndex = 0; // Index to track current image

    // Function to update the plant image
    function updatePlantImage() {
        const plantImageElement = document.getElementById("plantImage");
        plantImageElement.src = plantImages[currentIndex];
        plantImageElement.alt = `Plant ${currentIndex + 1}`;
    }

    // Function to check if the Start Watering button should be enabled
    function checkStartWateringButton() {
        const minutesInput = document.getElementById("minutesInput").value;
        const mLInput = document.getElementById("mLInput").value;
        const startWateringButton = document.getElementById("startWatering");

        // Enable button only if a plant is selected and both inputs have values
        startWateringButton.disabled = !(isPlantSelected && minutesInput && mLInput);
    }

    // Event listener for the Next button
    document.getElementById("nextButton").addEventListener("click", function () {
        currentIndex = (currentIndex + 1) % plantImages.length; // Increment index and wrap around
        updatePlantImage();
    });

    // Event listener for the Previous button
    document.getElementById("prevButton").addEventListener("click", function () {
        currentIndex = (currentIndex - 1 + plantImages.length) % plantImages.length; // Decrement index and wrap around
        updatePlantImage();
    });

    // Event listener for the Select Plant button
    let isPlantSelected = false;

    document.getElementById("selectPlantButton").addEventListener("click", function () {
        isPlantSelected = !isPlantSelected; // Toggle the selection state

        const plantImage = document.getElementById("plantImage");


        if (isPlantSelected) {
            // Change button color to red
            selectPlantButton.textContent = 'Selected';
            this.style.backgroundColor = "red";
            this.style.color = "white"; // Optional: change text color for better contrast


            // Disable carousel buttons
            document.getElementById("prevButton").disabled = true;
            document.getElementById("nextButton").disabled = true;

            // Add pulse animation class to the plant image
            plantImage.classList.add("pulse");

            // Remove pulse class after animation ends
            setTimeout(() => {
                plantImage.classList.remove("pulse");
            }, 500); // Duration of the pulse animation (in ms)
        } else {
            // Reset button color
            selectPlantButton.textContent = 'Select Seed';
            this.style.backgroundColor = "#FFD700"; // or your original color
            this.style.color = "black"; // Reset text color

            // Enable carousel buttons
            document.getElementById("prevButton").disabled = false;
            document.getElementById("nextButton").disabled = false;
        }
        checkStartWateringButton();
    });

    // Event listeners for input fields
    document.getElementById("minutesInput").addEventListener("input", checkStartWateringButton);
    document.getElementById("mLInput").addEventListener("input", checkStartWateringButton);

    // Event listener for the Start Watering button
    document.getElementById("startWatering").addEventListener("click", function () {
        // Hide the main container
        document.getElementById("mainContainer").style.display = "none";

        // Show the watering popup
        document.getElementById("wateringPopup").style.display = "block";

        // Get plant type by seed image index
        let userType = "plant1";
        switch (currentIndex) {
            case 0: userType = "plant1";
                break;
            case 1: userType = "plant2";
                break;
            case 2: userType = "plant3";
                break;
            case 3: userType = "plant4";
                break;
        }


        const freq = parseInt(document.getElementById("minutesInput").value);
        const goal = parseInt(document.getElementById("mLInput").value);

        if (isNaN(freq) || isNaN(goal)) {
            console.error("Invalid input: Please enter numeric values for frequency and water goal.");
            return;
        }

        // Send message to background.js
        chrome.runtime.sendMessage({
            action: "setUserInput",
            frequency: freq,
            waterGoal: goal,
            plantType: userType
        }, function (response) {
            console.log("Response from background:", response);
        });
    });

    // Event listener for the Quit Session button in the popup
    document.getElementById("wateringPopup").addEventListener("click", function (event) {
        if (event.target.id === "quitSessionButton") {
            chrome.storage.local.set({ totalWater: 0, waterGoal: 0, plantStage: "pot" }, () => { });
            window.close();
        }
    });

    document.getElementById("quitSessionButton").addEventListener("click", function () {
        chrome.storage.local.set({ currentScreen: "mainContainer" }, function () {
            document.getElementById("mainContainer").style.display = "block";
            document.getElementById("wateringPopup").style.display = "none";
        });
    });

    chrome.storage.local.get(["currentScreen"], function (result) {
        const currentScreen = result.currentScreen || "mainContainer";

        document.querySelectorAll(".container").forEach(container => {
            container.style.display = "none";
        });

        document.getElementById(currentScreen).style.display = "block";

        document.getElementById("startWatering").addEventListener("click", function () {

            chrome.storage.local.set({ currentScreen: "wateringPopup" }, function () {
                document.getElementById("mainContainer").style.display = "none";
                document.getElementById("wateringPopup").style.display = "block";
            });
        });
    });

    async function updateMetrics() {
        try {
            const alarm = await chrome.alarms.get("hydrationReminder");
            if (alarm) {
                const currentTime = Date.now();
                const remainingTime = alarm.scheduledTime - currentTime;

                const timeElement = document.getElementById("timeRemaining");
                if (remainingTime > 1) {
                    const minutesRemaining = Math.ceil(remainingTime / 60000);
                    timeElement.textContent = `${minutesRemaining}`;
                } else {
                    timeElement.textContent = `<1`;
                }
            }
            const { totalWater, waterGoal } = await chrome.storage.local.get(["totalWater", "waterGoal"]);
            const progress = Math.floor((totalWater / waterGoal) * 100);

            document.getElementById("totalWaterDrank").textContent = `${totalWater}`;
            document.getElementById("waterGoal").textContent =
                `You are ${progress}% of the way to your ${waterGoal}ml goal!`;
        } catch (error) {
            console.error("Error updating metrics:", error);
        }
    }

    updateMetrics();
    setInterval(updateMetrics, 5000); // poll at 5 sec intervals
});

