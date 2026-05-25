// ── Backup contract ───────────────────────────────────────────────────

var BACKUP_CONFIG_VERSION = 2;
var BACKUP_FORMAT = "espcontrol.backup";

function backupConfigError(message) {
  var err = new Error(message);
  err.backupMessage = message;
  return err;
}

function backupEmptyButtonConfig() {
  return EspControlModel.emptyCardConfig();
}

function backupNormalizeButtonConfig(button) {
  return normalizeButtonConfig(EspControlModel.cloneCardConfig(button || {}));
}

function backupSerializeGrid(grid, sizes) {
  return EspControlModel.serializeGridOrder(grid, sizes || {});
}

function backupSerializeSubpages(subpages) {
  var out = {};
  subpages = subpages || {};
  for (var key in subpages) {
    var sp = subpages[key];
    if (!sp) continue;
    var hasButtons = sp.buttons && sp.buttons.length > 0;
    var hasOrder = (sp.order && sp.order.length > 0) || (sp.grid && sp.grid.length > 0);
    if (hasButtons || hasOrder) out[key] = serializeSubpageConfig(sp);
  }
  return out;
}

function backupSource(data, slots) {
  var source = data && data.source && typeof data.source === "object" ? data.source : {};
  return {
    device: String(source.device || data.device || ""),
    slots: parseInt(source.slots, 10) || slots || 0,
  };
}

function createBackupConfig(snapshot) {
  snapshot = snapshot || {};
  var buttons = (snapshot.buttons || []).map(backupNormalizeButtonConfig);
  var slots = parseInt(snapshot.slots, 10) || buttons.length;
  return {
    version: BACKUP_CONFIG_VERSION,
    format: BACKUP_FORMAT,
    device: snapshot.device || "",
    source: {
      device: snapshot.device || "",
      slots: slots,
    },
    exported_at: snapshot.exported_at || new Date().toISOString(),
    button_order: snapshot.button_order != null
      ? String(snapshot.button_order)
      : backupSerializeGrid(snapshot.grid || [], snapshot.sizes || {}),
    button_on_color: snapshot.button_on_color || "FF8C00",
    button_off_color: snapshot.button_off_color || "313131",
    sensor_card_color: snapshot.sensor_card_color || "212121",
    buttons: buttons,
    subpages: backupSerializeSubpages(snapshot.subpages),
    settings: snapshot.settings || {},
    screen: snapshot.screen || {},
  };
}

function normalizeBackupConfig(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw backupConfigError("Invalid config file - backup must be a JSON object");
  }

  var version = parseInt(data.version, 10);
  if (!version || version < 1) {
    throw backupConfigError("Invalid config file - missing required fields");
  }
  if (version > BACKUP_CONFIG_VERSION) {
    throw backupConfigError("Backup was created by a newer version of EspControl");
  }
  if (version >= 2 && data.format !== BACKUP_FORMAT) {
    throw backupConfigError("Invalid config file - unsupported backup format");
  }
  if (!Array.isArray(data.buttons)) {
    throw backupConfigError("Invalid config file - missing required fields");
  }

  var buttons = data.buttons.map(backupNormalizeButtonConfig);
  var subpages = {};
  if (data.subpages && typeof data.subpages === "object") {
    for (var key in data.subpages) {
      var parsed = parseSubpageConfig(String(data.subpages[key] || ""));
      subpages[key] = serializeSubpageConfig(parsed);
    }
  }

  return {
    version: BACKUP_CONFIG_VERSION,
    format: BACKUP_FORMAT,
    device: String(data.device || ""),
    source: backupSource(data, buttons.length),
    exported_at: data.exported_at || "",
    button_order: String(data.button_order || ""),
    button_on_color: data.button_on_color || "FF8C00",
    button_off_color: data.button_off_color || "313131",
    sensor_card_color: data.sensor_card_color || "212121",
    buttons: buttons,
    subpages: subpages,
    settings: data.settings && typeof data.settings === "object" ? data.settings : null,
    screen: data.screen && typeof data.screen === "object"
      ? data.screen
      : (data.settings && data.settings.screen && typeof data.settings.screen === "object"
        ? data.settings.screen
        : null),
  };
}

function backupOrderUsedSlots(order, importedCount) {
  return EspControlModel.backupOrderUsedSlots(order, importedCount);
}

function backupPlaceSlotAt(grid, slot, pos, size, maxSlots) {
  EspControlModel.backupPlaceSlotAt(grid, slot, pos, size, maxSlots, GRID_COLS);
}

function planBackupImport(data, targetDevice) {
  var config = normalizeBackupConfig(data);
  targetDevice = targetDevice || {};
  var targetSlots = parseInt(targetDevice.slots, 10) || NUM_SLOTS;
  var targetDeviceId = targetDevice.device || DEVICE_ID;
  var importedCount = config.buttons.length;
  var warnings = [];

  if (config.device && config.device !== targetDeviceId) {
    warnings.push("Config was exported from a different panel (" + config.device + ") - layout may look different");
  }
  if (importedCount !== targetSlots) {
    warnings.push("Backup has " + importedCount + " slots, current config has " + targetSlots + " - adapting");
  }

  var layoutPlan = EspControlModel.planBackupButtonLayout(
    config.buttons,
    config.button_order,
    targetSlots,
    GRID_COLS
  );

  var subpages = {};
  for (var sourceKey in config.subpages) {
    var mappedKey = layoutPlan.slotMap[sourceKey];
    if (!mappedKey) continue;
    var subpage = parseSubpageConfig(config.subpages[sourceKey]);
    subpage.sizes = {};
    buildSubpageGrid(subpage);
    subpages[String(mappedKey)] = subpage;
  }

  return {
    config: config,
    warnings: warnings,
    importedCount: importedCount,
    buttons: layoutPlan.buttons.map(backupNormalizeButtonConfig),
    button_order: layoutPlan.button_order,
    importedSizes: layoutPlan.importedSizes,
    subpages: subpages,
    settings: config.settings,
    screen: config.screen,
  };
}
