<template>
  <div class="add-parallel-branches">
    <el-dialog
      :title="title"
      :model-value="visible"
      :destroy-on-close="true"
      width="420px"
      @close="onClose"
    >
      <div>
        <el-form :model="ruleForm" :rules="rules" ref="ruleFormRef" label-width="96px" class="form">
          <el-form-item label="并网点名称" prop="name">
            <el-input
              v-model="ruleForm.name"
              placeholder="请输入"
              maxlength="8"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="绑定计量点" prop="mpoint_id">
            <el-select
              v-model="ruleForm.mpoint_id"
              filterable
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option
                v-for="item in dataSource"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
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
const title = ref('添加并网点');
const dataSource = ref([]);

const ruleForm = reactive({
  name: null,
  mpoint_id: null,
});

const rules = {
  name: [
    { required: true, message: '请输入并网点名称', trigger: 'change' },
    { min: 0, max: 8, message: '最长8个字符', trigger: 'change' },
  ],
  mpoint_id: [{ required: true, message: '请选择计量点', trigger: 'change' }],
};

const getEnergyStorageUnitTypeData = async () => {
  if (!props.api.getIotMpointQuery) return;
  try {
    const res = await props.api.getIotMpointQuery({
      origin: '拓扑配置-获取计量点',
    });
    const { code, result } = res || {};
    if (code === '00000') {
      dataSource.value = result?.data || [];
    }
  } catch (e) {
    console.error('err', e);
  }
};

onMounted(() => {
  getEnergyStorageUnitTypeData();
});

const setFormValue = async (data) => {
  const { name, id: idVal, mpoint } = data || {};
  const { id } = mpoint || {};
  title.value = '编辑并网点';
  ruleForm.name = name;
  ruleForm.mpoint_id = id;
  currentId.value = idVal;
  type.value = 'edit';

  await getEnergyStorageUnitTypeData();

  // If mpoint exists but not in dataSource, add it
  if (mpoint && !dataSource.value.find((item) => item.id === mpoint.id)) {
    dataSource.value.push(mpoint);
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
      let params = {
        parent_id: props.currentParentId,
        origin: '并网点添加',
        ...ruleForm,
      };
      let apiMethod = 'addParallelBranches';
      if (type.value === 'edit') {
        params = {
          id: currentId.value,
          origin: '并网点编辑',
          ...ruleForm,
        };
        apiMethod = 'editParallelBranches';
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

defineExpose({
  setFormValue,
});
</script>

<style lang="scss" scoped>
.add-parallel-branches {
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
