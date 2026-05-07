# 共享钓场管理后台

共享钓场管理后台是面向钓场运营人员的 Web 管理端，用于维护钓场基础数据、查看订单与用户信息、管理活动与优惠券，并对接后端服务完成权限、菜单、系统监控和业务配置管理。项目基于 Vue3 与 RuoYi-Vue3 前端结构改造。

## 技术栈

- Vue 3.5
- Vite 6
- Element Plus
- Pinia
- Vue Router
- Axios
- ECharts
- Sass

## 关联仓库

| 子项目 | 仓库 | 说明 |
| --- | --- | --- |
| 后端服务 | [shared-fishing-backend](https://github.com/jiangyi3265/shared-fishing-backend) | 提供业务接口、权限、订单、计时和系统管理能力 |
| 管理后台 | [shared-fishing-admin](https://github.com/jiangyi3265/shared-fishing-admin) | 面向钓场管理员的 Web 管理端 |
| 用户端 | [shared-fishing-app](https://github.com/jiangyi3265/shared-fishing-app) | 面向钓场用户的 uni-app / 微信小程序端 |

## 快速启动

1. 安装依赖：

```bash
npm install
```

2. 根据后端地址调整环境配置：

```text
.env.development
```

3. 启动开发服务：

```bash
npm run dev
```

4. 构建生产包：

```bash
npm run build:prod
```

## 简历描述示例

基于 Vue3、Vite、Element Plus 和 Pinia 搭建共享钓场管理后台，支持订单、用户、活动、优惠券和系统权限等运营管理场景。通过模块化路由、接口封装和权限控制提升后台配置与业务运营效率。
