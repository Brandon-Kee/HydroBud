// PLANT

// Set plant position
function setPosition(element, ratio = 0.01) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate the position based on the ratio
    const rightMargin = screenWidth * ratio; // right ratio
    const bottomMargin = screenHeight * ratio; // bottom ratio

    element.style.position = "fixed";
    element.style.right = `${rightMargin}px`;
    element.style.bottom = `${bottomMargin}px`;
}  

// Show plant
function updatePlant() {
    // Check if there is a selected image option from the storage mechanism
    chrome.storage.local.get(["plantType", "plantStage"], function (result) {
        const plant = document.querySelector(".plant");
        // Get the selected image option from the storage mechanism
        let plantType = result.plantType;
        let plantStage = result.plantStage;
        console.log("Selected image: " + plantType);

        // Add the plant class and type to the plant element
        plant.classList.add(plantType); // e.g., plant1, plant2, etc.
        plant.classList.add(plantStage); // e.g., pot, sprout1, sprout2, etc.
        setPosition(plant);
        const imageUrl = chrome.runtime.getURL("images/" + plantStage + ".png");
        console.log("Image Path: ", imageUrl);
        plant.style.backgroundImage = `url(${imageUrl})`;
    });
}

window.addEventListener("load", () => {
    const plant = document.createElement("div");
    plant.classList.add("plant");
    document.body.appendChild(plant);
    updatePlant();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "timerSetOff") {
        console.log("timerSetOff event received in content.js");
        displayModal();
        sendResponse({ status: "success" });
    }
});

window.addEventListener("load", onload);

function displayModal() {
    // Create and append styles
    const modalStyle = document.createElement("style");
    modalStyle.innerHTML = `
      .hydrobud-modal-overlay > * {
        font-family: 'Chewy',cursive;
      }
      .hydrobud-modal-overlay {
        font-family: 'Chewy',cursive;
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      .hydrobud-modal {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        width: 100%;
        text-align: center;
      }
      .hydrobud-modal-header {
        color: black !important;
        font-size: 18px;
        margin-bottom: 10px;
      }
      .hydrobud-modal-footer button {
        padding: 10px 15px;
        border: none;
        background:rgba(44, 160, 255, 0.72);
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
      }
      .hydrobud-modal-footer button:hover {
        background:rgb(10, 104, 205);
      }
      .hydrobud-btn {
        --btn-color: rgb(40, 51, 169);
        --btn-bg: rgb(96, 153, 238);
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background-color: var(--btn-bg);
        color: var(--btn-color);
        padding: 14px 22px;
        border-radius: 8px;
        border: 0;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        font-family: system-ui;
        border: 2px solid var(--btn-color);
        transition: 100ms ease;
        box-shadow: 5px 5px 0 0 var(--btn-color);
    }

    .hydrobud-btn--secondary {
        --btn-color: #444;
        --btn-bg: #fafafa;
    }

    .hydrobud-btn svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .hydrobud-btn:hover {
        box-shadow: 2px 2px 0 0 var(--btn-color);
    }

    .hydrobud-btn:active {
        transition: 50ms ease;
        box-shadow: 0 0 0 0 var(--btn-color);
    }

    .hydrobud-btn:focus-visible {
        outline: 0;
        --btn-color: #002cc8;
    }

    .hydrobud-btn:focus-visible::after {
        position: absolute;
        left: 50%;
        top: calc(100% + 12px);
        transform: translateX(-50%);
        animation: float .5s ease-in-out infinite;
    }

    @keyframes float {
        0% {
            transform: translateX(-50%) translatey(0px);
        }

        50% {
            transform: translateX(-50%) translatey(-6px);
        }

        100% {
            transform: translateX(-50%) translatey(0px);
        }
    }
    `;
    document.head.appendChild(modalStyle);

    // Create modal overlay and modal content
    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("hydrobud-modal-overlay");

    const modalDiv = document.createElement("div");
    modalDiv.classList.add("hydrobud-modal");
    modalDiv.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Chewy&display=swap" rel="stylesheet">
      <div class="hydrobud-modal-header">I'm parched! Hydrate yourself to hydrate me! </div>
      <input type="text" id="userInput" placeholder="Enter amount of water" style="width: 80%; padding: 10px; margin-bottom: 10px;"><span>ml</span>
      <div class="hydrobud-modal-footer">
        <button id="closeModalBtn">Submit</button>
      </div>
    `;

    modalOverlay.appendChild(modalDiv);
    document.body.appendChild(modalOverlay);

    closeModalBtn.addEventListener("click", () => {
        const userInput = document.getElementById("userInput").value;
        const water = parseInt(userInput);

        if (isNaN(water)) {
            console.error(
                "Invalid input: Please enter numeric values for amount of water."
            );
            return;
        }

        console.log("User Input:", `${water} ml`); // Handle the input
        document.body.removeChild(modalOverlay); // Remove modal from DOM

        // Send message to background.js
        chrome.runtime.sendMessage(
            {
                action: "drinkWater",
                amount: water,
            },
            function (response) {
                console.log("Response from background:", response);
                updatePlant();
            }
        );
    });
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(
        sender.tab
            ? "(Im content.js) from a content script:" + sender.tab.url
            : "(Im content.js) from the extension"
    );
});




