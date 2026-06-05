import browser from "webextension-polyfill";

import { LocalData } from "../../types/local-data";

async function saveConnectionDetails(event: SubmitEvent) {
  event.preventDefault();

  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  console.log(`saving ip: ${formData.get("ip")}`)

  await browser.storage?.local.set({
    ip: formData.get("ip"),
    port: formData.get("port"),
    fandom: formData.get("fandom"),
    devices: getSelectedDevices(),
  });
}

function getSelectedDevices(): string[] {
  const checkedBoxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
  return Array.from(checkedBoxes).map((cb) => cb.value);
}

async function restoreConnectionDetails(): Promise<LocalData> {
  const res = await browser.storage?.local.get() as LocalData;
  const ipInput = document.querySelector("#ip") as HTMLInputElement;
  const portInput = document.querySelector("#port") as HTMLInputElement;
  const fandomInput = document.querySelector("#fandom") as HTMLInputElement;

  ipInput.value = res?.ip ?? ''
  portInput.value = res?.port ?? ''
  fandomInput.value = res?.fandom ?? ''
  return res;
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
  let config: LocalData = await restoreConnectionDetails();
  console.log(config);
  //TODO catch undefined
  getDevices(config);
});

const form = document.querySelector("#address") as HTMLFormElement;
form?.addEventListener("submit", saveConnectionDetails);

