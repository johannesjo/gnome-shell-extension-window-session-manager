const St = imports.gi.St;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
//const Extension = ExtensionUtils.getCurrentExtension();
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const HOME_PATH = GLib.get_home_dir();
const LWSM_PATH = HOME_PATH + '/.lwsm';
const LWSM_CFG_FILE_PATH = HOME_PATH + '/.lwsm/config.json';
const LWSM_SESSION_PATH = LWSM_PATH + '/sessionData';
const LWSM_CMD = HOME_PATH + '/.local/share/gnome-shell/extensions/lwsm@johannes.super-productivity.com/lwsm';
const DEFAULT_INDICATOR_TEXT = '';

const WindowSessionIndicator = new Lang.Class({
  Name: 'WindowSessionIndicator',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, 'Window Session Indicator', false);
    this._buildUi();
    this._refresh();
  },

  _buildUi: function () {
    this.statusLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      text: DEFAULT_INDICATOR_TEXT
    });
    this.statusLabel.add_style_class_name('window-session-indicator-label');

    let topBox = new St.BoxLayout();
    //topBox.add_actor(button);
    topBox.add_actor(this.statusLabel);
    this.actor.add_actor(topBox);
    topBox.add_style_class_name('window-session-indicator');

  },

  _createMenu: function () {
    if (this._sessionSection) {
      this._sessionSection.removeAll();
    }

    this._sessionSection = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this._sessionSection);
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
    const item = new PopupMenu.PopupMenuItem('Load ' + fileName);
    item.connect('activate', Lang.bind(this, function () {
      this._restoreSession(fileName);
    }));
    return item;
  },

  _saveSession: function (sessionName) {
    this._ExecLwsm('save', sessionName);
  },

  _restoreSession: function (sessionName) {
    this._ExecLwsm('restore', sessionName);
  },

  _ExecLwsm: function (action, sessionName) {
    const that = this;
    this.statusLabel.set_text(action + ' "' + sessionName + '"');
    let [success, pid] = GLib.spawn_async(null,
      [LWSM_CMD, action, sessionName],
      null,
      GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
      null);

    if (!success) {
      that.statusLabel.set_text('ERROR');
    } else {
      GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function (pid, status) {
        GLib.spawn_close_pid(pid);
        if (status !== 0 && status !== '0') {
          that.statusLabel.set_text('ERROR');
        }
        else {
          that.statusLabel.set_text(DEFAULT_INDICATOR_TEXT);
        }
      });
    }
  },

  _refresh: function () {
    this._createMenu();
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));
    return true;
  },

  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },
  stop: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
    }
    this._timeout = undefined;
    this.menu.removeAll();
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

// HELPER
// ------
function isDirectory(file) {
  return Gio.FileType.DIRECTORY === file.get_file_type();
}