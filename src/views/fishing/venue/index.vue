<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="钓场名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入钓场名称" clearable style="width:220px" @keyup.enter="handleQuery" />
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
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:venue:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['fishing:venue:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:venue:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="venueId" width="70" />
      <el-table-column label="钓场名称" align="center" prop="name" />
      <el-table-column label="地址" align="center" prop="address" :show-overflow-tooltip="true" />
      <el-table-column label="电话" align="center" prop="phone" width="140" />
      <el-table-column label="计费规则" align="center" prop="ruleId" width="100" />
      <el-table-column label="路人鱼价(元/斤)" align="center" width="130">
        <template #default="s"><span>{{ s.row.fishPriceCents != null ? (s.row.fishPriceCents / 100).toFixed(2) : '默认11.80' }}</span></template>
      </el-table-column>
      <el-table-column label="会员鱼价(元/斤)" align="center" width="130">
        <template #default="s"><span>{{ s.row.fishMemberPriceCents != null ? (s.row.fishMemberPriceCents / 100).toFixed(2) : '默认9.80' }}</span></template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="s">
          <el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="170">
        <template #default="s"><span>{{ parseTime(s.row.createTime) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:venue:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:venue:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="钓场名称" prop="name"><el-input v-model="form.name" placeholder="请输入钓场名称" /></el-form-item>
        <el-form-item label="地址" prop="address"><el-input v-model="form.address" placeholder="请输入地址" /></el-form-item>
        <el-form-item label="公告" prop="notice"><el-input v-model="form.notice" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="联系方式" prop="phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="计费规则" prop="ruleId">
          <el-select v-model="form.ruleId" placeholder="请选择规则" clearable style="width:100%">
            <el-option v-for="r in ruleOptions" :key="r.ruleId" :label="r.ruleName" :value="r.ruleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="路人鱼价">
          <el-input-number v-model="form.fishPriceYuan" :min="0" :precision="2" :step="0.1" controls-position="right" style="width:160px" />
          <span style="margin-left:8px;color:#909399">元 / 斤（留空用默认 11.80）</span>
        </el-form-item>
        <el-form-item label="会员鱼价">
          <el-input-number v-model="form.fishMemberPriceYuan" :min="0" :precision="2" :step="0.1" controls-position="right" style="width:160px" />
          <span style="margin-left:8px;color:#909399">元 / 斤（留空用默认 9.80）</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Venue">
import { listVenue, getVenue, addVenue, updateVenue, delVenue } from '@/api/fishing/venue'
import { listRule } from '@/api/fishing/rule'

const { proxy } = getCurrentInstance()

const list = ref([])
const ruleOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: { status: '0' },
  queryParams: { pageNum: 1, pageSize: 10, name: undefined, status: undefined },
  rules: {
    name: [{ required: true, message: '钓场名称不能为空', trigger: 'blur' }]
  }
})
const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listVenue(queryParams.value).then(res => {
    list.value = res.rows
    total.value = res.total
    loading.value = false
  })
}
function loadRules() {
  listRule({ pageNum: 1, pageSize: 100, status: '0' }).then(res => { ruleOptions.value = res.rows || [] })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { status: '0' }
  proxy.resetForm('formRef')
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) {
  ids.value = sel.map(i => i.venueId)
  single.value = sel.length !== 1
  multiple.value = !sel.length
}
function handleAdd() { reset(); open.value = true; title.value = '新增钓场' }
function handleUpdate(row) {
  reset()
  const venueId = row?.venueId || ids.value[0]
  getVenue(venueId).then(res => {
    form.value = res.data
    // 分 → 元，回显到表单
    form.value.fishPriceYuan = res.data.fishPriceCents != null ? res.data.fishPriceCents / 100 : undefined
    form.value.fishMemberPriceYuan = res.data.fishMemberPriceCents != null ? res.data.fishMemberPriceCents / 100 : undefined
    open.value = true
    title.value = '修改钓场'
  })
}
function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (!valid) return
    // 元 → 分（留空则置 null，由后端落到默认价）
    const payload = { ...form.value }
    payload.fishPriceCents = (payload.fishPriceYuan === undefined || payload.fishPriceYuan === null || payload.fishPriceYuan === '')
      ? null : Math.round(payload.fishPriceYuan * 100)
    payload.fishMemberPriceCents = (payload.fishMemberPriceYuan === undefined || payload.fishMemberPriceYuan === null || payload.fishMemberPriceYuan === '')
      ? null : Math.round(payload.fishMemberPriceYuan * 100)
    delete payload.fishPriceYuan
    delete payload.fishMemberPriceYuan
    const fn = payload.venueId ? updateVenue : addVenue
    fn(payload).then(() => {
      proxy.$modal.msgSuccess(payload.venueId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  const venueIds = row?.venueId || ids.value
  proxy.$modal.confirm('是否确认删除选中的钓场?').then(() => delVenue(venueIds)).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

getList()
loadRules()
</script>
