<template>
  <div class="add-device">
    <el-dialog
      :title="title"
      :model-value="visible"
      :destroy-on-close="true"
      width="420px"
      @close="onClose"
    >
      <div>
        <el-form
          :model="ruleForm"
          :rules="rules"
          ref="ruleFormRef"
          label-width="154px"
          class="form"
        >
          <el-form-item label="设备类型" prop="type">
            <el-select
              v-model="ruleForm.type"
              placeholder="请选择"
              style="width: 100%"
              @change="onSelectChange"
            >
              <el-option
                v-for="item in deviceTypeData"
                :key="item.id"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="绑定设备" prop="device_id">
            <el-select
              v-model="ruleForm.device_id"
              filterable
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option
                v-for="item in deviceData"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="ruleForm.type === deviceTypeMap[0]" label="额定功率" prop="p">
            <el-input v-model="ruleForm.p" placeholder="请输入">
              <template #append>kW</template>
            </el-input>
          </el-form-item>
          <div v-if="ruleForm.type === deviceTypeMap[1]">
            <el-form-item label="电池簇数量" prop="battery_cluster_num">
              <el-input-number
                v-model="ruleForm.battery_cluster_num"
                :min="1"
                :max="20"
              ></el-input-number>
            </el-form-item>
            <div class="battery-cluster-container" v-if="ruleForm.battery_cluster_num">
              <el-form-item
                v-for="(_, index) in ruleForm.battery_cluster_num || 0"
                :label="`电池簇${index + 1}`"
                :key="index"
                :prop="`device_${index + 1}`"
                label-width="80px"
              >
                <el-select
                  v-model="ruleForm[`device_${index + 1}`]"
                  placeholder="请选择"
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in computedClusterData[index]"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="每个电池簇pack数量" prop="battery_cluster_pack_num">
              <el-input-number
                v-model="ruleForm.battery_cluster_pack_num"
                :min="1"
                :max="10000"
              ></el-input-number>
            </el-form-item>
            <el-form-item label="每个pack单体数量" prop="pack_num">
              <el-input-number v-model="ruleForm.pack_num" :min="1" :max="10000"></el-input-number>
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onOk">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, defineProps, defineEmits, defineExpose } from 'vue';
import { ElMessage } from 'element-plus';
import { deviceTypeMap } from '../config.js';

