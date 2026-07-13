<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="所属钓场" prop="venueId">
        <el-select v-model="queryParams.venueId" placeholder="请选择钓场" clearable style="width:180px">
          <el-option v-for="v in activeVenueOptions" :key="v.venueId" :label="v.name" :value="v.venueId" />
        </el-select>
      </el-form-item>
      <el-form-item label="鱼种" prop="fishSpecies">
        <el-input v-model="queryParams.fishSpecies" placeholder="请输入鱼种" clearable style="width:180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="放鱼时间">
        <el-date-picker v-model="dateRange" style="width:240px" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:stocking:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:stocking:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="recordId" width="70" />
      <el-table-column label="所属钓场" align="center" prop="venueName" min-width="120">
        <template #default="s">{{ s.row.venueName || venueNameMap[s.row.venueId] || s.row.venueId || '--' }}</template>
      </el-table-column>
      <el-table-column label="鱼种" align="center" prop="fishSpecies" />
      <el-table-column label="斤数" align="center" prop="weightJin" width="90" />
      <el-table-column label="尾数" align="center" prop="fishCount" width="80" />
      <el-table-column label="放鱼时间" align="center" prop="stockingTime" width="170" />
      <el-table-column label="图片" align="center" width="80">
        <template #default="s">
          <el-image v-if="s.row.image" :src="s.row.image" style="width:40px;height:40px" fit="cover" :preview-src-list="[s.row.image]" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '已发布' : '隐藏' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:stocking:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:stocking:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属钓场" prop="venueId">
          <el-select v-model="form.venueId" placeholder="请选择钓场" style="width:100%">
            <el-option v-for="v in formVenueOptions" :key="v.venueId" :label="v.name" :value="v.venueId" :disabled="String(v.status ?? '0') !== '0'" />
          </el-select>
        </el-form-item>
        <el-form-item label="鱼种" prop="fishSpecies"><el-input v-model="form.fishSpecies" placeholder="如：鲤鱼、草鱼" /></el-form-item>
        <el-form-item label="斤数" prop="weightJin"><el-input-number v-model="form.weightJin" :min="0.1" :precision="1" /></el-form-item>
        <el-form-item label="尾数"><el-input-number v-model="form.fishCount" :min="0" /></el-form-item>
        <el-form-item label="放鱼时间" prop="stockingTime">
          <el-date-picker v-model="form.stockingTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择时间" />
        </el-form-item>
        <el-form-item label="现场图片">
          <image-upload v-model="form.image" :limit="1" />
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.content" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">已发布</el-radio>
            <el-radio label="1">隐藏</el-radio>
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

<script setup name="Stocking">
import { listStocking, getStocking, addStocking, updateStocking, delStocking } from '@/api/fishing/stocking'
import { listVenue } from '@/api/fishing/venue'

const { proxy } = getCurrentInstance()
const loading = ref(true)
const list = ref([])
const venueOptions = ref([])
const activeVenueOptions = computed(() => venueOptions.value.filter(venue => String(venue.status ?? '0') === '0'))
const formVenueOptions = computed(() => {
  const active = activeVenueOptions.value
  const current = venueOptions.value.find(venue => venue.venueId === form.value.venueId)
  return current && !active.some(venue => venue.venueId === current.venueId) ? [...active, current] : active
})
const venueNameMap = ref({})
const open = ref(false)
const title = ref('')
const total = ref(0)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const showSearch = ref(true)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, venueId: null, fishSpecies: null })
const form = ref({})
const rules = {
  venueId: [{ required: true, message: '请选择所属钓场', trigger: 'change' }],
  fishSpecies: [{ required: true, message: '请输入鱼种', trigger: 'blur' }],
  weightJin: [
    { required: true, message: '请输入斤数', trigger: 'blur' },
    { validator: validateWeightJin, trigger: ['blur', 'change'] }
  ],
  stockingTime: [{ required: true, message: '请选择放鱼时间', trigger: 'change' }]
}

function getList() {
  loading.value = true
  const params = { ...queryParams.value }
  if (dateRange.value && dateRange.value.length === 2) {
    params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] }
  }
  listStocking(params).then(res => {
    list.value = res.rows
    total.value = res.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.recordId); single.value = sel.length !== 1; multiple.value = !sel.length }
function loadVenues() {
  listVenue({ pageNum: 1, pageSize: 100 }).then(res => {
    venueOptions.value = res.rows || []
    venueNameMap.value = venueOptions.value.reduce((acc, venue) => {
      acc[venue.venueId] = venue.name
      return acc
    }, {})
    if (!form.value.venueId && activeVenueOptions.value.length === 1) form.value.venueId = activeVenueOptions.value[0].venueId
  })
}
function clearFormValidate() { nextTick(() => proxy.$refs.formRef?.clearValidate()) }
function validateWeightJin(rule, value, callback) {
  if (value === null || value === undefined || value === '') return callback()
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return callback(new Error('放鱼斤数必须大于 0'))
  callback()
}
function reset() {
  form.value = { status: '0' }
  if (activeVenueOptions.value.length === 1) form.value.venueId = activeVenueOptions.value[0].venueId
  clearFormValidate()
}
function handleAdd() { reset(); open.value = true; title.value = '新增放鱼记录' }
function handleUpdate(row) {
  const id = row.recordId || ids.value[0]
  getStocking(id).then(res => { form.value = res.data; open.value = true; title.value = '修改放鱼记录' })
}
function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (!valid) return
    if (form.value.recordId) {
      updateStocking(form.value).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() })
    } else {
      addStocking(form.value).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() })
    }
  })
}
function handleDelete(row) {
  const delIds = row.recordId ? [row.recordId] : ids.value
  proxy.$modal.confirm('确认删除？').then(() => delStocking(delIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
}
function cancel() { open.value = false; reset() }

loadVenues()
getList()
</script>
