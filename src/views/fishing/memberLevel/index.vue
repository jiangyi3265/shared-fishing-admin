<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:memberLevel:add']">新增</el-button></el-col>
      <right-toolbar @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" prop="levelId" width="70" align="center" />
      <el-table-column label="等级名称" prop="levelName" width="120" align="center" />
      <el-table-column label="消费门槛(元)" width="130" align="center">
        <template #default="s">{{ ((s.row.minConsumeCents||0)/100).toFixed(0) }}</template>
      </el-table-column>
      <el-table-column label="折扣" width="80" align="center">
        <template #default="s">{{ s.row.discountRate }}%</template>
      </el-table-column>
      <el-table-column label="免押金" width="80" align="center">
        <template #default="s"><el-tag v-if="s.row.freeDeposit" type="success">是</el-tag></template>
      </el-table-column>
      <el-table-column label="优先订位" width="90" align="center">
        <template #default="s"><el-tag v-if="s.row.priorityReserve" type="success">是</el-tag></template>
      </el-table-column>
      <el-table-column label="排序" prop="sortNum" width="70" align="center" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:memberLevel:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:memberLevel:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="title" v-model="open" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="等级名称" prop="levelName"><el-input v-model="form.levelName" /></el-form-item>
        <el-form-item label="消费门槛(分)" prop="minConsumeCents"><el-input-number v-model="form.minConsumeCents" :min="0" /></el-form-item>
        <el-form-item label="折扣(%)" prop="discountRate"><el-input-number v-model="form.discountRate" :min="1" :max="100" /></el-form-item>
        <el-form-item label="免押金"><el-switch v-model="form.freeDeposit" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="优先订位"><el-switch v-model="form.priorityReserve" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="其他权益"><el-input v-model="form.extraBenefits" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortNum" :min="0" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open=false">取 消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberLevel">
import { listMemberLevel, getMemberLevel, addMemberLevel, updateMemberLevel, delMemberLevel } from '@/api/fishing/memberLevel'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), open = ref(false), title = ref('')
const form = ref({}), rules = { levelName:[{required:true,message:'请输入等级名称',trigger:'blur'}], minConsumeCents:[{required:true,message:'请输入门槛',trigger:'blur'}], discountRate:[{required:true,message:'请输入折扣',trigger:'blur'}] }

function getList() { loading.value=true; listMemberLevel({pageNum:1,pageSize:100}).then(r=>{list.value=r.rows;loading.value=false}) }
function reset() { form.value={discountRate:100,freeDeposit:0,priorityReserve:0,sortNum:0,status:'0'} }
function handleAdd() { reset(); open.value=true; title.value='新增等级' }
function handleUpdate(row) { getMemberLevel(row.levelId).then(r=>{form.value=r.data;open.value=true;title.value='修改等级'}) }
function submitForm() { proxy.$refs.formRef.validate(v=>{if(!v)return;if(form.value.levelId){updateMemberLevel(form.value).then(()=>{proxy.$modal.msgSuccess('修改成功');open.value=false;getList()})}else{addMemberLevel(form.value).then(()=>{proxy.$modal.msgSuccess('新增成功');open.value=false;getList()})}}) }
function handleDelete(row) { proxy.$modal.confirm('确认删除？').then(()=>delMemberLevel([row.levelId])).then(()=>{getList();proxy.$modal.msgSuccess('删除成功')}) }
getList()
</script>
