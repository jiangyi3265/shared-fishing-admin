<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="套餐名" prop="title">
        <el-input v-model="queryParams.title" clearable style="width:200px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable style="width:120px">
          <el-option label="上架" value="0" />
          <el-option label="下架" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" icon="Plus" @click="openAdd" v-hasPermi="['fishing:rechargePlan:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" icon="Delete" :disabled="!selected.length" @click="handleDelete()" v-hasPermi="['fishing:rechargePlan:remove']">删除</el-button></el-col>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="(rows) => selected = rows.map(r => r.planId)">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="planId" width="80" />
      <el-table-column label="套餐名" prop="title" />
      <el-table-column label="角标" prop="badge" width="160" />
      <el-table-column label="支付金额" width="120">
        <template #default="s">¥{{ ((s.row.amountCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="赠送金额" width="120">
        <template #default="s"><span style="color:#b8860b">+¥{{ ((s.row.bonusCents || 0) / 100).toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column label="实际入账" width="120">
        <template #default="s">¥{{ (((s.row.amountCents || 0) + (s.row.bonusCents || 0)) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '上架' : '下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="s">
          <el-button link type="primary" @click="openEdit(s.row)" v-hasPermi="['fishing:rechargePlan:edit']">编辑</el-button>
          <el-button link type="danger"  @click="handleDelete(s.row)" v-hasPermi="['fishing:rechargePlan:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="form.planId ? '编辑套餐' : '新增套餐'" v-model="dialogOpen" width="460px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="套餐名"><el-input v-model="form.title" placeholder="如：超值储值" /></el-form-item>
        <el-form-item label="支付金额(元)"><el-input-number v-model="form.amountYuan" :min="1" :precision="2" :step="50" /></el-form-item>
        <el-form-item label="赠送金额(元)"><el-input-number v-model="form.bonusYuan" :min="0" :precision="2" :step="10" /></el-form-item>
        <el-form-item label="角标"><el-input v-model="form.badge" placeholder="如：送50元 · 推荐" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">上架</el-radio>
            <el-radio label="1">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RechargePlan">
import { listPlan, addPlan, updatePlan, delPlan } from '@/api/fishing/rechargePlan'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const selected = ref([])
const dialogOpen = ref(false)
const form = ref({})

const queryParams = ref({ pageNum: 1, pageSize: 10, title: undefined, status: undefined })

function getList() {
  loading.value = true
  listPlan(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { queryParams.value = { pageNum: 1, pageSize: 10 }; getList() }
function openAdd() { form.value = { amountYuan: 100, bonusYuan: 10, sort: 0, status: '0', badge: '' }; dialogOpen.value = true }
function openEdit(row) {
  form.value = { ...row, amountYuan: ((row.amountCents || 0) / 100), bonusYuan: ((row.bonusCents || 0) / 100) }
  dialogOpen.value = true
}
function submit() {
  const data = {
    ...form.value,
    amountCents: Math.round((form.value.amountYuan || 0) * 100),
    bonusCents: Math.round((form.value.bonusYuan || 0) * 100)
  }
  delete data.amountYuan
  delete data.bonusYuan
  const fn = data.planId ? updatePlan : addPlan
  fn(data).then(() => { proxy.$modal.msgSuccess('保存成功'); dialogOpen.value = false; getList() })
}
function handleDelete(row) {
  const ids = row ? [row.planId] : selected.value
  if (!ids.length) return
  proxy.$modal.confirm('确定删除选中套餐?').then(() => delPlan(ids))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); getList() }).catch(() => {})
}

getList()
</script>
