<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="70px">
      <el-form-item label="钓场" prop="venueId">
        <el-select v-model="queryParams.venueId" placeholder="选择钓场" clearable style="width:180px">
          <el-option v-for="v in venueOptions" :key="v.venueId" :label="v.name" :value="v.venueId" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="qrType">
        <el-select v-model="queryParams.qrType" placeholder="类型" clearable style="width:140px">
          <el-option label="入场" value="start" />
          <el-option label="离场" value="end" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:qrcode:add']">新增</el-button></el-col>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" align="center" prop="qrId" width="70" />
      <el-table-column label="钓场" align="center" prop="venueId" width="100">
        <template #default="s">{{ venueNameMap[s.row.venueId] || s.row.venueId }}</template>
      </el-table-column>
      <el-table-column label="类型" align="center" width="100">
        <template #default="s"><el-tag :type="s.row.qrType === 'start' ? 'success' : 'warning'">{{ s.row.qrType === 'start' ? '入场' : '离场' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="场景值" align="center" prop="sceneValue" />
      <el-table-column label="小程序链接" align="center" :show-overflow-tooltip="true">
        <template #default="s">pages/index/index?action={{ s.row.qrType }}&qrId={{ s.row.qrId }}&venueId={{ s.row.venueId }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '正常' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" icon="Download" @click="handleDownloadQr(s.row)">二维码</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:qrcode:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:qrcode:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="钓场" prop="venueId">
          <el-select v-model="form.venueId" style="width:100%">
            <el-option v-for="v in venueOptions" :key="v.venueId" :label="v.name" :value="v.venueId" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="qrType">
          <el-radio-group v-model="form.qrType">
            <el-radio label="start">入场</el-radio>
            <el-radio label="end">离场</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="场景值" prop="sceneValue"><el-input v-model="form.sceneValue" placeholder="可用于小程序码 scene 参数" /></el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" /></el-form-item>
        <el-form-item label="状态">
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

    <el-dialog v-model="qrVisible" title="二维码" width="400px" append-to-body>
      <div style="text-align:center">
        <p style="margin-bottom:12px;color:#666">{{ qrLabel }}</p>
        <img v-if="qrImageUrl" :src="qrImageUrl" style="width:280px;height:280px" />
      </div>
      <template #footer>
        <el-button type="primary" @click="downloadQrImage">下载图片</el-button>
        <el-button @click="qrVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Qrcode">
import { listQrcode, getQrcode, addQrcode, updateQrcode, delQrcode, getWxaCode } from '@/api/fishing/qrcode'
import { listVenue } from '@/api/fishing/venue'

const { proxy } = getCurrentInstance()
const list = ref([])
const total = ref(0)
const venueOptions = ref([])
const venueNameMap = ref({})
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const title = ref('')

const data = reactive({
  form: { qrType: 'start', status: '0' },
  queryParams: { pageNum: 1, pageSize: 20, venueId: undefined, qrType: undefined },
  rules: {
    venueId: [{ required: true, message: '请选择钓场' }],
    qrType: [{ required: true, message: '请选择类型' }]
  }
})
const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listQrcode(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function loadVenues() {
  listVenue({ pageNum: 1, pageSize: 100 }).then(res => {
    venueOptions.value = res.rows || []
    venueNameMap.value = (res.rows || []).reduce((acc, v) => { acc[v.venueId] = v.name; return acc }, {})
  })
}
function cancel() { open.value = false; reset() }
function reset() { form.value = { qrType: 'start', status: '0' }; proxy.resetForm('formRef') }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleAdd() { reset(); open.value = true; title.value = '新增二维码' }
function handleUpdate(row) {
  reset()
  getQrcode(row.qrId).then(res => { form.value = res.data; open.value = true; title.value = '修改二维码' })
}
function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (!valid) return
    const fn = form.value.qrId ? updateQrcode : addQrcode
    fn(form.value).then(() => { proxy.$modal.msgSuccess(form.value.qrId ? '修改成功' : '新增成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除该二维码?').then(() => delQrcode(row.qrId)).then(() => {
    getList(); proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

const qrVisible = ref(false)
const qrImageUrl = ref('')
const qrLabel = ref('')
let currentQrRow = null

function handleDownloadQr(row) {
  currentQrRow = row
  const venueName = venueNameMap.value[row.venueId] || row.venueId
  const typeLabel = row.qrType === 'start' ? '入场' : '离场'
  qrLabel.value = `${venueName} - ${typeLabel}码`
  if (qrImageUrl.value && qrImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(qrImageUrl.value)
  getWxaCode(row.qrId, { envVersion: 'release', width: 430 }).then(blob => {
    qrImageUrl.value = URL.createObjectURL(blob)
    qrVisible.value = true
  })
}

function downloadQrImage() {
  const link = document.createElement('a')
  link.href = qrImageUrl.value
  const venueName = venueNameMap.value[currentQrRow.venueId] || currentQrRow.venueId
  const typeLabel = currentQrRow.qrType === 'start' ? '入场' : '离场'
  link.download = `${venueName}_${typeLabel}码.png`
  link.click()
}

loadVenues()
getList()
</script>
