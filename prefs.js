'use strict';

const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;

const Gettext = imports.gettext.domain('lwsm');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;
const Gsettings = Lib.getSettings(Me);

// Add a child to a box, in either Gtk3 or Gtk4
function safe_append(box, child, expand, padding, end) {
  let horiz = (box.orientation == Gtk.Orientation.HORIZONTAL);
  if (end) {
    child[horiz ? 'halign' : 'valign'] = Gtk.Align.END;
  }
  if (box.pack_start) {
    box[end ? 'pack_end' : 'pack_start'](child, expand, expand, padding);
  } else {
    if (expand) {
      child[horiz ? 'hexpand' : 'vexpand'] = true;
    }
    if (padding) {
      child[horiz ? 'margin_left' : 'margin_top'] = padding;
      child[horiz ? 'margin_right' : 'margin_bottom'] = padding;
    }

    box.append(child);
  }
}

const Settings = {
  'lwsmpath': {
    type: "s",
    tab: "i",
    placeholder_text: "/path/to/lwsm",
    label: _("Path to lwsm"),
    help: _("Please enter the full path to the lwsm executable")
  },
  'auto-restore-enabled': {
    type: "b",
    tab: "i",
    label: _("Do you want your session to be auto restored?"),
  },
  'auto-restore-session-name': {
    type: "s",
    tab: "i",
    placeholder_text: 'DEFAULT',
    label: _("Which session name do you want to auto restore?"),
  },
};

const Frame = new GObject.Class({
  Name: 'Frame',
  GTypeName: 'Frame',
  Extends: Gtk.Box,

  _init: function(title) {
    this.parent({
      orientation: Gtk.Orientation.VERTICAL,
      margin_bottom: 6,
      margin_start: 6,
      margin_end: 6,
      hexpand: true,
      vexpand: true
    });
  }
});

const SettingsLabel = new GObject.Class({
  Name: 'SettingsLabel',
  GTypeName: 'SettingsLabel',
  Extends: Gtk.Label,

  _init: function(label) {
    this.parent({
      label: label,
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.START
    });
  }
});

const SettingsBox = new GObject.Class({
  Name: 'SettingsBox',
  GTypeName: 'SettingsBox',
  Extends: Gtk.Box,

  _init: function(setting) {
    this.parent({
      orientation: Gtk.Orientation.HORIZONTAL,
      margin_top: 6,
      margin_bottom: 6,
      margin_start: 12,
      margin_end: 12
    });

    let label = new SettingsLabel(Settings[setting].label);

    let toolTip = Settings[setting].help;

    if (toolTip) {
      this.set_tooltip_text(toolTip);
    }

    let widget;

    if (Settings[setting].type === 's') {
      widget = new SettingsEntry(setting);
    }
    if (Settings[setting].type === 'b') {
      widget = new SettingsSwitch(setting);
    }

    safe_append(this, label, true, 20, false);
    safe_append(this, widget, true, 20, true);
  }
});

const SettingsSwitch = new GObject.Class({
  Name: 'SettingsSwitch',
  GTypeName: 'SettingsSwitch',
  Extends: Gtk.Switch,

  _init: function(setting) {
    let active = Gsettings.get_boolean(setting);

    this.parent({
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.END,
      active: active
    });

    Gsettings.bind(
      setting,
      this,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );
  }
});

const SettingsEntry = new GObject.Class({
  Name: 'SettingsEntry',
  GTypeName: 'SettingsEntry',
  Extends: Gtk.Entry,

  _init: function(setting) {
    let text = Gsettings.get_string(setting);

    this.parent({
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.END,
      width_chars: 60,
      text: text
    });

    let placeholder_text = Settings[setting].placeholder_text;

    if (placeholder_text) {
      this.set_placeholder_text(placeholder_text);
    }

    Gsettings.bind(
      setting,
      this,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    );
  }
});

const PrefsWidget = new GObject.Class({
  Name: 'PrefsWidget',
  GTypeName: 'PrefsWidget',
  Extends: Frame,

  _init: function() {
    this.parent();

    const introText = new Gtk.Label({
      label: 'If not done already you need to manually install lwsm globally via npm (nodejs needs to be installed). you can run: \n\nnpm install -g linux-window-session-manager\n\nfrom your command line to do so. After installation you can check the path via: \n\nwhich lwsm',
      xalign: 0,
      wrap: true,
    });

    safe_append(this, introText, false, 20, false);

    let settingsBox;
    for (let setting in Settings) {
      settingsBox = new SettingsBox(setting);
      safe_append(this, settingsBox, false, 20, false);
    }

    const linkBtn = new Gtk.LinkButton({
      uri: 'https://github.com/johannesjo/gnome-shell-extension-window-session-manager',
      label: 'For more information and help check out the github page'
    });
    safe_append(this, linkBtn, true, 20, true);
  }
});

function init() {
  //Lib.initTranslations(Me);
  //Lib.addIcon(Me);
}

function buildPrefsWidget() {
  let widget = new PrefsWidget();
  if (widget.show_all) {
    widget.show_all(); // Gtk3
  }
  return widget;
}

// NOTE: Maybe later we add this
// function installDependencies() {
//  function _runCmd(cmd) {
//    try {
//      Main.Util.trySpawnCommandLine(cmd);
//    } catch (e) {
//      Main.notify(e.toString());
//      global.log(e.toString());
//    }
//  }
//  _runCmd('sh ' + SETUP_SH_PATH);
//}
