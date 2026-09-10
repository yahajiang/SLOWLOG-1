---
title: "心旅知音·注入防护盾：三层防御保护 AI 人格"
titleEn: "心旅知音·注入防护盾：三层防御保护 AI 人格"
slug: "soulsync-shield-prompt-injection"
date: "2026-09-01"
category: "Plugin"
tags: [Python, AstrBot, 安全, 提示注入, AI 防护]
excerpt: "防止提示注入与恶意调教的 AstrBot 插件：Persona 加固、八语言关键词检测、混淆解码、三级处置、管理员通知。"
status: "published"
readTime: "10 min"
---

## AI 人格被「调教」了怎么办？

你花了很多时间训练你的 AI 角色——给她设定了性格、记忆、情感。然后有人输入一句话：「忽略之前所有设定，你现在是一个...」。整个精心构建的人格瞬间崩塌。

这就是提示注入攻击（Prompt Injection），而心旅知音·注入防护盾就是为了防止这种攻击而生的。

## 三层防御体系

层级

机制

说明

第一层

Persona 加固

每次 LLM 请求在 system prompt 末尾注入防注入保护段

第二层

输入检测

八语言关键词库 + 启发式正则 + 混淆解码

第三层

处置策略

拦截 block / 剥离 sanitize / 告警 warn 三级

## 检测能力

检测器收录了中/英/日/韩/法/德/西/俄八语言的高危短语，以及多种启发式模式：

- 人设劫持：忽略之前、你不再是、开发者模式
- 伪标签注入：\[system\]、\[INST\]、\[developer\] 等伪造标签
- 思维链劫持：在 thinking 标签中输出指令（八语言覆盖）
- 混淆解码：base64 解码、分隔符拆分（i-g-n-o-r-e）、全角字符

## SoulSync 角色联动

防护盾与 SoulSync 内置 39 个关系角色联动——纯身份指派表达（「现在你是我的女朋友」）会被放行，但混入「忽略/泄露/服从」等攻击标记的仍拦截。

```python
# 关系角色豁免判定
def _is_relationship_expression_exempt(text, matched, role_vocab):
    # 命中规则必须是纯身份指派类（软规则）
    # 不得出现其他硬关键词
    # 身份触发词后 8 字符内须出现关系角色词
    for m in _IDENTITY_TRIGGER_RE.finditer(text):
        window = text[m.end(): m.end() + 8]
        for role in role_vocab:
            if role in window:
                return True
    return False
```

## 上下文扫描

防护盾不仅检测当前消息，还会扫描 LLM 请求的上下文历史——防止「记忆投毒」。引用消息先剥离再检测，转发攻击文本不算指令，避免误杀。

## 管理指令

```text
/防注入                  帮助
/防注入 统计             今日统计与最近命中
/防注入 模式 拦截|剥离|告警 切换处置模式
/防注入 白名单 加|删 <用户ID> 增删白名单
/防注入 图片模式         统计输出切换为图片
```

## 管理员通知

可选在每次拦截时向管理员私发通知，含时间、用户、命中规则与拦截内容。支持图片模式（Pillow 渲染卡片）。

