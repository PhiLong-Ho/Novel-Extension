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
  chrome.storage.local.get('isCharacterLimitEnabled', (result) => {
    const isCharacterLimitEnabled = result.isCharacterLimitEnabled !== undefined ? result.isCharacterLimitEnabled : true;
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
  let currentPart = 1;
  let totalParts = 1;
  let isCharacterLimitEnabled = true;

  chrome.storage.local.get(['characterLimit', 'isCharacterLimitEnabled'], (result) => {
    if (result.characterLimit) {
      characterLimit = result.characterLimit;
    }
    if (result.isCharacterLimitEnabled !== undefined) {
      isCharacterLimitEnabled = result.isCharacterLimitEnabled;
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
    const fullText = `${title}\n\n${content}`;
    
    if (!isCharacterLimitEnabled) {
      navigator.clipboard.writeText(fullText).then(() => {
        showTemporaryAlert("Novel full text copied to clipboard!");
      }).catch(err => {
        showTemporaryAlert("Failed to copy text.");
        console.error(err);
      });
      return;
    }

    const characterLimitContainer = document.createElement("div");
    characterLimitContainer.style.position = "fixed";
    characterLimitContainer.style.top = "50px";
    characterLimitContainer.style.right = "20px";
    characterLimitContainer.style.backgroundColor = "black";
    characterLimitContainer.style.color = "white";
    characterLimitContainer.style.padding = "10px";
    characterLimitContainer.style.borderRadius = "5px";
    characterLimitContainer.style.zIndex = "1000";
    characterLimitContainer.style.display = "flex";
    characterLimitContainer.style.alignItems = "center";
    document.body.appendChild(characterLimitContainer);
    
    const characterLimitLabel = document.createElement("span");
    characterLimitLabel.innerText = "Character Limit: ";
    characterLimitLabel.style.marginRight = "5px";
    characterLimitContainer.appendChild(characterLimitLabel);
    
    const characterLimitInput = document.createElement("input");
    characterLimitInput.type = "number";
    characterLimitInput.value = characterLimit;
    characterLimitInput.style.backgroundColor = "black";
    characterLimitInput.style.color = "white";
    characterLimitInput.style.padding = "5px";
    characterLimitInput.style.borderRadius = "5px";
    characterLimitInput.style.width = "60px";
    characterLimitInput.style.textAlign = "center";
    characterLimitContainer.appendChild(characterLimitInput);
    
    characterLimitInput.addEventListener("change", () => {
      characterLimit = parseInt(characterLimitInput.value, 10) || defaultCharacterLimit;
      chrome.storage.local.set({ characterLimit });
      updatePartInfo();
      copyCurrentPartToClipboard();
    });
    
    const partInfoContainer = document.createElement("div");
    partInfoContainer.style.position = "fixed";
    partInfoContainer.style.top = "110px";
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
      const partText = getPartText((currentPart - 1) * characterLimit, currentPart * characterLimit);
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