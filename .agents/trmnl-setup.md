# TRMNL Internal Dev Setup

Internal notes for getting the TRMNL 7.5 OG screen working from this project.

## Hardware

- TRMNL 7.5 OG with ESP32-S3 and a 7.5-inch 800x480 monochrome e-paper panel.
- Use a USB-C data cable. Charge-only cables will not flash firmware.
- On macOS, the serial port usually appears as `/dev/cu.usbmodem...`.

## Build Latest Factory Firmware

Run this from the project root:

```sh
docker run --rm -v "$PWD:/config" ghcr.io/esphome/esphome:stable compile /config/builds/trmnl-75-og.factory.yaml
```

The factory binary is written to:

```text
builds/.esphome/build/trmnl-75-og/.pioenvs/trmnl-75-og/firmware.factory.bin
```

## Flash Over USB

Find the connected serial port:

```sh
ls /dev/cu.*
```

Flash the firmware, replacing the port if needed:

```sh
esptool.py --chip esp32s3 --port /dev/cu.usbmodem2012301 --baud 460800 --before default_reset --after hard_reset write_flash -z 0x0 builds/.esphome/build/trmnl-75-og/.pioenvs/trmnl-75-og/firmware.factory.bin
```

A good flash ends with data verification and a hard reset.

## First Boot

- If no WiFi credentials are saved, the device starts the ESPHome setup access point.
- Join the setup network, enter WiFi credentials, and wait for the device to reboot.
- Add the device in Home Assistant through the ESPHome integration.
- Open the device web page from its local IP address to configure cards.

## Project Files

- Factory build: `builds/trmnl-75-og.factory.yaml`
- Device package: `devices/trmnl-75-og/packages.yaml`
- Device YAML: `devices/trmnl-75-og/device/device.yaml`
- Web UI bundle: `docs/public/webserver/trmnl-75-og/www.js`
- Shared button renderer: `components/espcontrol/button_grid_*.h`

## Dev Notes

- The TRMNL should use the same button-grid layout code as the other devices, with TRMNL-specific theme values.
- Weather forecast cards need Home Assistant action permission. If forecast values stay as `--/--`, check the Home Assistant actions setup.
- E-paper refresh is batched. Use the Home Assistant `Refresh Display` control when checking visual changes.

## Useful Checks

```sh
python3 scripts/check_device_profiles.py
python3 scripts/check_firmware_parser.py
python3 scripts/check_firmware_ha_bindings.py
node scripts/check_config_formats.js
node scripts/check_web_smoke.js
npm run docs:build
```
