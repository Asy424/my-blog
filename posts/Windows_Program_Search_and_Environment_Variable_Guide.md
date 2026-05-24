# Windows 程序查找与环境变量配置完全指南

## 📋 目录

- [一、程序安装方式分类](#一程序安装方式分类)
- [二、命令行安装的程序如何查找](#二命令行安装的程序如何查找)
- [三、手动安装包如何查找](#三手动安装包如何查找)
- [四、环境变量配置方法](#四环境变量配置方法)
- [五、通过代码/脚本查找程序路径](#五通过代码脚本查找程序路径)
- [六、实用工具函数](#六实用工具函数)

---

## 程序安装方式分类

###  包管理器安装（推荐）
- **npm** - Node.js 包管理器
- **pip** - Python 包管理器
- **chocolatey** - Windows 通用包管理器
- **winget** - Windows 官方包管理器
- **scoop** - Windows 命令行安装器

### 图形化安装包
- `.exe` / `.msi` 安装文件
- 从官网下载安装包后双击安装

### 绿色版/便携版
- 直接解压即可使用
- 无需安装，但需要手动配置路径

---

## 命令行安装的程序如何查找

###  npm 安装的程序

```powershell
# 1. 查看全局安装的包
npm list -g | Select-String "包名"

# 2. 获取全局安装目录
npm config get prefix
# 输出示例：C:\Users\用户名\AppData\Roaming\npm

# 3. 如果已在 PATH 中，直接查找
where.exe 命令名
# 或 PowerShell
Get-Command 命令名 | Select-Object Source
```

**示例：查找 Claude CLI**
```powershell
npm list -g | Select-String "claude"
# 输出：@anthropic-ai/claude-code@2.1.150

npm config get prefix
# 输出：C:\Users\Y\AppData\Roaming\npm

where.exe claude
# 输出：C:\Users\Y\AppData\Roaming\npm\claude.cmd
```

### pip 安装的程序

```powershell
# 1. 查看包信息
pip show 包名

# 2. 查看 Python 包安装位置
python -m site --user-site
# 或
pip config get global.target

# 3. 查找可执行文件
where.exe python
Get-Command python | Select-Object Source
```

**示例：查找 Jupyter**
```powershell
pip show jupyter
# 输出包含 Location: C:\Users\用户名\AppData\Local\Programs\Python\Python39\Lib\site-packages

where.exe jupyter
# 输出：C:\Users\用户名\AppData\Local\Programs\Python\Python39\Scripts\jupyter.exe
```

### Chocolatey 安装的软件

```powershell
# 1. 查看已安装的包
choco list --local-only | Select-String "包名"

# 2. 查看包的详细信息
choco info 包名

# 3. Chocolatey 默认安装位置
# C:\ProgramData\chocolatey\lib\包名
```

**示例：查找 Git**
```powershell
choco list --local-only | Select-String "git"
# 输出：git 2.40.0

Get-ChildItem "C:\ProgramData\chocolatey\lib\git*" -ErrorAction SilentlyContinue
```

### Winget 安装的软件

```powershell
# 1. 查看已安装的软件
winget list | Select-String "软件名"

# 2. 查看软件详细信息
winget show 软件ID

# 3. Winget 默认安装位置
# 通常在 C:\Program Files 或用户选择的目录
```

**示例：查找 VS Code**
```powershell
winget list | Select-String "code"
# 输出：Microsoft.VisualStudioCode 1.80.0

where.exe code
```

### Scoop 安装的软件

```powershell
# 1. 查看已安装的软件
scoop list | Select-String "软件名"

# 2. Scoop 默认安装位置
# C:\Users\用户名\scoop\apps\软件名\当前版本
```

---

## 手动安装包如何查找

### 方法一：检查常见安装位置 ⭐

大多数 Windows 软件安装在以下位置：

```powershell
# 系统级安装（所有用户）
C:\Program Files
C:\Program Files (x86)

# 用户级安装（当前用户）
C:\Users\用户名\AppData\Local
C:\Users\用户名\AppData\Roaming
C:\Users\用户名\AppData\Local\Programs
```

**搜索命令：**
```powershell
# 在 Program Files 中搜索
Get-ChildItem "C:\Program Files" -Filter "*关键词*" -ErrorAction SilentlyContinue | 
    Select-Object Name, FullName

# 在 AppData 中搜索
Get-ChildItem "C:\Users\$env:USERNAME\AppData\Local" -Recurse -Filter "*关键词*.exe" -ErrorAction SilentlyContinue | 
    Select-Object FullName -First 5

# 多位置同时搜索
$paths = @(
    "C:\Program Files",
    "C:\Program Files (x86)",
    "C:\Users\$env:USERNAME\AppData\Local",
    "C:\Users\$env:USERNAME\AppData\Roaming"
)

foreach ($path in $paths) {
    Get-ChildItem $path -Recurse -Filter "*chrome*.exe" -ErrorAction SilentlyContinue | 
        Select-Object FullName -First 1
}
# 如果不想写那么多代码，可以用这个简化版本：在所有常见位置搜索 chrome.exe
Get-ChildItem "C:\Program Files","C:\Program Files (x86)","C:\Users\$env:USERNAME\AppData\Local" -Recurse -Filter "chrome.exe" -ErrorAction SilentlyContinue | Select-Object FullName -First 1

```

### 方法二：检查 Windows 注册表 ⭐⭐⭐

注册表是最可靠的查找方式，因为安装程序通常会在此记录信息。

```powershell
# 1. 查看所有已安装的软件
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" | 
    Select-Object DisplayName, DisplayVersion, InstallLocation | 
    Format-Table -AutoSize

# 2. 搜索特定软件
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" | 
    Where-Object { $_.DisplayName -like "*Java*" } | 
    Select-Object DisplayName, InstallLocation

# 3. 检查 32 位软件（WOW6432Node）
Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" | 
    Where-Object { $_.DisplayName -like "*Python*" } | 
    Select-Object DisplayName, InstallLocation

# 4. 检查当前用户的安装
Get-ItemProperty "HKCU:\SOFTWARE\*" -ErrorAction SilentlyContinue | 
    Where-Object { $_.PSChildName -like "*关键词*" } | 
    Select-Object PSChildName, InstallLocation
```

**常用注册表路径：**
```
HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*          # 64位软件
HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*  # 32位软件
HKCU:\SOFTWARE\*                                                      # 当前用户软件
HKLM:\SOFTWARE\JavaSoft\*                                             # Java 特定
HKLM:\SOFTWARE\Python\PythonCore\*\InstallPath                        # Python 特定
```

### 方法三：检查开始菜单快捷方式

```powershell
# 查找开始菜单中的快捷方式
$startMenuPaths = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
    "C:\ProgramData\Microsoft\Windows\Start Menu\Programs"
)

foreach ($path in $startMenuPaths) {
    Get-ChildItem $path -Recurse -Filter "*.lnk" -ErrorAction SilentlyContinue | 
        Where-Object { $_.Name -like "*VS Code*" } | 
        ForEach-Object {
            $shell = New-Object -ComObject WScript.Shell
            $shortcut = $shell.CreateShortcut($_.FullName)
            Write-Host "$($_.Name) -> $($shortcut.TargetPath)"
        }
}
```

### 方法四：使用 where.exe（如果已在 PATH 中）

```powershell
# 最简单的方法，但前提是程序路径已在环境变量中
where.exe 程序名

# 示例
where.exe java
where.exe python
where.exe git
```

### 方法五：全盘搜索（最后手段，很慢）

```powershell
# ⚠️ 警告：非常慢，可能需要几分钟
Get-ChildItem "C:\" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | 
    Select-Object FullName -First 5

# 限制搜索深度加快速度
Get-ChildItem "C:\Program Files" -Recurse -Depth 3 -Filter "python.exe" -ErrorAction SilentlyContinue | 
    Select-Object FullName
```

---

## 环境变量配置方法

### PowerShell 配置（推荐）⭐

#### 添加到用户环境变量（无需管理员权限）

```powershell
# 基本语法
[Environment]::SetEnvironmentVariable(
    "Path", 
    $env:Path + ";你的路径", 
    [EnvironmentVariableTarget]::User
)

# 示例：添加 Java JDK
[Environment]::SetEnvironmentVariable(
    "Path", 
    $env:Path + ";C:\Program Files\Java\jdk-25.0.1\bin", 
    [EnvironmentVariableTarget]::User
)

# 示例：添加 Python
[Environment]::SetEnvironmentVariable(
    "Path", 
    $env:Path + ";C:\Python39;C:\Python39\Scripts", 
    [EnvironmentVariableTarget]::User
)

# 示例：添加 Node.js 全局包
[Environment]::SetEnvironmentVariable(
    "Path", 
    $env:Path + ";C:\Users\Y\AppData\Roaming\npm", 
    [EnvironmentVariableTarget]::User
)
```

#### 添加到系统环境变量（需要管理员权限）

```powershell
# 以管理员身份运行 PowerShell
[Environment]::SetEnvironmentVariable(
    "Path", 
    $env:Path + ";C:\Program Files\Git\bin", 
    [EnvironmentVariableTarget]::Machine
)
```

#### 刷新当前会话的环境变量

```powershell
# 立即生效，无需重启终端
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + 
            [System.Environment]::GetEnvironmentVariable("Path","User")
```

### 使用 setx 命令

```powershell
# 用户级别
setx PATH "%PATH%;C:\你的\路径"

# 系统级别（需要管理员）
setx PATH "%PATH%;C:\你的\路径" /M

# 示例
setx PATH "%PATH%;C:\Program Files\Java\jdk-25.0.1\bin"
```

⚠️ **注意**：`setx` 有长度限制（1024 字符），且不会立即在当前会话生效。

### 图形界面配置（手动）

1. 右键"此电脑" → "属性"
2. "高级系统设置" → "环境变量"
3. 在"用户变量"或"系统变量"中找到 `Path`
4. 点击"编辑" → "新建"
5. 输入路径，确定保存
6. **重启终端**使配置生效

### 验证配置是否成功

```powershell
# 1. 查看当前 PATH
$env:Path -split ';'

# 2. 检查特定路径是否在 PATH 中
$env:Path -like "*C:\Python39*"

# 3. 测试命令
java -version
python --version
node -v
```

---

## 通过代码/脚本查找程序路径

###  PowerShell 脚本查找

```powershell
# 方法1：使用 Get-Command
$command = Get-Command "java" -ErrorAction SilentlyContinue
if ($command) {
    Write-Host "找到: $($command.Source)"
} else {
    Write-Host "未找到"
}

# 方法2：使用 where.exe
$result = where.exe "python" 2>$null
if ($result) {
    Write-Host "找到: $result"
}

# 方法3：检查文件是否存在
if (Test-Path "C:\Program Files\Java\jdk-25.0.1\bin\java.exe") {
    Write-Host "Java 存在"
}
```

### Python 脚本查找

```python
import shutil
import os
import subprocess

# 方法1：使用 shutil.which（类似 where.exe）
java_path = shutil.which("java")
print(f"Java 路径: {java_path}")

# 方法2：检查常见位置
common_paths = [
    r"C:\Program Files\Java",
    r"C:\Program Files (x86)\Java",
    os.path.expanduser(r"~\AppData\Local\Programs\Python"),
]

for path in common_paths:
    if os.path.exists(path):
        print(f"找到: {path}")

# 方法3：查询注册表（Windows）
try:
    import winreg
    key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                         r"SOFTWARE\JavaSoft\Java Runtime Environment")
    version = winreg.QueryValueEx(key, "CurrentVersion")[0]
    print(f"Java 版本: {version}")
except FileNotFoundError:
    print("Java 未在注册表中找到")
```

### Java 代码查找

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class ProgramFinder {
    
    // 方法1：执行 where 命令
    public static String findProgram(String programName) {
        try {
            Process process = Runtime.getRuntime().exec("where.exe " + programName);
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );
            String line = reader.readLine();
            return line; // 返回第一行结果
        } catch (Exception e) {
            return null;
        }
    }
    
    // 方法2：检查环境变量
    public static String getEnvPath(String envVar) {
        return System.getenv(envVar);
    }
    
    // 方法3：检查文件是否存在
    public static boolean checkExists(String path) {
        return new java.io.File(path).exists();
    }
    
    public static void main(String[] args) {
        // 查找 Java
        String javaPath = findProgram("java");
        System.out.println("Java 路径: " + javaPath);
        
        // 检查 JAVA_HOME
        String javaHome = getEnvPath("JAVA_HOME");
        System.out.println("JAVA_HOME: " + javaHome);
        
        // 检查特定路径
        boolean exists = checkExists("C:\\Program Files\\Java\\jdk-25.0.1\\bin\\java.exe");
        System.out.println("Java 是否存在: " + exists);
    }
}
```

### Batch 批处理脚本

```batch
@echo off
REM 方法1：使用 where 命令
where java >nul 2>&1
if %errorlevel% equ 0 (
    echo Java 已找到
    where java
) else (
    echo Java 未找到
)

REM 方法2：检查环境变量
if defined JAVA_HOME (
    echo JAVA_HOME=%JAVA_HOME%
) else (
    echo JAVA_HOME 未设置
)

REM 方法3：检查文件是否存在
if exist "C:\Program Files\Java\jdk-25.0.1\bin\java.exe" (
    echo Java 存在于指定路径
)
```

---

## 实用工具函数

###  PowerShell 通用查找函数

```powershell
function Find-Program {
    <#
    .SYNOPSIS
        查找程序的安装路径
    
    .DESCRIPTION
        通过多种方式查找程序：PATH、常见位置、注册表
    
    .PARAMETER ProgramName
        要查找的程序名称
    
    .EXAMPLE
        Find-Program "java"
        Find-Program "python"
        Find-Program "chrome"
    #>
    
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProgramName
    )
    
    Write-Host "🔍 正在查找: $ProgramName" -ForegroundColor Cyan
    Write-Host ""
    
    # 方法1：where.exe（最快）
    Write-Host "[1/4] 检查 PATH..." -ForegroundColor Yellow
    $whereResult = where.exe $ProgramName 2>$null
    if ($whereResult) {
        Write-Host "✅ 在 PATH 中找到:" -ForegroundColor Green
        $whereResult | ForEach-Object { Write-Host "   $_" }
        Write-Host ""
        return $whereResult[0]
    }
    Write-Host "   ❌ 不在 PATH 中" -ForegroundColor Gray
    
    # 方法2：常见位置搜索
    Write-Host "[2/4] 搜索常见位置..." -ForegroundColor Yellow
    $commonPaths = @(
        "C:\Program Files",
        "C:\Program Files (x86)",
        "C:\Users\$env:USERNAME\AppData\Local",
        "C:\Users\$env:USERNAME\AppData\Roaming",
        "C:\Users\$env:USERNAME\AppData\Local\Programs"
    )
    
    foreach ($path in $commonPaths) {
        $result = Get-ChildItem $path -Recurse -Filter "*$ProgramName*.exe" -ErrorAction SilentlyContinue -Depth 2 | 
                  Select-Object FullName -First 1
        if ($result) {
            Write-Host "✅ 在常见位置找到:" -ForegroundColor Green
            Write-Host "   $($result.FullName)" -ForegroundColor White
            Write-Host ""
            return $result.FullName
        }
    }
    Write-Host "   ❌ 常见位置未找到" -ForegroundColor Gray
    
    # 方法3：注册表查询
    Write-Host "[3/4] 查询注册表..." -ForegroundColor Yellow
    $regPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    
    foreach ($regPath in $regPaths) {
        $regResult = Get-ItemProperty $regPath -ErrorAction SilentlyContinue |
                     Where-Object { $_.DisplayName -like "*$ProgramName*" } |
                     Select-Object DisplayName, InstallLocation -First 1
        
        if ($regResult -and $regResult.InstallLocation) {
            Write-Host "✅ 通过注册表找到:" -ForegroundColor Green
            Write-Host "   名称: $($regResult.DisplayName)" -ForegroundColor White
            Write-Host "   路径: $($regResult.InstallLocation)" -ForegroundColor White
            Write-Host ""
            return $regResult.InstallLocation
        }
    }
    Write-Host "   ❌ 注册表未找到" -ForegroundColor Gray
    
    # 方法4：开始菜单快捷方式
    Write-Host "[4/4] 检查开始菜单..." -ForegroundColor Yellow
    $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
    $shortcut = Get-ChildItem $startMenuPath -Recurse -Filter "*.lnk" -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -like "*$ProgramName*" } |
                Select-Object -First 1
    
    if ($shortcut) {
        $shell = New-Object -ComObject WScript.Shell
        $target = $shell.CreateShortcut($shortcut.FullName).TargetPath
        Write-Host "✅ 通过快捷方式找到:" -ForegroundColor Green
        Write-Host "   $target" -ForegroundColor White
        Write-Host ""
        return $target
    }
    Write-Host "   ❌ 开始菜单未找到" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "❌ 未找到 $ProgramName" -ForegroundColor Red
    Write-Host "建议：" -ForegroundColor Yellow
    Write-Host "  1. 确认程序已安装" -ForegroundColor Gray
    Write-Host "  2. 手动指定完整路径" -ForegroundColor Gray
    Write-Host "  3. 将程序目录添加到 PATH" -ForegroundColor Gray
    
    return $null
}
```

### PowerShell 添加到 PATH 函数

```powershell
function Add-ToPath {
    <#
    .SYNOPSIS
        将路径添加到环境变量 PATH
    
    .DESCRIPTION
        支持用户级别和系统级别，自动检测重复
    
    .PARAMETER NewPath
        要添加的路径
    
    .PARAMETER Scope
        作用域：User（默认）或 Machine
    
    .EXAMPLE
        Add-ToPath "C:\Python39"
        Add-ToPath "C:\Java\bin" -Scope Machine
    #>
    
    param(
        [Parameter(Mandatory=$true)]
        [string]$NewPath,
        
        [ValidateSet("User", "Machine")]
        [string]$Scope = "User"
    )
    
    # 检查路径是否存在
    if (-not (Test-Path $NewPath)) {
        Write-Host "⚠️  警告: 路径不存在: $NewPath" -ForegroundColor Yellow
        $confirm = Read-Host "是否继续添加？(y/n)"
        if ($confirm -ne 'y') {
            return
        }
    }
    
    # 获取当前 PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", $Scope)
    
    # 检查是否已存在
    if ($currentPath -split ';' | Where-Object { $_ -eq $NewPath }) {
        Write-Host "⚠️  路径已存在: $NewPath" -ForegroundColor Yellow
        return
    }
    
    # 添加到 PATH
    try {
        [Environment]::SetEnvironmentVariable(
            "Path", 
            "$currentPath;$NewPath", 
            $Scope
        )
        
        Write-Host "✅ 已添加到 $($Scope) PATH:" -ForegroundColor Green
        Write-Host "   $NewPath" -ForegroundColor White
        
        # 刷新当前会话
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + 
                    [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ 当前会话已刷新" -ForegroundColor Green
        Write-Host ""
        Write-Host "提示: 新打开的终端窗口也会自动生效" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ 添加失败: $_" -ForegroundColor Red
    }
}
```

### 完整工作流示例

```powershell
# 场景：安装 Python 后配置环境变量

# 1. 查找 Python 安装位置
$pythonPath = Find-Program "python"

# 2. 如果找到，提取目录并添加到 PATH
if ($pythonPath) {
    $pythonDir = Split-Path $pythonPath -Parent
    Add-ToPath $pythonDir
    
    # 如果有 Scripts 目录，也添加
    $scriptsDir = Join-Path (Split-Path $pythonDir -Parent) "Scripts"
    if (Test-Path $scriptsDir) {
        Add-ToPath $scriptsDir
    }
}

# 3. 验证
python --version
pip --version
```

---

## 常见问题与解决方案

### Q1: 为什么修改 PATH 后命令还是找不到？

**A:** 需要刷新环境变量：
```powershell
# 方法1：刷新当前会话
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + 
            [System.Environment]::GetEnvironmentVariable("Path","User")

# 方法2：关闭并重新打开终端（推荐）
```

### Q2: 用户变量和系统变量有什么区别？

**A:**
- **用户变量**：只对当前用户生效，无需管理员权限
- **系统变量**：对所有用户生效，需要管理员权限
- **优先级**：用户变量优先于系统变量

### Q3: PATH 太长怎么办？

**A:** 
```powershell
# 查看 PATH 长度
$env:Path.Length

# 清理无效路径
$paths = $env:Path -split ';' | Where-Object { Test-Path $_ }
$newPath = $paths -join ';'
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

### Q4: 如何永久删除 PATH 中的某个路径？

```powershell
$pathToRemove = "C:\要删除的路径"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = ($currentPath -split ';' | Where-Object { $_ -ne $pathToRemove }) -join ';'
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

### Q5: 如何查看完整的 PATH 内容？

```powershell
# 格式化显示
$env:Path -split ';' | ForEach-Object { Write-Host $_ }

# 或导出到文件
$env:Path -split ';' | Out-File "path_list.txt"
```

---

## 快速参考速查表

### 查找命令速查

| 场景 | 命令 |
|------|------|
| 在 PATH 中查找 | `where.exe 程序名` |
| npm 包位置 | `npm config get prefix` |
| pip 包位置 | `pip show 包名` |
| 常见位置搜索 | `Get-ChildItem "C:\Program Files" -Filter "*关键词*"` |
| 注册表查询 | `Get-ItemProperty "HKLM:\SOFTWARE\...\Uninstall\*"` |
| 全盘搜索 | `Get-ChildItem "C:\" -Recurse -Filter "*.exe"` |

### 环境变量配置速查

| 操作 | 命令 |
|------|------|
| 添加到用户 PATH | `[Environment]::SetEnvironmentVariable("Path", $env:Path + ";路径", "User")` |
| 添加到系统 PATH | `[Environment]::SetEnvironmentVariable("Path", $env:Path + ";路径", "Machine")` |
| 刷新当前会话 | `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")` |
| 查看当前 PATH | `$env:Path -split ';'` |
| 检查路径是否存在 | `Test-Path "路径"` |

---

## 最佳实践建议

### ✅ 推荐做法

1. **优先使用包管理器**：npm、pip、chocolatey、winget
2. **使用用户级环境变量**：避免权限问题
3. **定期清理 PATH**：移除无效路径
4. **使用工具函数**：封装常用操作
5. **记录安装路径**：建立个人知识库

### ❌ 避免做法

1. **不要频繁修改系统变量**：可能影响其他用户
2. **不要全盘搜索**：除非必要，速度太慢
3. **不要忘记刷新**：修改后记得刷新或重启终端
4. **不要硬编码路径**：使用环境变量动态获取

---

## 总结

### 查找程序的策略顺序

```
1. where.exe / Get-Command（最快，依赖 PATH）
   ↓ 未找到
2. 包管理器查询（npm/pip/choco/winget）
   ↓ 未找到
3. 常见位置搜索（Program Files/AppData）
   ↓ 未找到
4. 注册表查询（最可靠）
   ↓ 未找到
5. 开始菜单快捷方式
   ↓ 未找到
6. 全盘搜索（最后手段）
```

### 配置环境变量的步骤

```
1. 找到程序路径
   ↓
2. 添加到 PATH（用户级推荐）
   ↓
3. 刷新当前会话
   ↓
4. 验证配置成功
```

---

**文档版本**: 1.0  
**最后更新**: 2026-05-24  
**适用系统**: Windows 10/11, PowerShell 5.1+
