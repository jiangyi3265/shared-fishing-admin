<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="钓位名" prop="spotName">
        <el-input v-model="queryParams.spotName" placeholder="钓位名称" clearable style="width:180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类型" prop="spotType">
        <el-select v-model="queryParams.spotType" placeholder="类型" clearable style="width:120px">
          <el-option label="普通" value="normal" /><el-option label="VIP" value="vip" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:spot:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['fishing:spot:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="spotId" width="70" align="center" />
      <el-table-column label="钓位名" prop="spotName" align="center" />
      <el-table-column label="类型" width="80" align="center">
        <template #default="s"><el-tag :type="s.row.spotType==='vip'?'warning':'info'">{{ s.row.spotType==='vip'?'VIP':'普通' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="附加费(元)" width="110" align="center">
        <template #default="s">{{ ((s.row.extraFeeCents||0)/100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="容量" prop="capacity" width="70" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="s"><el-tag :type="s.row.status==='0'?'success':s.row.status==='1'?'warning':'danger'">{{ {0:'可用',1:'维护',2:'停用'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:spot:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:spot:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="钓位名称" prop="spotName"><el-input v-model="form.spotName" /></el-form-item>
        <el-form-item label="类型"><el-radio-group v-model="form.spotType"><el-radio label="normal">普通</el-radio><el-radio label="vip">VIP</el-radio></el-radio-group></el-form-item>
        <el-form-item label="附加费(分)"><el-input-number v-model="form.extraFeeCents" :min="0" /></el-form-item>
        <el-form-item label="容量"><el-input-number v-model="form.capacity" :min="1" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortNum" :min="0" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio label="0">可用</el-radio><el-radio label="1">维护</el-radio><el-radio label="2">停用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open=false">取 消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="FishSpot">
import { listSpot, getSpot, addSpot, updateSpot, delSpot } from '@/api/fishing/spot'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), open = ref(false), title = ref(''), total = ref(0), ids = ref([]), single = ref(true), multiple = ref(true), showSearch = ref(true)
const queryParams = ref({ pageNum:1, pageSize:10, spotName:null, spotType:null })
const form = ref({}), rules = { spotName:[{required:true,message:'请输入钓位名称',trigger:'blur'}] }

function getList() { loading.value=true; listSpot(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function handleQuery() { queryParams.value.pageNum=1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(s) { ids.value=s.map(i=>i.spotId); single.value=s.length!==1; multiple.value=!s.length }
function reset() { form.value={spotType:'normal',status:'0',extraFeeCents:0,capacity:1,sortNum:0} }
function handleAdd() { reset(); open.value=true; title.value='新增钓位' }
function handleUpdate(row) { getSpot(row.spotId||ids.value[0]).then(r=>{form.value=r.data;open.value=true;title.value='修改钓位'}) }
function submitForm() { proxy.$refs.formRef.validate(v=>{if(!v)return;if(form.value.spotId){updateSpot(form.value).then(()=>{proxy.$modal.msgSuccess('修改成功');open.value=false;getList()})}else{addSpot(form.value).then(()=>{proxy.$modal.msgSuccess('新增成功');open.value=false;getList()})}}) }
function handleDelete(row) { const d=row.spotId?[row.spotId]:ids.value; proxy.$modal.confirm('确认删除？').then(()=>delSpot(d)).then(()=>{getList();proxy.$modal.msgSuccess('删除成功')}) }
getList()
</script>
