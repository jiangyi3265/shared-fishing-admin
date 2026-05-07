<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="名称" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入名称" clearable style="width:220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类型" prop="couponType">
        <el-select v-model="queryParams.couponType" placeholder="类型" clearable style="width:160px">
          <el-option label="满减券" value="amount" />
          <el-option label="时长券" value="duration" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:coupon:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['fishing:coupon:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:coupon:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="templateId" width="70" />
      <el-table-column label="名称" align="center" prop="title" />
      <el-table-column label="类型" align="center" width="100">
        <template #default="s"><el-tag :type="s.row.couponType === 'amount' ? 'warning' : 'success'">{{ s.row.couponType === 'amount' ? '满减券' : '时长券' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="面值" align="center" width="140">
        <template #default="s">{{ s.row.couponType === 'amount' ? `¥${(s.row.couponValue / 100).toFixed(2)}` : `${s.row.couponValue} 分钟` }}</template>
      </el-table-column>
      <el-table-column label="门槛" align="center" width="120">
        <template #default="s">¥{{ ((s.row.minAmountCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="有效天数" align="center" prop="validDays" width="100" />
      <el-table-column label="库存/已发" align="center" width="120">
        <template #default="s">{{ s.row.totalStock || '不限' }} / {{ s.row.issuedCount || 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '正常' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:coupon:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:coupon:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="名称" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型" prop="couponType">
          <el-radio-group v-model="form.couponType">
            <el-radio label="amount">满减券</el-radio>
            <el-radio label="duration">时长券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.couponType === 'amount' ? '面值(分)' : '时长(分钟)'" prop="couponValue">
          <el-input-number v-model="form.couponValue" :min="1" />
        </el-form-item>
        <el-form-item label="使用门槛(分)" prop="minAmountCents">
          <el-input-number v-model="form.minAmountCents" :min="0" />
        </el-form-item>
        <el-form-item label="有效天数" prop="validDays">
          <el-input-number v-model="form.validDays" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="总库存" prop="totalStock">
          <el-input-number v-model="form.totalStock" :min="0" />
          <span style="color:#909399;margin-left:8px">0 表示不限</span>
        </el-form-item>
        <el-form-item label="发放来源" prop="source"><el-input v-model="form.source" placeholder="例如 activity/ad" /></el-form-item>
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
  </div>
</template>

<script setup name="CouponTpl">
import { listCoupon, getCoupon, addCoupon, updateCoupon, delCoupon } from '@/api/fishing/coupon'

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
  form: { couponType: 'amount', status: '0', validDays: 30, minAmountCents: 0, totalStock: 0 },
  queryParams: { pageNum: 1, pageSize: 10, title: undefined, couponType: undefined },
  rules: {
    title: [{ required: true, message: '名称不能为空' }],
    couponType: [{ required: true, message: '类型不能为空' }],
    couponValue: [{ required: true, message: '面值不能为空' }]
  }
})
const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listCoupon(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function cancel() { open.value = false; reset() }
function reset() { form.value = { couponType: 'amount', status: '0', validDays: 30, minAmountCents: 0, totalStock: 0 }; proxy.resetForm('formRef') }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.templateId); single.value = sel.length !== 1; multiple.value = !sel.length }
function handleAdd() { reset(); open.value = true; title.value = '新增优惠券' }
function handleUpdate(row) {
  reset()
  const tid = row?.templateId || ids.value[0]
  getCoupon(tid).then(res => { form.value = res.data; open.value = true; title.value = '修改优惠券' })
}
function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (!valid) return
    const fn = form.value.templateId ? updateCoupon : addCoupon
    fn(form.value).then(() => { proxy.$modal.msgSuccess(form.value.templateId ? '修改成功' : '新增成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const tids = row?.templateId || ids.value
  proxy.$modal.confirm('确认删除?').then(() => delCoupon(tids)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

getList()
</script>
