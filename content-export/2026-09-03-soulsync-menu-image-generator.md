---
title: "菜单图片：自动生成 Bot 指令菜单的 Pillow 渲染引擎"
titleEn: "菜单图片：自动生成 Bot 指令菜单的 Pillow 渲染引擎"
slug: "soulsync-menu-image-generator"
date: "2026-09-03"
category: "Plugin"
tags: [Python, AstrBot, Pillow, 图片渲染, UI 设计]
excerpt: "自动汇总 AstrBot 全部已注册指令，按插件分组生成暗色卡片风格菜单图片：毛玻璃背景、状态指纹实时失效、自动分页。"
status: "published"
readTime: "8 min"
---

## 你的 Bot 有多少指令？

当一个聊天机器人安装了 SoulSync + 心旅小馆 + 心镜 + 防护盾等十几个插件后，用户经常会问：「我到底能用哪些指令？」

手动维护指令列表太痛苦了——每次装新插件或更新都要改。菜单图片插件解决了这个问题：它自动读取 AstrBot 所有已注册指令，按插件分组，生成一张漂亮的菜单图片。

## 核心机制

1. 自动枚举：遍历 star\_handlers\_registry，收集所有已注册 handler 的指令名和描述
2. 按插件分组：通过 handler 的模块路径解析插件元数据，自动归类
3. 权限分类：普通用户只看到非管理员指令，管理员可看全部
4. 自动分页：指令过多时按插件分组完整性分页

## 毛玻璃渲染

菜单图片采用暗色卡片风格，核心渲染特性：

- 垂直渐变背景：从深色到更深色的平滑过渡
- 毛玻璃卡片：卡片区域贴入高斯模糊背景加轻微提亮，磨砂质感
- 标题圆点装饰：v3 排版新增的视觉细节
- 渐变分隔线：分组间的视觉分隔
- 页码圆点指示器：底部的分页指示

## 状态指纹实时失效

最巧妙的设计是状态指纹机制：

```python
def _fingerprint(self):
    # 轻量状态指纹：插件元数据 + 已注册 handler 概要
    # 任何指令增删、插件启停都会改变指纹
    parts = []
    for path, md in star_map.items():
        parts.append(f'{path}|{getattr(md, "activated", True)}|...')
    for handler in star_handlers_registry:
        parts.append(f'{handler.handler_module_path}|{handler.handler_name}|...')
    return hashlib.sha1('|'.join(sorted(parts)).encode()).hexdigest()[:10]
```

WebUI 停用/启用插件、注册新指令后，指纹立即改变，下次 /menu 立即生效。

## 缓存策略

缓存层

TTL

失效条件

指令收集

60s

指纹变化立即失效

图片渲染

30s

同键结果复用

缓存文件

30s

超时自动清理

## 配置项

- show\_builtin：是否显示 AstrBot 内置指令
- hide\_self：不在菜单中显示自身指令
- max\_commands\_per\_page：每页指令数上限（默认 40）
- frost\_glass：毛玻璃卡片开关
- custom\_font\_path：中文字体路径（Linux/Docker 必配）

