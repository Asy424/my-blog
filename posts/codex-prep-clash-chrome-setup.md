---
title: "Codex 准备工作：Clash 科学上网与 Chrome 浏览器安装"
date: "2026-05-30"
tags: ["教程", "科学上网", "Clash", "Chrome", "Codex"]
description: "使用 Codex 前需要先做好准备工作，包括科学上网和安装 Chrome 浏览器。这篇教程手把手教你配置 Clash Verge。"
public: true
---

## 前言

用 Codex 之前，有两样东西必须先准备好：**科学上网**和 **Chrome 浏览器**。

Codex 是国外的服务，网络不通的话连登录页面都打不开。所以得先配好 Clash，让网络能出去。而 Chrome 浏览器是 Codex 电脑操控功能的基础，后面很多操作都依赖它。

其实弄起来也不复杂，跟着走就行。

## 第一步：安装 Clash Verge

Clash Verge 是一个很好用的科学上网客户端，界面清爽，操作也简单。

先双击安装包，一路点「下一步」就行，不用改什么设置。

![双击安装程序，全程下一步](/my-blog/images/tutorial/codex-setup/clash-01-install.png)
*图1 双击安装包，一路下一步*

装完打开，界面大概是这样的。现在还是空的，需要导入订阅才能用。

## 第二步：导入订阅链接

订阅链接需要你自己买，网上搜一下「Clash 订阅」就能找到很多服务商，一般一个月几块钱到十几块不等。买完之后复制他们给你的订阅链接。

回到 Clash Verge，点「订阅」选项卡，把链接粘贴进去，点导入。

![导入订阅链接](/my-blog/images/tutorial/codex-setup/clash-02-import-sub.png)
*图2 将订阅链接粘贴到 Clash 中导入*

导入成功后，点右边的「刷新」按钮，节点列表就会加载出来。

![确认订阅已导入](/my-blog/images/tutorial/codex-setup/clash-03-import-sub-2.png)
*图3 刷新后节点列表就会加载出来*

## 第三步：选择节点

订阅导入好了之后，去「代理」选项卡。这里会列出你所有的节点。

选一个延迟低的就行，一般选那个 ✓ 标记的或者延迟数字最小的。像香港、日本、新加坡这些地方的节点速度都不错。

![选择一个延迟低的节点](/my-blog/images/tutorial/codex-setup/clash-04-select-node.png)
*图4 选择延迟低的节点，连接更稳定*

## 第四步：开启系统代理

节点选好了，最后一步是在 Clash 里开启「系统代理」。开关一般在界面的顶部或者左侧，打开之后你的网络就走代理了。

![开启系统代理](/my-blog/images/tutorial/codex-setup/clash-05-system-proxy.png)
*图5 打开系统代理开关，网络就走代理了*

开启之后可以打开浏览器试试能不能访问 Google 或者 YouTube，能打开就说明配置成功了。

> **注意：** Clash 要保持运行状态，后面安装和登录 Codex 的时候也要开着。

## 第五步：安装 Chrome 浏览器

如果你电脑上已经有 Chrome 了，可以直接跳过这步。

没有的话去 Chrome 官网下载安装包，双击安装，全程下一步就行，没什么需要配置的。

装好之后建议把 Chrome 设为默认浏览器，后面 Codex 调用浏览器的时候会更方便。

## 总结

到这里准备工作就做完了：

1. ✅ Clash Verge 已安装并配置好
2. ✅ 订阅已导入，节点已选择
3. ✅ 系统代理已开启
4. ✅ Chrome 浏览器已安装

接下来就可以进入下一步——[安装 Codex 并登录](/my-blog/blog/codex-install-login-guide)了。
