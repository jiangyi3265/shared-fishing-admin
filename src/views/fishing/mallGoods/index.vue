<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="商品名" prop="name"><el-input v-model="queryParams.name" clearable style="width:200px" /></el-form-item>
      <el-form-item label="分类" prop="catId">
        <el-select v-model="queryParams.catId" clearable style="width:160px">
          <el-option v-for="c in catOptions" :key="c.catId" :label="c.name" :value="c.catId" />
        </el-select>
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
      <el-col :span="1.5"><el-button type="primary" icon="Plus" @click="openAdd" v-hasPermi="['fishing:mallGoods:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" icon="Delete" :disabled="!selected.length" @click="handleDelete()" v-hasPermi="['fishing:mallGoods:remove']">删除</el-button></el-col>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="(rows) => selected = rows.map(r => r.goodsId)">
      <el-table-column type="selection" width="55" />
      <el-table-column label="封面" width="80">
        <template #default="s"><span style="font-size:36px">{{ s.row.cover }}</span></template>
      </el-table-column>
      <el-table-column label="商品名" prop="name" />
      <el-table-column label="分类" prop="catName" width="100" />
      <el-table-column label="副标题" prop="subtitle" show-overflow-tooltip />
      <el-table-column label="售价" width="100">
        <template #default="s">¥{{ ((s.row.priceCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="库存" prop="stock" width="80" />
      <el-table-column label="已售" prop="sales" width="80" />
      <el-table-column label="状态" width="120">
        <template #default="s">
          <el-switch v-model="s.row.status" active-value="0" inactive-value="1" @change="(v) => onToggle(s.row, v)" v-hasPermi="['fishing:mallGoods:toggle']" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="s">
          <el-button link type="primary" @click="openEdit(s.row)" v-hasPermi="['fishing:mallGoods:edit']">编辑</el-button>
          <el-button link type="danger"  @click="handleDelete(s.row)" v-hasPermi="['fishing:mallGoods:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="form.goodsId ? '编辑商品' : '新增商品'" v-model="dialogOpen" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="商品名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.subtitle" placeholder="如：40g · 经典款" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.catId" placeholder="请选择" style="width:100%">
            <el-option v-for="c in catOptions" :key="c.catId" :label="c.name" :value="c.catId" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面"><el-input v-model="form.cover" placeholder="emoji 或 url" /></el-form-item>
        <el-form-item label="售价(元)">
          <el-input-number v-model="form.priceYuan" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">上架</el-radio>
            <el-radio label="1">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="详情">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品介绍" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MallGoods">
import { listMallGoods, addMallGoods, updateMallGoods, delMallGoods, toggleMallGoods } from '@/api/fishing/mallGoods'
import { listMallCategory } from '@/api/fishing/mallCategory'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const selected = ref([])
const dialogOpen = ref(false)
const form = ref({})
const catOptions = ref([])

const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, catId: undefined, status: undefined })

function loadCats() { listMallCategory({ pageNum: 1, pageSize: 100 }).then(res => catOptions.value = res.rows || []) }
function getList() {
  loading.value = true
  listMallGoods(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { queryParams.value = { pageNum: 1, pageSize: 10 }; getList() }

function openAdd() { form.value = { priceYuan: 0, stock: 0, sort: 0, status: '0', cover: '🎣' }; dialogOpen.value = true }
function openEdit(row) {
  form.value = { ...row, priceYuan: ((row.priceCents || 0) / 100) }
  dialogOpen.value = true
}
function submitForm() {
  const data = { ...form.value, priceCents: Math.round((form.value.priceYuan || 0) * 100) }
  delete data.priceYuan
  const fn = data.goodsId ? updateMallGoods : addMallGoods
  fn(data).then(() => { proxy.$modal.msgSuccess('保存成功'); dialogOpen.value = false; getList() })
}
function handleDelete(row) {
  const ids = row ? [row.goodsId] : selected.value
  if (!ids.length) return
  proxy.$modal.confirm('确定删除选中商品?').then(() => delMallGoods(ids))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); getList() }).catch(() => {})
}
function onToggle(row, status) {
  toggleMallGoods(row.goodsId, status).then(() => proxy.$modal.msgSuccess(status === '0' ? '已上架' : '已下架'))
}

loadCats()
getList()
</script>
