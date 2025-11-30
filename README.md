🌌 Hyperspace Player

"Where Mathematics Meets Melody."

一个基于 Electron + Three.js 构建的次世代沉浸式 3D 音乐播放器。它不仅仅是播放器，更是一扇通往数学宇宙的窗口。

✨ 核心特性 (Features)

🎨 极致的视觉体验

数学形态可视化：内置多种基于数学公式生成的 3D 粒子形态，包括：

🌀 Galaxy：浩瀚的螺旋星系。

🦋 Lorenz Attractor：混沌理论中的洛伦兹吸引子。

♾️ Mobius Strip：拓扑学中的莫比乌斯带。

🍩 Torus：立体环面结构。

🧬 DNA Helix：双螺旋生物结构。

☁️ Mandelbulb：复杂的三维分形结构。

Unreal Bloom 辉光引擎：引入工业级后期处理（Post-Processing），让 40,000+ 个粒子呈现出赛博朋克般的霓虹辉光。

音频律动响应：粒子的大小、亮度、颜色以及形态的呼吸感，全部由音乐的 Bass (低频) 和 Treble (高频) 实时驱动。

🎮 交互与沉浸

智能运镜 (Auto-Cruise)：当检测到用户无操作时，摄像机自动进入电影级巡航模式，在星云中优雅穿梭。

3D 自由视角：支持鼠标拖拽旋转、缩放，360 度无死角欣赏数学之美。

动态调色板 (Themes)：内置 6 套精心设计的主题配色，一键切换宇宙氛围：

🟦 Neon Cyber (青/粉)

🟨 Black Gold (黑金奢华)

❄️ Glacier (冰封王座)

🔥 Inferno (烈焰地狱)

🟩 The Matrix (黑客帝国)

🟪 Deep Space (深空紫罗兰)

🛠️ 强大的播放内核

全格式支持：原生支持 MP3, WAV, FLAC, OGG, AAC，以及 Apple 生态的 M4A (ALAC/AAC) 格式。

本地播放列表：支持拖拽上传、列表管理、切歌。

极简 UI：采用 Glassmorphism (毛玻璃) 设计风格，半透明悬浮控件，最大化视觉干扰。

📥 下载与安装 (Installation)

macOS 用户

下载最新版本的 .dmg 安装包。

双击打开，将 Hyperspace 拖入 Applications 文件夹。

在启动台 (Launchpad) 中点击图标运行。

Windows 用户

下载最新版本的 .exe 安装包。

双击运行安装程序。

安装完成后即可直接运行。

⚡️ 开发指南 (Development)

如果你想自己在本地运行源码或进行二次开发，请按照以下步骤操作：

环境要求

Node.js (v16+)

npm 或 yarn

1. 克隆项目

git clone [https://github.com/your-username/hyperspace-player.git](https://github.com/your-username/hyperspace-player.git)
cd hyperspace-player


2. 安装依赖

npm install


(注意：项目依赖 electron, three, react, vite 等核心库，安装可能需要几分钟)

3. 启动开发模式

npm run electron:dev


此命令将同时启动 Vite 本地服务器和 Electron 窗口，支持热重载（HMR）。

4. 打包构建

构建 macOS 版本 (.dmg):

npm run electron:build


构建 Windows 版本 (.exe):

npm run electron:build -- --win


📝 常见问题 (FAQ)

Q: 为什么上传 M4A 文件没有声音？
A: 请确保您的 M4A 文件不是受 DRM 保护的（如 Apple Music 缓存文件）。普通的 AAC 或 ALAC 编码 M4A 均可正常播放。

Q: 画面有点卡顿？
A: 这是一个 WebGL 密集型应用，会渲染超过 40,000 个动态粒子和后期光效。建议在拥有独立显卡的设备上运行以获得最佳体验（60 FPS）。

🤯 这只是一个壳子，你需要自己上传音乐（我在仓库中放了几个，你可以自己下载）

📄 开源协议 (License)

MIT License © 2025 Hyperspace Team.


