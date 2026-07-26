import browser from "webextension-polyfill";

import { LocalData } from "../../types/local-data";
import { constructBaseUrl } from "../../lib/fetch.ts";

type SelectedDevices = [upload: string[], queue: string[]];

async function saveConnectionDetails(event: SubmitEvent) {
  event.preventDefault();

  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const [upload, queue] = getSelectedDevices();

  await browser.storage?.local.set({
    ip: formData.get("ip"),
    port: formData.get("port"),
    fandom: formData.get("fandom"),
    devices_to_upload_to: upload,
    devices_to_queue: queue
  });
}

function getSelectedDevices(): SelectedDevices {
  const checkedBoxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');

  return Array.from(checkedBoxes).reduce<SelectedDevices>(
    (result, box) => {
      result[box.id.startsWith('upload') ? 0 : 1].push(box.value);
      return result;
    },
    [[], []]
  );
}

async function loadLocalData(): Promise<LocalData | null> {
  const keysToFetch: (keyof LocalData)[] = ['ip', 'port', 'fandom', 'devices_to_upload_to', 'devices_to_queue'];

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
  const uploadDevicesDiv = document.getElementById('uploadDevices') as HTMLDivElement;
  uploadDevicesDiv.replaceChildren();
  const queueDevicesDiv = document.getElementById('queueDevices') as HTMLDivElement;
  queueDevicesDiv.replaceChildren();

  let res: Response;
  if (config && 'ip' in config) {
    console.log(`config exists: ${JSON.stringify(config)}`)
    res = await fetch(`${constructBaseUrl(config.ip, config.port)}/devices`)
  } else {
    console.log("config doesn't exist")
    const ipInput = document.querySelector("#ip") as HTMLInputElement;
    const portInput = document.querySelector("#port") as HTMLInputElement;

    if (ipInput.value && portInput.value) {
      console.log(`Loaded ip: ${ipInput.value}, port: ${portInput.value}`)
      res = await fetch(`${constructBaseUrl(ipInput.value, portInput.value)}/devices`)
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
    deviceCheckbox.id = `upload-device-${device}`;
    deviceCheckbox.name = 'uploadDevices[]';
    deviceCheckbox.value = device;
    deviceCheckbox.checked = config.devices_to_upload_to?.includes(device) ?? false;

    const deviceLabel = document.createElement('label') as HTMLLabelElement;
    deviceLabel.htmlFor = `upload-device-${device}`;
    deviceLabel.textContent = device;

    uploadDevicesDiv!.appendChild(deviceCheckbox);
    uploadDevicesDiv!.appendChild(deviceLabel);
    uploadDevicesDiv!.appendChild(document.createElement('br'));

    const queueDeviceCheckbox = deviceCheckbox.cloneNode(false) as HTMLInputElement;
    queueDeviceCheckbox.id = `queue-device-${device}`;
    queueDeviceCheckbox.name = 'queueDevices[]';
    queueDeviceCheckbox.checked = config.devices_to_queue?.includes(device) ?? false;

    const queueDeviceLabel = deviceLabel.cloneNode(true) as HTMLLabelElement;
    queueDeviceLabel.htmlFor = `queue-device-${device}`;

    queueDevicesDiv!.appendChild(queueDeviceCheckbox);
    queueDevicesDiv!.appendChild(queueDeviceLabel);
    queueDevicesDiv!.appendChild(document.createElement('br'));
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

