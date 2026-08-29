# 配置用户名和邮箱（仅需在首次使用时设置）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 在当前目录初始化一个新的 Git 仓库
git init

# 克隆远程仓库到本地
git clone <远程仓库地址>

# 查看当前工作区和暂存区的状态
git status

# 将指定文件添加到暂存区（可同时添加多个文件）
git add <文件名>
# 将所有改动添加到暂存区（包括新文件、修改、删除）
git add .

# 将暂存区的内容提交到本地仓库，并附上提交说明
git commit -m "提交说明"
# 2. 在当前提交上创建轻量标签 V1.1
git tag V1.1
# 查看提交历史（按时间倒序）
git log
# 查看简洁的提交历史（一行一条）
git log --oneline

# 查看工作区与暂存区的差异
git diff
# 查看暂存区与最新提交的差异
git diff --cached

# 创建新分支
git branch <分支名>
# 切换分支
git checkout <分支名>
# 创建并切换到新分支（常用）
git checkout -b <分支名>
# 列出所有本地分支（当前分支前有*）
git branch

# 将指定分支合并到当前分支
git merge <分支名>

# 将本地提交推送到远程仓库（默认推送当前分支）
git push
# 首次推送并设置上游分支
git push -u origin <分支名>

# 从远程仓库拉取最新代码并合并到本地
git pull

# 将远程仓库的更新取回本地但不自动合并
git fetch

# 撤销工作区中文件的修改（未暂存）
git checkout -- <文件名>
# 将文件从暂存区移出（取消暂存，但保留工作区修改）
git reset HEAD <文件名>
# 回退到上一个提交（保留工作区修改）
git reset --soft HEAD~1
# 回退到上一个提交（丢弃工作区和暂存区修改）
git reset --hard HEAD~1

# 查看远程仓库信息
git remote -v
# 添加远程仓库地址
git remote add origin <远程仓库地址>

# 储藏当前工作区修改，使工作区干净
git stash
# 恢复最近一次储藏的修改
git stash pop