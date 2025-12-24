<template>
  <div class="topology-config">
    <el-select
      v-if="stationOptions && stationOptions.length > 0"
      v-model="currentStationId"
      placeholder="请选择"
      style="width: 200px; position: absolute; top: 74px; right: 17px; z-index: 10"
      @change="onSelectChange"
    >
      <el-option
        v-for="item in stationOptions"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      ></el-option>
    </el-select>

    <div class="page-container">
      <div class="page-title">
        <div class="title-left">
          <div class="title-line"></div>
          <span>储能网络拓扑</span>
        </div>
        <div class="title-right">
          <div v-if="editData?.length">
            <el-button v-if="!isEdit" size="small" @click="onEdit(true)">编辑</el-button>
            <div v-else>
              <el-button size="small" @click="onEdit(false)">取消</el-button>
              <el-button size="small" type="primary" @click="onEdit(false)">确定</el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="topology-content" v-loading="loading" ref="topologyContentRef" id="topology-content">
        <div ref="topologyRef" id="topology" v-if="editData?.length" class="topology-graph"></div>
        <div class="topology-empty" v-if="editData?.length === 0 && !loading">
          <div class="topology-empty-container">
            <img
              src="https://dee-static.oss-cn-beijing.aliyuncs.com/dee-master-pro/topology-empty-icon.svg"
              alt="empty_icon"
            />
            <div class="empty-content">
              <h4>储能网络拓扑</h4>
              <span>该电站拓扑暂未配置</span>
              <div @click="goConfig">
                <img
                  src="https://dee-static.oss-cn-beijing.aliyuncs.com/dee-master-pro/topology-btn-icon.svg"
                  alt="btn_icon"
                />
                去配置
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="topology-tooltip" v-if="tooltipData.visible" @click="tooltipData.visible = false">
      <div
        class="topology-tooltip-container"
        :style="{ top: tooltipData.position.y + 'px', left: tooltipData.position.x + 'px' }"
        @click.stop="tooltipData.visible = true"
      >
        <div class="tooltip-header">
          <h4>{{ tooltipData.title }}</h4>
          <el-icon @click.stop="tooltipData.visible = false"><Close /></el-icon>
        </div>
        <div class="tooltip-content">
          <div v-if="tooltipData.data.length > 0">
            <div class="content-item" v-for="(item, index) in tooltipData.data" :key="index">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-value">{{ item.value }}</div>
            </div>
          </div>
          <div v-else class="tooltip-empty">
            <img
              src="https://dee-static.oss-cn-beijing.aliyuncs.com/dee-web/empty-data.png"
              alt="empty"
            />
            <span>暂无数据</span>
          </div>
        </div>
      </div>
    </div>
    <AddParallelBranches
      v-if="visibleOne"
      :visible="visibleOne"
      @onClose="onCloseOne"
      :currentParentId="currentParentId"
      ref="addParallelBranchesRef"
      @onFreshData="getTopologyMapListData(true)"
      :api="api"
    />
    <AddEnergyStorageUnit
      v-if="visibleTwo"
      :visible="visibleTwo"
      @onClose="onCloseTwo"
      :currentParentId="currentParentId"
      ref="addEnergyStorageUnitRef"
      @onFreshData="getTopologyMapListData(true)"
      :api="api"
    />
    <AddDevice
      v-if="visibleThree"
      :visible="visibleThree"
      @onClose="onCloseThree"
      :stationId="currentStationId"
      :currentParentId="currentParentId"
      ref="addDeviceRef"
      @onFreshData="getTopologyMapListData(true)"
      :api="api"
    />
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  defineProps,
  defineEmits,
} from 'vue';
import { SVG } from '@svgdotjs/svg.js';
import SvgPanZoom from 'svg-pan-zoom';
import dagre from 'dagre';
import { ElMessage, ElMessageBox } from 'element-plus';
import { topologyAddMap } from './config.js';
import AddParallelBranches from './components/AddParallelBranches.vue';
import AddEnergyStorageUnit from './components/AddEnergyStorageUnit.vue';
import AddDevice from './components/AddDevice.vue';
import { Close } from '@element-plus/icons-vue';

