async function showDropdown(source, buttonText, message) {
    download_button = document.getElementById(source + "ButtonText")
    info_dropdown = document.getElementById(source + "dropdown")
    info_dropdown_text = document.getElementById(source + "dropdownInfo")

    download_button.text = buttonText
    info_dropdown_text.innerText = message
    info_dropdown.classList.remove("hidden")
    setTimeout(function() {info_dropdown.classList.add("hidden")}, 10000 )
}

async function downloadUrlWithFandomOverride(AO3Url, source) {
    await downloadUrl(AO3Url, source, true)
}

async function downloadUrl(AO3Url, source, useFandomOverride = false) {
    const res = await browser.storage.local.get()
    const serverIp = `${res.AO3_ip}:${res.AO3_port}`
    const fandomOverride = res.AO3_fandom

    if (res.AO3_ip == '' || res.AO3_ip == undefined) {
        showDropdown(source, "Error", "Server IP is not set")
        return
    }
    else if (res.AO3_port == '' || res.AO3_port == undefined) {
        showDropdown(source, "Error", "Server port is not set")
        return
    }
    else if (!/^\d+$/.test(res.AO3_port)) {
        showDropdown(source, "Error", "Port entered is not valid")
        return
    }
    else if (useFandomOverride && (fandomOverride == '' || fandomOverride == undefined)) {
        showDropdown(source, "Error", "Fandom override is not set")
        return
    }
    
    const download_button = document.getElementById(source + "ButtonText")
    download_button.text = "Downloading"

    const info_dropdown = document.getElementById(source + "dropdown")
    info_dropdown.classList.add("hidden")
    
    let response = {}
    const testing = false
    if (!testing) {
        const body = useFandomOverride ?
            JSON.stringify({
                url: AO3Url,
                fandom_override: fandomOverride
            }) 
        :
            JSON.stringify({
                url: AO3Url
            })
        try {
            response = await fetch(`http://${serverIp}/download`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body,
            });
            console.log(await response);
        } catch (e) {
            console.error(e)
            console.error(`trying to fetch ${serverIp}`)

            if (e instanceof TypeError) {
                if (e.message.startsWith("NetworkError")) {
                    showDropdown(source, "Error", `Cannot connect to server ${serverIp}, check ip and server state`)
                } else {
                    showDropdown(source, "Error", e)
                }
            } else {
                showDropdown(source, "Error", e)
            }
            return
        }
    } else {
        response.status = 503
        response.text = async () => {
            return "test error message"
        }
    }

    switch (response.status) {
        case 200:
            showDropdown(source, "Success", await response.text())
            break;
        default:
            showDropdown(source, "Failed", await response.text())
            break;
    }
}

function removeElementsByClass(className){
    const elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

if (!document.URL.includes("search")) {
    console.log("Adding API download buttons")

    removeElementsByClass("A2O4Button")
    removeElementsByClass("A2O4OButton")

    const navigationButtons = document.getElementsByClassName("work navigation actions")[0] ?? document.getElementsByClassName("navigation actions")[2]

    add_button(navigationButtons, "A2O4", "A2O4", downloadUrl)
    add_button(navigationButtons, "A2O4O", "A2O4 Override", downloadUrlWithFandomOverride)
} else {
    console.log("Wrong Page")
}

// navButtons: Element
// button_name: String
// event_listener: function
function add_button(navButtons, buttonName, text, eventListener) {
    const newButton = document.createElement("li")
    const newButtonText = document.createElement("a")
    const newButtonDropdown = document.createElement("ul")
    const newButtonDropdownInfo = document.createElement("p")

    newButton.className = buttonName + "Button"
    
    newButtonText.text = text
    newButtonText.id = buttonName + "ButtonText"

    newButtonDropdown.className = "expandable secondary hidden"
    newButtonDropdown.id = buttonName + "dropdown"
    
    newButtonDropdownInfo.className = "region"
    newButtonDropdownInfo.id = buttonName + "dropdownInfo"
    newButtonDropdownInfo.style.display = "flex"

    newButtonDropdown.appendChild(newButtonDropdownInfo)
    newButton.appendChild(newButtonText)
    newButton.appendChild(newButtonDropdown)
    newButton.addEventListener("click", () => eventListener(document.URL, buttonName))
    navButtons.appendChild(newButton)
}

