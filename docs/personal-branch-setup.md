# Personal Branch Setup

这份文档说明如何在 weid.fun 仓库里建立 personal 分支，用于存储个人博客内容
（文章、reference vault、custom rules 等），同时保持 main 分支作为可开源的框架。

## 背景

weid.fun 是“框架 + 博客”两用的单仓库。通过两个分支区分：

- **main** 分支：框架代码（可开源），个人内容被 `.gitignore`
- **personal** 分支：框架 + 个人内容，个人内容被追踪

两分支共享大部分代码，通过 `.gitignore` 内容不同实现分离。

## 建立步骤

### 1. 确保 main 分支是干净的

```bash
git checkout main
git status
```

Expected: `working tree clean`，没有未提交的个人内容。

### 2. 创建 personal 分支

```bash
git checkout -b personal
```

### 3. 修改 .gitignore，删除“个人内容”段

打开 `.gitignore`，找到这段：

```text
# ============================================================
# 👇 以下是「个人内容」：仅在 main (framework) 分支 ignore
# ============================================================
```

**删除**这一段下面的所有规则（到文件末尾）。personal 分支的 `.gitignore` 只保留：
- 构建产物
- 依赖
- 编辑器/OS
- 环境变量
- brainstorming/superpowers 目录
- oh-my-claudecode state
- inbox 临时区

**不要删除**的：
- `/inbox/`（inbox 始终 ignore，仅作本地临时暂存）
- `/.superpowers/`
- `/.omc/`

### 4. 提交 .gitignore 修改

```bash
git add .gitignore
git commit -m "chore(personal): relax gitignore to track personal content"
```

### 5. 首次发布个人文章

```bash
/publish inbox/my-first-real-article
git add articles/ series/ src/home/home-data.json src/reference-vault/ src/standards/hard-rules.custom.md
git commit -m "blog: publish my-first-real-article"
```

## 日常工作流

### 写文章 / 博客运营 → 都在 personal 分支

```bash
git checkout personal
# 写内容, /publish, 预览, /deploy
```

### 框架更新 / 修 bug → 在 main 分支

```bash
git checkout main
# 改 primitives / scripts / SKILL.md 等
git commit
```

### 把框架更新同步到 personal

```bash
git checkout personal
git merge main
# 解决冲突（通常只是 .gitignore，personal 的版本优先）
```

### 不要做：从 personal 合并回 main

**禁止！** 这会把个人内容污染到 framework 分支。

## Remote 配置（可选）

如果你想把 main 公开但 personal 私有：

```bash
# main 公开 remote
git remote add origin-public git@github.com:weidwonder/weid-fun-framework.git
git push origin-public main

# personal 私有 remote
git remote add origin-private git@github.com:weidwonder/weid-fun-blog.git
git push origin-private personal
```

然后可以用不同的 remote 分别推送。
