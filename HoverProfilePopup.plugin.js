/**
 * @name HoverProfilePopup
 * @version 1.2.0
 * @author Ra6cool
 * @description Adds status, bio, and game info to the user popout when you hover over their name.
 */

const { Patcher, UI, WebpackModules } = BdApi;
const React = BdApi.React;

module.exports = class HoverProfilePopup {
  constructor() {
    this.pluginName = 'HoverProfilePopup';
    this.popoutModule = null;
  }

  start() {
    this.popoutModule = WebpackModules.find(m => m.default?.displayName === 'UserPopout');
    if (!this.popoutModule) return console.error(this.pluginName, 'UserPopout module not found');
    Patcher.after(this.pluginName, this.popoutModule, 'default', (_this, [props], res) => this.appendInfo(res, props.user.id));
  }

  stop() {
    Patcher.unpatchAll(this.pluginName);
  }

  appendInfo(res, userId) {
    try {
      // Get stores
      const presence = WebpackModules.find(m => m.getStatus && m.getState);
      const userStore = WebpackModules.find(m => m.getUser && m.getCurrentUser);
      if (!presence || !userStore) return;

      // Fetch data
      const presences = presence.getState().presences || {};
      const activities = presences[userId]?.activities || [];
      const games = activities.filter(a => a.type === 0).map(a => a.name).join(', ');
      const status = presence.getStatus(userId) || 'offline';
      const user = userStore.getUser(userId) || {};
      const descMod = WebpackModules.find(m => m.DESCRIPTION);
      const bioField = descMod?.DESCRIPTION;
      const bio = bioField && user[bioField] ? user[bioField] : '';

      // Build extra info component
      const infoBlock = React.createElement('div', { style: { marginTop: '10px', fontSize: '12px', color: 'var(--text-normal)' } },
        React.createElement('div', null, `Status: ${status}`),
        bio && React.createElement('div', { style: { marginTop: '4px' } }, `Bio: ${bio}`),
        games && React.createElement('div', { style: { marginTop: '4px' } }, `Playing: ${games}`)
      );

      // Locate container in popout, e.g., element with class header-2o-2h6 or similar
      const container = BdApi.DOM.query('.container-2o20K2, .header-2k84AM', res);
      if (container && container.parentNode) {
        container.parentNode.appendChild(infoBlock);
      } else {
        // fallback: append to children end
        res.props.children.push(infoBlock);
      }
    } catch (err) {
      console.error(this.pluginName, 'Error appending info', err);
    }
    return res;
  }
};
