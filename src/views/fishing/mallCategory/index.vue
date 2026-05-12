<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" clearable style="width:200px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable style="width:120px">
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
      <el-col :span="1.5"><el-button type="primary" icon="Plus" @click="openAdd" v-hasPermi="['fishing:mallCategory:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" icon="Delete" :disabled="!selected.length" @click="handleDelete()" v-hasPermi="['fishing:mallCategory:remove']">删除</el-button></el-col>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="(rows) => selected = rows.map(r => r.catId)">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="catId" width="80" />
      <el-table-column label="图标" prop="icon" width="80">
        <template #default="s"><span style="font-size:24px">{{ s.row.icon }}</span></template>
      </el-table-column>
      <el-table-column label="分类名" prop="name" />
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{ s.row.status === '0' ? '正常' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="s">
          <el-button link type="primary" @click="openEdit(s.row)" v-hasPermi="['fishing:mallCategory:edit']">编辑</el-button>
          <el-button link type="danger"  @click="handleDelete(s.row)" v-hasPermi="['fishing:mallCategory:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="form.catId ? '编辑分类' : '新增分类'" v-model="dialogOpen" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" placeholder="emoji 或 url" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MallCategory">
import { listMallCategory, addMallCategory, updateMallCategory, delMallCategory } from '@/api/fishing/mallCategory'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const selected = ref([])
const dialogOpen = ref(false)
const form = ref({})

const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, status: undefined })

function getList() {
  loading.value = true
  listMallCategory(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { queryParams.value = { pageNum: 1, pageSize: 10 }; getList() }
function openAdd() { form.value = { sort: 0, status: '0', icon: '🛍️' }; dialogOpen.value = true }
function openEdit(row) { form.value = { ...row }; dialogOpen.value = true }
function submitForm() {
  const fn = form.value.catId ? updateMallCategory : addMallCategory
  fn(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); dialogOpen.value = false; getList() })
}
function handleDelete(row) {
  const ids = row ? [row.catId] : selected.value
  if (!ids.length) return
  proxy.$modal.confirm('确定删除选中分类?').then(() => delMallCategory(ids))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); getList() }).catch(() => {})
}

getList()
</script>
