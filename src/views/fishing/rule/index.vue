<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="queryParams.ruleName" placeholder="请输入规则名称" clearable style="width:220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:160px">
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:rule:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['fishing:rule:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:rule:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="ruleId" width="70" />
      <el-table-column label="规则名称" align="center" prop="ruleName" />
      <el-table-column label="单位时长(分钟)" align="center" prop="stepMinutes" width="120" />
      <el-table-column label="单位价格(元)" align="center" width="120">
        <template #default="s">{{ (s.row.pricePerStepCents / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="起步时长(分钟)" align="center" prop="minDurationMinutes" width="120" />
      <el-table-column label="封顶金额(元)" align="center" width="120">
        <template #default="s">{{ ((s.row.capAmountCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template #default="s">
          <el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="摘要" align="center" prop="summary" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:rule:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:rule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="规则名称" prop="ruleName"><el-input v-model="form.ruleName" /></el-form-item>
        <el-form-item label="单位时长(分钟)" prop="stepMinutes">
          <el-input-number v-model="form.stepMinutes" :min="1" :max="1440" />
        </el-form-item>
        <el-form-item label="单位价格(分)" prop="pricePerStepCents">
          <el-input-number v-model="form.pricePerStepCents" :min="0" />
        </el-form-item>
        <el-form-item label="起步时长(分钟)" prop="minDurationMinutes">
          <el-input-number v-model="form.minDurationMinutes" :min="0" />
        </el-form-item>
        <el-form-item label="封顶金额(分)" prop="capAmountCents">
          <el-input-number v-model="form.capAmountCents" :min="0" />
          <span style="color:#909399;margin-left:8px">0 表示不封顶</span>
        </el-form-item>
        <el-form-item label="进位方式" prop="roundType">
          <el-select v-model="form.roundType" style="width:100%">
            <el-option label="向上取整至单位" value="ceil_step" />
            <el-option label="向上取整至分钟" value="ceil_minute" />
            <el-option label="向上取整至小时" value="ceil_hour" />
          </el-select>
        </el-form-item>
        <el-form-item label="摘要" prop="summary"><el-input v-model="form.summary" type="textarea" :rows="2" /></el-form-item>

        <el-divider>分时段价格（可选）</el-divider>
        <div v-for="(seg, idx) in form.segments" :key="idx" class="segment-row">
          <el-time-picker v-model="seg.start" format="HH:mm" value-format="HH:mm" placeholder="起" style="width:110px" />
          <el-time-picker v-model="seg.end" format="HH:mm" value-format="HH:mm" placeholder="止" style="width:110px" />
          <el-input-number v-model="seg.pricePerStepCents" :min="0" placeholder="单位价格(分)" />
          <el-button link type="danger" @click="form.segments.splice(idx, 1)">移除</el-button>
        </div>
        <el-button size="small" @click="form.segments.push({ start: '18:00', end: '06:00', pricePerStepCents: form.pricePerStepCents })">+ 新增时段</el-button>

        <el-form-item label="状态" style="margin-top:12px">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Rule">
import { listRule, getRule, addRule, updateRule, delRule } from '@/api/fishing/rule'

const { proxy } = getCurrentInstance()
const list = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: { status: '0', stepMinutes: 30, pricePerStepCents: 300, minDurationMinutes: 30, capAmountCents: 0, roundType: 'ceil_step', segments: [] },
  queryParams: { pageNum: 1, pageSize: 10, ruleName: undefined, status: undefined },
  rules: {
    ruleName: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
    stepMinutes: [{ required: true, message: '单位时长不能为空' }],
    pricePerStepCents: [{ required: true, message: '单位价格不能为空' }]
  }
})
const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listRule(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { status: '0', stepMinutes: 30, pricePerStepCents: 300, minDurationMinutes: 30, capAmountCents: 0, roundType: 'ceil_step', segments: [] }
  proxy.resetForm('formRef')
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.ruleId); single.value = sel.length !== 1; multiple.value = !sel.length }
function handleAdd() { reset(); open.value = true; title.value = '新增规则' }
function handleUpdate(row) {
  reset()
  const ruleId = row?.ruleId || ids.value[0]
  getRule(ruleId).then(res => {
    const d = res.data || {}
    let segments = []
    if (d.timeSegmentJson) {
      try { segments = JSON.parse(d.timeSegmentJson) || [] } catch (e) {}
    }
    form.value = { ...d, segments }
    open.value = true
    title.value = '修改规则'
  })
}
function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (!valid) return
    const payload = { ...form.value }
    if (payload.segments && payload.segments.length) {
      payload.timeSegmentJson = JSON.stringify(payload.segments.filter(s => s.start && s.end))
    } else {
      payload.timeSegmentJson = ''
    }
    delete payload.segments
    const fn = payload.ruleId ? updateRule : addRule
    fn(payload).then(() => { proxy.$modal.msgSuccess(payload.ruleId ? '修改成功' : '新增成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const ruleIds = row?.ruleId || ids.value
  proxy.$modal.confirm('是否确认删除?').then(() => delRule(ruleIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

getList()
</script>

<style scoped>
.segment-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
</style>
