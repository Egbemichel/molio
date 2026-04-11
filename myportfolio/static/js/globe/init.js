// Globe initialization script for Django
// This script initializes the GitHub Globe visualization

(function() {
  'use strict';

  window.GlobeManager = {
    instances: [],
    init: function(containerSelector, config = {}, data = []) {
      const container = document.querySelector(containerSelector);
      if (!container || !window.GithubGlobe) {
        console.warn('Container not found or GithubGlobe not loaded');
        return null;
      }

      try {
        const globe = new GithubGlobe(container, config, data);
        this.instances.push(globe);
        return globe;
      } catch (error) {
        console.error('Failed to initialize globe:', error);
        return null;
      }
    },

    destroyAll: function() {
      this.instances.forEach(globe => {
        if (globe && typeof globe.destroy === 'function') {
          globe.destroy();
        }
      });
      this.instances = [];
    }
  };

  // Auto-initialize globes with data-globe attribute
  document.addEventListener('DOMContentLoaded', function() {
    const globeContainers = document.querySelectorAll('[data-globe]');
    globeContainers.forEach(container => {
      const configStr = container.getAttribute('data-globe-config');
      const dataStr = container.getAttribute('data-globe-data');

      let config = {};
      let data = [];

      try {
        if (configStr) config = JSON.parse(configStr);
        if (dataStr) data = JSON.parse(dataStr);
      } catch (e) {
        console.warn('Invalid JSON in data attributes:', e);
      }

      GlobeManager.init('#' + (container.id || 'globe-container'), config, data);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
      GlobeManager.destroyAll();
    });
  });
})();