const props = defineProps({
  visible: Boolean,
  stationId: [String, Number],
  currentParentId: [String, Number],
  api: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const emit = defineEmits(['onClose', 'onFreshData']);

const ruleFormRef = ref(null);
const currentId = ref(null);
const type = ref('add');
const title = ref('添加设备');
const deviceTypeData = ref([]);
const deviceData = ref([]);
const clusterData = ref([]);

const ruleForm = reactive({
  type: null,
  device_id: null,
  p: null,
  battery_cluster_num: undefined,
  battery_cluster_pack_num: undefined,
  pack_num: undefined,
});

const validatorFn = (_, value, callback) => {
  if (value === '' || value === null || value === undefined) {
    callback(new Error('请输入额定功率'));
  } else if (!/^-?\d+(\.\d+)?$/.test(value)) {
    callback(new Error('请输入数字'));
  } else if (!/^-?\d{1,6}(\.\d{1,2})?$/.test(value)) {
    callback(new Error('整数部分最多为6位，小数部分最多为2位'));
  } else {
    callback();
  }
};

const rules = {
  type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  device_id: [{ required: true, message: '请选择绑定设备', trigger: 'change' }],
  p: [{ required: true, validator: validatorFn, trigger: 'change' }],
  battery_cluster_num: [{ required: true, message: '请输入电池簇数量', trigger: 'change' }],
  battery_cluster_pack_num: [
    { required: true, message: '请输入每个电池簇pack数量', trigger: 'change' },
  ],
  pack_num: [{ required: true, message: '请输入每个pack单体数量', trigger: 'change' }],
};

const computedClusterData = computed(() => {
  if (!ruleForm.battery_cluster_num) return [];
  return new Array(ruleForm.battery_cluster_num).fill('device')?.map((item, index) => {
    return clusterData.value?.filter((subItem) => {
      const selectedIds = new Array(index).fill(1).map((_, i) => ruleForm?.[`${item}_${i + 1}`]);
      return !selectedIds.includes(subItem.id);
    });
  });
});

const getDeviceTypeData = async () => {
  if (!props.api.getIotDictQuery) return;
  try {
    const res = await props.api.getIotDictQuery({
      query: {
        type: 'dev_type',
        code: {
          in: 'pcs_es,bms_stack,hvac_es',
        },
      },
      fields: 'id,,type,name,code',
      origin: '系统管理/基础数据/空间管理',
    });
    const { code, result } = res || {};
    if (code === '00000') {
      deviceTypeData.value = result?.data || [];
    }
  } catch (e) {
    console.error('err', e);
  }
};

const getDeviceData = async (devType) => {
  if (!props.api.getIotDeviceQuery) return;
  try {
    const res = await props.api.getIotDeviceQuery({
      type: devType,
      station: props.stationId,
      origin: '拓扑配置-添加设备',
    });
    const { code, info } = res || {};
    if (code === '00000') {
      if (devType === 'BMS_CLUSTER') {
        clusterData.value = info?.data || [];
        return;
      }
      deviceData.value = info?.data || [];
    }
  } catch (e) {
    console.error('err', e);
  }
};

const onSelectChange = (val) => {
  ruleForm.device_id = '';
  getDeviceData(val);
  if (val === 'BMS_STACK') {
    getDeviceData('BMS_CLUSTER');
  }
};

const setFormValue = async (data) => {
  const { class: classType, id, device, params, device_params, vol } = data || {};
  const formatParams = (params && JSON.parse(params)) || {};
  const formatDeviceParams = (device_params && JSON.parse(device_params)) || {};
  const { pack_num, battery_cluster_num, battery_cluster_pack_num } = formatDeviceParams || {};

  title.value = '编辑设备';
  ruleForm.type = classType;
  ruleForm.device_id = device?.id;
  ruleForm.pack_num = pack_num;
  ruleForm.battery_cluster_num = battery_cluster_num;
  ruleForm.battery_cluster_pack_num = battery_cluster_pack_num;
  ruleForm.p = (vol && Number(vol)) || 0;

  currentId.value = id;
  type.value = 'edit';

  await getDeviceData(classType);
  if (device) {
    // Ensure device is in list if not already
    if (!deviceData.value.find((d) => d.id === device.id)) {
      deviceData.value.push(device);
    }
  }

  if (battery_cluster_num) {
    await getDeviceData('BMS_CLUSTER');
    // Logic for clusterData concatenation if needed?
    // Vue 2 code did: this.clusterData = this.clusterData.concat(formatParams);
    // This seems to append mock data from params to the list?
    if (Array.isArray(formatParams)) {
      formatParams.forEach((p) => {
        if (!clusterData.value.find((c) => c.id === p.id)) {
          clusterData.value.push(p);
        }
      });
    }

    new Array(ruleForm.battery_cluster_num).fill('device')?.forEach((item, index) => {
      ruleForm[`${item}_${index + 1}`] = formatParams[index]?.id;
    });
  }
};

const onClose = () => {
  emit('onClose');
};

const onOk = () => {
  ruleFormRef.value.validate(async (valid) => {
    if (!valid) {
      console.error('error submit!!');
      return false;
    }
    try {
      const {
        type: formType,
        device_id,
        p,
        pack_num,
        battery_cluster_num,
        battery_cluster_pack_num,
        ...others
      } = ruleForm;

      let params = {
        station_id: props.currentParentId,
        type: formType,
        device_id,
        origin: '设备添加',
      };
      if (formType === deviceTypeMap[0]) {
        params = {
          p,
          ...params,
        };
      }
      if (formType === deviceTypeMap[1]) {
        const obj = { pack_num, battery_cluster_num, battery_cluster_pack_num };
        const battery_list = (others && Object.values(others)) || [];
        const arr = [];
        battery_list?.forEach((item) => {
          clusterData.value?.forEach((subItem) => {
            if (item === subItem.id) {
              arr.push(subItem);
            }
          });
        });
        params = {
          params: JSON.stringify(obj),
          battery_list,
          battery_params: JSON.stringify(arr),
          ...params,
        };
      }
      let apiMethod = 'addDevice';
      if (type.value === 'edit') {
        params = {
          id: currentId.value,
          ...params,
          origin: '设备编辑',
        };
        apiMethod = 'editDevice';
      }
      if (!props.api[apiMethod]) return;

      const res = await props.api[apiMethod](params);
      if (res?.code === '00000') {
        ElMessage.success(`${type.value === 'edit' ? '编辑' : '添加'}成功`);
        onClose();
        emit('onFreshData');
      }
    } catch (e) {
      console.error('err', e);
    }
  });
};

onMounted(() => {
  getDeviceTypeData();
});

defineExpose({
  setFormValue,
  getDeviceTypeData, // Exposed just in case parent needs to call it, though onMounted handles it
});
</script>

<style lang="scss" scoped>
.add-device {
  :deep(.el-dialog__title) {
    font-weight: bold !important;
  }
  :deep(.el-dialog) {
    width: 420px !important;
  }
  :deep(.el-dialog__body) {
    padding: 24px;
    padding-bottom: 6px;
  }
  :deep(.el-dialog__footer) {
    padding: 20px 24px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
