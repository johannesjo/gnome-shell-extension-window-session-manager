'use strict';

const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;

const Gettext = imports.gettext.domain('lwsm');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;
const Gsettings = Lib.getSettings(Me);

const Settings = {
  'lwsmpath': {
    type: "s",
    tab: "i",
    placeholder_text: "/path/to/lwsm",
    label: _("Path to lwsm"),
    help: _("Please enter the full path to the lwsm executable")
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

    this.pack_start(label, true, true, 0);
    this.pack_end(widget, true, true, 0);
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
    let frame = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      border_width: 10, margin: 20
    });
    const introText = new Gtk.Label({
      label: 'If not done already you need to manually install lwsm globally via npm (nodejs needs to be installed). you can run: \n\nnpm install -g lwsm\n\nfrom your command line to do so. After installation you can check the path via: \n\nwhich lwsm',
      xalign: 0,
      wrap: true,
    });

    this.pack_start(introText, false, false, 20);

    frame.show_all();

    let settingsBox;

    for (let setting in Settings) {
      settingsBox = new SettingsBox(setting);
      this.pack_start(settingsBox, false, false, 20);
    }

    const linkBtn = new Gtk.LinkButton({
      uri: 'https://github.com/johannesjo/gnome-shell-extension-window-session-manager',
      label: 'For more information and help check out the github page'
    });
    this.pack_end(linkBtn, false, false, 20);
  }
});

function init() {
  //Lib.initTranslations(Me);
  //Lib.addIcon(Me);
}

function buildPrefsWidget() {
  let widget = new PrefsWidget();
  widget.show_all();
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