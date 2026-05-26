#pragma once

// Firmware-facing card metadata boundary. Card behavior stays in the existing
// card files; shared identity, defaults, families, and capability checks flow
// through this helper.

#include "button_grid_contract_generated.h"

inline const char *card_runtime_label(const std::string &type) {
  return card_contract_card_label(type);
}

inline bool card_runtime_allow_in_subpage(const std::string &type) {
  return card_contract_allow_in_subpage(type);
}

inline const char *card_runtime_default_icon_name(const std::string &type) {
  return card_contract_default_icon_name(type);
}

inline const char *card_runtime_default_icon_on_name(const std::string &type) {
  return card_contract_default_icon_on_name(type);
}

inline bool card_runtime_brightness_slider_type(const std::string &type) {
  return card_contract_is_brightness_slider_type(type);
}

inline bool card_runtime_fan_card_type(const std::string &type) {
  return card_contract_is_fan_card_type(type);
}

inline const char *card_runtime_fan_default_icon_name(const std::string &type) {
  return card_contract_fan_default_icon_name(type);
}

inline const char *card_runtime_fan_default_icon_on_name(const std::string &type) {
  return card_contract_fan_default_icon_on_name(type);
}

inline bool card_runtime_option_select_action(const std::string &action) {
  return card_contract_is_option_select_action(action);
}

inline const char *card_runtime_option_select_canonical_action() {
  return CARD_CONTRACT_OPTION_SELECT_ACTION;
}

inline bool card_runtime_large_numbers_supported(const std::string &type,
                                                 const std::string &precision) {
  return card_contract_large_numbers_supported(type, precision);
}
