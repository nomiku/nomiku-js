
/**
 * The Device object manages the state of an individual device
 *
 * @constructor
 *
 * @param {string} hwid The hardware ID of the device
 */

function Device(hwid) {
  if (!(this instanceof Device)) {
    return new Device(options);
  }

  this.hwid = hwid;
}

module.exports = Device
