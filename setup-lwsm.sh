#!/usr/bin/env bash

mkdir ~/.lwsm
mkdir ~/.lwsm/sessionData/

cmd_output=$(npm install -q -g linux-window-session-manager 2>&1)
if [ $? -eq 0 ]; then
    notify-send "Installed lwsm and created directories"
else
    notify-send "Failed to install lwsm" "Please install linux-window-session-manager manually via 'npm install -g linux-window-session-manager'. LOG: $cmd_output."
fi