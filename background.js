chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: showPopup
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "copy_novel_text") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: extractNovel
        });
      }
    });
  }
});

function showPopup() {
  function showTemporaryAlert(message) {
    const alertBox = document.createElement("div");
    alertBox.innerText = message;
    alertBox.style.position = "fixed";
    alertBox.style.bottom = "20px";
    alertBox.style.left = "50%";
    alertBox.style.transform = "translateX(-50%)";
    alertBox.style.backgroundColor = "black";
    alertBox.style.color = "white";
    alertBox.style.padding = "10px";
    alertBox.style.borderRadius = "5px";
    alertBox.style.zIndex = "1000";
    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.remove();
    }, 2000);
  }
  chrome.storage.local.get(['isCharacterLimitEnabled', 'characterLimit', 'isAIPromptEnabled'], (result) => {
    const isCharacterLimitEnabled = result.isCharacterLimitEnabled !== undefined ? result.isCharacterLimitEnabled : true;
    const characterLimit = result.characterLimit || 1000;
    const isAIPromptEnabled = result.isAIPromptEnabled !== undefined ? result.isAIPromptEnabled : true;
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '10px';
    popup.style.right = '10px';
    popup.style.backgroundColor = 'black';
    popup.style.color = 'white';
    popup.style.padding = '10px';
    popup.style.borderRadius = '5px';
    popup.style.zIndex = '1000';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.flexDirection = 'column';
    document.body.appendChild(popup);

    const title = document.createElement('div');
    title.innerText = 'Novel Extractor';
    title.style.fontSize = '16px';
    title.style.marginBottom = '10px';
    popup.appendChild(title);

    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    popup.appendChild(toggleContainer);

    const toggleLabel = document.createElement('span');
    toggleLabel.innerText = 'Character Limit is enabled';
    toggleLabel.style.marginRight = '10px';
    toggleContainer.appendChild(toggleLabel);

    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.checked = isCharacterLimitEnabled;
    toggleSwitch.addEventListener('change', () => {
      chrome.storage.local.set({ isCharacterLimitEnabled: toggleSwitch.checked }, () => {
        const message = toggleSwitch.checked ? 'Character limit feature enabled.' : 'Character limit feature disabled.';
        showTemporaryAlert(message);
      });
    });
    toggleContainer.appendChild(toggleSwitch);

    const characterLimitLabel = document.createElement('span');
    characterLimitLabel.innerText = `Current Limit: `;
    characterLimitLabel.style.marginLeft = '10px';
    toggleContainer.appendChild(characterLimitLabel);

    const characterLimitInput = document.createElement('input');
    characterLimitInput.type = 'number';
    characterLimitInput.value = characterLimit;
    characterLimitInput.style.marginLeft = '5px';
    characterLimitInput.style.width = '60px';
    characterLimitInput.addEventListener('change', () => {
      const newLimit = parseInt(characterLimitInput.value, 10) || 1000;
      chrome.storage.local.set({ characterLimit: newLimit }, () => {
        showTemporaryAlert(`Character limit updated to ${newLimit}.`);
      });
    });
    toggleContainer.appendChild(characterLimitInput);

    const aiPromptToggleContainer = document.createElement('div');
    aiPromptToggleContainer.style.display = 'flex';
    aiPromptToggleContainer.style.alignItems = 'center';
    aiPromptToggleContainer.style.marginTop = '10px';
    popup.appendChild(aiPromptToggleContainer);

    const aiPromptToggleLabel = document.createElement('span');
    aiPromptToggleLabel.innerText = 'AI Prompt is enabled';
    aiPromptToggleLabel.style.marginRight = '10px';
    aiPromptToggleContainer.appendChild(aiPromptToggleLabel);

    const aiPromptToggleSwitch = document.createElement('input');
    aiPromptToggleSwitch.type = 'checkbox';
    aiPromptToggleSwitch.checked = isAIPromptEnabled;
    aiPromptToggleSwitch.addEventListener('change', () => {
      chrome.storage.local.set({ isAIPromptEnabled: aiPromptToggleSwitch.checked }, () => {
        const message = aiPromptToggleSwitch.checked ? 'AI prompt feature enabled.' : 'AI prompt feature disabled.';
        showTemporaryAlert(message);
      });
    });
    aiPromptToggleContainer.appendChild(aiPromptToggleSwitch);

    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.addEventListener('click', () => {
      popup.remove();
    });
    popup.appendChild(closeButton);
  });
}

