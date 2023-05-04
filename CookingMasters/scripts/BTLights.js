let device = null;
const serviceId = "00010203-0405-0607-0809-0a0b0c0d1910";
const characteristicId = "00010203-0405-0607-0809-0a0b0c0d2b11";

export async function lightsConnect() {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [
                {namePrefix: 'Govee'}
            ],
            optionalServices: [serviceId],
            // acceptAllDevices: true,
            // filters: [{ name: 'Govee_H6053_2E94' }]
        });
        // console.log(device);

        return true;
    } catch (e) {
        return false;
    }
}

export async function turnOn() {
    writeData("3301010000000000000000000000000000000033");
}

export async function turnOff() {
    writeData("3301000000000000000000000000000000000032");
}

export async function moreBrightness() {
    writeData("33042e0000000000000000000000000000000019");
}

export async function lessBrightness() {
    writeData("3304140000000000000000000000000000000023");
}


async function writeData(hexString) {
    const server = await device.gatt.connect(); 

    const service = await server.getPrimaryService(serviceId);
    const characteristic = await service.getCharacteristic(characteristicId);

    console.log(`Writing ${hexString}`);
    const byteArrayLength = hexString.length / 2;
    const byteArray = new Uint8Array(byteArrayLength);

    for (let i = 0; i < byteArrayLength; i++) {
        const byte = hexString.substr(i * 2, 2);
        byteArray[i] = parseInt(byte, 16);
    }

    const value = new Uint8Array(byteArray);

    characteristic.writeValue(value);

}

async function test() {
 
    const service = await server.getPrimaryService(serviceId);
    // console.log(service);

    const characteristic = await service.getCharacteristic(characteristicId);
    // console.log(characteristic);
            
    const options = 
           ["3301010000000000000000000000000000000033", // on
            "330912320503000000000000000000000000001c", //
            "3309123211030000000000000000000000000008", //
            "3301000000000000000000000000000000000032", // off
            "3301010000000000000000000000000000000033", //
            "330502ff000000ff8912000000000000000000af", //
            "33050200ff0000ff8912000000000000000000af", //
            "3305020000ff00ff8912000000000000000000af", //
            "330502ffff0000ff891200000000000000000050", //
            "3305028b00ff00ff891200000000000000000024", //
            "33050200ffff00ff891200000000000000000050", //
            "33047f0000000000000000000000000000000048", //
            "33042e0000000000000000000000000000000019", // más brillo
            "3304140000000000000000000000000000000023", // menos brillo
            "3304fe00000000000000000000000000000000c9", //
            "330502ffffff01d7e2ff00000000000000000000", //
            "330502ffffff01ff932c0000000000000000008a", //
            "3301000000000000000000000000000000000032"] // OFF

    for (let i=0; i<options.length; i++) {
        let hexString = options[i];
        setTimeout(() => {
            console.log(`Writing ${hexString}`);
            const byteArrayLength = hexString.length / 2;
            const byteArray = new Uint8Array(byteArrayLength);
        
            for (let i = 0; i < byteArrayLength; i++) {
                const byte = hexString.substr(i * 2, 2);
                byteArray[i] = parseInt(byte, 16);
            }
        
            const value = new Uint8Array(byteArray);
        
            characteristic.writeValue(value);
    
        }, parseInt(i*1000));
    }

    // const hexString = "3304fe00000000000000000000000000000000c9";
                //    "330414000000000000000000000000000023";


    // const services = await server.getPrimaryServices();
    // services.forEach(async service =>  {
    //     console.log('> Service: ' + service.uuid);
    //     const characteristics = await service.getCharacteristics();
    //     characteristics.forEach(characteristic => {
    //     console.log('>> Characteristic: ' + characteristic.uuid + ' ' +
    //         getSupportedProperties(characteristic));
    //     });
    // });
};

function getSupportedProperties(characteristic) {
  let supportedProperties = [];
  for (const p in characteristic.properties) {
    if (characteristic.properties[p] === true) {
      supportedProperties.push(p.toUpperCase());
    }
  }
  return '[' + supportedProperties.join(', ') + ']';
}
