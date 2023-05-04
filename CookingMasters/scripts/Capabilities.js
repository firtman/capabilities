import { lightsConnect, turnOn, turnOff } from "./BTLights.js";

export const Capabilities = {
    init: async () => {
        Capabilities.bluetoothConnected = false;
    },
    disconnect: async() => {
        if (Capabilities.wakeLockSentinel) {
            Capabilities.wakeLockSentinel.release();
        }    
        if (Capabilities.recognition) {
            Capabilities.recognition.stop();
        }
        if (Capabilities.bluetoothConnected) {
            turnOff();
        }
    },
    wakeLock: async() => {
        const wakeLock = await navigator.wakeLock.request();
        if (!wakeLock.released) {
            document.querySelector("#wakelock").className="on";
        }

        console.log('State of Wake Lock', wakeLock);
        wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock released:', wakeLock.released);
            document.querySelector("#wakelock").className="off";
        });
        Capabilities.wakeLockSentinel = wakeLock; // we save it for future cancellation
        Capabilities.load();
    },
    bluetooth: async() => {
        if (await lightsConnect()) {
            turnOn();
            document.querySelector("#lights").className="on";
            Capabilities.bluetoothConnected = true;
        }
    },
    say: async(text, lang="en-US") => {
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = text;
        utterance.lang = lang;

        function loadVoices() {
            const voices = speechSynthesis.getVoices().filter(v=>v.lang==lang);
            console.log(voices);
            utterance.voice = voices[0];    
        }
        window.speechSynthesis.onvoiceschanged = function(e) {
            loadVoices();
        };
        speechSynthesis.speak(utterance);
    },
    microphone: async() => {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "en";

        recognition.addEventListener("result", event => {
            if (event.type=="result") {
                let result = event.results[event.results.length-1] 
                const confidence = result[result.length-1].confidence*100;
                const text = result[result.length-1].transcript;
                console.log(`${text}. ${parseInt(confidence)}%.`);
                if (text.endsWith(".")) {
                    text = text.substring(0, text.length-1);
                }
                switch(text.trim().toLowerCase()) {
                    case "hey cooking next":
                        console.log("next")
                        app.cooking.next();
                        break;
                    case "hey cooking previous":
                        app.cooking.previous();
                        break;
                    case "hey cooking exit":
                        app.cooking.end();
                        break;
                    case "hey cooking repeat":
                        app.cooking.sayStep();
                        break;
                    }            
            }
        });
        recognition.addEventListener("start", event => {
            console.log("Speech Recognition started");
            document.querySelector("#speech").className = "on";
            Capabilities.load();
        });
        recognition.addEventListener("stop", event => {
            console.log("Speech Recognition started");
            document.querySelector("#speech").className = "off";
            Capabilities.load();
        });
        recognition.addEventListener("error", event => {
            console.log("Error with speech recognition. ", event)
            document.querySelector("#speech").className = "off";
        });        
        recognition.start();

        Capabilities.recognition = recognition;
    },
    load: async () => {
        async function permissionsAPICheck(permission, elementID) {
            const element = document.getElementById(elementID).querySelector("span");
            const button = document.getElementById(elementID).querySelector("button");
            try {
                const result = await navigator.permissions.query({name: permission});
                switch (result.state) {
                    case "granted": 
                        element.textContent = "✅ OK";
                        break;
                    case "denied":
                        element.textContent = "✋ Denied";
                        if (button) button.hidden = true;
                        break;
                    case "prompt":
                        element.textContent =  "❌ Waiting";
                }
            } catch (e) {
                console.log(e);
                element.textContent = "⛔️ Not supported";
                if (button) button.hidden = true;                           
            }
        }

        if (navigator.permissions) {
            if (Capabilities.wakeLockSentinel && Capabilities.wakeLockSentinel.released==false) {
                document.querySelector("#permissionWL span").innerText = `✅ ON`;
            } else {
                await permissionsAPICheck("screen-wake-lock", "permissionWL"); 
            } 
            if (Capabilities.recognition) {
                console.log(Capabilities.recognition);
                document.querySelector("#permissionWL span").innerText = `✅ ON`;
            } else {
                await permissionsAPICheck("microphone", "permissionMic");  
            }
            await permissionsAPICheck("screen-wake-lock", "permissionWL"); 
        }
        // Gamepad
        let element = document.querySelector("#permissionGP span");
        if ("getGamepads" in navigator) {
            let gamepads =  await navigator.getGamepads();
            if (gamepads[0]!=null) {
                element.textContent = `✅ Connected`;
                document.querySelector("#gamepad").className = "on";
                if (Capabilities.gamepadController==undefined) {
                    let buttons = [false, false, false];
                    let frame = 0;
                    async function gameLoop() {
                        let gamepads =  await navigator.getGamepads();                        
                        if (gamepads[0].buttons[0].pressed==true) buttons[0]=true;
                        if (gamepads[0].axes[0]>0.5) buttons[1]=true;
                        if (gamepads[0].axes[0]<-0.5) buttons[2]=true;
                        frame++;
                        if (frame%60==0) {
                            if (buttons[0]) {
                                app.cooking.end();
                            } else  if (buttons[1]) {
                                app.cooking.next();
                            } else if (buttons[2]) {
                                app.cooking.previous();
                            }                            
                            buttons = [false, false, false];
                        }
                        requestAnimationFrame(gameLoop);
                    }      
                    gameLoop();          }
            } else {
                element.textContent = `❌ Disconnected`;
                document.querySelector("#gamepad").className = "off";
            }
        } else {
            element.textContent = `⛔️ Not supported`;
        }

        // Bluetooth
        element = document.querySelector("#permissionBT span");
        if (navigator.bluetooth && await navigator.bluetooth.getAvailability()) {
            element.textContent = `👉 Ready`;
        } else {
            element.textContent = `⛔️ Not supported`;
            document.querySelector("#permissionBT button").hidden = true;

        }
    }
}

window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad connected")
    Capabilities.load(); 
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Gamepad disconnected")
    Capabilities.load();
});