# Map Vue

基于AntV L7的Vue 3地图可视化，使用geotiff处理tiff文件内容及解析，使用proj4处理投影坐标系转换，使用gcoord处理因国内政策导致两大地图厂商（高德，百度，腾讯）坐标偏移

## 功能特性

- **StationMap**: 用于多边形编辑和电站规划的地图组件。
- **StationModel**: 包含边界编辑、区域划分和正射影像叠加的综合电站建模组件。
- **PreviewMap**: 用于预览电站数据、航线和巡检结果的地图组件。
- **Tiff 支持**: 内置支持加载和渲染 GeoTIFF 正射影像。

## 安装

```bash
npm install map-vue
# 或
yarn add map-vue
```

## 使用方法

### 全局注册

```javascript
import { createApp } from 'vue';
import MapPreviewComponent from 'map-vue';
import 'map-vue/dist/style.css'; // 别忘了引入 CSS！

const app = createApp(App);
app.use(MapPreviewComponent);
app.mount('#app');
```

### 局部引入

```vue
<template>
  <StationModel
    :center="[116.397, 39.909]"
    :initial-data="stationData"
    @save="onSave"
  />
</template>

<script setup>
import { StationModel } from 'map-vue';
import 'map-vue/dist/style.css';
import { ref } from 'vue';

const stationData = ref({});
const onSave = (data) => {
  console.log(data);
};
</script>
```

## 开发指南

本项目采用标准的库开发结构。

### 项目结构

```
map-vue/
├── playground/      # 开发调试应用 (Vue 3)
│   ├── App.vue      # 主要测试组件
│   └── main.js      # playground 入口文件
├── src/             # 组件库源码
│   ├── components/  # 可复用子组件
│   ├── assets/      # 静态资源 (图片)
│   ├── StationMap.vue
│   ├── StationModel.vue
│   └── index.js     # 库入口文件
├── dist/            # 构建产物
├── index.html       # Vite 开发服务器入口
├── package.json     # 项目配置
└── vite.config.js   # 库构建的 Vite 配置
```

### 环境准备

1. 安装依赖：

```bash
yarn install
```

2. 启动开发服务器 (Playground)：

```bash
yarn dev
```
这将启动一个 Vite 服务器，你可以在其中交互式地测试 `playground/App.vue` 中定义的组件。

### 打包构建

构建生产环境库文件 (输出到 dist)：

```bash
yarn build
```

这将生成：
- `dist/map-vue.es.js` (ES Module)
- `dist/map-vue.umd.js` (UMD)
- `dist/style.css` (提取的 CSS)

## 调试

- **本地开发**: 使用 `yarn dev` 运行 playground。
- **链接到其他项目**:
  1. 在当前目录运行 `yarn link`。
  2. 在目标项目运行 `yarn link map-vue`。

## 依赖说明

- **Peer Dependencies (宿主依赖)**: `vue`, `element-plus`, `@antv/l7`, `@antv/l7-maps`, `geotiff`, `proj4`, `gcoord`。
  - 这些依赖必须在宿主应用程序中安装。