function extractNovel() {
  function showTemporaryAlert(message) {
    const alertBox = document.createElement("div");
    alertBox.innerText = message;
    alertBox.style.position = "fixed";
    alertBox.style.bottom = "20px";
    alertBox.style.left = "50%";
    alertBox.style.transform = "translateX(-50%)";
    alertBox.style.backgroundColor = "black";
    alertBox.style.color = "white";
    alertBox.style.padding = "10px";
    alertBox.style.borderRadius = "5px";
    alertBox.style.zIndex = "1000";
    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.remove();
    }, 2000);
  }
  let titleElement, contentElement;
  const defaultCharacterLimit = 1000;
  let characterLimit = defaultCharacterLimit;
  let defaultAIPrompt = "Translate this novel chapter to English.\n\n"
  let currentPart = 1;
  let totalParts = 1;
  let isCharacterLimitEnabled = true;
  let isAIPromptEnabled = true;

  chrome.storage.local.get(['characterLimit', 'isCharacterLimitEnabled', 'isAIPromptEnabled'], (result) => {
    if (result.characterLimit) {
      characterLimit = result.characterLimit;
    }
    if (result.isCharacterLimitEnabled !== undefined) {
      isCharacterLimitEnabled = result.isCharacterLimitEnabled;
    }
    if (result.isAIPromptEnabled !== undefined) {
      isAIPromptEnabled = result.isAIPromptEnabled;
    }
    initializeUI();
  });

  function initializeUI() {
    if (window.location.hostname.includes("syosetu.com")) {
      titleElement = document.querySelector(".p-novel__title.p-novel__title--rensai");
      contentElement = document.querySelector(".p-novel__body");
    } else if (window.location.hostname.includes("booktoki468.com")) {
      titleElement = document.querySelector(".toon-title");
      contentElement = document.querySelector("#novel_content");
    }
    
    if (!titleElement || !contentElement) {
      showTemporaryAlert("Novel title or content not found.");
      return;
    }
    
    const title = titleElement.innerText.trim();
    const content = contentElement.innerText.trim();
    let fullText = `${title}\n\n${content}`;
    
    if (!isCharacterLimitEnabled) {
      if (isAIPromptEnabled) {
        fullText = defaultAIPrompt + fullText;
      }
      navigator.clipboard.writeText(fullText).then(() => {
        showTemporaryAlert("Novel full text copied to clipboard!");
      }).catch(err => {
        showTemporaryAlert("Failed to copy text.");
        console.error(err);
      });
      return;
    }

    const partInfoContainer = document.createElement("div");
    partInfoContainer.style.position = "fixed";
    partInfoContainer.style.top = "50px";
    partInfoContainer.style.right = "20px";
    partInfoContainer.style.backgroundColor = "black";
    partInfoContainer.style.color = "white";
    partInfoContainer.style.padding = "10px";
    partInfoContainer.style.borderRadius = "5px";
    partInfoContainer.style.zIndex = "1000";
    partInfoContainer.style.display = "flex";
    partInfoContainer.style.alignItems = "center";
    document.body.appendChild(partInfoContainer);
    
    const partInfoLabel = document.createElement("span");
    partInfoLabel.innerText = "Part: ";
    partInfoLabel.style.marginRight = "5px";
    partInfoContainer.appendChild(partInfoLabel);
    
    const partInfoInput = document.createElement("input");
    partInfoInput.type = "number";
    partInfoInput.value = currentPart;
    partInfoInput.min = 1;
    partInfoInput.style.backgroundColor = "black";
    partInfoInput.style.color = "white";
    partInfoInput.style.padding = "5px";
    partInfoInput.style.borderRadius = "5px";
    partInfoInput.style.width = "40px";
    partInfoInput.style.textAlign = "center";
    partInfoContainer.appendChild(partInfoInput);
    
    const totalPartsLabel = document.createElement("span");
    totalPartsLabel.style.marginLeft = "5px";
    partInfoContainer.appendChild(totalPartsLabel);
    
    partInfoInput.addEventListener("change", () => {
      currentPart = parseInt(partInfoInput.value, 10) || 1;
      if (currentPart < 1) currentPart = 1;
      if (currentPart > totalParts) currentPart = totalParts;
      partInfoInput.value = currentPart;
      copyCurrentPartToClipboard();
    });
    
    function updatePartInfo() {
      totalParts = Math.ceil(fullText.length / characterLimit);
      totalPartsLabel.innerText = `of ${totalParts}`;
      partInfoInput.max = totalParts;
      partInfoInput.value = currentPart;
    }
    
    function getPartText(startIndex, endIndex) {
      let partText = fullText.slice(startIndex, endIndex);
      const lastSentenceEnd = Math.max(partText.lastIndexOf("."), partText.lastIndexOf("\n")) + 1;
      if (lastSentenceEnd > 0 && lastSentenceEnd < partText.length) {
        partText = partText.slice(0, lastSentenceEnd);
      }
      return partText;
    }
    
    function copyCurrentPartToClipboard() {
      let partText = getPartText((currentPart - 1) * characterLimit, currentPart * characterLimit);
      if (isAIPromptEnabled) {
        partText = defaultAIPrompt + partText;
      }
      navigator.clipboard.writeText(partText).then(() => {
        showTemporaryAlert(`Novel text PART ${currentPart} is copied to clipboard!`);
      }).catch(err => {
        showTemporaryAlert("Failed to copy text.");
        console.error(err);
      });
    }
    
    updatePartInfo();
    copyCurrentPartToClipboard();
  }
}