const props = defineProps({
  stationList: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  api: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const topologyContentRef = ref(null);
const topologyRef = ref(null);
const addParallelBranchesRef = ref(null);
const addEnergyStorageUnitRef = ref(null);
const addDeviceRef = ref(null);

const currentStationId = ref(props.modelValue);
const stationOptions = ref(props.stationList);
const drawSvg = ref(null);
const graph = ref(null);
const isEdit = ref(false);
const loading = ref(false);
const visibleOne = ref(false);
const visibleTwo = ref(false);
const visibleThree = ref(false);
const currentNodeId = ref(null);
const currentParentId = ref(0);
const tooltipData = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  title: '',
  data: [],
});
const width = ref(null);
const height = ref(null);
const panZoom = ref(null);
const sourceData = ref([]);
const editData = ref([]);
const zoom = ref(0.7);

const $convertUnit = (val) => {
  if (props.api.convertUnit) {
    return props.api.convertUnit(val);
  }
  return { value: val?.value, unit: '' };
};

const deepClone = (data) => {
  return JSON.parse(JSON.stringify(data));
};

const getMathRandom = () => {
  return (~~(Math.random() * 10 ** 6)).toString() + new Date().valueOf();
};

const searchNodeInfo = (data, nodeId) => {
  let info = null;
  data?.forEach((item) => {
    if (String(item.id) === String(nodeId)) {
      info = item;
    }
    if (item.children) {
      const result = searchNodeInfo(item.children, nodeId);
      if (result) {
        info = result;
      }
    }
  });
  return info;
};

const searchParentNodeInfo = (data, nodeId, parentId = null) => {
  let id = null;
  data?.forEach((item) => {
    if (String(item.id) === String(nodeId)) {
      id = parentId;
    }
    if (item.children) {
      const result = searchParentNodeInfo(item.children, nodeId, item.id);
      if (result) {
        id = result;
      }
    }
  });
  return id;
};

const formatData = (data, dept = 0) => {
  let name = '添加并网点';
  let topologyAdd = topologyAddMap[0];
  if (dept === 1) {
    name = '添加储能单元';
    topologyAdd = topologyAddMap[1];
  } else if (dept === 2) {
    name = '添加设备';
    topologyAdd = topologyAddMap[2];
  }
  data?.forEach((item) => {
    if ((!item?.children || item?.children?.length === 0) && dept < 2) {
      formatData((item.children = []), dept + 1);
    } else if (item?.children?.length > 0) {
      formatData(item.children, dept + 1);
    }
  });
  data?.push({ id: getMathRandom(), name, topologyAdd, type: 'add' });
  return data;
};

const clearDraw = () => {
  drawSvg.value?.clear();
  const el = topologyRef.value;
  if (el?.firstElementChild) {
    el.firstElementChild.remove();
  }
};

const reDraw = () => {
  clearDraw();
  init();
};

const init = () => {
  const content = topologyContentRef.value;
  if (!content) return;
  width.value = content.clientWidth;
  height.value = content.clientHeight;
  if (!width.value || !height.value) return;

  const topologyEl = topologyRef.value;
  if (!topologyEl) return;

  drawSvg.value = SVG().addTo(topologyEl).size(width.value, height.value);

  // const defs = drawSvg.value.defs();
  // const marker = defs.marker(10, 10, function (add) {
  //   add.path('M 0 0 L 10 5 L 0 10 z').fill('#999999');
  // });
  // marker.attr('id', 'arrowMarker');
  // marker.ref(0, 5);

  // width.value = document.getElementById('topology-content')?.clientWidth;
  // height.value = document.getElementById('topology-content')?.clientHeight;
  // drawSvg.value = SVG().addTo('#topology').size(width.value, height.value);

  layout(editData.value);

  const el = topologyEl.firstElementChild;
  if (el) {
    const pz = SvgPanZoom(el);
    panZoom.value = pz;
    pz.setMinZoom(0.1);
    pz.setMaxZoom(4);
    pz.zoom(zoom.value);
  }
};

const drawStartLine = (data, position, nodeId) => {
  const arr = [];
  const { x, y } = position || {};
  data?.forEach((item) => {
    arr.push(String(item.id));
  });
  if (arr.includes(String(nodeId))) {
    const line = drawSvg.value.line(x, -60, x, y - 60);
    line.stroke({ color: '#979797', width: 2, linecap: 'round' });
  }
};

const getTopologySingleInfo = async (data) => {
  if (!props.api.getTopologySingleInfo) return false;
  loading.value = true;
  let result = false;
  try {
    const { class: device_class, id, type } = data || {};
    const res = await props.api.getTopologySingleInfo({
      device_class,
      type,
      id,
      page: 1,
      row: 10,
      origin: '拓扑图单一查询',
    });
    const { code, info } = res || {};
    if (code === '00000') {
      const { data } = info || {};
      result = data?.[0];
    }
  } catch (e) {
    console.error('err', e);
    result = false;
  } finally {
    loading.value = false;
  }
  return result;
};

