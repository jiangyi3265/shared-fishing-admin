<template>
  <div class="app-container">
    <div class="page-heading">
      <div>
        <h2>轮播图管理</h2>
        <p>维护小程序首页轮播内容，可上传普通轮播图或带报名信息的活动轮播图。</p>
      </div>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['fishing:ad:add']">新增轮播图</el-button>
    </div>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入标题" clearable style="width:220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="轮播类型" prop="adType">
        <el-select v-model="queryParams.adType" placeholder="轮播类型" clearable style="width:160px">
          <el-option label="普通轮播图" value="ad" />
          <el-option label="活动轮播图" value="activity" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:ad:add']">新增轮播图</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['fishing:ad:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:ad:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="adId" width="70" />
      <el-table-column label="封面图" align="center" width="100">
        <template #default="s">
          <image-preview v-if="s.row.image" :src="s.row.image" width="64px" height="40px" />
          <span v-else class="muted-text">未上传</span>
        </template>
      </el-table-column>
      <el-table-column label="轮播类型" align="center" prop="adType" width="110">
        <template #default="s">
          <el-tag :type="s.row.adType === 'activity' ? 'success' : 'info'">{{ s.row.adType === 'activity' ? '活动轮播图' : '普通轮播图' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" align="center" prop="title" />
      <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="活动日期" align="center" prop="activityDate" width="120" />
      <el-table-column label="报名费(元)" align="center" width="110">
        <template #default="s">{{ s.row.adType === 'activity' ? ((s.row.activityFeeCents || 0) / 100).toFixed(2) : '--' }}</template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortNum" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '正常' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:ad:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:ad:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="轮播类型" prop="adType">
          <el-radio-group v-model="form.adType">
            <el-radio label="ad">普通轮播图</el-radio>
            <el-radio label="activity">活动轮播图</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="描述" prop="description"><el-input v-model="form.description" /></el-form-item>
        <el-form-item label="轮播封面图" prop="image">
          <image-upload v-model="form.image" :limit="1" />
          <div class="form-tip">请上传 1 张清晰横图；保存后将作为小程序首页轮播封面。</div>
        </el-form-item>
        <el-form-item label="背景色" prop="bgColor"><el-input v-model="form.bgColor" placeholder="#fff3d1" /></el-form-item>
        <el-form-item label="详情内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortNum" :min="0" /></el-form-item>

        <template v-if="form.adType === 'activity'">
          <el-divider>活动信息</el-divider>
          <el-form-item label="活动名称"><el-input v-model="form.activityName" /></el-form-item>
          <el-form-item label="活动日期"><el-input v-model="form.activityDate" placeholder="2026-05-10" /></el-form-item>
          <el-form-item label="活动地点"><el-input v-model="form.activityLocation" /></el-form-item>
          <el-form-item label="报名费(分)"><el-input-number v-model="form.activityFeeCents" :min="0" /></el-form-item>
          <el-form-item label="名额"><el-input-number v-model="form.activitySlots" :min="0" /></el-form-item>
          <el-form-item label="活动规则"><el-input v-model="form.activityRules" type="textarea" :rows="3" /></el-form-item>
        </template>

        <el-form-item label="关联优惠券">
          <el-select v-model="form.couponTemplateId" placeholder="可选" clearable style="width:100%">
            <el-option v-for="c in couponOptions" :key="c.templateId" :label="c.title" :value="c.templateId" />
          </el-select>
        </el-form-item>
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

<script setup name="Ad">
import { listAd, getAd, addAd, updateAd, delAd } from '@/api/fishing/ad'
import { listCoupon } from '@/api/fishing/coupon'

const { proxy } = getCurrentInstance()
const list = ref([])
const couponOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: { adType: 'ad', status: '0', sortNum: 0 },
  queryParams: { pageNum: 1, pageSize: 10, title: undefined, adType: undefined },
  rules: {
    title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
    image: [{ required: true, message: '请上传轮播封面图', trigger: 'change' }]
  }
})
const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listAd(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function loadCoupons() { listCoupon({ pageNum: 1, pageSize: 100, status: '0' }).then(r => couponOptions.value = r.rows || []) }
function cancel() { open.value = false; reset() }
function clearFormValidate() { nextTick(() => proxy.$refs.formRef?.clearValidate()) }
function reset() {
  form.value = { adType: 'ad', status: '0', sortNum: 0 }
  clearFormValidate()
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.adId); single.value = sel.length !== 1; multiple.value = !sel.length }
function handleAdd() { reset(); open.value = true; title.value = '新增轮播图' }
function handleUpdate(row) {
  reset()
  const adId = row?.adId || ids.value[0]
  getAd(adId).then(res => { form.value = res.data; open.value = true; title.value = '编辑轮播图' })
}
function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (!valid) return
    const fn = form.value.adId ? updateAd : addAd
    fn(form.value).then(() => { proxy.$modal.msgSuccess(form.value.adId ? '修改成功' : '新增成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const adIds = row?.adId || ids.value
  proxy.$modal.confirm('确认删除?').then(() => delAd(adIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

getList()
loadCoupons()
</script>

<style scoped>
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 18px 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}
.page-heading h2 { margin: 0 0 6px; font-size: 20px; color: #303133; }
.page-heading p { margin: 0; color: #606266; }
.form-tip { width: 100%; margin-top: 6px; color: #909399; font-size: 12px; line-height: 1.5; }
.muted-text { color: #c0c4cc; font-size: 12px; }
</style>
