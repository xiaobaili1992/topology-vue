# Map Preview Component

用于拓扑配置的 Vue 3 组件库，使用dagre库来处理自适应拓扑配置，使用svg-pan-zoom来处理拓扑配置放大缩小

## 安装

```bash
npm install topology-vue
```

## 开发

### 项目设置
```bash
npm install
```

### 运行开发服务器 (预览与调试)
```bash
npm run serve
```
启动本地开发服务器，带有模拟环境以预览和调试组件。

### 构建库
```bash
npm run build
```
为生产环境构建组件库。输出目录为 `dist`。
**注意：** `vue` 和 `element-plus` 被视为外部依赖，**不**包含在打包文件中。

## 使用方法

### 全局注册

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import Topology from 'topology-vue';
import 'topology-vue/dist/style.css'; // 如果样式被提取

const app = createApp(App);
app.use(Topology);
```

### 局部注册

```javascript
import { Topology } from 'topology-vue';

export default {
  components: {
    Topology,
  },
  // ...
};
```

### 示例

```vue
<template>
  <div style="height: 800px; width: 100%">
    <topology
      v-model="currentStationId"
      :station-list="stationList"
      :api="api"
      @change="handleStationChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Topology from 'topology-vue';

const currentStationId = ref('');
const stationList = ref([
  { id: 1, name: '电站 A' },
  { id: 2, name: '电站 B' },
]);

const handleStationChange = (id) => {
  console.log('电站切换:', id);
};

const api = {
  // 在此处实现所需的 API 方法
  getTopologyMapList: async (params) => { /* ... */ },
  deleteTopologyMap: async (params) => { /* ... */ },
  getTopologySingleInfo: async (params) => { /* ... */ },
  convertUnit: (val) => { return { value: val, unit: 'kW' }; },
  
  // 字典与设备查询
  getIotDictQuery: async (params) => { /* ... */ },
  getIotDeviceQuery: async (params) => { /* ... */ },
  getIotMpointQuery: async (params) => { /* ... */ },

  // 添加/编辑方法
  addDevice: async (params) => { /* ... */ },
  editDevice: async (params) => { /* ... */ },
  addParallelBranches: async (params) => { /* ... */ },
  editParallelBranches: async (params) => { /* ... */ },
  addEnergyStorageCabinet: async (params) => { /* ... */ },
  editEnergyStorageCabinet: async (params) => { /* ... */ },
};
</script>
```

## 属性 (Props)

| 名称 | 类型 | 必填 | 默认值 | 描述 |
|------|------|----------|---------|-------------|
| `modelValue` | String/Number | 否 | - | 当前电站 ID (支持 v-model) |
| `stationList` | Array | 否 | `[]` | 电站列表 `{id, name}`，用于下拉选择 |
| `api` | Object | 是 | `{}` | 包含所有必需 API 方法的对象 |

## API 对象方法

`api` 属性必须提供以下方法（返回 Promise，解析为标准响应格式 `{ code: '00000', result: { ... }, info: { ... } }`）：

- `getTopologyMapList(params)`
- `deleteTopologyMap(params)`
- `getTopologySingleInfo(params)`
- `getIotDictQuery(params)`
- `getIotDeviceQuery(params)`
- `getIotMpointQuery(params)`
- `addDevice(params)`
- `editDevice(params)`
- `addParallelBranches(params)`
- `editParallelBranches(params)`
- `addEnergyStorageCabinet(params)`
- `editEnergyStorageCabinet(params)`
- `convertUnit(value)` (同步方法, 返回 `{ value, unit }`)

## 对等依赖 (Peer Dependencies)

- `element-plus`
- `vue`