const drawNode = (data, position, nodeId) => {
  const nodeInfo = searchNodeInfo(data, nodeId);
  const { x, y } = position || {};
  const { name, type, topologyAdd } = nodeInfo || {};
  const groups = drawSvg.value.group();
  groups.css('cursor', 'pointer');

  const rect = drawSvg.value.rect(120, 120);
  rect.stroke({ color: '#E6E6E6', width: 1 }).fill({ color: '#fff' }).radius(3);
  groups.add(rect);

  if (type === 'add') {
    groups.on('click', () => {
      currentNodeId.value = nodeId;
      const parentId = searchParentNodeInfo(data, nodeId);
      currentParentId.value = parentId || currentStationId.value;
      zoom.value = panZoom.value.getZoom();
      if (topologyAdd === topologyAddMap[0]) {
        visibleOne.value = true;
        // In Vue 3, ref might not be available immediately if v-if just turned true
        // but visibleOne handles v-if.
        // Need nextTick to ensure child component is mounted
        nextTick(() => {
          // If child exposes method via defineExpose, we can call it.
          // We didn't expose getEnergyStorageUnitTypeData in AddParallelBranches explicitly?
          // Ah, AddParallelBranches didn't have it exposed.
          // Wait, AddParallelBranches does fetching on setFormValue mostly.
          // But the original code called `getEnergyStorageUnitTypeData` on `addParallelBranches`.
          // In my conversion of AddParallelBranches, I didn't expose it.
          // But `onMounted` calls it. So v-if true triggers mount, triggers fetch.
        });
      } else if (topologyAdd === topologyAddMap[1]) {
        visibleTwo.value = true;
      } else if (topologyAdd === topologyAddMap[2]) {
        visibleThree.value = true;
      }
    });
  } else {
    groups.on('click', async (e) => {
      const { name } = nodeInfo;
      const res = await getTopologySingleInfo(nodeInfo);
      if (res) {
        const {
          type,
          mpoint,
          dcac_vol,
          sub_type,
          params,
          vol,
          device_params,
          device,
          class: classType,
        } = res || {};

        if (isEdit.value) {
          let targetRef = null;
          if (type === 'ST_PORTAL') {
            visibleOne.value = true;
            targetRef = addParallelBranchesRef;
          } else if (type === 'ST_ES_UNIT') {
            visibleTwo.value = true;
            targetRef = addEnergyStorageUnitRef;
          } else {
            visibleThree.value = true;
            targetRef = addDeviceRef;
          }
          nextTick(() => {
            targetRef.value?.setFormValue({ ...res, currentName: name });
          });
          return;
        }

        let result = [];
        if (type === 'ST_PORTAL') {
          const { name: mName } = mpoint || {};
          result = [{ name: '绑定计量点', value: mName }];
        } else if (type === 'ST_ES_UNIT') {
          const { name: sName } = sub_type || {};
          result = [
            { name: '储能单元类型', value: sName },
            {
              name: '储能单元容量',
              value: `${$convertUnit({ value: dcac_vol }).value} ${$convertUnit({ value: dcac_vol }).unit}`,
            },
          ];
        } else {
          const { name: dName, type: dType } = device || {};
          const arr = (params && JSON.parse(params)) || [];
          const deviceArr =
            Array.isArray(arr) &&
            arr?.map((item, index) => {
              return {
                name: `电池簇${index + 1}`,
                value: item.name,
              };
            });
          const { pack_num, battery_cluster_num, battery_cluster_pack_num } =
            (device_params && JSON.parse(device_params)) || {};
          if (classType === 'BMS_STACK') {
            result = [
              { name: '绑定设备', value: dName },
              { name: '电池簇数量', value: battery_cluster_num },
              ...deviceArr,
              { name: '每个电池簇pack数量', value: battery_cluster_pack_num },
              { name: '每个pack单体数量', value: pack_num },
            ];
          } else if (classType === 'PCS_ES') {
            result = [
              { name: '设备类型', value: dType },
              { name: '绑定设备', value: dName },
              { name: '额定功率', value: vol },
            ];
          } else if (classType === 'HVAC_ES') {
            result = [
              { name: '设备类型', value: dType },
              { name: '绑定设备', value: dName },
            ];
          }
        }

        const { clientX, clientY } = e;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const tooltipWidth = 250;
        const tooltipHeight = 300;
        let tooltipX = clientX;
        let tooltipY = clientY;
        if (viewportWidth - clientX < tooltipWidth) {
          tooltipX = viewportWidth - tooltipWidth;
        }
        if (viewportHeight - clientY < tooltipHeight) {
          tooltipY = viewportHeight - tooltipHeight;
        }

        tooltipData.visible = true;
        tooltipData.position = { x: tooltipX, y: tooltipY };
        tooltipData.title = name;
        tooltipData.data = result;
      }
    });
  }

  if (isEdit.value && (!type || type !== 'add')) {
    const closeImage = drawSvg.value.image(
      'https://dee-static.oss-cn-beijing.aliyuncs.com/dee-master-pro/topology-close-icon.svg',
    );
    closeImage
      .size(24, 24)
      .css('cursor', 'pointer')
      .move(108, -12);
    closeImage.click((e) => {
      e.stopPropagation();
      zoom.value = panZoom.value.getZoom();
      const { type: nodeType } = nodeInfo || {};
      let message = '是否确认删除该设备';
      if (nodeType === 'ST_PORTAL') {
        message = '是否确认删除该并网点，删除并网点后会自动删除下属储能单元及设备';
      }
      if (nodeType === 'ST_ES_UNIT') {
        message = '是否确认删除该储能单元，删除储能单元后会自动删除下属设备';
      }
      ElMessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          removeTopology(nodeInfo);
        })
        .catch(() => {});
    });
    groups.add(closeImage);
  }
  const text = `<foreignObject x="0" y="0" width="120" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <div style='width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;
        padding: 16px; font-size: 14px; color: #333; font-family: PingFangSC, PingFang SC; font-weight: bold;
        box-sizing: border-box; flex-direction: column; word-break: break-all; text-align: center;'
      >
      ${
        (type &&
          type === 'add' &&
          "<image style='width: 20px; height: 20px; margin-bottom: 12px' src='https://dee-static.oss-cn-beijing.aliyuncs.com/dee-master-pro/topology-add-icon.svg' />") ||
        ''
      }
      ${name}
      </div>
    </div>
  </foreignObject>`;
  groups.add(text);
  groups.addClass('node').attr('id', nodeId);
  groups.translate(x - 60, y - 60);
};

