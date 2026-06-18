# GitHub Actions 部署说明

管理端推送到 `main` 后会自动执行 `.github/workflows/deploy.yml`：

1. 使用 Node 20 安装依赖。
2. 执行 `npm run build:prod`。
3. 打包 `dist`。
4. 通过 SSH 上传并解压到 `/www/wwwroot/ht.diaoyuus.cn`。

## GitHub Secrets

在 GitHub 仓库进入 `Settings -> Secrets and variables -> Actions`，添加：

| Secret | 必填 | 说明 |
| --- | --- | --- |
| `SSH_HOST` | 是 | 服务器 IP 或域名 |
| `SSH_USER` | 是 | SSH 用户 |
| `SSH_PORT` | 否 | SSH 端口，默认 `22` |
| `SSH_PASSWORD` | 二选一 | SSH 密码 |
| `SSH_PRIVATE_KEY` | 二选一 | SSH 私钥，推荐用这个替代密码 |

生产接口前缀在 `.env.production` 中配置：

```env
VITE_APP_BASE_API = '/prod-api'
```

Nginx 需要把 `/prod-api/` 反代到后端服务，例如：

```nginx
location /prod-api/ {
    rewrite ^/prod-api/(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```
