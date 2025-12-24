<template>
  <div class="add-energy-storage-unit">
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
          label-width="110px"
          class="form"
        >
          <el-form-item label="储能单元类型" prop="sub_type">
            <el-select v-model="ruleForm.sub_type" placeholder="请选择" style="width: 100%">
              <el-option
                v-for="item in dataSource"
                :key="item.id"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="储能单元名称" prop="name">
            <el-input
              v-model="ruleForm.name"
              placeholder="请输入"
              maxlength="6"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="储能单元容量" prop="dcac_vol">
            <el-input v-model="ruleForm.dcac_vol" placeholder="请输入">
              <template #append>kWh</template>
            </el-input>
          </el-form-item>
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
import { ref, reactive, onMounted, defineProps, defineEmits, defineExpose } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: Boolean,
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
const title = ref('添加储能单元');
const dataSource = ref([]);

const ruleForm = reactive({
  sub_type: null,
  name: null,
  dcac_vol: null,
});

const validatorFn = (_, value, callback) => {
  if (value === '' || value === null || value === undefined) {
    callback(new Error('请输入储能单元容量'));
  } else if (!/^-?\d+(\.\d+)?$/.test(value)) {
    callback(new Error('请输入数字'));
  } else {
    callback();
  }
};

const rules = {
  sub_type: [{ required: true, message: '请选择储能单元类型', trigger: 'change' }],
  name: [
    { required: true, message: '请输入储能单元名称', trigger: 'change' },
    { min: 0, max: 6, message: '最长6个字符', trigger: 'change' },
  ],
  dcac_vol: [{ required: true, validator: validatorFn, trigger: 'change' }],
};

const getEnergyStorageUnitTypeData = async () => {
  if (!props.api.getIotDictQuery) return;
  try {
    const res = await props.api.getIotDictQuery({
      query: {
        type: 'ST_ES_UNIT_type',
      },
      fields: 'id,,type,name,code',
      origin: '系统管理/基础数据/空间管理',
    });
    const { code, result } = res || {};
    if (code === '00000') {
      dataSource.value = result?.data || [];
    }
  } catch (e) {
    console.error('err', e);
  }
};

const setFormValue = (data) => {
  const { dcac_vol, id: idVal, sub_type, currentName } = data || {};
  const { code } = sub_type || {};
  title.value = '编辑储能单元';
  ruleForm.sub_type = code;
  ruleForm.name = currentName;
  ruleForm.dcac_vol = dcac_vol;
  currentId.value = idVal;
  type.value = 'edit';
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
      let params = {
        parent_id: props.currentParentId,
        origin: '储能单元添加',
        ...ruleForm,
      };
      let apiMethod = 'addEnergyStorageCabinet';
      if (type.value === 'edit') {
        params = {
          id: currentId.value,
          origin: '储能单元编辑',
          ...ruleForm,
        };
        apiMethod = 'editEnergyStorageCabinet';
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
  getEnergyStorageUnitTypeData();
});

defineExpose({
  setFormValue,
});
</script>

<style lang="scss" scoped>
.add-energy-storage-unit {
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
