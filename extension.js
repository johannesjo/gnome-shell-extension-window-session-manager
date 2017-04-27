const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
//const Extension = ExtensionUtils.getCurrentExtension();
const GLib = imports.gi.GLib;

// this produces errors
//const GFile = imports.gi.GFile;
const Gio = imports.gi.Gio;
const FileUtils = imports.misc.fileUtils;

const TW_URL = 'https://transferwise.com/api/v1/payment/calculate';
const TW_AUTH_KEY = 'dad99d7d8e52c2c8aaf9fda788d8acdc';

let _httpSession;
const WindowSessionIndicator = new Lang.Class({
  Name: 'WindowSessionIndicator',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, 'Window Session Indicator', false);
    this._buildUi();
    //this._refresh();
  },

  _buildUi: function () {
    let button = new St.Bin({
      style_class: 'panel-button',
      reactive: true,
      can_focus: true,
      x_fill: true,
      y_fill: false,
      track_hover: true
    });
    let icon = new St.Icon({
      icon_name: 'system-run-symbolic',
      style_class: 'system-status-icon'
    });
    button.set_child(icon);

    this.statusLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      text: 'XXXXXXxsxsxs'
    });
    let topBox = new St.BoxLayout();
    topBox.add_actor(button);
    //topBox.add_actor(this.statusLabel);
    this.actor.add_actor(topBox);

    this._sessionItems = [];
    this._sessionSection = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this._sessionSection);
    global.log('super, SUPER--------------------------------------------------------------------------');
    this._createMenuItems();
  },

  _createMenuItems: function () {
    const HOME_PATH = GLib.get_home_dir();
    const LWSM_SESSION_PATH = HOME_PATH + '/.lwsm/sessionData';
    this.lwsmSessionDir = Gio.file_new_for_path(LWSM_SESSION_PATH);
    const enumeratedChildren = this.lwsmSessionDir.enumerate_children('*', 0, null, null);

    let fileInfo;
    let files = [];
    while ((fileInfo = enumeratedChildren.next_file(null, null)) !== null) {
      if (!fileInfo.get_is_hidden() && !isDirectory(fileInfo)) {
        files.push(fileInfo);
      }
    }
    enumeratedChildren.close(null, null);

    files.forEach(Lang.bind(this, function (file) {
      this._sessionSection.addMenuItem(this.createItem(file));
    }));
  },

  createItem: function (fileInfo) {
    const fileName = fileInfo.get_display_name().replace('.json', '');
    const item = new PopupMenu.PopupMenuItem(fileName);
    item.connect('activate', Lang.bind(this, function () {
      this._activateSession(fileName);
    }));
    return item;
  },

  _activateSession: function (sessionName) {
    global.log('super', sessionName);
  },
});

let wsMenu;

function init() {
}

function enable() {
  wsMenu = new WindowSessionIndicator;
  Main.panel.addToStatusArea('ws-indicator', wsMenu);
}

function disable() {
  wsMenu.stop();
  wsMenu.destroy();
}

function isDirectory(file) {
  return Gio.FileType.DIRECTORY === file.get_file_type();
}