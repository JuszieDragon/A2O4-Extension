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

const loadLocalData = (): Promise<LocalData> => browser.storage?.local.get() as Promise<LocalData>;

function reloadDetails(config: LocalData): void {
  const ipInput = document.querySelector("#ip") as HTMLInputElement;
  const portInput = document.querySelector("#port") as HTMLInputElement;
  const fandomInput = document.querySelector("#fandom") as HTMLInputElement;

  ipInput.value = config?.ip ?? '';
  portInput.value = config?.port ?? '';
  fandomInput.value = config?.fandom ?? '';
}

async function getDevices(config: LocalData) {
  const devicesDiv = document.getElementById('devices') as HTMLDivElement;

  const res: Response = await fetch(`http://${config.ip}:${config.port}/devices`);
  const devices: string[] = await res.json();
  console.log(res)
  console.log(devices)

  devices.forEach(device => {
    const deviceCheckbox = document.createElement('input') as HTMLInputElement;
    deviceCheckbox.type = 'checkbox';
    deviceCheckbox.id = `device-${device}`;
    deviceCheckbox.name = 'devices[]';
    deviceCheckbox.value = device;
    deviceCheckbox.checked = config.devices.includes(device);

    const deviceLabel = document.createElement('label') as HTMLLabelElement;
    deviceLabel.htmlFor = `device-${device}`;
    deviceLabel.textContent = device;

    devicesDiv!.appendChild(deviceCheckbox);
    devicesDiv!.appendChild(deviceLabel)
    devicesDiv!.appendChild(document.createElement('br'));
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  let config: LocalData = await loadLocalData();
  console.log(config);
  getDevices(config);
  reloadDetails(config);
});

const form = document.querySelector("#address") as HTMLFormElement;
form?.addEventListener("submit", saveConnectionDetails);

