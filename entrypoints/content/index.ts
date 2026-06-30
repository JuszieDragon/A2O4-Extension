import browser from "webextension-polyfill";

import { LocalData } from "../../types/local-data";
import { A2O4Request, DownloadFormat } from "../../types/a2o4-request.ts";

async function showDropdown(source: string, buttonText: string, message: string) {
  const download_button = document.getElementById(source + "ButtonText") as HTMLAnchorElement;
  const info_dropdown = document.getElementById(source + "dropdown") as HTMLUListElement;
  const info_dropdown_text = document.getElementById(source + "dropdownInfo") as HTMLParagraphElement

  download_button.text = buttonText
  info_dropdown_text.innerText = message
  info_dropdown.classList.remove("hidden")
  setTimeout(function() { info_dropdown.classList.add("hidden") }, 10000)
}

async function downloadUrlWithFandomOverride(AO3Url: string, source: string) {
  await downloadUrl(AO3Url, source, true)
}

async function downloadUrl(AO3Url: string, source: string, useFandomOverride = false) {
  const config = await browser.storage.local.get() as LocalData;
  const serverIp: string = `${config.ip}:${config.port}`;
  const fandomOverride: string = config.fandom;

  if (config.ip == '' || config.ip == undefined) {
    showDropdown(source, "Error", "Server IP is not set");
    return
  }
  else if (config.port == '' || config.port == undefined) {
    showDropdown(source, "Error", "Server port is not set");
    return
  }
  else if (!/^\d+$/.test(config.port)) {
    showDropdown(source, "Error", "Port entered is not valid");
    return
  }
  else if (useFandomOverride && (fandomOverride == '' || fandomOverride == undefined)) {
    showDropdown(source, "Error", "Fandom override is not set");
    return
  }

  const download_button = document.getElementById(source + "ButtonText") as HTMLAnchorElement;
  if (download_button) download_button.text = "Downloading";

  const info_dropdown = document.getElementById(source + "dropdown") as HTMLUListElement;
  if (info_dropdown) info_dropdown.classList.add("hidden");

  let response: Response;
  const request: A2O4Request = {
    url: AO3Url,
    devices: config.devices,
    fandom_override: useFandomOverride ? fandomOverride : null,
    format: DownloadFormat.EPUB
  }
  try {
    response = await fetch(`http://${serverIp}/download`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    });
    console.log(await response);
  } catch (e: unknown) {
    console.error(e);
    console.error(`trying to fetch ${serverIp}`);

    if (e instanceof Error) {
      if (e.message.startsWith("NetworkError")) {
        showDropdown(source, "Error", `Cannot connect to server ${serverIp}, check ip and server state`);
      } else {
        showDropdown(source, "Error", e.message);
      }
    } else {
      showDropdown(source, "Unknown error", "");
    }
    return
  }

  switch (response.status) {
    case 200:
      showDropdown(source, "Success", await response.text());
      break;
    default:
      showDropdown(source, "Failed", await response.text());
      break;
  }
}

function removeElementsByClass(className: string) {
  const elements = document.getElementsByClassName(className) as HTMLCollectionOf<HTMLElement>;
  while (elements.length > 0) {
    elements[0]?.parentNode?.removeChild(elements[0]);
  };
}



function add_button(navButtons: HTMLUListElement, buttonName: string, text: string, eventListener: (AO3Url: string, source: string) => void) {
  const newButton = document.createElement("li");
  const newButtonText = document.createElement("a");
  const newButtonDropdown = document.createElement("ul");
  const newButtonDropdownInfo = document.createElement("p");

  newButton.className = buttonName + "Button";

  newButtonText.text = text;
  newButtonText.id = buttonName + "ButtonText";

  newButtonDropdown.className = "expandable secondary hidden";
  newButtonDropdown.id = buttonName + "dropdown";

  newButtonDropdownInfo.className = "region";
  newButtonDropdownInfo.id = buttonName + "dropdownInfo";
  newButtonDropdownInfo.style.display = "flex";

  newButtonDropdown?.appendChild(newButtonDropdownInfo);
  newButton?.appendChild(newButtonText);
  newButton?.appendChild(newButtonDropdown);
  newButton?.addEventListener("click", () => eventListener(document.URL, buttonName));
  navButtons?.appendChild(newButton);
}

export default defineContentScript({
  matches: [
    "*://archiveofourown.org/works/*",
    "*://archiveofourown.org/series/*",
    "*://archiveofourown.org/*/works/*"
  ],
  main: () => {
    if (!document.URL?.includes("search")) {
      console.log("Adding API download buttons");

      removeElementsByClass("A2O4Button");
      removeElementsByClass("A2O4OButton");

      const navigationButtons = (document.getElementsByClassName("work navigation actions")[0] ?? document.getElementsByClassName("navigation actions")[2]) as HTMLUListElement;

      add_button(navigationButtons, "A2O4", "A2O4", downloadUrl);
      add_button(navigationButtons, "A2O4O", "A2O4 Override", downloadUrlWithFandomOverride);
    } else {
      console.log("Wrong Page");
    }
  }
})

