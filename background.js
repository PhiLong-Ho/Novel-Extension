chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractNovel
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
  
  if (window.location.hostname.includes("ncode.syosetu.com")) {
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
  
  const fullText = `Translate this novel chapter to English\n\n${title}\n\n${content}`;
  navigator.clipboard.writeText(fullText).then(() => {
    showTemporaryAlert("Novel text copied to clipboard!");
  }).catch(err => {
    showTemporaryAlert("Failed to copy text.");
    console.error(err);
  });
}