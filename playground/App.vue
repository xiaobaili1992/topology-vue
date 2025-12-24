<template>
  <div id="app" style="display: flex; flex-direction: column; height: 100vh">
    <div style="padding: 10px; background: #f0f2f5; border-bottom: 1px solid #ddd">
      <h3>组件预览调试</h3>
      <div style="color: #666; font-size: 12px">当前选中电站ID: {{ currentStationId }}</div>
    </div>
    <div
      style="position: relative; display: flex; flex: 1; flex-direction: column; overflow: hidden"
    >
      <Topology
        v-model="currentStationId"
        :station-list="stationList"
        :api="api"
        style="width: 100%; height: 100%"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Topology from '../src/Topology.vue';

const currentStationId = ref(1);
const stationList = ref([
  { id: 1, name: '测试电站A (有数据)' },
  { id: 2, name: '测试电站B (无数据)' },
]);

const api = {
  // 模拟获取拓扑图列表
  getTopologyMapList: async (params) => {
    console.log('API Call: getTopologyMapList', params);
    if (params.station_id === 2) {
      return {
        code: '00000',
        info: {
          data: [],
        },
      };
    }
    return {
      code: '00000',
      info: {
        data: [
          {
            id: '1001',
            name: '并网点1',
            type: 'ST_PORTAL',
            children: [
              {
                id: '2001',
                name: '储能单元1',
                type: 'ST_ES_UNIT',
                children: [
                  {
                    id: '3001',
                    name: 'PCS设备',
                    type: 'PCS_ES',
                    class: 'PCS_ES',
                    vol: 100,
                  },
                  {
                    id: '3002',
                    name: 'BMS设备',
                    type: 'BMS_STACK',
                    class: 'BMS_STACK',
                    params: JSON.stringify([{ name: '簇1' }, { name: '簇2' }]),
                    device_params: JSON.stringify({
                      pack_num: 10,
                      battery_cluster_num: 2,
                      battery_cluster_pack_num: 5,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
    };
  },
  deleteTopologyMap: async (params) => {
    console.log('API Call: deleteTopologyMap', params);
    return { code: '00000' };
  },
  getTopologySingleInfo: async (params) => {
    console.log('API Call: getTopologySingleInfo', params);
    const { id, type, class: device_class } = params;
    let data = {
      id: id,
      name: '测试设备详情',
      type: type,
      class: device_class,
    };

    if (type === 'ST_PORTAL') {
      data.mpoint = { id: 201, name: '计量点001' };
      data.name = '并网点1';
    } else if (type === 'ST_ES_UNIT') {
      data.sub_type = { code: 'ES_UNIT_TYPE_1', name: '储能单元类型1' };
      data.dcac_vol = 1000;
      data.name = '储能单元1';
    } else {
      // Device
      data.device = { id: 101, name: '设备001', type: type };
      if (device_class === 'BMS_STACK') {
        data.params = JSON.stringify([{ name: '簇1' }, { name: '簇2' }]);
        data.device_params = JSON.stringify({
          pack_num: 10,
          battery_cluster_num: 2,
          battery_cluster_pack_num: 5,
        });
      } else if (device_class === 'PCS_ES') {
        data.vol = 500;
      }
    }

    return {
      code: '00000',
      info: {
        data: [data],
      },
    };
  },
  getIotDictQuery: async (params) => {
    console.log('API Call: getIotDictQuery', params);
    return {
      code: '00000',
      result: {
        data: [
          { id: 1, name: 'PCS', code: 'PCS_ES' },
          { id: 2, name: 'BMS', code: 'BMS_STACK' },
        ],
      },
    };
  },
  getIotDeviceQuery: async (params) => {
    console.log('API Call: getIotDeviceQuery', params);
    return {
      code: '00000',
      info: {
        data: [
          { id: 101, name: '设备001' },
          { id: 102, name: '设备002' },
        ],
      },
    };
  },
  getIotMpointQuery: async (params) => {
    console.log('API Call: getIotMpointQuery', params);
    return {
      code: '00000',
      result: {
        data: [
          { id: 201, name: '计量点001' },
          { id: 202, name: '计量点002' },
        ],
      },
    };
  },
  addDevice: async (params) => {
    console.log('API Call: addDevice', params);
    return { code: '00000' };
  },
  editDevice: async (params) => {
    console.log('API Call: editDevice', params);
    return { code: '00000' };
  },
  addParallelBranches: async (params) => {
    console.log('API Call: addParallelBranches', params);
    return { code: '00000' };
  },
  editParallelBranches: async (params) => {
    console.log('API Call: editParallelBranches', params);
    return { code: '00000' };
  },
  addEnergyStorageCabinet: async (params) => {
    console.log('API Call: addEnergyStorageCabinet', params);
    return { code: '00000' };
  },
  editEnergyStorageCabinet: async (params) => {
    console.log('API Call: editEnergyStorageCabinet', params);
    return { code: '00000' };
  },
  convertUnit: (val) => {
    return { value: val?.value || 0, unit: 'kW' };
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}
</style>
