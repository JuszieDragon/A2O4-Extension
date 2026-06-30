import browser from "webextension-polyfill";

import { LocalData } from "../../types/local-data";

async function saveConnectionDetails(event: SubmitEvent) {
  event.preventDefault();

  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  await browser.storage?.local.set({
    ip: formData.get("ip"),
    port: formData.get("port"),
    fandom: formData.get("fandom"),
    devices: getSelectedDevices(),
  });
}

function getSelectedDevices(): string[] {
  const checkedBoxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
  return Array.from(checkedBoxes).map((box) => box.value);
}

async function loadLocalData(): LocalData | null {
  const keysToFetch: (keyof LocalData)[] = ['ip', 'port', 'fandom', 'devices'];

  const result = await browser.storage.local.get(keysToFetch);

  // Check if the returned object has any keys
  if (Object.keys(result).length === 0) {
    return null;
  }

  // Safe to cast now that we know data exists
  return result as LocalData;
}

function reloadDetails(config: LocalData | null): void {
  const ipInput = document.querySelector("#ip") as HTMLInputElement;
  const portInput = document.querySelector("#port") as HTMLInputElement;
  const fandomInput = document.querySelector("#fandom") as HTMLInputElement;

  ipInput.value = config?.ip ?? '';
  portInput.value = config?.port ?? '';
  fandomInput.value = config?.fandom ?? '';
}

//TODO fix checked devices being lost on clicking load devices after already loading and saving config
async function getDevices(config: (LocalData | null) | PointerEvent) {
  const devicesDiv = document.getElementById('devices') as HTMLDivElement;
  devicesDiv.replaceChildren();

  let res: Response;
  if (config && 'ip' in config) {
    console.log(`config exists: ${config}`)
    res = await fetch(`http://${config.ip}:${config.port}/devices`)
  } else {
    console.log("config doesn't exist")
    const ipInput = document.querySelector("#ip") as HTMLInputElement;
    const portInput = document.querySelector("#port") as HTMLInputElement;

    if (ipInput.value && portInput.value) {
      console.log(`Loaded ip: ${ipInput.value}, port: ${portInput.value}`)
      res = await fetch(`http://${ipInput.value}:${portInput.value}/devices`)
    } else {
      console.log("found nothing, exiting")
      return
    }
  };

  const devices: string[] = await res.json();
  console.log(res)
  console.log(devices)

  devices.forEach(device => {
    const deviceCheckbox = document.createElement('input') as HTMLInputElement;
    deviceCheckbox.type = 'checkbox';
    deviceCheckbox.id = `device-${device}`;
    deviceCheckbox.name = 'devices[]';
    deviceCheckbox.value = device;
    deviceCheckbox.checked = config.devices?.includes(device) ?? false;

    const deviceLabel = document.createElement('label') as HTMLLabelElement;
    deviceLabel.htmlFor = `device-${device}`;
    deviceLabel.textContent = device;

    devicesDiv!.appendChild(deviceCheckbox);
    devicesDiv!.appendChild(deviceLabel)
    devicesDiv!.appendChild(document.createElement('br'));
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  const config: LocalData = await loadLocalData();
  console.log(config);
  getDevices(config);
  reloadDetails(config);
});

const form = document.querySelector("#address") as HTMLFormElement;
form?.addEventListener("submit", saveConnectionDetails);
const loadButton = document.querySelector("#loadDevices") as HTMLButtonElement
loadButton?.addEventListener("click", getDevices);

