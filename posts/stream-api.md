---
title: "Stream API 完全指南"
date: "2026-05-28"
tags: []
public: true
---

# Stream API 完全指南

> Java 8 引入的声明式数据处理工具，让集合操作更简洁、更高效。

---

## 目录

- [1. 什么是 Stream](#1-什么是-stream)
- [2. Stream 的核心特点](#2-stream-的核心特点)
- [3. Stream 的操作流程](#3-stream-的操作流程)
- [4. 创建 Stream](#4-创建-stream)
- [5. 中间操作（Intermediate Operations）](#5-中间操作intermediate-operations)
- [6. 终端操作（Terminal Operations）](#6-终端操作terminal-operations)
- [7. 综合实战案例](#7-综合实战案例)
- [8. 高级特性](#8-高级特性)
- [9. 注意事项与陷阱](#9-注意事项与陷阱)
- [10. 最佳实践](#10-最佳实践)
- [11. 总结](#11-总结)

---

## 1. 什么是 Stream

Stream（流）是 Java 8 引入的一种**抽象概念**，用于处理集合中的数据。它允许你以声明式的方式处理数据集合，类似于 SQL 查询数据库。

### 核心思想

```java
// 传统方式：命令式编程（告诉计算机怎么做）
List<String> result = new ArrayList<>();
for (String name : names) {
    if (name.startsWith("A")) {
        result.add(name.toUpperCase());
    }
}

// Stream 方式：声明式编程（告诉计算机要什么）
List<String> result = names.stream()
    .filter(name -> name.startsWith("A"))
    .map(String::toUpperCase)
    .collect(Collectors.toList());
```

### 本质理解

- **Stream 不是数据结构**，不存储数据
- **Stream 不会修改源数据**，返回新的结果
- **Stream 支持链式调用**，像流水线一样处理数据
- **Stream 可以并行执行**，充分利用多核 CPU

---

## 2. Stream 的核心特点

### ✅ 1. 声明式编程

只需描述"要什么"，不需要关心"怎么做"。

### ✅ 2. 惰性求值（Lazy Evaluation）

中间操作不会立即执行，只有遇到终端操作时才会触发计算。

### ✅ 3. 不可变性

Stream 不会修改源数据，每次操作都产生新的 Stream。

### ✅ 4. 可并行化

通过 `parallel()` 方法轻松实现并行处理。

### ✅ 5. 一次性消费

Stream 只能被消费一次，使用后必须重新创建。

---

## 3. Stream 的操作流程

Stream 的操作分为三个阶段：

```
创建 Stream → 中间操作（零个或多个） → 终端操作（一个）
```

### 流程图

```
数据源
  ↓
创建 Stream (stream/parallelStream)
  ↓
中间操作 (filter/map/sorted...) ← 惰性求值，不执行
  ↓
中间操作 (filter/map/sorted...) ← 惰性求值，不执行
  ↓
终端操作 (collect/forEach/reduce) ← 触发执行
  ↓
结果
```

### 示例

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

long count = names.stream()           // ① 创建 Stream
    .filter(n -> n.length() > 3)     // ② 中间操作（不执行）
    .map(String::toUpperCase)        // ③ 中间操作（不执行）
    .count();                        // ④ 终端操作（触发执行）

System.out.println(count); // 3 (Alice, Charlie, David)
```

---

## 4. 创建 Stream

### ① 从集合创建

```java
List<String> list = Arrays.asList("a", "b", "c");

// 串行流
Stream<String> stream = list.stream();

// 并行流
Stream<String> parallelStream = list.parallelStream();
```

---

### ② 从数组创建

```java
String[] array = {"a", "b", "c"};

// 使用 Arrays.stream
Stream<String> stream = Arrays.stream(array);

// 使用 Stream.of
Stream<String> stream2 = Stream.of(array);
```

---

### ③ 直接创建

```java
// Stream.of
Stream<String> stream = Stream.of("a", "b", "c");

// Stream.empty
Stream<Object> empty = Stream.empty();

// Stream.iterate（无限流）
Stream<Integer> iterate = Stream.iterate(0, n -> n + 2);
iterate.limit(5).forEach(System.out::println); // 0, 2, 4, 6, 8

// Stream.generate（无限流）
Stream<Double> generate = Stream.generate(Math::random);
generate.limit(3).forEach(System.out::println); // 随机数
```

---

### ④ 从文件创建

```java
// 读取文件每一行
try (Stream<String> lines = Files.lines(Paths.get("file.txt"))) {
    lines.forEach(System.out::println);
} catch (IOException e) {
    e.printStackTrace();
}
```

---

### ⑤ 从正则表达式创建

```java
// 分割字符串为 Stream
Stream<String> words = Pattern.compile("\\s+")
    .splitAsStream("Hello World Java Stream");

words.forEach(System.out::println);
// Hello
// World
// Java
// Stream
```

---

## 5. 中间操作（Intermediate Operations）

中间操作返回新的 Stream，可以链式调用，**惰性求值**。

### 中间操作总览

| 操作 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `filter` | 有状态/无状态 | 过滤元素 | `filter(n -> n > 0)` |
| `map` | 无状态 | 转换元素 | `map(String::toUpperCase)` |
| `flatMap` | 无状态 | 扁平化映射 | `flatMap(list -> list.stream())` |
| `distinct` | 有状态 | 去重 | `distinct()` |
| `sorted` | 有状态 | 排序 | `sorted()` |
| `limit` | 有状态 | 截取前n个 | `limit(5)` |
| `skip` | 有状态 | 跳过前n个 | `skip(3)` |
| `peek` | 无状态 | 调试查看 | `peek(System.out::println)` |

---

### ① filter - 过滤

根据条件过滤元素。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 过滤出偶数
List<Integer> evens = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());

System.out.println(evens); // [2, 4, 6, 8, 10]

// 过滤出大于5的奇数
List<Integer> result = numbers.stream()
    .filter(n -> n > 5)
    .filter(n -> n % 2 != 0)
    .collect(Collectors.toList());

System.out.println(result); // [7, 9]
```

---

### ② map - 转换

将每个元素转换为另一种形式。

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// 转为大写
List<String> upper = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());

System.out.println(upper); // [ALICE, BOB, CHARLIE]

// 获取字符串长度
List<Integer> lengths = names.stream()
    .map(String::length)
    .collect(Collectors.toList());

System.out.println(lengths); // [5, 3, 7]

// 提取对象属性
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", 20),
    new User("Charlie", 30)
);

List<String> userNames = users.stream()
    .map(User::getName)
    .collect(Collectors.toList());

System.out.println(userNames); // [Alice, Bob, Charlie]
```

---

### ③ flatMap - 扁平化映射

将嵌套结构展平为一层。

```java
// 场景：List<List<String>> 转为 List<String>
List<List<String>> nested = Arrays.asList(
    Arrays.asList("a", "b"),
    Arrays.asList("c", "d"),
    Arrays.asList("e", "f")
);

// 使用 flatMap 展平
List<String> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());

System.out.println(flat); // [a, b, c, d, e, f]

// 场景：句子拆分为单词
List<String> sentences = Arrays.asList(
    "Hello World",
    "Java Stream",
    "Flat Map"
);

List<String> words = sentences.stream()
    .flatMap(sentence -> Arrays.stream(sentence.split(" ")))
    .collect(Collectors.toList());

System.out.println(words); // [Hello, World, Java, Stream, Flat, Map]
```

**map vs flatMap 对比：**
```java
// map: 一对一转换
["abc", "def"] --map--> ["ABC", "DEF"]

// flatMap: 一对多转换 + 展平
[["a","b"], ["c","d"]] --flatMap--> ["a", "b", "c", "d"]
```

---

### ④ distinct - 去重

去除重复元素（基于 `equals()` 方法）。

```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5);

List<Integer> distinct = numbers.stream()
    .distinct()
    .collect(Collectors.toList());

System.out.println(distinct); // [1, 2, 3, 4, 5]

// 对象去重（需要重写 equals 和 hashCode）
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Alice", 25), // 重复
    new User("Bob", 20)
);

List<User> unique = users.stream()
    .distinct()
    .collect(Collectors.toList());
```

---

### ⑤ sorted - 排序

对元素进行排序。

```java
List<Integer> numbers = Arrays.asList(5, 2, 8, 1, 9, 3);

// 自然排序（升序）
List<Integer> sorted = numbers.stream()
    .sorted()
    .collect(Collectors.toList());

System.out.println(sorted); // [1, 2, 3, 5, 8, 9]

// 自定义排序（降序）
List<Integer> desc = numbers.stream()
    .sorted(Comparator.reverseOrder())
    .collect(Collectors.toList());

System.out.println(desc); // [9, 8, 5, 3, 2, 1]

// 对象排序
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", 20),
    new User("Charlie", 30)
);

// 按年龄升序
List<User> byAge = users.stream()
    .sorted(Comparator.comparing(User::getAge))
    .collect(Collectors.toList());

// 按年龄降序
List<User> byAgeDesc = users.stream()
    .sorted(Comparator.comparing(User::getAge).reversed())
    .collect(Collectors.toList());

// 多字段排序：先按年龄，再按姓名
List<User> multiSort = users.stream()
    .sorted(Comparator.comparing(User::getAge)
        .thenComparing(User::getName))
    .collect(Collectors.toList());
```

---

### ⑥ limit - 截取

截取前 n 个元素。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> first5 = numbers.stream()
    .limit(5)
    .collect(Collectors.toList());

System.out.println(first5); // [1, 2, 3, 4, 5]

// 结合无限流使用
Stream.iterate(0, n -> n + 2)
    .limit(5)
    .forEach(System.out::println); // 0, 2, 4, 6, 8
```

---

### ⑦ skip - 跳过

跳过前 n 个元素。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> after5 = numbers.stream()
    .skip(5)
    .collect(Collectors.toList());

System.out.println(after5); // [6, 7, 8, 9, 10]

// 分页：跳过前10个，取后5个
List<Integer> page2 = numbers.stream()
    .skip(10)
    .limit(5)
    .collect(Collectors.toList());
```

---

### ⑧ peek - 调试查看

在不影响流的情况下查看元素（主要用于调试）。

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

List<String> result = names.stream()
    .peek(n -> System.out.println("原始: " + n))
    .map(String::toUpperCase)
    .peek(n -> System.out.println("转换后: " + n))
    .collect(Collectors.toList());

// 输出：
// 原始: alice
// 转换后: ALICE
// 原始: bob
// 转换后: BOB
// 原始: charlie
// 转换后: CHARLIE
```

---

## 6. 终端操作（Terminal Operations）

终端操作会触发 Stream 的执行，返回结果或产生副作用。**Stream 只能有一个终端操作**。

### 终端操作总览

| 操作 | 返回类型 | 说明 | 示例 |
|------|---------|------|------|
| `forEach` | void | 遍历元素 | `forEach(System.out::println)` |
| `collect` | R | 收集结果 | `collect(Collectors.toList())` |
| `reduce` | Optional/T | 归约 | `reduce(0, Integer::sum)` |
| `count` | long | 计数 | `count()` |
| `findFirst` | Optional<T> | 第一个元素 | `findFirst()` |
| `findAny` | Optional<T> | 任意元素 | `findAny()` |
| `anyMatch` | boolean | 任一匹配 | `anyMatch(n -> n > 5)` |
| `allMatch` | boolean | 全部匹配 | `allMatch(n -> n > 0)` |
| `noneMatch` | boolean | 无一匹配 | `noneMatch(n -> n < 0)` |
| `max/min` | Optional<T> | 最大/最小值 | `max(Comparator.naturalOrder())` |
| `toArray` | Object[] | 转数组 | `toArray()` |

---

### ① forEach - 遍历

对每个元素执行操作。

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// 打印每个元素
names.stream().forEach(System.out::println);

// 或者更简洁
names.forEach(System.out::println);

// 带索引的遍历（需要额外处理）
IntStream.range(0, names.size())
    .forEach(i -> System.out.println(i + ": " + names.get(i)));
```

---

### ② collect - 收集

将 Stream 中的元素收集到集合或其他容器中。

#### 收集到 List

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

List<String> upper = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// Java 16+ 可以使用 toList()
List<String> upper2 = names.stream()
    .map(String::toUpperCase)
    .toList();
```

#### 收集到 Set

```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 3);

Set<Integer> unique = numbers.stream()
    .collect(Collectors.toSet());

System.out.println(unique); // [1, 2, 3]
```

#### 收集到 Map

```java
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", 20),
    new User("Charlie", 30)
);

// 姓名 -> 用户对象
Map<String, User> userMap = users.stream()
    .collect(Collectors.toMap(User::getName, user -> user));

// 姓名 -> 年龄
Map<String, Integer> ageMap = users.stream()
    .collect(Collectors.toMap(User::getName, User::getAge));

System.out.println(ageMap); // {Alice=25, Bob=20, Charlie=30}
```

#### 分组（Grouping By）

```java
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", 20),
    new User("Charlie", 30),
    new User("David", 25)
);

// 按年龄分组
Map<Integer, List<User>> byAge = users.stream()
    .collect(Collectors.groupingBy(User::getAge));

System.out.println(byAge);
// {20=[Bob], 25=[Alice, David], 30=[Charlie]}

// 按年龄段分组
Map<String, List<User>> byAgeGroup = users.stream()
    .collect(Collectors.groupingBy(user -> {
        if (user.getAge() < 25) return "青年";
        else return "中年";
    }));

System.out.println(byAgeGroup);
// {青年=[Bob], 中年=[Alice, Charlie, David]}
```

#### 分区（Partitioning By）

```java
// 按条件分为两组（true/false）
Map<Boolean, List<User>> partitioned = users.stream()
    .collect(Collectors.partitioningBy(user -> user.getAge() >= 25));

System.out.println(partitioned);
// {false=[Bob], true=[Alice, Charlie, David]}
```

####  joining - 字符串拼接

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// 简单拼接
String joined = names.stream()
    .collect(Collectors.joining());

System.out.println(joined); // AliceBobCharlie

// 带分隔符
String joined2 = names.stream()
    .collect(Collectors.joining(", "));

System.out.println(joined2); // Alice, Bob, Charlie

// 带前后缀
String joined3 = names.stream()
    .collect(Collectors.joining(", ", "[", "]"));

System.out.println(joined3); // [Alice, Bob, Charlie]
```

---

### ③ reduce - 归约

将 Stream 中的元素归约为单个值。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 求和（方式1：reduce）
int sum = numbers.stream()
    .reduce(0, (a, b) -> a + b);

// 求和（方式2：方法引用）
int sum2 = numbers.stream()
    .reduce(0, Integer::sum);

System.out.println(sum); // 15

// 求最大值
Optional<Integer> max = numbers.stream()
    .reduce(Integer::max);

System.out.println(max.get()); // 5

// 字符串拼接
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
String result = names.stream()
    .reduce("", (a, b) -> a + ", " + b);

System.out.println(result); // , Alice, Bob, Charlie（注意前面的逗号）
```

**reduce 的三个参数版本：**
```java
// reduce(identity, accumulator, combiner)
// identity: 初始值
// accumulator: 累加器
// combiner: 合并器（并行流时使用）

int sum = numbers.parallelStream()
    .reduce(0, Integer::sum, Integer::sum);
```

---

### ④ count - 计数

统计元素数量。

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

long count = names.stream()
    .filter(n -> n.length() > 3)
    .count();

System.out.println(count); // 2 (Alice, Charlie)
```

---

### ⑤ findFirst / findAny - 查找

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 查找第一个偶数
Optional<Integer> firstEven = numbers.stream()
    .filter(n -> n % 2 == 0)
    .findFirst();

System.out.println(firstEven.get()); // 2

// 查找任意一个偶数（并行流时性能更好）
Optional<Integer> anyEven = numbers.parallelStream()
    .filter(n -> n % 2 == 0)
    .findAny();

System.out.println(anyEven.get()); // 2 或 4
```

**Optional 处理：**
```java
Optional<Integer> result = numbers.stream()
    .filter(n -> n > 100)
    .findFirst();

// 方式1：orElse
int value = result.orElse(0);

// 方式2：orElseGet
int value2 = result.orElseGet(() -> 0);

// 方式3：orElseThrow
int value3 = result.orElseThrow(() -> new NoSuchElementException());

// 方式4：ifPresent
result.ifPresent(System.out::println);
```

---

### ⑥ anyMatch / allMatch / noneMatch - 匹配

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 是否有任意一个大于3
boolean any = numbers.stream()
    .anyMatch(n -> n > 3);

System.out.println(any); // true

// 是否全部大于0
boolean all = numbers.stream()
    .allMatch(n -> n > 0);

System.out.println(all); // true

// 是否没有负数
boolean none = numbers.stream()
    .noneMatch(n -> n < 0);

System.out.println(none); // true
```

**短路特性：** 一旦确定结果就停止遍历（类似 `||` 和 `&&`）。

---

### ⑦ max / min - 最值

```java
List<Integer> numbers = Arrays.asList(5, 2, 8, 1, 9, 3);

// 最大值
Optional<Integer> max = numbers.stream()
    .max(Comparator.naturalOrder());

System.out.println(max.get()); // 9

// 最小值
Optional<Integer> min = numbers.stream()
    .min(Comparator.naturalOrder());

System.out.println(min.get()); // 1

// 对象最值
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", 20),
    new User("Charlie", 30)
);

User oldest = users.stream()
    .max(Comparator.comparing(User::getAge))
    .get();

System.out.println(oldest.getName()); // Charlie
```

---

### ⑧ toArray - 转数组

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// 转为 Object[]
Object[] array = names.stream().toArray();

// 转为 String[]
String[] stringArray = names.stream().toArray(String[]::new);

System.out.println(Arrays.toString(stringArray)); // [Alice, Bob, Charlie]
```

---

## 7. 综合实战案例

### 案例 1：数据分析

```java
List<User> users = Arrays.asList(
    new User("Alice", 25, "Engineering"),
    new User("Bob", 20, "Marketing"),
    new User("Charlie", 30, "Engineering"),
    new User("David", 25, "Marketing"),
    new User("Eve", 35, "Engineering")
);

// 1. 统计工程部人数
long engineeringCount = users.stream()
    .filter(u -> "Engineering".equals(u.getDepartment()))
    .count();

System.out.println("工程部人数: " + engineeringCount); // 3

// 2. 获取所有部门名称（去重）
List<String> departments = users.stream()
    .map(User::getDepartment)
    .distinct()
    .collect(Collectors.toList());

System.out.println("部门: " + departments); // [Engineering, Marketing]

// 3. 按部门分组，统计平均年龄
Map<String, Double> avgAgeByDept = users.stream()
    .collect(Collectors.groupingBy(
        User::getDepartment,
        Collectors.averagingInt(User::getAge)
    ));

System.out.println(avgAgeByDept);
// {Engineering=30.0, Marketing=22.5}

// 4. 找出每个部门年龄最大的人
Map<String, Optional<User>> oldestByDept = users.stream()
    .collect(Collectors.groupingBy(
        User::getDepartment,
        Collectors.maxBy(Comparator.comparing(User::getAge))
    ));

// 5. 获取年龄大于25的用户姓名，按字母排序
List<String> names = users.stream()
    .filter(u -> u.getAge() > 25)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());

System.out.println(names); // [Charlie, Eve]
```

---

### 案例 2：文本处理

```java
String text = "Hello World Java Stream Hello World";

// 1. 统计单词频率
Map<String, Long> wordCount = Pattern.compile("\\s+")
    .splitAsStream(text)
    .collect(Collectors.groupingBy(
        word -> word.toLowerCase(),
        Collectors.counting()
    ));

System.out.println(wordCount);
// {hello=2, world=2, java=1, stream=1}

// 2. 找出出现次数最多的单词
String mostFrequent = wordCount.entrySet().stream()
    .max(Map.Entry.comparingByValue())
    .map(Map.Entry::getKey)
    .orElse("N/A");

System.out.println("最常出现的单词: " + mostFrequent); // hello 或 world
```

---

### 案例 3：订单处理

```java
List<Order> orders = Arrays.asList(
    new Order(1, "Alice", 100.0, "COMPLETED"),
    new Order(2, "Bob", 200.0, "PENDING"),
    new Order(3, "Charlie", 150.0, "COMPLETED"),
    new Order(4, "David", 300.0, "CANCELLED"),
    new Order(5, "Eve", 250.0, "COMPLETED")
);

// 1. 计算已完成订单的总金额
double totalCompleted = orders.stream()
    .filter(o -> "COMPLETED".equals(o.getStatus()))
    .mapToDouble(Order::getAmount)
    .sum();

System.out.println("已完成订单总额: " + totalCompleted); // 500.0

// 2. 按客户分组，计算每个客户的订单总额
Map<String, Double> totalByCustomer = orders.stream()
    .collect(Collectors.groupingBy(
        Order::getCustomer,
        Collectors.summingDouble(Order::getAmount)
    ));

System.out.println(totalByCustomer);
// {Alice=100.0, Bob=200.0, Charlie=150.0, David=300.0, Eve=250.0}

// 3. 找出金额最高的订单
Order highestOrder = orders.stream()
    .max(Comparator.comparing(Order::getAmount))
    .get();

System.out.println("最高金额订单: " + highestOrder.getId()); // 4
```

---

## 8. 高级特性

### ① 并行流（Parallel Stream）

利用多核 CPU 并行处理数据。

```java
List<Integer> numbers = IntStream.rangeClosed(1, 1_000_000)
    .boxed()
    .collect(Collectors.toList());

// 串行流
long start = System.currentTimeMillis();
long sum = numbers.stream()
    .mapToLong(Long::valueOf)
    .sum();
System.out.println("串行耗时: " + (System.currentTimeMillis() - start) + "ms");

// 并行流
start = System.currentTimeMillis();
long sum2 = numbers.parallelStream()
    .mapToLong(Long::valueOf)
    .sum();
System.out.println("并行耗时: " + (System.currentTimeMillis() - start) + "ms");
```

**注意事项：**
- 并行流适合**大数据量**和**CPU 密集型**操作
- 不适合**I/O 密集型**或**小数据量**
- 注意线程安全问题

---

### ② 基本类型 Stream

Java 提供了三种基本类型的 Stream，避免装箱/拆箱开销。

```java
// IntStream
IntStream intStream = IntStream.rangeClosed(1, 10);
int sum = intStream.sum(); // 55

// LongStream
LongStream longStream = LongStream.rangeClosed(1L, 10L);
long sum2 = longStream.sum(); // 55

// DoubleStream
DoubleStream doubleStream = DoubleStream.of(1.1, 2.2, 3.3);
double sum3 = doubleStream.sum(); // 6.6
```

**常用方法：**
```java
// 生成范围
IntStream.range(1, 10);      // 1-9（不包含10）
IntStream.rangeClosed(1, 10); // 1-10（包含10）

// 统计
IntSummaryStatistics stats = IntStream.of(1, 2, 3, 4, 5)
    .summaryStatistics();

System.out.println("最大值: " + stats.getMax());     // 5
System.out.println("最小值: " + stats.getMin());     // 1
System.out.println("平均值: " + stats.getAverage()); // 3.0
System.out.println("总和: " + stats.getSum());       // 15
System.out.println("数量: " + stats.getCount());     // 5
```

---

### ③ Optional 与 Stream 结合

```java
List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", null), // 年龄为空
    new User("Charlie", 30)
);

// 过滤掉年龄为空的用戶
List<Integer> ages = users.stream()
    .map(User::getAge)
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

// 或者使用 flatMap + Optional
List<Integer> ages2 = users.stream()
    .flatMap(user -> Optional.ofNullable(user.getAge()).stream())
    .collect(Collectors.toList());
```

---

### ④ 自定义 Collector

```java
// 将字符串收集为逗号分隔的大写字符串
Collector<String, ?, String> customCollector = Collectors.collectingAndThen(
    Collectors.mapping(String::toUpperCase, Collectors.toList()),
    list -> String.join(", ", list)
);

List<String> names = Arrays.asList("alice", "bob", "charlie");
String result = names.stream().collect(customCollector);

System.out.println(result); // ALICE, BOB, CHARLIE
```

---

## 9. 注意事项与陷阱

### ⚠️ 1. Stream 只能消费一次

```java
Stream<String> stream = names.stream();

// 第一次使用
stream.forEach(System.out::println); // ✅

// 第二次使用
stream.map(String::toUpperCase); // ❌ IllegalStateException
```

**解决方案：** 重新创建 Stream
```java
names.stream().forEach(System.out::println);
names.stream().map(String::toUpperCase);
```

---

### ⚠️ 2. 不要在 Stream 中修改外部变量

```java
int sum = 0;
// numbers.forEach(n -> sum += n); // ❌ 编译错误

// 正确做法：使用 reduce
int sum = numbers.stream().reduce(0, Integer::sum);
```

---

### ⚠️ 3. 注意 NullPointerException

```java
List<String> names = Arrays.asList("Alice", null, "Bob");

// ❌ 可能抛出 NullPointerException
names.stream()
    .map(String::toUpperCase)
    .forEach(System.out::println);

// ✅ 先过滤 null
names.stream()
    .filter(Objects::nonNull)
    .map(String::toUpperCase)
    .forEach(System.out::println);
```

---

### ⚠️ 4. 并行流的线程安全

```java
List<Integer> result = new ArrayList<>();

// ❌ 线程不安全
numbers.parallelStream().forEach(result::add);

// ✅ 线程安全
List<Integer> result2 = numbers.parallelStream()
    .collect(Collectors.toList());
```

---

### ⚠️ 5. 惰性求值的陷阱

```java
// peek 只在终端操作执行时才生效
Stream<String> stream = names.stream()
    .peek(System.out::println); // 不会打印

// 必须有终端操作
stream.collect(Collectors.toList()); // 才会打印
```

---

### ⚠️ 6. 避免过度使用 Stream

```java
// ❌ 简单操作用 Stream 反而复杂
Optional<String> first = names.stream().findFirst();

// ✅ 直接用集合方法
String first = names.isEmpty() ? null : names.get(0);
```

---

## 10. 最佳实践

### 📌 1. 优先使用方法引用

```java
// 推荐
names.stream().map(String::toUpperCase)

// 不推荐
names.stream().map(name -> name.toUpperCase())
```

---

### 📌 2. 保持 Stream 链简洁

如果 Stream 链超过 5 个操作，考虑抽取为方法。

```java
// 不推荐：过长
list.stream()
    .filter(...)
    .map(...)
    .sorted(...)
    .filter(...)
    .map(...)
    .collect(...);

// 推荐：抽取方法
list.stream()
    .filter(this::isValid)
    .map(this::transform)
    .collect(Collectors.toList());
```

---

### 📌 3. 选择合适的终端操作

```java
// 只需要判断是否存在
boolean exists = list.stream().anyMatch(predicate); // ✅

// 不要这样做
long count = list.stream().filter(predicate).count(); // ❌
boolean exists = count > 0;
```

---

### 📌 4. 合理使用并行流

```java
// 适合并行流的情况
largeList.parallelStream()
    .map(expensiveOperation)
    .collect(Collectors.toList());

// 不适合并行流的情况
smallList.parallelStream() // ❌ 开销大于收益
    .map(simpleOperation)
    .collect(Collectors.toList());
```

---

### 📌 5. 使用专用 Collector

```java
// 推荐：使用专门的 Collector
int sum = numbers.stream().collect(Collectors.summingInt(Integer::intValue));
double avg = numbers.stream().collect(Collectors.averagingInt(Integer::intValue));

// 不推荐：手动 reduce
int sum = numbers.stream().reduce(0, Integer::sum);
```

---

## 11. 总结

### 核心要点

1. **Stream 是声明式的数据处理工具**，关注"要什么"而非"怎么做"
2. **三阶段流程**：创建 → 中间操作（惰性） → 终端操作（触发）
3. **中间操作**：filter、map、flatMap、sorted、distinct 等
4. **终端操作**：collect、reduce、forEach、count、find 等
5. **配合 Lambda 和方法引用**，代码更简洁优雅
6. **注意线程安全和空指针**，合理使用并行流

### 学习路径回顾

```
Lambda 表达式 → 方法引用 → Stream API → 并行流
     ↓              ↓            ↓
  基础语法      语法简化    数据处理核心
```

### Stream 操作速查表

| 类别 | 常用操作 |
|------|---------|
| 创建 | `stream()`, `of()`, `iterate()`, `generate()` |
| 过滤 | `filter()`, `distinct()`, `limit()`, `skip()` |
| 转换 | `map()`, `flatMap()` |
| 排序 | `sorted()` |
| 收集 | `collect(toList/toSet/toMap/groupingBy)` |
| 归约 | `reduce()`, `sum()`, `count()`, `max()`, `min()` |
| 匹配 | `anyMatch()`, `allMatch()`, `noneMatch()` |
| 查找 | `findFirst()`, `findAny()` |
| 遍历 | `forEach()`, `peek()` |

---

## 练习题

### 练习 1：基础操作

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 1. 过滤出偶数，转为平方，收集到 List
// 2. 计算所有奇数的和
// 3. 找出最大的偶数
```

### 练习 2：字符串处理

```java
List<String> words = Arrays.asList("hello", "world", "java", "stream");

// 1. 将所有单词转为大写，用逗号连接
// 2. 统计每个单词的长度，收集到 Map
// 3. 找出最长的单词
```

### 练习 3：对象操作

```java
List<Product> products = Arrays.asList(
    new Product("Laptop", 999.99, "Electronics"),
    new Product("Phone", 699.99, "Electronics"),
    new Product("Book", 19.99, "Education"),
    new Product("Desk", 299.99, "Furniture")
);

// 1. 按类别分组，计算每类的平均价格
// 2. 找出价格高于 500 的产品名称
// 3. 计算 Electronics 类别的总价
```

---

## 参考资料

- [Oracle 官方文档 - Stream API](https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html)
- [Baeldung - Java Streams Tutorial](https://www.baeldung.com/java-streams-introduction)
- [DZone - Java 8 Stream Tutorial](https://dzone.com/articles/learn-java-8-streams)

---

**上一步：** [方法引用完全指南](./post-mpou6s96)  
**下一步：** （可选）[并行流深入解析](/my-blog/blog/04_Parallel_Stream)
