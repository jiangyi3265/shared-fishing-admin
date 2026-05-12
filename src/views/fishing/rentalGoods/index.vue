<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:rental:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:rental:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="goodsId" width="70" align="center" />
      <el-table-column label="名称" prop="name" align="center" />
      <el-table-column label="分类" prop="category" width="90" align="center" />
      <el-table-column label="押金(元)" width="100" align="center">
        <template #default="s">{{ ((s.row.depositCents||0)/100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="租金(元)" width="100" align="center">
        <template #default="s">{{ ((s.row.rentCents||0)/100).toFixed(2) }}/{{ s.row.rentUnit==='per_hour'?'时':'次' }}</template>
      </el-table-column>
      <el-table-column label="库存" prop="stock" width="70" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="s"><el-tag :type="s.row.status==='0'?'success':'info'">{{ s.row.status==='0'?'上架':'下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:rental:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:rental:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="钓椅/抄网/鱼竿/饵料" /></el-form-item>
        <el-form-item label="押金(分)"><el-input-number v-model="form.depositCents" :min="0" /></el-form-item>
        <el-form-item label="租金(分)"><el-input-number v-model="form.rentCents" :min="0" /></el-form-item>
        <el-form-item label="计费方式"><el-radio-group v-model="form.rentUnit"><el-radio label="per_use">按次</el-radio><el-radio label="per_hour">按小时</el-radio></el-radio-group></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
        <el-form-item label="图片"><image-upload v-model="form.image" :limit="1" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio label="0">上架</el-radio><el-radio label="1">下架</el-radio></el-radio-group></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open=false">取 消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="RentalGoods">
import { listRentalGoods, getRentalGoods, addRentalGoods, updateRentalGoods, delRentalGoods } from '@/api/fishing/rental'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), open = ref(false), title = ref(''), total = ref(0), ids = ref([]), single = ref(true), multiple = ref(true), showSearch = ref(true)
const queryParams = ref({ pageNum:1, pageSize:20 })
const form = ref({}), rules = { name:[{required:true,message:'请输入名称',trigger:'blur'}] }

function getList() { loading.value=true; listRentalGoods(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function handleSelectionChange(s) { ids.value=s.map(i=>i.goodsId); single.value=s.length!==1; multiple.value=!s.length }
function reset() { form.value={status:'0',rentUnit:'per_use',depositCents:0,rentCents:0,stock:1} }
function handleAdd() { reset(); open.value=true; title.value='新增租赁装备' }
function handleUpdate(row) { getRentalGoods(row.goodsId||ids.value[0]).then(r=>{form.value=r.data;open.value=true;title.value='修改租赁装备'}) }
function submitForm() { proxy.$refs.formRef.validate(v=>{if(!v)return;if(form.value.goodsId){updateRentalGoods(form.value).then(()=>{proxy.$modal.msgSuccess('修改成功');open.value=false;getList()})}else{addRentalGoods(form.value).then(()=>{proxy.$modal.msgSuccess('新增成功');open.value=false;getList()})}}) }
function handleDelete(row) { const d=row.goodsId?[row.goodsId]:ids.value; proxy.$modal.confirm('确认删除？').then(()=>delRentalGoods(d)).then(()=>{getList();proxy.$modal.msgSuccess('删除成功')}) }
getList()
</script>
