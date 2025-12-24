import Topology from './Topology.vue';

const install = function (app) {
  if (install.installed) return;
  app.component('Topology', Topology);
};

export default {
  install,
};

export { Topology };
