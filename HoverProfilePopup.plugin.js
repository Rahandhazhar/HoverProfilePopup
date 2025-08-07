/**
 * @name HoverProfileTooltip
 * @version 1.0.0
 * @author Ra6cool
 * @description Shows a tooltip with a user's status, bio, and games when hovering over their username in chat, without clicking their profile.
 */

module.exports = (() => {
  const config = {
    info: {
      name: 'HoverProfileTooltip',
      authors: [{ name: 'Ra6cool' }],
      version: '1.0.0',
      description: 'Shows a tooltip with a user\'s status, bio, and games when hovering over their username in chat.',
      github: 'https://github.com/Rahandhazhar/HoverProfilePopup',
      github_raw: 'https://raw.githubusercontent.com/Rahandhazhar/HoverProfilePopup/master/HoverProfileTooltip.plugin.js'
    }
  };

  return (!global.ZeresPluginLibrary) ? class {
    constructor() { this._config = config; }
    getName() { return config.info.name; }
    getAuthor() { return config.info.authors.map(a => a.name).join(', '); }
    getVersion() { return config.info.version; }
    load() {
      BdApi.showConfirmationModal(
        'ZeresPluginLibrary Missing',
        `The library plugin needed for ${config.info.name} is missing. Please download it from the BetterDiscord library.`,
        {
          confirmText: 'Download Now',
          cancelText: 'Cancel',
          onConfirm: () => require('request').get(
            'https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js',
            (err, res, body) => {
              if (!err) require('fs').writeFileSync(
                require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body
              );
            }
          )
        }
      );
    }
    start() {}
    stop() {}
  } : (([Plugin, Library]) => {
    const { Patcher, UI, WebpackModules } = Library;
    const React = Library.React;

    return class HoverProfileTooltip extends Plugin {
      onStart() {
        this.patchUsernames();
      }

      onStop() {
        Patcher.unpatchAll(this.getName());
      }

      patchUsernames() {
        const UsernameMod = WebpackModules.find(m => m.default?.displayName === 'Username');
        if (!UsernameMod) return console.error(this.getName(), 'Username module not found');

        Patcher.after(this.getName(), UsernameMod, 'default', (_this, [props], res) => {
          // wrap in span and attach tooltip on hover
          const original = res.props.children;
          res.props.children = React.createElement(
            'span',
            {
              style: { cursor: 'help' },
              onMouseEnter: e => this.showTooltip(e.currentTarget, props.user.id),
              onMouseLeave: e => this.hideTooltip()
            },
            original
          );
          return res;
        });
      }

      showTooltip(elem, userId) {
        // fetch libraries
        const presence = WebpackModules.find(m => m.getStatus && m.getState);
        const userStore = WebpackModules.find(m => m.getUser && m.getCurrentUser);
        if (!presence || !userStore) return;

        const presences = presence.getState().presences || {};
        const activities = presences[userId]?.activities || [];
        const games = activities.filter(a => a.type === 0).map(a => `• ${a.name}`);
        const status = presence.getStatus(userId) || 'offline';
        const user = userStore.getUser(userId) || {};
        const descMod = WebpackModules.find(m => m.DESCRIPTION);
        const bioField = descMod?.DESCRIPTION;
        const bio = bioField && user[bioField] ? user[bioField] : 'No bio.';

        const lines = [`Status: ${status}`, `Bio: ${bio}`];
        if (games.length) {
          lines.push('Playing:', ...games);
        } else {
          lines.push('Not playing any games.');
        }
        const content = lines.join('\n');

        // create tooltip
        this.hideTooltip();
        this.tooltip = UI.createTooltip(elem, content, { style: 'info', side: 'top' });
      }

      hideTooltip() {
        if (this.tooltip) {
          this.tooltip.remove();
          this.tooltip = null;
        }
      }
    };
  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
