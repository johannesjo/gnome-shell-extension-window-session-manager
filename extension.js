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
    //button.connect('button-press-event', _showHello);
    let topBox = new St.BoxLayout();
    topBox.add_actor(button);
    topBox.add_actor(this.statusLabel);
    this.actor.add_actor(topBox);

    this._sessionItems = [];
    this._sessionSection = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this._sessionSection);
    global.log('super,TEST--------------------------------------------------------------------------');
    this._createMenuItems();
  },

  _createMenuItems: function () {
    const HOME_PATH = GLib.get_home_dir();
    const LWSM_SESSION_PATH = HOME_PATH + '/.lwsm/sessionData';
    this.lwsmSessionDir = Gio.file_new_for_path(LWSM_SESSION_PATH);
    this.current_dir = this.lwsmSessionDir;
    const enumeratedChildren = this.current_dir.enumerate_children('*', 0, null, null);
    this.processDirectory(enumeratedChildren);
    global.log('super', this.current_dir);
    global.log('super', enumeratedChildren);

    const list = [
      'YEEE',
      'sdfsd',
      'dfgdfgdfg',
    ];
    for (let i = 0; i < list.length; i++) {
      let listItem = list[i];
      this._sessionItems[i] = new PopupMenu.PopupMenuItem(HOME_PATH + listItem);
      this._sessionSection.addMenuItem(this._sessionItems[i]);
      //this._sessionItems[i].connect('activate', Lang.bind(this, function (actor) {
      //  this._activate(actor);
      //}));
    }
  },

  processDirectory: function (children) {
    let files = [];
    let dirs = [];
    let fileInfo = null;
    while ((fileInfo = children.next_file(null, null)) !== null) {
      if (!fileInfo.get_is_hidden() && !isDirectory(fileInfo)) {
        files.push(fileInfo);
      }
    }
    children.close(null, null);
    global.log('super', files);

    //files.sort(fileComparator);
    //files.forEach(Lang.bind(this, function (fi) {
    //  this.filesList.addMenuItem(this.createItem(fi));
    //}));
  },

  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));
    return true;
  },

  _loadData: function () {
    let params = {
      amount: '1000',
      sourceCurrency: 'CHF',
      targetCurrency: 'EUR'
    };
    _httpSession = new Soup.Session();
    let message = Soup.form_request_new_from_hash('GET', TW_URL, params);
    message.request_headers.append('X-Authorization-key', TW_AUTH_KEY);
    _httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
        if (message.status_code !== 200)
          return;
        let json = JSON.parse(message.response_body.data);
        this._refreshUI(json);
      }
      )
    );
  },

  _refreshUI: function (data) {
    let txt = data.transferwisePayOut.toString();
    txt = txt.substring(0, 6) + ' CHF';
    global.log(txt);
    this.buttonText.set_text(txt);
  },

  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (_httpSession !== undefined)
      _httpSession.abort();
    _httpSession = undefined;

    if (this._timeout)
      Mainloop.source_remove(this._timeout);
    this._timeout = undefined;

    this.menu.removeAll();
  }
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