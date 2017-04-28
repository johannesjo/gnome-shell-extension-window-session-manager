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
    this.lwsmSessionDir = Gio.file_new_for_path(LWSM_SESSION_PATH);

    // read files
    this.fileList = [];
    const enumeratedChildren = this.lwsmSessionDir.enumerate_children('*', 0, null, null);
    let fileInfo;
    while ((fileInfo = enumeratedChildren.next_file(null, null)) !== null) {
      if (!fileInfo.get_is_hidden() && !isDirectory(fileInfo)) {
        this.fileList.push(fileInfo);
      }
    }
    enumeratedChildren.close(null, null);

    // if nothing changed don't refresh menu
    if (this.fileListBefore && this.fileListBefore.length === this.fileList.length) {
      return;
    }

    // remove previous session section
    if (this._sessionSection) {
      this._sessionSection.removeAll();
    }

    // create new session section and menu
    this._sessionSection = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this._sessionSection);

    const that = this;
    this.fileList.forEach(Lang.bind(this, function (file) {
      that._sessionSection.addMenuItem(this._createMenuItem(file));
    }));
    that._sessionSection.addMenuItem(this._createNewSessionItem())
    this.fileListBefore = this.fileList;
  },

  _createNewSessionItem: function () {
    const item = new PopupMenu.PopupMenuItem('', {
      activate: false,
      reactive: true,
      can_focus: false,
    });
    const itemActor = item.actor;
    const that = this;
    //this._entry.clutter_text.connect('text-changed', Lang.bind(this, this._onTextChanged));
    // add main session label
    itemActor.add(new St.Entry({
      name: 'NewItemInput',
      style_class: 'new-item-input',
      track_hover: true,
      reactive: true,
      can_focus: true,
    }), {
      expand: true
    });

    // add icon
    itemActor.add(new St.Icon({
      icon_name: 'document-save-symbolic',
      style_class: 'popup-menu-icon-save'
    }));
    //.get_text()
    item.connect('activate', Lang.bind(that, function () {
      that._restoreSession(fileName);
    }));

    return item;
  },

  _createNewSession: function () {

  },

  _createMenuItem: function (fileInfo) {
    const fileName = fileInfo.get_display_name().replace('.json', '');
    const item = new PopupMenu.PopupMenuItem('');
    const itemActor = item.actor;
    const that = this;

    // add main session label and icon
    itemActor.add(new St.Icon({
      icon_name: 'media-playback-start-symbolic',
      style_class: 'popup-menu-icon-play',
    }));
    itemActor.add(new St.Label({ text: fileName }), { expand: true });

    // add save button
    let _saveBtn = new St.Button({
      reactive: true,
      can_focus: true,
      x_fill: true,
    });
    _saveBtn.child = new St.Icon({
      icon_name: 'document-save-symbolic',
      style_class: 'popup-menu-icon-save',
    });
    _saveBtn.connect('clicked', Lang.bind(that, function () {
      that._saveSession(fileName);
      return Clutter.EVENT_STOP;
    }));
    itemActor.add(_saveBtn, {
      x_align: St.Align.END,
    });

    // add remove button
    let _removeBtn = new St.Button({
      reactive: true,
      can_focus: true,
      x_fill: true,
    });
    _removeBtn.child = new St.Icon({
      icon_name: 'edit-delete-symbolic',
      style_class: 'popup-menu-icon-delete'
    });
    _removeBtn.connect('clicked', Lang.bind(that, function () {
      that._removeSession(fileName, function () {
        that._refresh();
      });
      return Clutter.EVENT_STOP;
    }));
    itemActor.add(_removeBtn, {
      x_align: St.Align.END,
    });

    item.connect('activate', Lang.bind(that, function () {
      that._restoreSession(fileName);
    }));
    return item;
  },

  _saveSession: function (sessionName, cb) {
    this._execLwsm('save', sessionName, cb);
  },

  _restoreSession: function (sessionName, cb) {
    this._execLwsm('restore', sessionName, cb);
  },

  _removeSession: function (sessionName, cb) {
    this._execLwsm('remove', sessionName, cb);
  },

  _execLwsm: function (action, sessionName, cb) {
    const that = this;
    this.statusLabel.set_text(action + ' "' + sessionName + '"');
    let [success, pid] = GLib.spawn_async(
      null,
      [LWSM_CMD, action, sessionName],
      null,
      GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
      null
    );

    if (!success) {
      that.statusLabel.set_text('ERROR');
    } else {
      GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function (pid, status) {
        GLib.spawn_close_pid(pid);
        if (status !== 0 && status !== '0') {
          global.log('lwsm', action, sessionName, 'UNKNOWN ERROR');
          that.statusLabel.set_text('ERROR');
        }
        else {
          that.statusLabel.set_text(DEFAULT_INDICATOR_TEXT);
          if (cb) {
            cb();
          }
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