const createNode = (item) => {
  const { id, name } = item || {};
  graph.value.setNode(id, { label: name, width: 120, height: 120 });
};

const createAllNode = (data) => {
  data?.forEach((item) => {
    createNode(item);
    if (item?.children) {
      createAllNode(item?.children);
    }
  });
};

const drawEdge = (edgeId, nodeObj) => {
  const edge = graph.value.edge(edgeId);
  const { points } = edge;
  const { v, w } = edgeId || {};
  const startX = nodeObj[v].x;
  const startY = nodeObj[v].y;
  points.splice(1, 0, { x: startX, y: startY + 30 });
  const pathString = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${startX},${startY}`;
    }
    if (index === 2 && startX !== point.x) {
      const x = startX > point.x ? point.x + 8 : point.x - 8;
      return `${path} L ${x},${point.y} Q ${point.x},${point.y} ${point.x},${point.y + 8}`;
    } else {
      return `${path} L ${point.x},${point.y}`;
    }
  }, '');
  const path = drawSvg.value.path(pathString);
  path
    .stroke({ color: '#999999', width: 2, linecap: 'round' })
    .fill('none')
    .attr('marker-end', 'url(#arrowMarker)')
    .attr('id', v + w);
};

const createEdge = (target, source) => {
  graph.value.setEdge(source.id, target.id);
};

const createAllEdge = (cur, pre) => {
  cur?.forEach((item) => {
    if (pre) {
      createEdge(item, pre);
    }
    if (item?.children) {
      createAllEdge(item?.children, item);
    }
  });
};

const layout = (data) => {
  const g = new dagre.graphlib.Graph({ directed: true });
  graph.value = g;
  g.setGraph({
    rankdir: 'TB',
    ranksep: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  createAllNode(data);
  createAllEdge(data);

  dagre.layout(g);

  const nodeObj = {};

  g.nodes().forEach((nodeId) => {
    const position = g.node(nodeId);
    nodeObj[nodeId] = {
      x: position.x,
      y: position.y + 60,
    };
    drawNode(data, position, nodeId);
    drawStartLine(data, position, nodeId);
  });

  g.edges().forEach((edgeId) => {
    drawEdge(edgeId, nodeObj);
  });

  const line = drawSvg.value.line(0, 0, g?._label?.width, 0);
  line.stroke({ color: '#979797', width: 2, linecap: 'round' });
  line.move(0, -60);
  dagre.layout(g);
};

const removeTopology = async (data) => {
  if (!props.api.deleteTopologyMap) return;
  loading.value = true;
  try {
    const { class: device_class, id, type } = data || {};
    const res = await props.api.deleteTopologyMap({
      device_class,
      type,
      id,
      origin: '拓扑图单一删除',
    });
    if (res?.code === '00000') {
      getTopologyMapListData(true);
    }
  } catch (e) {
    console.error('err', e);
  } finally {
    loading.value = false;
  }
};

const getTopologyMapListData = async (bool) => {
  if (!props.api.getTopologyMapList) {
    console.warn('API getTopologyMapList is not provided');
    return;
  }
  loading.value = true;
  try {
    const res = await props.api.getTopologyMapList({
      station_id: currentStationId.value,
      origin: '拓扑图',
    });
    const { code, info } = res || {};
    if (code === '00000') {
      sourceData.value = info?.data || [];
      if (bool) {
        onEdit(true);
        return;
      }
      editData.value = deepClone(sourceData.value);
      if (editData.value?.length === 0) {
        clearDraw();
        return;
      }
      nextTick(() => {
        reDraw();
      });
    }
  } catch (e) {
    console.error('err', e);
  } finally {
    loading.value = false;
  }
};

const onEdit = (bool) => {
  isEdit.value = bool;
  let data = deepClone(sourceData.value);
  if (bool) {
    data = formatData(deepClone(sourceData.value));
  }
  editData.value = data;
  clearDraw();
  nextTick(() => {
    reDraw();
  });
};

const goConfig = () => {
  onEdit(true);
};

const onSelectChange = (val) => {
  emit('update:modelValue', val);
  emit('change', val);
  currentStationId.value = val;
  if (val) {
    getTopologyMapListData();
  }
};

const onCloseOne = () => {
  visibleOne.value = false;
};
const onCloseTwo = () => {
  visibleTwo.value = false;
};
const onCloseThree = () => {
  visibleThree.value = false;
};

watch(
  () => props.stationList,
  (val) => {
    stationOptions.value = val;
    if (val && val.length > 0 && !currentStationId.value) {
      currentStationId.value = val[0].id;
      onSelectChange(currentStationId.value);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (val) => {
    currentStationId.value = val;
  },
);

onMounted(() => {
  window.addEventListener('resize', reDraw);
  // Initial load if stationId exists
  if (currentStationId.value) {
    getTopologyMapListData();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', reDraw);
});
</script>

<style lang="scss" scoped>
.topology-config {
  width: 100%;
  height: 100%;
  position: relative;

  .page-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .page-title {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #f0f0f0;

    .title-left {
      display: flex;
      align-items: center;
      .title-line {
        width: 4px;
        height: 16px;
        background: #1890ff;
        margin-right: 8px;
        border-radius: 2px;
      }
      span {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }
    }
  }

  .topology-content {
    flex: 1;
    overflow: hidden;
    position: relative;
    width: 100%;

    .topology-graph {
      width: 100%;
      height: 100%;
    }

    .topology-empty {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .topology-empty-container {
        text-align: center;
        img {
          width: 200px;
          margin-bottom: 20px;
        }
        .empty-content {
          h4 {
            font-size: 18px;
            color: #333;
            margin-bottom: 8px;
          }
          span {
            color: #999;
            font-size: 14px;
            display: block;
            margin-bottom: 20px;
          }
          div {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 120px;
            height: 40px;
            background: #1890ff;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            img {
              width: 16px;
              height: 16px;
              margin-bottom: 0;
              margin-right: 8px;
            }
          }
        }
      }
    }
  }

  .topology-tooltip {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    pointer-events: none; // Allow clicks through wrapper? No, click on wrapper closes it

    .topology-tooltip-container {
      position: absolute;
      background: #fff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      padding: 0;
      width: 250px;
      max-height: 300px;
      display: flex;
      flex-direction: column;
      pointer-events: auto;

      .tooltip-header {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        h4 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }
        i {
          cursor: pointer;
          color: #999;
          &:hover {
            color: #666;
          }
        }
      }
      .tooltip-content {
        padding: 12px 16px;
        overflow-y: auto;
        .content-item {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
          .item-name {
            color: #999;
            width: 100px;
            flex-shrink: 0;
          }
          .item-value {
            color: #333;
            word-break: break-all;
          }
        }
        .topology-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
          img {
            width: 80px;
            margin-bottom: 10px;
          }
          span {
            color: #999;
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
