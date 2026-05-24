---
title: "我的第一篇技术笔记"
date: "2026-05-24"
tags: ["技术", "JavaScript", "教程"]
description: "记录学习 JavaScript 数组方法的心得与实践"
---

## 为什么要学数组方法？

JavaScript 提供了丰富的数组操作方法。掌握它们能让你写出更简洁、更可读的代码。刚学的时候觉得 `for` 循环就够了，后来才体会到函数式编程的魅力。

三个最常用的方法：`map`、`filter`、`reduce`——它们相互配合，几乎能解决所有数组处理需求。

<div align="center">


![微信图片_20260111124113_2_3.jpg](/my-blog/images/2026/05/1779622329304-_____20260111124113_2_3.jpg)

*图1. 猫咪*
</div>
<div align="center">


![Snipaste_2026-04-25_11-23-02.png](/my-blog/images/2026/05/1779622366584-Snipaste_2026-04-25_11-23-02.jpg)

*图2. 月夜*

</div>
## map：一对一转换

`map` 对数组每个元素执行相同的操作，返回一个新数组。

```javascript
const numbers = [1, 2, 3, 4, 5

// 每个数翻倍
const doubled = numbers.map((n) => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// 提取对象数组中的某个字段
const users = [
  { name: "小明", age: 25 },
  { name: "小红", age: 30 },
  { name: "小刚", age: 28 },
];
const names = users.map((u) => u.name);
console.log(names); // ["小明", "小红", "小刚"]
```

## filter：条件筛选

`filter` 保留满足条件的元素。

```javascript
const scores = [85, 92, 60, 78, 95, 43];

const passed = scores.filter((s) => s >= 60);
console.log(passed); // [85, 92, 78, 95]

// 结合 map 和 filter
const adultNames = users
  .filter((u) => u.age >= 28)
  .map((u) => u.name);
console.log(adultNames); // ["小红", "小刚"]
```

## reduce：聚合成一个值

`reduce` 稍微难理解一点，但其实很强大。它把数组"归约"成一个值。

```javascript
const total = numbers.reduce((sum, n) => sum + n, 0);
console.log(total); // 15

// 更实用的例子：按年龄分组
const grouped = users.reduce((acc, user) => {
  const key = user.age >= 28 ? "older" : "younger";
  acc[key] = acc[key] || [];
  acc[key].push(user.name);
  return acc;
}, {} as Record<string, string[]>);
console.log(grouped);
// { younger: ["小明"], older: ["小红", "小刚"] }
```

## 链式调用才是精髓

单独用每个方法威力有限，**链式组合**才是真正优雅的地方：

```javascript
const orders = [
  { id: 1, items: ["书", "笔"], total: 45 },
  { id: 2, items: ["键盘"], total: 299 },
  { id: 3, items: ["鼠标", "鼠标垫", "耳机"], total: 180 },
];

// 找出总价超过 100 的订单，列出商品名，按字母排序
const expensiveItems = orders
  .filter((o) => o.total > 100)
  .flatMap((o) => o.items)
  .sort();
console.log(expensiveItems); // ["耳机", "键盘", "鼠标", "鼠标垫"]
```

## 小结

| 方法 | 用途 | 返回值 |
|------|------|--------|
| `map` | 转换每个元素 | 新数组 |
| `filter` | 筛选元素 | 新数组 |
| `reduce` | 聚合计算 | 任意值 |
| `flatMap` | 映射并展平 | 新数组 |

这些方法不改变原数组，符合不可变数据的原则。如果你也在学习 JavaScript，推荐看看 [MDN 数组文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)，写得非常详细。

多写多练，慢慢就会习惯用它们替代 `for` 循环。



