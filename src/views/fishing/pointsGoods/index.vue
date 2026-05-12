<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:pointsGoods:add']">新增</el-button></el-col>
      <right-toolbar @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" prop="goodsId" width="70" align="center" />
      <el-table-column label="名称" prop="name" align="center" />
      <el-table-column label="类型" width="90" align="center">
        <template #default="s"><el-tag>{{ {coupon:'优惠券',goods:'实物',duration:'免费时长'}[s.row.type] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="所需积分" prop="pointsCost" width="100" align="center" />
      <el-table-column label="库存" prop="stock" width="80" align="center" />
      <el-table-column label="排序" prop="sortNum" width="70" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="s"><el-tag :type="s.row.status==='0'?'success':'info'">{{ s.row.status==='0'?'上架':'下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:pointsGoods:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['fishing:pointsGoods:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type"><el-option label="优惠券" value="coupon" /><el-option label="实物" value="goods" /><el-option label="免费时长" value="duration" /></el-select></el-form-item>
        <el-form-item label="所需积分" prop="pointsCost"><el-input-number v-model="form.pointsCost" :min="1" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
        <el-form-item label="免费分钟" v-if="form.type==='duration'"><el-input-number v-model="form.durationMinutes" :min="1" /></el-form-item>
        <el-form-item label="图片"><image-upload v-model="form.image" :limit="1" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortNum" :min="0" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio label="0">上架</el-radio><el-radio label="1">下架</el-radio></el-radio-group></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open=false">取 消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="PointsGoods">
import { listPointsGoods, getPointsGoods, addPointsGoods, updatePointsGoods, delPointsGoods } from '@/api/fishing/points'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), open = ref(false), title = ref(''), total = ref(0)
const queryParams = ref({ pageNum:1, pageSize:20 })
const form = ref({}), rules = { name:[{required:true,message:'请输入名称',trigger:'blur'}], pointsCost:[{required:true,message:'请输入积分',trigger:'blur'}] }

function getList() { loading.value=true; listPointsGoods(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function reset() { form.value={type:'coupon',status:'0',stock:999,sortNum:0,pointsCost:100} }
function handleAdd() { reset(); open.value=true; title.value='新增积分商品' }
function handleUpdate(row) { getPointsGoods(row.goodsId).then(r=>{form.value=r.data;open.value=true;title.value='修改积分商品'}) }
function submitForm() { proxy.$refs.formRef.validate(v=>{if(!v)return;if(form.value.goodsId){updatePointsGoods(form.value).then(()=>{proxy.$modal.msgSuccess('修改成功');open.value=false;getList()})}else{addPointsGoods(form.value).then(()=>{proxy.$modal.msgSuccess('新增成功');open.value=false;getList()})}}) }
function handleDelete(row) { proxy.$modal.confirm('确认删除？').then(()=>delPointsGoods([row.goodsId])).then(()=>{getList();proxy.$modal.msgSuccess('删除成功')}) }
getList()
</script>
